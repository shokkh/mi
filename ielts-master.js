const mockProgressStorageKey = 'ielts-master-mock-progress';
const mockActivityStorageKey = 'ielts-master-mock-active-days';
const profileStorageKey = 'ielts-master-profile';
const mockProgressSkills = ['listening', 'reading', 'writing', 'speaking'];
let activeProfile = { name: 'Student', targetBand: 7.5, onboardingComplete: false };

function showSkillProgressError(message, error) {
    console.error(message, error);
    const status = document.getElementById('skillProgressStatus');
    status.textContent = 'Mock progress could not be loaded or saved in this browser.';
    status.hidden = false;
}

function readCompletedMockRecords() {
    let saved;
    try {
        saved = localStorage.getItem(mockProgressStorageKey);
    } catch (error) {
        showSkillProgressError('Unable to read saved mock progress.', error);
        return null;
    }
    if (!saved) return [];

    let records;
    try {
        records = JSON.parse(saved);
    } catch (error) {
        showSkillProgressError('Saved mock progress is not valid JSON.', error);
        return null;
    }

    if (!Array.isArray(records) || records.some(record =>
        !record ||
        !mockProgressSkills.includes(record.skill) ||
        typeof record.paperId !== 'string'
    )) {
        showSkillProgressError('Saved mock progress has an unexpected format.', new TypeError('Invalid mock progress data.'));
        return null;
    }
    return records;
}

function renderSkillProgress() {
    const status = document.getElementById('skillProgressStatus');
    const bank = window.IELTS_MOCK_BANK;
    if (!bank) {
        showSkillProgressError('Mock question bank is unavailable.', new Error('IELTS_MOCK_BANK was not loaded.'));
        return;
    }

    const records = readCompletedMockRecords();
    if (!records) return;
    status.hidden = true;
    status.textContent = '';

    let totalCompleted = 0;
    document.querySelectorAll('[data-skill-progress]').forEach(container => {
        const skill = container.dataset.skillProgress;
        const availableIds = skill === 'speaking'
            ? new Set(['famous-person-interview'])
            : new Set((bank[skill] || []).map(paper => paper.id));
        const completedIds = new Set(records
            .filter(record => record.skill === skill && availableIds.has(record.paperId))
            .map(record => record.paperId));
        const total = availableIds.size;
        const completed = completedIds.size;
        const percent = total ? Math.round((completed / total) * 100) : 0;
        const count = container.querySelector('[data-progress-completed]');
        const totalLabel = container.querySelector('[data-progress-total]');
        const bar = container.querySelector('[role="progressbar"]');
        const fill = container.querySelector('[data-progress-fill]');

        if (!count || !totalLabel || !bar || !fill) {
            showSkillProgressError('Skill progress markup is incomplete.', new Error(`Missing progress elements for ${skill}.`));
            return;
        }

        totalCompleted += completed;
        count.textContent = String(completed);
        totalLabel.textContent = String(total);
        bar.setAttribute('aria-valuemax', String(total));
        bar.setAttribute('aria-valuenow', String(completed));
        bar.setAttribute('aria-valuetext', `${completed} of ${total} mocks completed`);
        fill.style.width = `${percent}%`;
    });

    const overallCount = document.getElementById('completedMockCount');
    if (overallCount) overallCount.textContent = String(totalCompleted);
    const profileCount = document.getElementById('profileCompletedCount');
    if (profileCount) profileCount.textContent = String(totalCompleted);
}

function localDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function isValidLocalDateKey(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function showPerformanceChartError(message, error) {
    console.error(message, error);
    const status = document.getElementById('performanceChartStatus');
    status.textContent = 'Active-day history could not be loaded or charted in this browser.';
    status.hidden = false;
}

function readMockActiveDays() {
    let saved;
    try {
        saved = localStorage.getItem(mockActivityStorageKey);
    } catch (error) {
        showPerformanceChartError('Unable to read active-day history.', error);
        return null;
    }
    if (!saved) return [];

    let days;
    try {
        days = JSON.parse(saved);
    } catch (error) {
        showPerformanceChartError('Active-day history is not valid JSON.', error);
        return null;
    }
    if (!Array.isArray(days) || days.some(day => !isValidLocalDateKey(day))) {
        showPerformanceChartError('Active-day history has an unexpected format.', new TypeError('Invalid active-day data.'));
        return null;
    }
    return [...new Set(days)].sort();
}

function renderRecentMockActivity(days) {
    const list = document.getElementById('recentMockActivity');
    if (!list) return;
    list.replaceChildren();

    const recentDays = days.filter(day => day <= localDateKey(new Date())).slice(-4).reverse();
    const activeDayCount = document.getElementById('profileActiveDayCount');
    if (activeDayCount) activeDayCount.textContent = String(days.filter(day => day <= localDateKey(new Date())).length);
    if (recentDays.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'activity-empty';
        empty.textContent = 'No mock activity yet. Submit a mock to start tracking active days.';
        list.append(empty);
        return;
    }

    recentDays.forEach(day => {
        const [year, month, date] = day.split('-').map(Number);
        const itemDate = new Date(year, month - 1, date);
        const item = document.createElement('div');
        item.className = 'activity-item';
        item.innerHTML = '<div class="activity-icon icon-blue"><i class="fas fa-calendar-check" aria-hidden="true"></i></div><div class="activity-content"><div class="activity-title">Mock practice completed</div><div class="activity-meta"></div></div>';
        item.querySelector('.activity-meta').textContent = `Active day · ${itemDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}`;
        list.append(item);
    });
}

function showProfileStatus(message, isError, statusId) {
    const status = document.getElementById(statusId);
    status.textContent = message;
    status.classList.toggle('error', isError);
    status.hidden = false;
}

function showProfileError(message, error, statusId) {
    console.error(message, error);
    showProfileStatus('Profile details could not be loaded or saved in this browser.', true, statusId);
}

function isValidTargetBand(targetBand) {
    return typeof targetBand === 'number' &&
        Number.isFinite(targetBand) &&
        targetBand >= 1 &&
        targetBand <= 9 &&
        Number.isInteger(targetBand * 2);
}

function applyProfile(profile) {
    activeProfile = profile;
    const name = profile.name;
    const targetBand = profile.targetBand.toFixed(1);
    const initial = Array.from(name)[0].toUpperCase();
    document.querySelectorAll('[data-profile-initial]').forEach(element => {
        element.textContent = initial;
    });
    document.querySelectorAll('[data-profile-name]').forEach(element => {
        element.textContent = name;
    });
    document.querySelectorAll('.profile-trigger, .mobile-profile').forEach(button => {
        button.setAttribute('aria-label', `Open profile for ${name}`);
    });
    document.getElementById('profileNameInput').value = name;
    document.getElementById('onboardingNameInput').value = name;
    document.getElementById('profileTargetBand').value = targetBand;
    document.getElementById('onboardingTargetBand').value = targetBand;

    const targetDisplay = document.getElementById('targetBandDisplay');
    if (targetDisplay && targetDisplay.firstChild) targetDisplay.firstChild.textContent = targetBand;
    document.getElementById('profileTargetBandDisplay').textContent = targetBand;
    updateGoalScale(profile.targetBand);
}

function updateGoalScale(targetBand) {
    const fullSegments = Math.floor(targetBand);
    const hasHalfSegment = targetBand % 1 === 0.5;
    document.querySelectorAll('.goal-scale > span').forEach((segment, index) => {
        segment.classList.toggle('is-reached', index < fullSegments);
        segment.classList.toggle('is-partial', hasHalfSegment && index === fullSegments);
    });
}

function initProfile() {
    document.getElementById('profileSettingsForm').addEventListener('submit', saveProfileSettings);
    document.getElementById('onboardingForm').addEventListener('submit', completeProfileOnboarding);
    document.getElementById('onboardingDialog').addEventListener('cancel', event => event.preventDefault());

    let saved;
    try {
        saved = localStorage.getItem(profileStorageKey);
    } catch (error) {
        showProfileError('Unable to read the saved profile.', error, 'onboardingStatus');
    }

    if (saved) {
        let profile;
        try {
            profile = JSON.parse(saved);
        } catch (error) {
            showProfileError('Saved profile data is not valid JSON.', error, 'onboardingStatus');
        }

        if (profile !== undefined) {
            if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
                showProfileError('Saved profile data has an unexpected format.', new TypeError('Invalid profile data.'), 'onboardingStatus');
            } else {
                const hasValidName =
                    typeof profile.name === 'string' &&
                    Boolean(profile.name.trim()) &&
                    profile.name.trim().length <= 40;
                if (hasValidName) {
                    activeProfile.name = profile.name.trim();
                } else {
                    showProfileError('Saved profile name has an unexpected format.', new TypeError('Invalid profile name.'), 'onboardingStatus');
                }

                if (profile.targetBand !== undefined) {
                    if (isValidTargetBand(profile.targetBand)) {
                        activeProfile.targetBand = profile.targetBand;
                    } else {
                        showProfileError('Saved target band has an unexpected format.', new TypeError('Invalid target band.'), 'onboardingStatus');
                    }
                }
                activeProfile.onboardingComplete =
                    profile.onboardingComplete === true && hasValidName && isValidTargetBand(profile.targetBand);
            }
        }
    }

    applyProfile(activeProfile);
    if (!activeProfile.onboardingComplete) {
        document.getElementById('onboardingDialog').showModal();
        document.getElementById('onboardingNameInput').focus();
    }
}

