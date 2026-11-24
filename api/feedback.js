'use strict';

const { getFirebaseAdmin, verifyUser } = require('./_firebaseAdmin');

const dailyRequestLimit = 3;
const maxJsonBytes = 3_500_000;
const maxAudioBytes = 2_000_000;

function sendError(response, status, message) {
    return response.status(status).json({ error: message });
}

function validateString(value, maxLength) {
    return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

function validateFeedbackShape(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const summary = typeof value.summary === 'string' ? value.summary.trim().slice(0, 700) : '';
    const nextPractice = typeof value.nextPractice === 'string' ? value.nextPractice.trim().slice(0, 500) : '';
    const strengths = Array.isArray(value.strengths)
        ? value.strengths.filter(item => typeof item === 'string').slice(0, 4).map(item => item.trim().slice(0, 300))
        : [];
    const improvements = Array.isArray(value.improvements)
        ? value.improvements.filter(item => typeof item === 'string').slice(0, 5).map(item => item.trim().slice(0, 300))
        : [];
    if (!summary || !nextPractice) return null;
    return { summary, strengths, improvements, nextPractice };
}

async function reserveDailyRequest(admin, uid) {
    const date = new Date().toISOString().slice(0, 10);
    const reference = admin.firestore.collection('aiUsage').doc(`${uid}_${date}`);
    const used = await admin.firestore.runTransaction(async transaction => {
        const snapshot = await transaction.get(reference);
        const current = snapshot.exists ? Number(snapshot.data().used) || 0 : 0;
        if (current >= dailyRequestLimit) {
            const error = new Error(`Daily AI feedback limit reached (${dailyRequestLimit} requests).`);
            error.statusCode = 429;
            throw error;
        }
        transaction.set(reference, {
            uid,
            date,
            used: current + 1,
            updatedAt: admin.FieldValue.serverTimestamp()
        });
        return current + 1;
    });
    return { reference, used, date };
}

async function releaseDailyRequest(admin, reference) {
    await admin.firestore.runTransaction(async transaction => {
        const snapshot = await transaction.get(reference);
        if (!snapshot.exists) return;
        const used = Math.max(0, (Number(snapshot.data().used) || 0) - 1);
        transaction.set(reference, {
            used,
            updatedAt: admin.FieldValue.serverTimestamp()
        }, { merge: true });
    });
}

async function transcribeAudio(audioBase64, mimeType) {
    if (typeof audioBase64 !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(audioBase64)) {
        const error = new Error('Record a speaking response before requesting feedback.');
        error.statusCode = 400;
        throw error;
    }
    const audio = Buffer.from(audioBase64, 'base64');
    if (!audio.length || audio.length > maxAudioBytes) {
        const error = new Error('The speaking recording must be no larger than 2 MB.');
        error.statusCode = 413;
        throw error;
    }
    const supportedTypes = new Set(['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/ogg']);
    if (!supportedTypes.has(mimeType)) {
        const error = new Error('This recording format is not supported. Record it again in the browser.');
        error.statusCode = 400;
        throw error;
    }

    const extension = mimeType === 'audio/webm' ? 'webm'
        : mimeType === 'audio/mp4' ? 'mp4'
            : mimeType === 'audio/mpeg' ? 'mp3'
                : mimeType === 'audio/wav' ? 'wav'
                    : mimeType === 'audio/ogg' ? 'ogg'
                        : 'm4a';
    const form = new FormData();
    form.append('file', new Blob([audio], { type: mimeType }), `speaking.${extension}`);
    form.append('model', 'whisper-1');
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: form
    });
    if (!response.ok) {
        console.error('OpenAI transcription request failed.', { status: response.status });
        throw new Error('Speaking audio could not be transcribed right now.');
    }
    const result = await response.json();
    if (!validateString(result.text, 12000)) {
        throw new Error('No clear speech was detected in the recording. Try recording again.');
    }
    return result.text.trim();
}

async function requestFeedback(skill, prompt, answer) {
    const instructions = skill === 'writing'
        ? 'Give constructive English-learning feedback on the learner response to the task. Comment on task fulfilment, organization, vocabulary, and grammar. Do not claim to provide an official IELTS/CEFR score. Return JSON with summary, strengths (array), improvements (array), and nextPractice.'
        : 'Give constructive English-learning feedback on the speech transcript. Comment on clarity, vocabulary, grammar, and organization. Do not infer pronunciation from text and do not claim to provide an official IELTS/CEFR score. Return JSON with summary, strengths (array), improvements (array), and nextPractice.';
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: process.env.OPENAI_FEEDBACK_MODEL || 'gpt-4o-mini',
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: instructions },
                { role: 'user', content: JSON.stringify({ task: prompt, response: answer }) }
            ],
            max_tokens: 700
        })
    });
    if (!response.ok) {
        console.error('OpenAI feedback request failed.', { status: response.status });
        throw new Error('AI feedback is temporarily unavailable. Please try again later.');
    }
    const result = await response.json();
    let parsed;
    try {
        parsed = JSON.parse(result.choices[0].message.content);
    } catch (error) {
        console.error('OpenAI returned feedback in an unexpected format.', error);
        throw new Error('AI feedback could not be processed. Please try again.');
    }
    const feedback = validateFeedbackShape(parsed);
    if (!feedback) throw new Error('AI feedback could not be processed. Please try again.');
    return feedback;
}

module.exports = async function feedback(request, response) {
    if (request.method !== 'POST') {
        response.setHeader('Allow', 'POST');
        return sendError(response, 405, 'Method not allowed.');
    }

    let usage;
    let admin;
    try {
        const user = await verifyUser(request);
        admin = getFirebaseAdmin();
        if (!process.env.OPENAI_API_KEY) {
            return sendError(response, 503, 'AI feedback is not configured on this host.');
        }
        const body = request.body;
        if (!body || typeof body !== 'object' || Array.isArray(body) || Buffer.byteLength(JSON.stringify(body)) > maxJsonBytes) {
            return sendError(response, 413, 'Feedback request is invalid or too large.');
        }
        if (body.consent !== true) return sendError(response, 400, 'Confirm the AI feedback privacy notice to continue.');
        if (!['writing', 'speaking'].includes(body.skill) || !validateString(body.prompt, 5000)) {
            return sendError(response, 400, 'A valid Writing or Speaking task is required.');
        }

        let answer;
        let transcript;
        if (body.skill === 'writing') {
            if (!validateString(body.answer, 15000)) return sendError(response, 400, 'Write a response before requesting feedback.');
            answer = body.answer.trim();
        }

        usage = await reserveDailyRequest(admin, user.uid);
        if (body.skill === 'speaking') {
            transcript = await transcribeAudio(body.audioBase64, body.mimeType);
            answer = transcript;
        }
        const feedbackResult = await requestFeedback(body.skill, body.prompt, answer);
        return response.status(200).json({
            feedback: feedbackResult,
            transcript: transcript || null,
            remainingToday: Math.max(0, dailyRequestLimit - usage.used)
        });
    } catch (error) {
        if (usage && admin) {
            try {
                await releaseDailyRequest(admin, usage.reference);
            } catch (releaseError) {
                console.error('Could not restore AI feedback quota after a failed request.', releaseError);
            }
        }
        const status = error.statusCode || (error.message.includes('FIREBASE_SERVICE_ACCOUNT_JSON') ? 503 : 502);
        if (status >= 500) console.error('AI feedback request failed.', error);
        return sendError(response, status, status === 502 ? 'AI feedback is temporarily unavailable. Please try again later.' : error.message);
    }
};
