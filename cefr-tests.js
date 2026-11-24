(function () {
    const root = document.getElementById('cefr-mock-root');
    if (!root) return;

    const mocks = {
        A1: {
            title: 'Beginner',
            listening: 'Hello, my name is Mia. I live in York and work at a hospital. I am a nurse. I work from Monday to Friday. On Saturday, I visit my sister.',
            reading: 'The Green Cafe is open from eight in the morning until four in the afternoon on weekdays. On Saturday, it closes at two. It is closed on Sunday. Soup costs five pounds and tea costs two pounds.',
            writingPrompt: 'Write 3–5 sentences introducing yourself. Include where you live and one thing you like.',
            speakingPrompt: 'Speak for about one minute about your usual morning.',
            questions: [
                { section: 'listening', text: 'Where does Mia live?', options: ['York', 'London', 'Oxford', 'Bristol'], answer: 0, explanation: 'Mia says that she lives in York.' },
                { section: 'listening', text: 'What is Mia’s job?', options: ['Teacher', 'Nurse', 'Cook', 'Student'], answer: 1, explanation: 'She says, “I am a nurse.”' },
                { section: 'listening', text: 'Who does Mia visit on Saturday?', options: ['Her friend', 'Her mother', 'Her sister', 'Her cousin'], answer: 2, explanation: 'She visits her sister on Saturday.' },
                { section: 'reading', text: 'Which day is the cafe closed?', options: ['Friday', 'Saturday', 'Sunday', 'Monday'], answer: 2, explanation: 'The cafe is closed on Sunday.' },
                { section: 'reading', text: 'How much is the soup?', options: ['Two pounds', 'Three pounds', 'Four pounds', 'Five pounds'], answer: 3, explanation: 'The passage says that soup costs five pounds.' },
                { section: 'reading', text: 'What time does the cafe close on Saturday?', options: ['At noon', 'At two', 'At four', 'At eight'], answer: 1, explanation: 'The cafe closes at two on Saturday.' }
            ]
        },
        A2: {
            title: 'Elementary',
            listening: 'Good morning, passengers. The ten fifteen train to Oxford is delayed by twenty minutes. Please wait on platform four. Passengers who need help can speak to a member of station staff.',
            reading: 'Lina usually cycles to work, but yesterday it rained heavily, so she took the bus. The bus was crowded and arrived ten minutes late. Her manager allowed her to finish work later that day.',
            writingPrompt: 'Write a short message to a friend about your plans for the coming weekend. Give a time and place.',
            speakingPrompt: 'Describe a place in your town that you like visiting and explain why.',
            questions: [
                { section: 'listening', text: 'Where is the train going?', options: ['Oxford', 'Cambridge', 'York', 'Brighton'], answer: 0, explanation: 'The announcement says the train is going to Oxford.' },
                { section: 'listening', text: 'How long is the train delayed?', options: ['Ten minutes', 'Fifteen minutes', 'Twenty minutes', 'Thirty minutes'], answer: 2, explanation: 'It is delayed by twenty minutes.' },
                { section: 'listening', text: 'Which platform should passengers use?', options: ['Platform one', 'Platform two', 'Platform three', 'Platform four'], answer: 3, explanation: 'Passengers are asked to wait on platform four.' },
                { section: 'reading', text: 'Why did Lina take the bus?', options: ['Her bicycle was broken.', 'It was raining heavily.', 'She missed her usual bus.', 'She had to carry a large bag.'], answer: 1, explanation: 'She took the bus because it rained heavily.' },
                { section: 'reading', text: 'What did Lina’s manager allow her to do?', options: ['Work from home', 'Take the afternoon off', 'Finish work later', 'Start work earlier'], answer: 2, explanation: 'Her manager allowed her to finish later that day.' },
                { section: 'reading', text: 'Why did Lina’s bus arrive late?', options: ['The weather was bad.', 'The road was closed.', 'The bus was crowded.', 'Lina got on the wrong bus.'], answer: 2, explanation: 'The passage says the crowded bus arrived ten minutes late.' }
            ]
        },
        B1: {
            title: 'Intermediate',
            listening: 'Hi, Sam. The weekend photography course runs for six Saturdays and starts next month. Please register by Friday because places are limited. Bring your own laptop; the instructor will provide the cameras for the outdoor sessions.',
            reading: 'Greenbridge introduced a bicycle-share scheme to reduce traffic in its centre. Use has grown quickly near the railway station, but residents in outer neighbourhoods use it less often. The council plans to add stations farther out and offer discounted annual memberships.',
            writingPrompt: 'Write an email to a friend describing a useful course or skill you have learned. Explain what you learned and how it helped you.',
            speakingPrompt: 'Describe a time you learned something new. Say what was difficult and what helped you succeed.',
            questions: [
                { section: 'listening', text: 'How long does the photography course last?', options: ['Three Saturdays', 'Four Saturdays', 'Six Saturdays', 'Eight Saturdays'], answer: 2, explanation: 'The course runs for six Saturdays.' },
                { section: 'listening', text: 'When should people register?', options: ['By Friday', 'By the end of the month', 'On the first Saturday', 'After the course begins'], answer: 0, explanation: 'The message asks people to register by Friday.' },
                { section: 'listening', text: 'What should participants bring?', options: ['A camera', 'A laptop', 'A printed map', 'A tripod'], answer: 1, explanation: 'Participants should bring their own laptop; cameras are provided.' },
                { section: 'reading', text: 'What was the main purpose of the bicycle-share scheme?', options: ['To attract more tourists', 'To reduce traffic downtown', 'To replace the railway station', 'To raise money for the council'], answer: 1, explanation: 'The scheme was introduced to reduce traffic in the centre.' },
                { section: 'reading', text: 'What does the council plan to do for outer neighbourhoods?', options: ['Remove existing stations', 'Add stations and discounted memberships', 'Make all journeys free', 'Limit bicycle use near the centre'], answer: 1, explanation: 'It plans to add stations farther out and offer discounted annual memberships.' },
                { section: 'reading', text: 'Where has bicycle-share use grown quickly?', options: ['Near the railway station', 'In the outer neighbourhoods', 'Along the river', 'At the university'], answer: 0, explanation: 'Use has grown quickly near the railway station.' }
            ]
        },
        B2: {
            title: 'Upper-intermediate',
            listening: 'A quick update about Friday’s project meeting: we will meet at ten in room three twenty-one, not in the usual conference room. Please send your revised proposal by Thursday afternoon. There is no need to print it, as colleagues joining remotely will use the shared document.',
            reading: 'A four-day working-week pilot at a regional firm kept overall output stable while short-term absences declined. Customer-service teams maintained coverage by rotating their days off. The results were less straightforward in departments whose work depended on daily coordination with external partners.',
            writingPrompt: 'Write 180–220 words discussing whether employers should offer a four-day working week. Support your view with reasons and examples.',
            speakingPrompt: 'Give a short argument for or against flexible working hours, then respond to one possible objection.',
            questions: [
                { section: 'listening', text: 'When is the project meeting?', options: ['Thursday at ten', 'Friday at ten', 'Friday at three', 'Monday at ten'], answer: 1, explanation: 'The meeting is on Friday at ten.' },
                { section: 'listening', text: 'Where will the meeting take place?', options: ['The usual conference room', 'Room three twenty-one', 'The main office lobby', 'An online meeting room only'], answer: 1, explanation: 'The message gives room three twenty-one as the new location.' },
                { section: 'listening', text: 'Why is printing the proposal unnecessary?', options: ['The proposal is not final.', 'The printer is unavailable.', 'Remote colleagues will use the shared document.', 'The meeting has been cancelled.'], answer: 2, explanation: 'Colleagues joining remotely will use the shared document.' },
                { section: 'reading', text: 'What happened to overall output during the pilot?', options: ['It stayed stable.', 'It fell significantly.', 'It doubled.', 'The passage does not say.'], answer: 0, explanation: 'The pilot kept overall output stable.' },
                { section: 'reading', text: 'Which departments found the results less straightforward?', options: ['Those with no external customers', 'Those relying on daily coordination with partners', 'Those that already worked remotely', 'Those with rotating customer-service shifts'], answer: 1, explanation: 'The final sentence identifies departments that depended on daily coordination with external partners.' },
                { section: 'reading', text: 'How did customer-service teams keep their service available?', options: ['By hiring more staff', 'By rotating days off', 'By shortening opening hours', 'By moving all work online'], answer: 1, explanation: 'The teams maintained coverage by rotating their days off.' }
            ]
        },
        C1: {
            title: 'Advanced',
            listening: 'The research seminar has been moved to Thursday afternoon. Please circulate your revised abstracts by noon on Wednesday so the discussants have time to read them. The change does not affect the data session, which will retain its original format; only the order of the presentations has been adjusted.',
            reading: 'Urban tree canopies can moderate local heat, yet their benefits are rarely distributed evenly. Neighbourhoods with fewer mature trees often face the greatest exposure, while new planting alone cannot immediately reproduce the shade or ecological functions of established trees. Effective programmes therefore combine long-term maintenance with species diversity and decisions informed by residents.',
            writingPrompt: 'Write 220–260 words recommending how a city should improve access to urban green space. Address evidence, trade-offs, and long-term maintenance.',
            speakingPrompt: 'Discuss how public projects can balance expert evidence with the priorities of local residents.',
            questions: [
                { section: 'listening', text: 'When has the seminar been rescheduled for?', options: ['Wednesday morning', 'Wednesday afternoon', 'Thursday afternoon', 'Friday morning'], answer: 2, explanation: 'The seminar has been moved to Thursday afternoon.' },
                { section: 'listening', text: 'When should revised abstracts be circulated?', options: ['By noon on Wednesday', 'At the seminar', 'By Thursday evening', 'After the data session'], answer: 0, explanation: 'The abstracts should be circulated by noon on Wednesday.' },
                { section: 'listening', text: 'What remains unchanged?', options: ['The order of presentations', 'The date of the seminar', 'The data session format', 'The discussants’ schedule'], answer: 2, explanation: 'The data session retains its original format.' },
                { section: 'reading', text: 'Why may new tree planting be insufficient on its own?', options: ['Young trees cannot immediately provide all the benefits of mature ones.', 'Residents always oppose planting in their neighbourhoods.', 'Urban trees increase local temperatures.', 'Species diversity prevents trees from growing.'], answer: 0, explanation: 'The passage says new planting cannot immediately reproduce mature trees’ shade and ecological functions.' },
                { section: 'reading', text: 'Which approach does the passage support?', options: ['Planting a single species as quickly as possible', 'Combining maintenance, species diversity, and resident input', 'Removing older trees before planting new ones', 'Focusing only on neighbourhoods with many trees'], answer: 1, explanation: 'The final sentence recommends that combined approach.' },
                { section: 'reading', text: 'Which neighbourhoods face the greatest heat exposure?', options: ['Those with fewer mature trees', 'Those with newer buildings', 'Those with the most residents', 'Those with diverse tree species'], answer: 0, explanation: 'Neighbourhoods with fewer mature trees often face the greatest exposure.' }
            ]
        },
        C2: {
            title: 'Proficient',
            listening: 'The archive’s new catalogue will go live next month, although one collection will remain restricted pending a review of its provenance. This is not a judgement on the material’s authenticity; rather, the correspondence is incomplete, and several attributions rest on later annotations. A digital surrogate may be released once those records have been reconciled.',
            reading: 'Public forecasts are often judged by whether a central estimate proves accurate. Yet a point estimate stripped of its uncertainty can be less informative than a carefully calibrated range. Communicating uncertainty is not an admission of analytical failure: it enables decision-makers to distinguish robust conclusions from those contingent on assumptions that may not hold.',
            writingPrompt: 'Write 250–300 words evaluating the claim that a forecast’s precision matters more than communicating its uncertainty. Develop a nuanced position.',
            speakingPrompt: 'Discuss how institutions should handle incomplete historical records when publishing a public account.',
            questions: [
                { section: 'listening', text: 'Why will one collection remain restricted?', options: ['Its authenticity has been rejected.', 'Its provenance is still under review.', 'The catalogue has been cancelled.', 'The material has not been digitised.'], answer: 1, explanation: 'The collection is restricted pending a provenance review.' },
                { section: 'listening', text: 'What does the speaker say about the collection’s authenticity?', options: ['It has been disproved.', 'It is not the reason for the restriction.', 'It has been conclusively established.', 'It cannot be assessed digitally.'], answer: 1, explanation: 'The restriction is explicitly described as not being a judgement on authenticity.' },
                { section: 'listening', text: 'What may happen after the records are reconciled?', options: ['The collection may be destroyed.', 'A digital surrogate may be released.', 'The annotations will be removed.', 'The catalogue will remain unpublished.'], answer: 1, explanation: 'A digital surrogate may be released once the records have been reconciled.' },
                { section: 'reading', text: 'What limitation of a single central estimate does the passage identify?', options: ['It may conceal the uncertainty around the forecast.', 'It is always less accurate than a range.', 'It cannot be used by decision-makers.', 'It depends on no underlying assumptions.'], answer: 0, explanation: 'A point estimate without uncertainty can hide the range of plausible outcomes.' },
                { section: 'reading', text: 'According to the passage, communicating uncertainty can help decision-makers to…', options: ['avoid making any forecasts.', 'identify which conclusions depend on assumptions.', 'replace evidence with opinion.', 'ensure that every estimate is correct.'], answer: 1, explanation: 'The passage says it helps distinguish robust conclusions from assumption-dependent ones.' },
                { section: 'reading', text: 'Why can communicating uncertainty be useful?', options: ['It removes the need to make forecasts.', 'It shows which conclusions depend on assumptions.', 'It guarantees that estimates are correct.', 'It replaces evidence with a single exact figure.'], answer: 1, explanation: 'It helps distinguish robust conclusions from those that depend on assumptions.' }
            ]
        }
    };

    const skillOrder = ['listening', 'reading', 'writing', 'speaking'];
    const skillNames = {
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
    const skillDescriptions = {
        listening: 'Listen to a short level-matched recording and answer questions.',
        reading: 'Read a level-matched passage and answer comprehension questions.',
        writing: 'Complete a timed writing prompt for this CEFR level.',
        speaking: 'Practise speaking aloud using a level-matched prompt.'
    };
    const skillTimes = {
        A1: { listening: 3, reading: 5, writing: 8, speaking: 2 },
        A2: { listening: 4, reading: 6, writing: 10, speaking: 3 },
        B1: { listening: 5, reading: 8, writing: 15, speaking: 4 },
        B2: { listening: 6, reading: 10, writing: 20, speaking: 5 },
        C1: { listening: 7, reading: 12, writing: 25, speaking: 6 },
        C2: { listening: 8, reading: 15, writing: 30, speaking: 7 }
    };
    const levelRoot = document.getElementById('cefr-level-root');
    let activeLevel = '';
    let activeSkill = '';
    let activeQuestions = [];
    let answers = [];
    let writingResponse = '';
    let speakingNotes = '';
    let secondsRemaining = 0;
    let timerId = null;
    let listeningPlays = 0;
    let finished = false;

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, character => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[character]);
    }

    function openLevel(level) {
        if (!Object.prototype.hasOwnProperty.call(mocks, level)) {
            console.error('Unknown CEFR level.', level);
            return;
        }
        activeLevel = level;
        renderLevel();
        showPage('cefr-level-tests');
    }

    function renderLevel() {
        const mock = mocks[activeLevel];
        const cards = skillOrder.map(skill => {
            const questions = mock.questions.filter(question => question.section === skill).length;
            const detail = questions
                ? `${questions} questions · ${skillTimes[activeLevel][skill]} min`
                : `Open response · ${skillTimes[activeLevel][skill]} min`;
            return `
                <article class="cefr-skill-card">
                    <span class="cefr-skill-icon"><i class="fas ${skillIcons[skill]}" aria-hidden="true"></i></span>
                    <div>
                        <h2>${skillNames[skill]}</h2>
                        <p>${skillDescriptions[skill]}</p>
                        <span class="cefr-skill-meta">${detail}</span>
                    </div>
                    <button class="btn btn-primary" type="button" data-cefr-skill="${skill}">
                        Start ${skillNames[skill]} <i class="fas fa-arrow-right" aria-hidden="true"></i>
                    </button>
                </article>
            `;
        }).join('');
        levelRoot.innerHTML = `
            <div class="section-header cefr-level-header">
                <div>
                    <h1 class="section-title">${activeLevel} · ${escapeHtml(mock.title)}</h1>
                    <p class="section-subtitle">Choose one skill. Each mock has its own timer and result.</p>
                </div>
                <button class="btn btn-outline" type="button" data-cefr-action="back-to-cefr">Back to CEFR levels</button>
            </div>
            <div class="cefr-skill-grid">${cards}</div>
        `;
    }

    function startMock(level, skill) {
        if (!Object.prototype.hasOwnProperty.call(mocks, level) || !skillOrder.includes(skill)) {
            console.error('Invalid CEFR mock selection.', { level, skill });
            return;
        }
        window.speechSynthesis?.cancel();
        window.clearInterval(timerId);
        activeLevel = level;
        activeSkill = skill;
        activeQuestions = mocks[level].questions.filter(question => question.section === skill);
        answers = Array(activeQuestions.length).fill(null);
        writingResponse = '';
        speakingNotes = '';
        listeningPlays = 0;
        finished = false;
        secondsRemaining = skillTimes[level][skill] * 60;
        showPage('cefr-mock');
        renderMock();
        root.scrollIntoView({ behavior: 'smooth', block: 'start' });
        timerId = window.setInterval(updateTimer, 1000);
    }

    function renderMock() {
        const mock = mocks[activeLevel];
        const questions = activeQuestions.map((question, index) => `
            <fieldset class="cefr-question">
                <legend>${index + 1}. ${escapeHtml(question.text)}</legend>
                ${question.options.map((option, optionIndex) => `
                    <label class="cefr-answer-option">
                        <input type="radio" name="cefr-question-${index}" value="${optionIndex}" ${answers[index] === optionIndex ? 'checked' : ''}>
                        <span>${escapeHtml(option)}</span>
                    </label>
                `).join('')}
            </fieldset>
        `).join('');
        const reading = activeSkill === 'reading'
            ? `<div class="cefr-reading-text">${escapeHtml(mock.reading)}</div>`
            : '';
        const listening = activeSkill === 'listening'
            ? `<div class="cefr-listening-control">
                <button class="btn btn-primary" type="button" data-cefr-action="listen" ${listeningPlays >= 2 ? 'disabled' : ''}>
                    <i class="fas fa-volume-up" aria-hidden="true"></i> Play audio
                </button>
                <span id="cefr-listening-status" role="status">Audio may be played twice. Uses your browser’s English voice.</span>
            </div>`
            : '';
        const writing = activeSkill === 'writing'
            ? `<div class="cefr-practice-task">
                <p>${escapeHtml(mock.writingPrompt)}</p>
                <label for="cefr-writing-response">Your response</label>
                <textarea id="cefr-writing-response" rows="8">${escapeHtml(writingResponse)}</textarea>
              </div>`
            : '';
        const speaking = activeSkill === 'speaking'
            ? `<div class="cefr-practice-task">
                <p>${escapeHtml(mock.speakingPrompt)}</p>
                <p class="cefr-speaking-hint">Speak aloud for the full section time. Use these notes if helpful.</p>
                <label for="cefr-speaking-notes">Notes</label>
                <textarea id="cefr-speaking-notes" rows="5">${escapeHtml(speakingNotes)}</textarea>
              </div>`
            : '';
        const timerMinutes = skillTimes[activeLevel][activeSkill];
        const answerCount = activeQuestions.length;

        root.innerHTML = `
            <section class="cefr-mock-card" aria-labelledby="cefr-mock-title">
                <div class="cefr-mock-top">
                    <div class="cefr-mock-identity">
                        <span class="cefr-mock-level">${activeLevel}</span>
                        <div>
                            <h2 id="cefr-mock-title">${activeLevel} ${escapeHtml(mock.title)} · ${skillNames[activeSkill]}</h2>
                            <p class="section-subtitle">${timerMinutes} minute ${skillNames[activeSkill]} mock</p>
                        </div>
                    </div>
                    <div class="cefr-mock-controls">
                        <span id="cefr-mock-timer" class="cefr-mock-timer" role="timer" aria-label="${skillNames[activeSkill]} time remaining"></span>
                        <button class="btn btn-outline" type="button" data-cefr-action="back-to-skills">Back to ${activeLevel} skills</button>
                    </div>
                </div>
                <div class="cefr-mock-section">
                    ${listening}
                    ${reading}
                    ${questions}
                    ${writing}
                    ${speaking}
                </div>
                <div class="cefr-mock-progress">
                    <span>${answerCount ? `0 of ${answerCount} questions answered` : `${skillNames[activeSkill]} practice`}</span>
                    <span>This skill is timed separately</span>
                </div>
                <p id="cefr-mock-status" class="cefr-mock-status" role="status"></p>
                <div class="cefr-mock-actions">
                    <button class="btn btn-primary" type="button" data-cefr-action="finish">Finish ${skillNames[activeSkill]} mock</button>
                </div>
            </section>
        `;
        updateTimerDisplay();
    }

    function updateTimerDisplay() {
        const timer = root.querySelector('#cefr-mock-timer');
        if (!timer) return;
        const minutes = Math.floor(Math.max(secondsRemaining, 0) / 60);
        const seconds = Math.max(secondsRemaining, 0) % 60;
        timer.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function updateTimer() {
        if (finished) return;
        secondsRemaining -= 1;
        updateTimerDisplay();
        if (secondsRemaining <= 0) finishMock(true);
    }

    function playListening() {
        const status = root.querySelector('#cefr-listening-status');
        if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
            status.textContent = 'Audio playback is not supported by this browser.';
            return;
        }
        if (listeningPlays >= 2) {
            status.textContent = 'The audio has already been played twice.';
            return;
        }
        window.speechSynthesis.cancel();
        const utterance = new window.SpeechSynthesisUtterance(mocks[activeLevel].listening);
        utterance.lang = 'en-US';
        utterance.rate = activeLevel === 'A1' || activeLevel === 'A2' ? 0.85 : 0.95;
        utterance.onerror = () => {
            status.textContent = 'The browser could not play the audio. Check that speech is available and try again.';
        };
        listeningPlays += 1;
        status.textContent = `Audio played ${listeningPlays} of 2 times.`;
        const button = root.querySelector('[data-cefr-action="listen"]');
        if (button && listeningPlays >= 2) button.disabled = true;
        window.speechSynthesis.speak(utterance);
    }

    function finishMock(timeExpired) {
        if (finished) return;
        const unanswered = activeQuestions.filter((question, index) => answers[index] === null).length;
        if (!timeExpired && unanswered && !window.confirm(`You have ${unanswered} unanswered question(s). Finish anyway?`)) return;
        finished = true;
        window.clearInterval(timerId);
        window.speechSynthesis?.cancel();
        const mock = mocks[activeLevel];
        const score = activeQuestions.reduce((total, question, index) =>
            total + (answers[index] === question.answer ? 1 : 0), 0);
        const percent = activeQuestions.length ? Math.round(score / activeQuestions.length * 100) : null;
        const review = activeQuestions.map((question, index) => {
            const correct = answers[index] === question.answer;
            const selected = answers[index] === null ? 'No answer' : question.options[answers[index]];
            return `
                <div class="cefr-review-item ${correct ? 'is-correct' : 'is-incorrect'}">
                    <strong>${index + 1}. ${correct ? 'Correct' : 'Review'}</strong>
                    <p>${escapeHtml(question.text)}</p>
                    <p>Your answer: ${escapeHtml(selected)} · Correct answer: ${escapeHtml(question.options[question.answer])}</p>
                    <p>${escapeHtml(question.explanation)}</p>
                </div>
            `;
        }).join('');
        const practiceResult = activeSkill === 'writing'
            ? `<div class="cefr-practice-task"><p>${escapeHtml(mock.writingPrompt)}</p><p>${writingResponse ? escapeHtml(writingResponse) : 'No written response provided.'}</p></div>`
            : activeSkill === 'speaking'
                ? `<div class="cefr-practice-task"><p>${escapeHtml(mock.speakingPrompt)}</p><p>${speakingNotes ? escapeHtml(speakingNotes) : 'No notes provided.'}</p></div>`
                : '';

        root.innerHTML = `
            <section class="cefr-mock-result" aria-labelledby="cefr-result-title">
                <h2 id="cefr-result-title">${activeLevel} ${skillNames[activeSkill]} mock ${timeExpired ? '— time is up' : 'complete'}</h2>
                ${percent === null ? '<p>Writing and speaking are self-practice tasks and are not automatically scored.</p>' : `<p class="cefr-mock-result-score">${score} / ${activeQuestions.length} (${percent}%)</p>`}
                ${timeExpired ? '<p>The section time ended.</p>' : ''}
                <div class="cefr-mock-actions">
                    <button class="btn btn-outline" type="button" data-cefr-action="back-to-skills">Back to ${activeLevel} skills</button>
                    <button class="btn btn-primary" type="button" data-cefr-action="retry">Try again</button>
                </div>
                ${practiceResult}
                ${review ? `<div class="cefr-mock-section"><h3>Answer review</h3>${review}</div>` : ''}
            </section>
        `;
        root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function leaveMock() {
        if (!finished && !window.confirm('Exit this mock and discard your current answers?')) return;
        window.clearInterval(timerId);
        window.speechSynthesis?.cancel();
        root.replaceChildren();
        showPage('cefr-level-tests');
    }

    root.addEventListener('click', event => {
        const actionButton = event.target.closest('[data-cefr-action]');
        if (!actionButton) return;
        const action = actionButton.dataset.cefrAction;
        if (action === 'listen') playListening();
        if (action === 'finish') finishMock(false);
        if (action === 'retry') startMock(activeLevel, activeSkill);
        if (action === 'back-to-skills') leaveMock();
    });

    root.addEventListener('change', event => {
        const input = event.target;
        if (!(input instanceof HTMLInputElement) || !input.matches('input[type="radio"][name^="cefr-question-"]')) return;
        const questionIndex = Number(input.name.replace('cefr-question-', ''));
        if (!Number.isInteger(questionIndex) || questionIndex < 0 || questionIndex >= answers.length) return;
        answers[questionIndex] = Number(input.value);
        const count = root.querySelector('.cefr-mock-progress span');
        if (count) count.textContent = `${answers.filter(answer => answer !== null).length} of ${answers.length} questions answered`;
    });

    root.addEventListener('input', event => {
        if (event.target.id === 'cefr-writing-response') writingResponse = event.target.value;
        if (event.target.id === 'cefr-speaking-notes') speakingNotes = event.target.value;
    });

    document.addEventListener('click', event => {
        const levelButton = event.target.closest('[data-cefr-start]');
        const skillButton = event.target.closest('[data-cefr-skill]');
        const backButton = event.target.closest('[data-cefr-action="back-to-cefr"]');
        if (levelButton) openLevel(levelButton.dataset.cefrStart);
        if (skillButton) startMock(activeLevel, skillButton.dataset.cefrSkill);
        if (backButton) showPage('cefr');
    });
})();