function readProfileForm(form, statusId) {
    const nameInput = form.querySelector('[name="name"]');
    const targetInput = form.querySelector('[name="targetBand"]');
    const name = nameInput.value.trim();
    const targetBand = Number(targetInput.value);
    if (!name || name.length > 40) {
        showProfileStatus('Enter a name of 1 to 40 characters.', true, statusId);
        nameInput.focus();
        return null;
    }
    if (!isValidTargetBand(targetBand)) {
        showProfileStatus('Choose a target band between 1.0 and 9.0.', true, statusId);
        targetInput.focus();
        return null;
    }
    return { name, targetBand };
}

function saveProfile(name, targetBand, statusId) {
    const profile = { name, targetBand, onboardingComplete: true };
    try {
        localStorage.setItem(profileStorageKey, JSON.stringify(profile));
    } catch (error) {
        showProfileError('Unable to save the profile.', error, statusId || 'onboardingStatus');
        return false;
    }

    applyProfile(profile);
    const dialog = document.getElementById('onboardingDialog');
    if (dialog.open) dialog.close();
    window.dispatchEvent(new Event('ielts:profile-updated'));
    if (statusId) showProfileStatus('Profile saved on this device.', false, statusId);
    return true;
}

function saveProfileSettings(event) {
    event.preventDefault();
    const profile = readProfileForm(event.currentTarget, 'profileSaveStatus');
    if (!profile) return;
    saveProfile(profile.name, profile.targetBand, 'profileSaveStatus');
}

function completeProfileOnboarding(event) {
    event.preventDefault();
    const profile = readProfileForm(event.currentTarget, 'onboardingStatus');
    if (!profile) return;
    saveProfile(profile.name, profile.targetBand, null);
}

function refreshMockProgress() {
    renderSkillProgress();
    updatePerformanceChart();
}

window.addEventListener('ielts:mock-progress-updated', refreshMockProgress);
window.addEventListener('ielts:cloud-data-updated', event => {
    if (event.detail && event.detail.profile) applyProfile(event.detail.profile);
    refreshMockProgress();
});
window.addEventListener('storage', event => {
    if (event.key === mockProgressStorageKey || event.key === mockActivityStorageKey || event.key === null) {
        refreshMockProgress();
    }
});

