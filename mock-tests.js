(function () {
    const root = document.getElementById('mock-library-root');
    const bank = window.IELTS_MOCK_BANK;
    const progressStorageKey = 'ielts-master-mock-progress';
    const activityStorageKey = 'ielts-master-mock-active-days';

    if (!root) return;
    if (!bank || !bank.reading || !bank.listening || !bank.writing) {
        root.innerHTML = '<p class="mock-error">Mock test content could not be loaded. Check that mock-bank.js is next to this page.</p>';
        return;
    }

    const customWriting = {
        id: 'ielts-master-departments-2011',
        title: 'IELTS Academic Writing: University Departments (2011)',
        tasks: [
            {
                id: 'departments-task-1',
                number: 1,
                title: 'Writing Task 1: University departments',
                prompt: 'The table below gives information about students studying in six departments at an Australian university in 2011.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.',
                minWords: 150,
                image: null,
                figureDescription: 'Table comparing six university departments by female students, students whose first language is not English, and students born outside Australia.'
            },
            {
                id: 'departments-task-2',
                number: 2,
                title: 'Writing Task 2: Practical skills and academic subjects',
                prompt: 'Some people believe that universities should teach practical skills, while others think academic subjects are more important. Discuss both views and give your opinion.',
                minWords: 250,
                image: null,
                figureDescription: ''
            }
        ]
    };
    bank.writing.push(customWriting);

    const fullMockSets = [
        { reading: 5, writing: 3 },
        { reading: 1, writing: 5 },
        { reading: 3, writing: 0 }
    ];
    const skillLabels = {
        listening: 'Listening',
        reading: 'Reading',
        writing: 'Writing',
        speaking: 'Speaking'
    };
    const skillIcons = {
        listening: 'fa-headphones',
        reading: 'fa-book-open',
        writing: 'fa-pen',
        speaking: 'fa-microphone'
    };
    const speakingParts = [
        {
            title: 'Part 1 — Introduction and interview',
            time: '4-5 minutes',
            questions: [
                'Could you tell me your full name?',
                'Where are you from, and what do you like about your hometown?',
                'Do you work or are you a student?',
                'What do you enjoy doing in your free time?'
            ]
        },
        {
            title: 'Part 2 — Individual long turn',
            time: '3-4 minutes',
            topic: 'Describe a time you watched a famous person being interviewed.',
            topicNumber: 67,
            validity: 'September 2026 – April 2027',
            cues: [
                'who the famous person was',
                'what the interview was about',
                'when and where you watched the interview',
                'how you felt about the interview'
            ],
            questions: [
                'You have one minute to prepare. Make notes, then speak for one to two minutes.'
            ]
        },
        {
            title: 'Part 3 — Two-way discussion',
            time: '4-5 minutes',
            questions: [
                'Why are people interested in interviews with famous people?',
                'Do public interviews give a reliable picture of a person? Why or why not?',
                'How has social media changed the way famous people communicate with the public?',
                'Should journalists ask famous people more challenging questions?'
            ]
        }
    ];

    let libraryView = 'full';
    let selectedSkill = 'reading';
    let selectedMode = 'exam';
    let session = readSavedSession();
    let toastTimer;
    let recorder = null;
    let recordingStream = null;
    let recordingChunks = [];
    let recordingUrl = '';
    let recordingBlob = null;
    let recordedPartIndex = -1;
    let recordingPartIndex = -1;
    let expiryHandled = false;

    function readSavedSession() {
        try {
            const saved = localStorage.getItem('ielts-master-mock-session');
            if (!saved) return null;
            const parsed = JSON.parse(saved);
            return parsed && parsed.status === 'active' ? parsed : null;
        } catch (error) {
            setTimeout(() => notify('Saved mock progress could not be read from this browser.'), 0);
            return null;
        }
    }

    function persistSession() {
        try {
            if (session && session.status === 'active') {
                localStorage.setItem('ielts-master-mock-session', JSON.stringify(session));
            } else {
                localStorage.removeItem('ielts-master-mock-session');
            }
        } catch (error) {
            notify('Your browser could not save this mock test. Keep this tab open.');
        }
    }

    function recordMockActivity() {
        const now = new Date();
        const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const saved = localStorage.getItem(activityStorageKey);
        const days = saved ? JSON.parse(saved) : [];
        if (!Array.isArray(days) || days.some(value => typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))) {
            throw new TypeError('Saved active-day history has an unexpected format.');
        }
        if (!days.includes(day)) {
            days.push(day);
            days.sort();
            localStorage.setItem(activityStorageKey, JSON.stringify(days));
        }
    }

    function recordCompletedMock(result) {
        if (!result || !Object.prototype.hasOwnProperty.call(skillLabels, result.skill) || typeof result.paperId !== 'string') {
            console.error('Unable to save completed mock progress.', new TypeError('Mock result is missing a valid skill or paper ID.'));
            notify('Mock completed, but progress could not be saved in this browser.');
            return;
        }

        try {
            const saved = localStorage.getItem(progressStorageKey);
            const records = saved ? JSON.parse(saved) : [];
            if (!Array.isArray(records) || records.some(record =>
                !record ||
                !Object.prototype.hasOwnProperty.call(skillLabels, record.skill) ||
                typeof record.paperId !== 'string'
            )) {
                throw new TypeError('Saved mock progress has an unexpected format.');
            }

            if (!records.some(record => record.skill === result.skill && record.paperId === result.paperId)) {
                records.push({ skill: result.skill, paperId: result.paperId });
                localStorage.setItem(progressStorageKey, JSON.stringify(records));
            }
        } catch (error) {
            console.error('Unable to save completed mock progress.', error);
            notify('Mock completed, but progress could not be saved in this browser.');
        }

        try {
            recordMockActivity();
        } catch (error) {
            console.error('Unable to save mock active-day history.', error);
            notify('Mock completed, but its active day could not be saved.');
        }
        window.dispatchEvent(new Event('ielts:mock-progress-updated'));
    }

    function notify(message) {
        let notice = root.querySelector('.mock-toast');
        if (!notice) {
            notice = document.createElement('div');
            notice.className = 'mock-toast';
            notice.setAttribute('role', 'status');
            root.prepend(notice);
        }
        notice.textContent = message;
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => notice.remove(), 5000);
    }

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, character => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[character]);
    }

    function assetPath(path) {
        return path && path.startsWith('/content/') ? path.slice(1) : path;
    }

    function paperFor(skill, id) {
        const collection = skill === 'writing' ? bank.writing : bank[skill];
        return collection.find(paper => paper.id === id);
    }

    function cleanTitle(title) {
        return title
            .replace(/^IELTS (?:Academic |Upper-Intermediate |Advanced |Expert )?/, '')
            .replace(/^(?:Reading Practice: |Reading Mastery: |Reading: |Listening: |Writing: )/, '')
            .replace(/\s*\(Band [\d.]+\)/, '');
    }

    function numberOfQuestions(paper) {
        return paper && paper.parts
            ? paper.parts.reduce((sum, part) => sum + part.groups.reduce((groupSum, group) => groupSum + group.questions.length, 0), 0)
            : 0;
    }

    function listeningDuration(paper) {
        if (!paper) return 30 * 60;
        const previews = paper.parts.reduce((sum, part, index) => sum + (index === 0 ? 45 : 30), 0);
        const recordings = paper.parts.reduce((sum, part) => sum + (part.audioDuration || 0), 0);
        return previews + recordings + paper.parts.length * 30 + 120;
    }

    function durationFor(skill, paper) {
        if (skill === 'listening') return listeningDuration(paper);
        if (skill === 'speaking') return 12 * 60;
        return 60 * 60;
    }

    function formatTime(seconds) {
        const value = Math.max(0, Math.ceil(seconds));
        return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
    }

    function formatAudioTime(seconds) {
        if (!Number.isFinite(seconds)) return '0:00';
        const value = Math.max(0, Math.floor(seconds));
        return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
    }

    function remaining() {
        if (!session) return 0;
        if (session.pausedAt) return session.pausedRemaining;
        return Math.max(0, Math.ceil((session.deadline - Date.now()) / 1000));
    }

    function renderLibrary() {
        if (session && session.status === 'active') {
            renderExam();
            return;
        }
        if (session && session.status === 'complete') {
            renderResults();
            return;
        }

        root.innerHTML = `
            <div class="mock-library-intro">
                <div>
                    <h2>Choose your mock test.</h2>
                    <p>Three complete IELTS Academic mock combinations, plus every individual test from the IELTS Studio question bank.</p>
                </div>
                <label class="mock-mode-picker">Test mode
                    <select id="mock-mode">
                        <option value="exam" ${selectedMode === 'exam' ? 'selected' : ''}>Exam conditions</option>
                        <option value="practice" ${selectedMode === 'practice' ? 'selected' : ''}>Practice mode</option>
                    </select>
                </label>
            </div>
            <div class="mock-view-tabs" role="tablist" aria-label="Mock test library">
                <button type="button" class="${libraryView === 'full' ? 'active' : ''}" data-action="view" data-view="full">Full mock tests (3)</button>
                <button type="button" class="${libraryView === 'skill' ? 'active' : ''}" data-action="view" data-view="skill">Individual skills</button>
            </div>
            ${libraryView === 'full' ? renderFullMocks() : renderSkillLibrary()}
            <p class="mock-content-note">${escapeHtml(bank.contentNotice || 'Practice materials are AI-authored and are not official IELTS content.')} Listening audio and Writing figures are included. IELTS Studio content is provided under the MIT license; details are in IELTS-STUDIO-LICENSE.txt.</p>
        `;
    }

    function mockSetPapers(index) {
        const selection = fullMockSets[index];
        return {
            listening: bank.listening[index],
            reading: bank.reading[selection.reading],
            writing: bank.writing[selection.writing]
        };
    }

    function renderFullMocks() {
        const cards = fullMockSets.map((_, index) => {
            const papers = mockSetPapers(index);
            const minutes = Math.round((listeningDuration(papers.listening) + 2 * 60 * 60) / 60);
            return `
                <article class="mock-set-card">
                    <div class="mock-card-heading">
                        <span class="mock-set-number">0${index + 1}</span>
                        <span class="mock-status"><i class="fas fa-graduation-cap"></i> Academic · full mock</span>
                    </div>
                    <h3>Academic mock ${index + 1}</h3>
                    <p class="mock-card-description">${escapeHtml(papers.reading.parts.map(part => part.title).join(' · '))}</p>
                    <div class="mock-card-meta">
                        <span><i class="fas fa-clock"></i>${minutes} min</span>
                        <span><i class="fas fa-list-ol"></i>80 questions + 2 tasks</span>
                        <span><i class="fas fa-headphones"></i>Recorded Listening</span>
                    </div>
                    <button type="button" class="btn btn-primary" data-action="start-full" data-set="${index}">Start full mock <i class="fas fa-arrow-right"></i></button>
                </article>
            `;
        }).join('');
        return `<div class="mock-set-grid">${cards}</div>`;
    }

    function renderSkillLibrary() {
        const counts = {
            listening: bank.listening.length,
            reading: bank.reading.length,
            writing: bank.writing.length,
            speaking: 1
        };
        const tabs = Object.keys(skillLabels).map(skill => `
            <button type="button" class="${selectedSkill === skill ? 'active' : ''}" data-action="skill" data-skill="${skill}">
                <i class="fas ${skillIcons[skill]}"></i> ${skillLabels[skill]} (${counts[skill]})
            </button>
        `).join('');
        return `
            <div class="mock-skill-tabs" role="tablist" aria-label="Filter tests by IELTS skill">${tabs}</div>
            <div class="mock-paper-list">${renderSkillCards(selectedSkill)}</div>
        `;
    }

    function renderSkillCards(skill) {
        if (skill === 'speaking') {
            return `
                <article class="mock-paper-card">
                    <span class="mock-paper-icon"><i class="fas fa-microphone"></i></span>
                    <div>
                        <h3>Famous person being interviewed</h3>
                        <p class="mock-card-description">Three-part Speaking interview with Part 2 · Topic 67 (September 2026 – April 2027).</p>
                        <div class="mock-paper-meta"><span><i class="fas fa-clock"></i>11-14 minutes</span><span><i class="fas fa-comments"></i>3 parts</span><span><i class="fas fa-microphone"></i>Optional recording</span></div>
                    </div>
                    <button type="button" class="btn btn-primary" data-action="start-speaking">Start Speaking <i class="fas fa-arrow-right"></i></button>
                </article>
            `;
        }

        const papers = bank[skill];
        return papers.map((paper, index) => {
            const parts = skill === 'writing' ? paper.tasks.length : paper.parts.length;
            const questions = skill === 'writing' ? '2 writing tasks' : `${numberOfQuestions(paper)} questions`;
            const duration = skill === 'listening' ? Math.round(listeningDuration(paper) / 60) : 60;
            return `
                <article class="mock-paper-card">
                    <span class="mock-paper-icon"><i class="fas ${skillIcons[skill]}"></i></span>
                    <div>
                        <h3>${escapeHtml(cleanTitle(paper.title))}</h3>
                        <p class="mock-card-description">${escapeHtml(skill === 'writing' ? paper.tasks.map(task => task.title).join(' · ') : paper.parts.map(part => part.title).join(' · '))}</p>
                        <div class="mock-paper-meta">
                            <span><i class="fas fa-signal"></i>${escapeHtml(paper.difficulty || 'Academic')}</span>
                            <span><i class="fas fa-clock"></i>${duration} min</span>
                            <span><i class="fas fa-list-ol"></i>${questions}</span>
                            <span>${parts} ${skill === 'writing' ? 'tasks' : 'parts'}</span>
                        </div>
                    </div>
                    <button type="button" class="btn btn-primary" data-action="start-paper" data-skill="${skill}" data-paper="${escapeHtml(paper.id)}">Start test <i class="fas fa-arrow-right"></i></button>
                </article>
            `;
        }).join('') || '<p class="mock-content-note">No tests are available in this section.</p>';
    }

    function currentSkill(value) {
        if (value.kind === 'full') return ['listening', 'reading', 'writing'][value.stageIndex];
        return value.skill;
    }

    function currentPaper() {
        if (!session || session.skill === 'speaking') return null;
        return paperFor(session.skill, session.paperId);
    }

    function startFull(set) {
        const papers = mockSetPapers(set);
        session = {
            id: `full-${Date.now()}`,
            kind: 'full',
            title: `Academic mock ${set + 1}`,
            set,
            mode: selectedMode,
            stageIndex: 0,
            sequence: ['listening', 'reading', 'writing'],
            paperIds: {
                listening: papers.listening.id,
                reading: papers.reading.id,
                writing: papers.writing.id
            },
            skill: 'listening',
            paperId: papers.listening.id,
            partIndex: 0,
            answers: {},
            writingAnswers: {},
            speakingNotes: {},
            startedAt: Date.now(),
            deadline: Date.now() + durationFor('listening', papers.listening) * 1000,
            pausedAt: null,
            pausedRemaining: 0,
            results: [],
            status: 'active'
        };
        expiryHandled = false;
        persistSession();
        renderExam();
    }

    function startPaper(skill, paperId) {
        const paper = paperFor(skill, paperId);
        if (!paper) {
            notify('This test could not be opened.');
            return;
        }
        const duration = durationFor(skill, paper);
        session = {
            id: `${skill}-${Date.now()}`,
            kind: 'skill',
            title: cleanTitle(paper.title),
            mode: selectedMode,
            skill,
            paperId,
            partIndex: 0,
            answers: {},
            writingAnswers: {},
            speakingNotes: {},
            startedAt: Date.now(),
            deadline: Date.now() + duration * 1000,
            pausedAt: null,
            pausedRemaining: 0,
            results: [],
            status: 'active'
        };
        expiryHandled = false;
        persistSession();
        renderExam();
    }

    function startSpeaking() {
        session = {
            id: `speaking-${Date.now()}`,
            kind: 'skill',
            title: 'Famous person being interviewed',
            mode: selectedMode,
            skill: 'speaking',
            paperId: 'famous-person-interview',
            partIndex: 0,
            answers: {},
            writingAnswers: {},
            speakingNotes: {},
            startedAt: Date.now(),
            deadline: Date.now() + 12 * 60 * 1000,
            pausedAt: null,
            pausedRemaining: 0,
            results: [],
            status: 'active'
        };
        expiryHandled = false;
        persistSession();
        renderExam();
    }

    function getParts() {
        if (session.skill === 'speaking') return speakingParts;
        const paper = currentPaper();
        return session.skill === 'writing' ? paper.tasks : paper.parts;
    }

    function renderExam() {
        if (!session || session.status !== 'active') return;
        stopListeningAudio();
        const parts = getParts();
        const part = parts[session.partIndex];
        const skill = session.skill;
        const fullLabel = session.kind === 'full' ? ` · Full mock section ${session.stageIndex + 1} of 3` : '';
        const partOptions = parts.map((item, index) => {
            const label = skill === 'writing' ? `Task ${index + 1}` : skill === 'reading' ? `Passage ${index + 1}` : `Part ${index + 1}`;
            const details = item.title ? ` — ${item.title}` : '';
            const words = skill === 'writing' ? ` · ${wordCount(session.writingAnswers[item.id] || '')} words` : '';
            return `<option value="${index}" ${session.partIndex === index ? 'selected' : ''}>${escapeHtml(`${label}${details}${words}`)}</option>`;
        }).join('');
        const modeText = session.mode === 'exam' ? 'Exam conditions' : 'Practice mode';
        const paused = !!session.pausedAt;

        root.innerHTML = `
            <section class="mock-exam" aria-label="${escapeHtml(skillLabels[skill])} mock test">
                <header class="mock-exam-top">
                    <div class="mock-exam-heading">
                        <h2>${escapeHtml(session.title)}</h2>
                        <p>${escapeHtml(skillLabels[skill])}${escapeHtml(fullLabel)} · ${modeText}</p>
                    </div>
                    <div class="mock-exam-actions">
                        <span class="mock-clock ${remaining() < 300 ? 'urgent' : ''}" id="mock-timer" role="timer"><i class="fas fa-clock"></i>${formatTime(remaining())}</span>
                        ${session.mode === 'practice' ? `<button type="button" class="btn btn-outline mock-small-button" data-action="pause">${paused ? 'Resume' : 'Pause'}</button>` : ''}
                        <button type="button" class="btn btn-outline mock-small-button" data-action="exit">Exit</button>
                    </div>
                </header>
                ${paused ? '<div class="mock-content-note">Practice paused. Resume when you are ready.</div>' : renderStage(skill, part)}
                <footer class="mock-exam-footer">
                    <p>${skill === 'writing' ? 'Writing is not automatically band-scored.' : skill === 'speaking' ? 'Speaking is not automatically band-scored.' : `${answeredCount()} of ${questionCount()} questions answered`}</p>
                    <button type="button" class="btn btn-primary mock-submit" data-action="submit">${session.kind === 'full' && session.stageIndex < 2 ? `Submit ${skillLabels[skill]} and continue` : 'Submit test'} <i class="fas fa-arrow-right"></i></button>
                </footer>
                <label class="mock-part-picker">Test section
                    <select aria-label="Select test section" data-part-select>${partOptions}</select>
                </label>
            </section>
        `;
        initializeListeningAudio();
        persistSession();
    }

    function renderStage(skill, part) {
        if (skill === 'speaking') return renderSpeakingPart(part);
        if (skill === 'writing') return renderWritingPart(part);
        return renderQuestionPart(skill, part);
    }

    function renderQuestionPart(skill, part) {
        if (!part) return '<div class="mock-error">This test section could not be found.</div>';
        const passage = skill === 'reading'
            ? `<div class="mock-passage-content"><p><strong>${escapeHtml(part.title)}</strong></p>${String(part.content || '').split(/\n\s*\n/).map(text => `<p>${escapeHtml(text)}</p>`).join('')}</div>`
            : `<div class="mock-passage-content"><p>${escapeHtml(part.title)}</p><p>Answer the questions as you listen to this recording.</p></div>
               ${part.audio ? `<div class="mock-listening-audio">
                    <button type="button" class="btn btn-primary mock-audio-button" data-action="toggle-listening-audio" aria-label="Play listening audio" aria-pressed="false">
                        <i class="fas fa-volume-up" aria-hidden="true"></i> Play audio
                    </button>
                    <span class="mock-audio-status" role="status">0:00 / 0:00</span>
                  </div>
                  <audio class="mock-audio" preload="metadata" src="${escapeHtml(assetPath(part.audio))}" hidden>Your browser does not support audio playback.</audio>` : '<p class="mock-content-note">Audio is unavailable for this section.</p>'}`;
        const questions = renderQuestionGroups(part.groups || []);
        return `
            <div class="mock-exam-grid">
                <section class="mock-pane">
                    <h3>${skill === 'reading' ? 'Reading passage' : 'Listening recording'}</h3>
                    ${passage}
                </section>
                <section class="mock-pane">
                    <h3>Questions</h3>
                    ${questions}
                </section>
            </div>
        `;
    }

    function renderQuestionGroups(groups) {
        return groups.map(group => `
            <section class="mock-group">
                <h4>${escapeHtml(group.questions.length > 1 ? `Questions ${group.questions[0].number}–${group.questions[group.questions.length - 1].number}` : `Question ${group.questions[0].number}`)}</h4>
                <p class="mock-instructions">${escapeHtml(group.instructions)}</p>
                ${group.wordBank && group.wordBank.length ? `<div class="mock-word-bank">${group.wordBank.map(word => `<span>${escapeHtml(word)}</span>`).join('')}</div>` : ''}
                ${hasGroupedGapPrompt(group) ? renderGroupedGapAnswers(group) : group.questions.map(question => renderQuestion(group, question)).join('')}
            </section>
        `).join('');
    }

    function hasGroupedGapPrompt(group) {
        const prompt = group.questions[0] && group.questions[0].text;
        const gaps = prompt ? prompt.match(/\{\{gap[^}]*\}\}/g) : null;
        return !!gaps && gaps.length === group.questions.length && group.questions.slice(1).every(question => !question.text);
    }

    function renderGroupedGapAnswers(group) {
        let questionIndex = 0;
        const prompt = group.questions[0].text.split(/(\{\{gap[^}]*\}\})/g).map(segment => {
            if (!/^\{\{gap[^}]*\}\}$/.test(segment)) return escapeHtml(segment);
            const question = group.questions[questionIndex++];
            const answer = session.answers[question.id] || '';
            return `
                <span class="mock-gap-answer">
                    <span class="mock-question-number">${question.number}.</span>
                    <input class="mock-answer-input" type="text" autocomplete="off" spellcheck="false" aria-label="Answer question ${question.number}" value="${escapeHtml(answer)}" data-answer="${escapeHtml(question.id)}" placeholder="${escapeHtml(group.wordLimit ? `${group.wordLimit} word${group.wordLimit === 1 ? '' : 's'} maximum` : 'Type your answer')}">
                </span>
            `;
        }).join('');
        return `<div class="mock-question"><div class="mock-gap-prompt">${prompt}</div></div>`;
    }

    function renderQuestion(group, question) {
        const text = (question.text || `Complete answer ${question.number}`).replace(/\{\{gap[^}]*\}\}/g, '________');
        const answer = session.answers[question.id] || '';
        const options = answerOptions(group, question);
        let answerControl;

        if (group.type === 'multiple-choice' && options.length) {
            answerControl = `
                <fieldset class="mock-answer-options">
                    <legend class="sr-only">Answer question ${question.number}</legend>
                    ${options.map(option => `
                        <label><input type="radio" name="answer-${escapeHtml(question.id)}" value="${escapeHtml(option.value)}" ${answer === option.value ? 'checked' : ''} data-answer="${escapeHtml(question.id)}">
                            <span>${escapeHtml(option.label)}</span>
                        </label>
                    `).join('')}
                </fieldset>
            `;
        } else if (options.length) {
            answerControl = `
                <select class="mock-answer-select" aria-label="Answer question ${question.number}" data-answer="${escapeHtml(question.id)}">
                    <option value="">Select an answer</option>
                    ${options.map(option => `<option value="${escapeHtml(option.value)}" ${answer === option.value ? 'selected' : ''}>${escapeHtml(option.label)}</option>`).join('')}
                </select>
            `;
        } else {
            answerControl = `<input class="mock-answer-input" type="text" autocomplete="off" spellcheck="false" aria-label="Answer question ${question.number}" value="${escapeHtml(answer)}" data-answer="${escapeHtml(question.id)}" placeholder="${escapeHtml(group.wordLimit ? `${group.wordLimit} word${group.wordLimit === 1 ? '' : 's'} maximum` : 'Type your answer')}">`;
        }

        return `
            <div class="mock-question">
                <label class="mock-question-label"><span class="mock-question-number">${question.number}.</span><span>${escapeHtml(text)}</span></label>
                ${answerControl}
            </div>
        `;
    }

    function answerOptions(group, question) {
        if (group.type === 'true-false-not-given') return ['TRUE', 'FALSE', 'NOT GIVEN'].map(value => ({ value, label: value }));
        if (group.type === 'yes-no-not-given') return ['YES', 'NO', 'NOT GIVEN'].map(value => ({ value, label: value }));
        if (group.type === 'matching-headings' && group.wordBank && group.wordBank.length) {
            return group.wordBank.map(word => ({ value: word.split(/[.)]/)[0].trim(), label: word }));
        }
        return question.options || [];
    }

    function renderWritingPart(task) {
        if (!task) return '<div class="mock-error">This Writing task could not be found.</div>';
        const answer = session.writingAnswers[task.id] || '';
        const table = task.id === 'departments-task-1' ? renderDepartmentsTable() : '';
        const image = task.image ? `<img class="mock-writing-figure" src="${escapeHtml(assetPath(task.image))}" alt="${escapeHtml(task.figureDescription || task.title)}">` : '';
        return `
            <div class="mock-exam-grid writing-layout">
                <section class="mock-pane">
                    <h3>${escapeHtml(task.title)}</h3>
                    <div class="mock-writing-prompt">${String(task.prompt).split(/\n\s*\n/).map(line => `<p>${escapeHtml(line)}</p>`).join('')}</div>
                    ${table}
                    ${image}
                    <p class="mock-instructions">Write at least ${task.minWords} words. Suggested time: ${task.number === 1 ? '20' : '40'} minutes.</p>
                    ${task.number === 2 ? '<p class="mock-instructions">Task 2 contributes twice as much to your Writing score as Task 1.</p>' : ''}
                </section>
                <section class="mock-pane">
                    <h3>Your response</h3>
                    <textarea class="mock-writing-answer" data-writing-answer="${escapeHtml(task.id)}" aria-label="${escapeHtml(task.title)} response" spellcheck="false" placeholder="Begin your response here...">${escapeHtml(answer)}</textarea>
                    <div class="mock-word-count"><span id="writing-count">${wordCount(answer)}</span>&nbsp;words · minimum ${task.minWords}</div>
                    <div class="mock-ai-feedback">
                        <label><input type="checkbox" data-ai-consent> I agree to send this response to OpenAI for feedback. Do not include personal or sensitive information.</label>
                        <button class="btn btn-outline" type="button" data-action="ai-feedback" data-feedback-skill="writing" data-task-id="${escapeHtml(task.id)}">Get AI feedback</button>
                        <p class="mock-feedback-status" role="status" aria-live="polite" hidden></p>
                        <div class="mock-feedback-result" aria-live="polite"></div>
                    </div>
                </section>
            </div>
        `;
    }

    function renderDepartmentsTable() {
        const rows = [
            ['English', '72%', '12%', '20%'],
            ['Modern Languages', '68%', '16%', '23%'],
            ['History', '52%', '45%', '31%'],
            ['Physics', '56%', '38%', '56%'],
            ['Math', '17%', '49%', '56%'],
            ['Chemistry', '15%', '42%', '48%']
        ];
        return `
            <div class="writing-table-wrap">
                <table class="writing-task-table">
                    <thead><tr><th>Department</th><th>Females</th><th>First language not English</th><th>Born outside Australia</th></tr></thead>
                    <tbody>${rows.map(row => `<tr><th scope="row">${row[0]}</th>${row.slice(1).map(value => `<td>${value}</td>`).join('')}</tr>`).join('')}</tbody>
                </table>
            </div>
        `;
    }

    function renderSpeakingPart(part) {
        const index = session.partIndex;
        const answer = session.speakingNotes[index] || '';
        const body = part.topic
            ? `<div class="mock-speaking-cue"><p class="mock-instructions">PART 2 · TOPIC-${part.topicNumber} · ${escapeHtml(part.validity)}</p><strong>${escapeHtml(part.topic)}</strong><p class="mock-instructions">You should say:</p><ul>${part.cues.map(cue => `<li>${escapeHtml(cue)}</li>`).join('')}</ul></div>`
            : `<div class="mock-speaking-cue">${part.questions.map(question => `<p>${escapeHtml(question)}</p>`).join('')}</div>`;
        return `
            <div class="mock-exam-grid">
                <section class="mock-pane">
                    <h3>${escapeHtml(part.title)}</h3>
                    <p class="mock-instructions">Suggested time: ${escapeHtml(part.time)}</p>
                    ${body}
                </section>
                <section class="mock-pane">
                    <h3>Preparation notes</h3>
                    <textarea class="mock-speaking-notes" data-speaking-notes="${index}" aria-label="Speaking notes for ${escapeHtml(part.title)}" placeholder="Jot down a few ideas before you speak...">${escapeHtml(answer)}</textarea>
                    <div class="mock-recording-controls">
                        <button class="btn btn-outline" type="button" data-action="record"><i class="fas fa-microphone"></i> Start recording</button>
                        <audio class="mock-recording-preview" controls hidden></audio>
                    </div>
                    <div class="mock-ai-feedback">
                        <label><input type="checkbox" data-ai-consent> I agree to send this recording to OpenAI for transcription and feedback. Do not include personal or sensitive information.</label>
                        <button class="btn btn-outline" type="button" data-action="ai-feedback" data-feedback-skill="speaking">Get AI feedback</button>
                        <p class="mock-feedback-status" role="status" aria-live="polite" hidden></p>
                        <div class="mock-feedback-result" aria-live="polite"></div>
                    </div>
                </section>
            </div>
        `;
    }

    function renderExamResults(result) {
        if (result.skill === 'reading' || result.skill === 'listening') {
            const paper = paperFor(result.skill, result.paperId);
            const allQuestions = paper.parts.flatMap(part => part.groups.flatMap(group => group.questions.map(question => ({ question, group }))));
            return `
                <div class="mock-review-list">
                    ${allQuestions.map(({ question, group }) => {
                        const answer = result.answers[question.id] || '';
                        const correct = isCorrect(question, answer, group);
                        const prompt = question.text || (hasGroupedGapPrompt(group) ? `Summary completion blank ${group.questions.indexOf(question) + 1}` : `Complete answer ${question.number}`);
                        return `<div class="mock-question"><p class="mock-question-label"><span class="mock-question-number">${question.number}.</span><span>${escapeHtml(prompt)}</span></p><p class="mock-review-answer">${correct ? 'Correct' : `Your answer: ${escapeHtml(answer || 'Unanswered')} · Correct answer: ${escapeHtml(question.answer)}`}</p></div>`;
                    }).join('')}
                </div>
            `;
        }
        if (result.skill === 'writing') {
            const paper = paperFor('writing', result.paperId);
            return `<div class="mock-content-note">${paper.tasks.map(task => `${escapeHtml(task.title)}: ${wordCount(result.writingAnswers[task.id] || '')} words (minimum ${task.minWords}).`).join('<br>')} Writing answers are saved locally; no automatic band score is generated.</div>`;
        }
        return '<p class="mock-content-note">Your Speaking notes are saved locally. Recordings are temporary and can only be replayed before submission. Speaking is not automatically band-scored.</p>';
    }

    function renderResults() {
        const results = session.results || [];
        const summary = results.map(result => {
            const label = skillLabels[result.skill];
            const score = result.rawScore === undefined
                ? (result.skill === 'writing' ? 'Writing saved' : 'Speaking complete')
                : `${result.rawScore}/${result.totalQuestions} correct`;
            return `
                <article class="mock-results-card">
                    <div class="mock-result-heading"><h2>${escapeHtml(label)}</h2><span class="mock-status">${formatTime(result.elapsed || 0)} used</span></div>
                    <div class="mock-result-score">${escapeHtml(score)}</div>
                    ${renderExamResults(result)}
                </article>
            `;
        }).join('');
        root.innerHTML = `
            <section class="mock-results-page">
                <div class="mock-library-intro">
                    <div><h2>Test submitted.</h2><p>${escapeHtml(session.title)} · ${session.mode === 'exam' ? 'Exam conditions' : 'Practice mode'}</p></div>
                    <span class="mock-status">Completed ${new Date().toLocaleString()}</span>
                </div>
                ${results.length === 0 ? '<p class="mock-content-note">No answers were submitted.</p>' : `<div class="mock-results-list">${summary}</div>`}
                <div class="mock-result-actions">
                    <button class="btn btn-primary" type="button" data-action="library">Back to mock tests</button>
                    <button class="btn btn-outline" type="button" data-action="retry">Try another mock</button>
                </div>
            </section>
        `;
    }

    function isCorrect(question, answer, group) {
        if (!answer.trim()) return false;
        const normalise = value => String(value).normalize('NFKC').trim().toLocaleLowerCase('en')
            .replace(/[‘’]/g, "'").replace(/[‐‑–—]/g, '-').replace(/\s+/g, ' ');
        const accepted = [question.answer, ...(question.alternatives || [])];
        if (!accepted.some(value => normalise(value) === normalise(answer))) return false;
        const limit = group.wordLimit || wordLimitFromInstructions(group.instructions);
        if (limit && wordCount(answer) > limit && !/\d/.test(answer) && !/\d/.test(question.answer)) return false;
        return true;
    }

    function wordLimitFromInstructions(instructions) {
        const match = String(instructions || '').toUpperCase().match(/NO MORE THAN (ONE|TWO|THREE|FOUR) WORD/);
        return match ? { ONE: 1, TWO: 2, THREE: 3, FOUR: 4 }[match[1]] : 0;
    }

    function wordCount(text) {
        return String(text || '').trim() ? String(text).trim().split(/\s+/u).length : 0;
    }

    function answeredCount() {
        return Object.values(session.answers).filter(value => String(value).trim()).length;
    }

    function questionCount() {
        if (session.skill === 'speaking') return 0;
        const paper = currentPaper();
        return session.skill === 'writing'
            ? paper.tasks.length
            : numberOfQuestions(paper);
    }

    function scoreCurrentStage() {
        const skill = session.skill;
        const result = {
            skill,
            paperId: session.paperId,
            answers: { ...session.answers },
            writingAnswers: { ...session.writingAnswers },
            speakingNotes: { ...session.speakingNotes },
            elapsed: Math.max(0, Math.floor((Date.now() - session.startedAt) / 1000))
        };
        if (skill === 'reading' || skill === 'listening') {
            const paper = currentPaper();
            const all = paper.parts.flatMap(part => part.groups.flatMap(group => group.questions.map(question => ({ question, group }))));
            result.totalQuestions = all.length;
            result.rawScore = all.filter(item => isCorrect(item.question, session.answers[item.question.id] || '', item.group)).length;
        }
        return result;
    }

    function submitStage(force) {
        if (!session || session.status !== 'active') return;
        if (!force && session.skill !== 'speaking' && !window.confirm(`Submit ${skillLabels[session.skill]}? You cannot edit this section afterwards.`)) return;
        stopListeningAudio();
        const result = scoreCurrentStage();
        session.results.push(result);
        stopRecording();
        if (session.kind === 'full' && session.stageIndex < session.sequence.length - 1) {
            session.stageIndex += 1;
            session.skill = session.sequence[session.stageIndex];
            session.paperId = session.paperIds[session.skill];
            session.partIndex = 0;
            session.answers = {};
            session.startedAt = Date.now();
            session.deadline = Date.now() + durationFor(session.skill, currentPaper()) * 1000;
            session.pausedAt = null;
            expiryHandled = false;
            persistSession();
            renderExam();
            return;
        }
        session.results.forEach(completedResult => recordCompletedMock(completedResult));
        session.status = 'complete';
        persistSession();
        renderResults();
    }

    function exitSession() {
        const keep = session.mode === 'practice' && window.confirm('Save this unfinished practice and leave the test?');
        if (keep) {
            persistSession();
            session = null;
        } else if (window.confirm('Exit and discard this unfinished mock test?')) {
            session = null;
            persistSession();
        } else {
            return;
        }
        stopListeningAudio();
        stopRecording();
        renderLibrary();
    }

    function pauseSession() {
        if (!session || session.mode !== 'practice') return;
        if (session.pausedAt) {
            session.deadline = Date.now() + session.pausedRemaining * 1000;
            session.pausedAt = null;
            session.pausedRemaining = 0;
        } else {
            session.pausedRemaining = remaining();
            session.pausedAt = Date.now();
        }
        persistSession();
        renderExam();
    }

    function currentSetMode() {
        const picker = root.querySelector('#mock-mode');
        if (picker) selectedMode = picker.value;
    }

    function render() {
        if (session && session.status === 'active') renderExam();
        else renderLibrary();
    }

    function startTimer() {
        window.setInterval(() => {
            if (!session || session.status !== 'active' || session.pausedAt) return;
            const clock = root.querySelector('#mock-timer');
            const seconds = remaining();
            if (clock) {
                clock.innerHTML = `<i class="fas fa-clock"></i>${formatTime(seconds)}`;
                clock.classList.toggle('urgent', seconds < 300);
            }
            if (seconds === 0 && !expiryHandled) {
                expiryHandled = true;
                submitStage(true);
            }
        }, 1000);
    }

    function handleClick(event) {
        const button = event.target.closest('[data-action]');
        if (!button) return;
        const action = button.dataset.action;

        if (action === 'view') {
            libraryView = button.dataset.view;
            renderLibrary();
        } else if (action === 'skill') {
            selectedSkill = button.dataset.skill;
            renderLibrary();
        } else if (action === 'start-full') {
            currentSetMode();
            startFull(Number(button.dataset.set));
        } else if (action === 'start-paper') {
            currentSetMode();
            startPaper(button.dataset.skill, button.dataset.paper);
        } else if (action === 'start-speaking') {
            currentSetMode();
            startSpeaking();
        } else if (action === 'submit') {
            submitStage();
        } else if (action === 'exit') {
            exitSession();
        } else if (action === 'pause') {
            pauseSession();
        } else if (action === 'library' || action === 'retry') {
            session = null;
            persistSession();
            renderLibrary();
        } else if (action === 'record') {
            toggleRecording(button);
        } else if (action === 'ai-feedback') {
            requestAIFeedback(button);
        } else if (action === 'toggle-listening-audio') {
            toggleListeningAudio(button);
        }
    }

    function initializeListeningAudio() {
        const audio = root.querySelector('.mock-audio');
        if (!audio) return;
        const updateControls = () => updateListeningAudioControls(audio);
        audio.addEventListener('loadedmetadata', updateControls);
        audio.addEventListener('timeupdate', updateControls);
        audio.addEventListener('play', updateControls);
        audio.addEventListener('pause', updateControls);
        audio.addEventListener('ended', updateControls);
        audio.addEventListener('error', () => {
            const button = root.querySelector('[data-action="toggle-listening-audio"]');
            const status = root.querySelector('.mock-audio-status');
            if (button) button.disabled = false;
            if (status) status.textContent = 'Listening audio could not be loaded.';
        });
        updateControls();
    }

    function toggleListeningAudio(button) {
        const audio = root.querySelector('.mock-audio');
        if (!audio) {
            notify('Listening audio is unavailable for this section.');
            return;
        }
        if (!audio.paused && !audio.ended) return;
        if (audio.ended) audio.currentTime = 0;
        button.disabled = true;
        const playback = audio.play();
        if (playback && typeof playback.catch === 'function') {
            playback.then(() => updateListeningAudioControls(audio, button)).catch(error => {
                console.error('Unable to play listening audio.', error);
                button.disabled = false;
                updateListeningAudioControls(audio, button);
                notify('Listening audio could not be played in this browser.');
            });
        } else {
            updateListeningAudioControls(audio, button);
        }
    }

    function updateListeningAudioControls(audio, button = root.querySelector('[data-action="toggle-listening-audio"]')) {
        const status = root.querySelector('.mock-audio-status');
        if (!button) return;
        const isPlaying = !audio.paused && !audio.ended;
        const label = isPlaying ? 'Playing audio' : audio.ended ? 'Replay audio' : audio.currentTime > 0 ? 'Continue audio' : 'Play audio';
        button.innerHTML = `<i class="fas ${isPlaying ? 'fa-volume-up' : 'fa-play'}" aria-hidden="true"></i> ${label}`;
        button.disabled = isPlaying;
        button.setAttribute('aria-label', `${label} for listening section`);
        button.setAttribute('aria-pressed', String(isPlaying));
        if (status) status.textContent = `${formatAudioTime(audio.currentTime)} / ${formatAudioTime(audio.duration)}`;
    }

    function stopListeningAudio() {
        const audio = root.querySelector('.mock-audio');
        if (audio) audio.pause();
    }

    function handleInput(event) {
        const target = event.target;
        if (target.dataset.answer) {
            session.answers[target.dataset.answer] = target.value;
            persistSession();
        } else if (target.dataset.writingAnswer) {
            session.writingAnswers[target.dataset.writingAnswer] = target.value;
            const count = root.querySelector('#writing-count');
            if (count) count.textContent = wordCount(target.value);
            persistSession();
        } else if (target.dataset.speakingNotes !== undefined) {
            session.speakingNotes[target.dataset.speakingNotes] = target.value;
            persistSession();
        }
    }

    function handleChange(event) {
        const target = event.target;
        if (target.dataset.partSelect !== undefined) {
            session.partIndex = Number(target.value);
            persistSession();
            renderExam();
        } else if (target.dataset.answer) {
            session.answers[target.dataset.answer] = target.value;
            persistSession();
        } else if (target.id === 'mock-mode') {
            selectedMode = target.value;
        }
    }

    async function toggleRecording(button) {
        if (recorder && recorder.state === 'recording') {
            recorder.stop();
            button.innerHTML = '<i class="fas fa-microphone"></i> Start recording';
            return;
        }
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
            notify('Audio recording is not supported in this browser.');
            return;
        }
        try {
            recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            recordingChunks = [];
            recordingBlob = null;
            recordedPartIndex = -1;
            recordingPartIndex = session && session.skill === 'speaking' ? session.partIndex : -1;
            const preferredMimeType = typeof MediaRecorder.isTypeSupported === 'function'
                ? ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find(type => MediaRecorder.isTypeSupported(type))
                : '';
            recorder = preferredMimeType
                ? new MediaRecorder(recordingStream, { mimeType: preferredMimeType })
                : new MediaRecorder(recordingStream);
            recorder.addEventListener('dataavailable', event => {
                if (event.data.size) recordingChunks.push(event.data);
            });
            recorder.addEventListener('stop', () => {
                if (recordingUrl) URL.revokeObjectURL(recordingUrl);
                recordingBlob = new Blob(recordingChunks, { type: recorder.mimeType || 'audio/webm' });
                recordedPartIndex = recordingPartIndex;
                recordingUrl = URL.createObjectURL(recordingBlob);
                const preview = root.querySelector('.mock-recording-preview');
                if (preview) {
                    preview.src = recordingUrl;
                    preview.hidden = false;
                }
                if (recordingStream) recordingStream.getTracks().forEach(track => track.stop());
                recordingStream = null;
            }, { once: true });
            recorder.start();
            button.innerHTML = '<i class="fas fa-stop"></i> Stop recording';
        } catch (error) {
            notify(`Microphone could not start: ${error.message}`);
        }
    }

    function setFeedbackStatus(container, message, isError) {
        const status = container.querySelector('.mock-feedback-status');
        status.textContent = message;
        status.classList.toggle('error', isError);
        status.hidden = !message;
    }

    function appendFeedbackSection(container, title, values) {
        if (!values.length) return;
        const section = document.createElement('section');
        const heading = document.createElement('h4');
        heading.textContent = title;
        const list = document.createElement('ul');
        values.forEach(value => {
            const item = document.createElement('li');
            item.textContent = value;
            list.append(item);
        });
        section.append(heading, list);
        container.append(section);
    }

    function renderAIFeedback(container, feedback, transcript) {
        const result = container.querySelector('.mock-feedback-result');
        result.replaceChildren();
        if (transcript) {
            const transcriptSection = document.createElement('section');
            const transcriptHeading = document.createElement('h4');
            const transcriptText = document.createElement('p');
            transcriptHeading.textContent = 'Speech transcript';
            transcriptText.textContent = transcript;
            transcriptSection.append(transcriptHeading, transcriptText);
            result.append(transcriptSection);
        }
        const summary = document.createElement('p');
        summary.className = 'mock-feedback-summary';
        summary.textContent = feedback.summary;
        result.append(summary);
        appendFeedbackSection(result, 'What went well', feedback.strengths);
        appendFeedbackSection(result, 'Try improving', feedback.improvements);
        const nextPractice = document.createElement('p');
        nextPractice.textContent = `Next practice: ${feedback.nextPractice}`;
        result.append(nextPractice);
    }

    async function blobToBase64(blob) {
        if (blob.size > 2_000_000) throw new Error('The recording is larger than 2 MB. Record a shorter response.');
        const bytes = new Uint8Array(await blob.arrayBuffer());
        let binary = '';
        const chunkSize = 0x8000;
        for (let offset = 0; offset < bytes.length; offset += chunkSize) {
            binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
        }
        return btoa(binary);
    }

    async function requestAIFeedback(button) {
        const container = button.closest('.mock-ai-feedback');
        const consent = container.querySelector('[data-ai-consent]');
        if (!consent.checked) {
            setFeedbackStatus(container, 'Check the consent box before sending your response.', true);
            return;
        }

        const skill = button.dataset.feedbackSkill;
        let prompt;
        let answer;
        let audioBlob;
        let audioBase64;
        let mimeType;
        if (skill === 'writing') {
            const task = currentPaper().tasks.find(item => item.id === button.dataset.taskId);
            answer = task ? session.writingAnswers[task.id] || '' : '';
            if (!task || !answer.trim()) {
                setFeedbackStatus(container, 'Write a response before requesting feedback.', true);
                return;
            }
            prompt = `${task.title}\n${task.prompt}`;
        } else {
            if (!recordingBlob || recordedPartIndex !== session.partIndex) {
                setFeedbackStatus(container, 'Record and stop your answer for this speaking part before requesting feedback.', true);
                return;
            }
            if (!speakingParts[session.partIndex]) {
                setFeedbackStatus(container, 'The speaking prompt could not be found.', true);
                return;
            }
            prompt = [
                speakingParts[session.partIndex].title,
                speakingParts[session.partIndex].topic || '',
                ...(speakingParts[session.partIndex].questions || []),
                ...(speakingParts[session.partIndex].cues || [])
            ].filter(Boolean).join('\n');
            audioBlob = recordingBlob;
            mimeType = audioBlob.type.split(';')[0];
        }

        const originalLabel = button.textContent;
        button.disabled = true;
        button.textContent = 'Getting feedback…';
        setFeedbackStatus(container, '', false);
        try {
            await window.ieltsAccountReady;
            if (!window.ieltsAccount) throw new Error('Cloud account services are not configured on this host.');
            const token = await window.ieltsAccount.getIdToken();
            const payload = { skill, prompt, consent: true };
            if (skill === 'writing') payload.answer = answer;
            else {
                audioBase64 = await blobToBase64(audioBlob);
                Object.assign(payload, { audioBase64, mimeType });
            }
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.error || 'AI feedback is temporarily unavailable.');
            renderAIFeedback(container, result.feedback, result.transcript);
            setFeedbackStatus(container, `${result.remainingToday} AI feedback requests remaining today.`, false);
        } catch (error) {
            console.error('AI feedback request failed.', error);
            setFeedbackStatus(container, error.message || 'AI feedback is temporarily unavailable. Please try again later.', true);
        } finally {
            button.disabled = false;
            button.textContent = originalLabel;
        }
    }

    function stopRecording() {
        if (recorder && recorder.state === 'recording') recorder.stop();
        if (recordingStream) recordingStream.getTracks().forEach(track => track.stop());
        recordingStream = null;
    }

    function handleVisibility() {
        if (document.visibilityState === 'hidden' && session && session.status === 'active' && session.mode === 'exam') {
            session.focusLosses = (session.focusLosses || 0) + 1;
            persistSession();
        }
    }

    root.addEventListener('click', handleClick);
    root.addEventListener('input', handleInput);
    root.addEventListener('change', handleChange);
    root.addEventListener('error', event => {
        const target = event.target;
        if (target.tagName === 'AUDIO' && target.classList.contains('mock-audio')) {
            notify('Listening audio could not load. Run node serve.js and open this site at http://127.0.0.1:8765/ielts-master.html instead of opening the HTML file directly.');
        }
    }, true);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', persistSession);

    if (session) {
        if (!session.results) session.results = [];
        if (!session.writingAnswers) session.writingAnswers = {};
        if (!session.speakingNotes) session.speakingNotes = {};
    }
    render();
    startTimer();
})();
