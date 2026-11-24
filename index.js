// Page Navigation
        function showPage(pageName) {
            // Hide all pages
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });

            // Show selected page
            document.getElementById(pageName).classList.add('active');

            // Update nav links
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.dataset.page === pageName) {
                    link.classList.add('active');
                }
            });

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Initialize charts if dashboard
            if (pageName === 'dashboard') {
                setTimeout(initCharts, 100);
            }

            // Close mobile menu if open
            document.getElementById('navLinks').classList.remove('mobile-active');
        }

        // Tab Switching
        function switchTab(tabName) {
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });

            // Show selected tab
            document.getElementById(tabName).classList.add('active');

            // Update tab buttons
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            event.target.classList.add('active');
        }

        // Modal Functions
        function openModal(type) {
            const modal = document.getElementById(type + 'Modal');
            modal.classList.add('active');
        }

        function closeModal(type) {
            const modal = document.getElementById(type + 'Modal');
            modal.classList.remove('active');
        }

        // Close modal on outside click
        window.onclick = function(event) {
            if (event.target.classList.contains('modal')) {
                event.target.classList.remove('active');
            }
        }

        // Mobile Menu Toggle
        function toggleMobileMenu() {
            document.getElementById('navLinks').classList.toggle('mobile-active');
        }

        // Nav link click handlers
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                showPage(this.dataset.page);
            });
        });

        // Initialize Charts
        function initCharts() {
            // Progress Line Chart
            const progressCtx = document.getElementById('progressChart');
            if (progressCtx && !progressCtx.chart) {
                progressCtx.chart = new Chart(progressCtx, {
                    type: 'line',
                    data: {
                        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
                        datasets: [{
                            label: 'Overall Band Score',
                            data: [6.5, 6.8, 7.0, 7.2, 7.4, 7.5],
                            borderColor: '#2563EB',
                            backgroundColor: 'rgba(37, 99, 235, 0.1)',
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: true,
                                position: 'bottom'
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: false,
                                min: 5,
                                max: 9
                            }
                        }
                    }
                });
            }

            // Skills Radar Chart
            const radarCtx = document.getElementById('radarChart');
            if (radarCtx && !radarCtx.chart) {
                radarCtx.chart = new Chart(radarCtx, {
                    type: 'radar',
                    data: {
                        labels: ['Listening', 'Reading', 'Writing', 'Speaking'],
                        datasets: [{
                            label: 'Current Score',
                            data: [8.0, 7.5, 7.0, 7.5],
                            borderColor: '#2563EB',
                            backgroundColor: 'rgba(37, 99, 235, 0.2)',
                            pointBackgroundColor: '#2563EB'
                        }, {
                            label: 'Target Score',
                            data: [8.5, 8.0, 8.0, 8.0],
                            borderColor: '#10B981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            pointBackgroundColor: '#10B981'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: true,
                                position: 'bottom'
                            }
                        },
                        scales: {
                            r: {
                                beginAtZero: false,
                                min: 5,
                                max: 9
                            }
                        }
                    }
                });
            }
        }

        // Newsletter form submission
        document.querySelector('.newsletter-form').addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Thank you for subscribing to our newsletter!');
            this.reset();
        });

        // Initialize on load
        window.addEventListener('load', function() {
            // Add smooth scroll behavior
            document.documentElement.style.scrollBehavior = 'smooth';

            // Animate elements on scroll
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };

            const observer = new IntersectionObserver(function(entries) {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                });
            }, observerOptions);

            document.querySelectorAll('.card, .feature, .testimonial').forEach(el => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
                el.style.transition = 'all 0.6s ease';
                observer.observe(el);
            });
        });