// Theme Management
        function initTheme() {
            const savedTheme = localStorage.getItem('ielts-theme') || 'light';
            document.documentElement.setAttribute('data-theme', savedTheme);
            updateThemeIcon(savedTheme);
        }

        function toggleTheme() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';

            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('ielts-theme', newTheme);
            updateThemeIcon(newTheme);
        }

        function updateThemeIcon(theme) {
            const icon = document.getElementById('themeIcon');
            icon.className = theme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
        }

        // Navigation
        function showPage(pageName) {
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });
            document.getElementById(pageName).classList.add('active');

            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.dataset.page === pageName) {
                    link.classList.add('active');
                }
            });

            const pageTitles = {
                dashboard: 'Overview',
                vocabulary: 'Vocabulary',
                podcasts: 'English Podcasts',
                cefr: 'CEFR',
                'cefr-level-tests': 'CEFR Practice',
                'cefr-mock': 'CEFR Mock Test',
                profile: 'Profile',
                'mock-test': 'Mock tests'
            };
            document.getElementById('activePageTitle').textContent = pageTitles[pageName] || 'Overview';

            window.scrollTo({ top: 0, behavior: 'smooth' });

            if (window.innerWidth <= 900) {
                closeMenu();
            }

            // Initialize chart if dashboard
            if (pageName === 'dashboard') {
                renderSkillProgress();
                setTimeout(initChart, 100);
            }
        }

        // Mobile Menu
        function toggleMenu() {
            const navLinks = document.getElementById('navLinks');
            const menuButton = document.querySelector('.hamburger');
            const isOpen = navLinks.classList.toggle('active');

            menuButton.setAttribute('aria-expanded', String(isOpen));
            menuButton.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
        }

        function closeMenu() {
            document.getElementById('navLinks').classList.remove('active');

            const menuButton = document.querySelector('.hamburger');
            menuButton.setAttribute('aria-expanded', 'false');
            menuButton.setAttribute('aria-label', 'Open menu');
        }

        window.addEventListener('resize', function() {
            if (window.innerWidth > 900) {
                closeMenu();
            }
        });

        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                closeMenu();
            }
        });

        // Nav Links Click Handler
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                showPage(this.dataset.page);
            });
        });

        // Chart Initialization
        function initChart() {
            updatePerformanceChart();
        }

        function updatePerformanceChart() {
            const canvas = document.getElementById('performanceChart');
            if (!canvas) return;
            const activeDays = readMockActiveDays();
            if (!activeDays) return;

            const status = document.getElementById('performanceChartStatus');
            status.hidden = true;
            status.textContent = '';
            renderRecentMockActivity(activeDays);

            if (typeof Chart === 'undefined') {
                showPerformanceChartError('Chart.js is unavailable.', new Error('Chart.js did not load.'));
                return;
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const firstDay = new Date(today);
            firstDay.setDate(firstDay.getDate() - 29);
            const firstDayKey = localDateKey(firstDay);
            const todayKey = localDateKey(today);
            const activeDaySet = new Set(activeDays.filter(day => day <= todayKey));
            let cumulativeDays = [...activeDaySet].filter(day => day < firstDayKey).length;
            const labels = [];
            const values = [];

            for (const date = new Date(firstDay); date <= today; date.setDate(date.getDate() + 1)) {
                const dayKey = localDateKey(date);
                if (activeDaySet.has(dayKey)) cumulativeDays += 1;
                labels.push(date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
                values.push(cumulativeDays);
            }

            if (canvas.chart) {
                canvas.chart.data.labels = labels;
                canvas.chart.data.datasets[0].data = values;
                canvas.chart.update();
                canvas.chart.resize();
                return;
            }

            const ctx = canvas.getContext('2d');
            canvas.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'Cumulative active days',
                        data: values,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        pointRadius: 2,
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0
                            },
                            title: {
                                display: true,
                                text: 'Total active days'
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }

        // Option Selection
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('option')) {
                const questionItem = e.target.closest('.question-item');
                questionItem.querySelectorAll('.option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                e.target.classList.add('selected');
            }
        });

        // Initialize on Load
        window.addEventListener('load', function() {
            initTheme();
            initProfile();
            initChart();
            renderSkillProgress();
        });

        // Update chart colors on theme change
        const originalToggleTheme = toggleTheme;
        toggleTheme = function() {
            originalToggleTheme();
            const canvas = document.getElementById('performanceChart');
            if (canvas && canvas.chart) {
                canvas.chart.destroy();
                canvas.chart = null;
                setTimeout(initChart, 100);
            }
        };
