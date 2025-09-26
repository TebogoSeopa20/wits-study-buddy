// Progress Tracking System with Study Hours, Analytics, and PDF Export
class ProgressTracker {
    constructor() {
        this.modules = JSON.parse(localStorage.getItem('studentModules')) || [];
        this.studySessions = JSON.parse(localStorage.getItem('studySessions')) || [];
        this.currentTimer = {
            startTime: null,
            elapsed: 0,
            isRunning: false,
            interval: null
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadModules();
        this.loadStudySessions();
        this.updateStats();
        this.initCharts();
        this.setupSearch();
        this.setupTimer();
        
        // Set default dates
        this.setDefaultDates();
    }

    setupEventListeners() {
        // Module management
        document.getElementById('addModuleBtn').addEventListener('click', () => this.showAddModuleModal());
        document.getElementById('moduleForm').addEventListener('submit', (e) => this.saveModule(e));
        document.getElementById('cancelModule').addEventListener('click', () => this.closeModal('addModuleModal'));
        document.getElementById('deleteModuleBtn').addEventListener('click', () => this.deleteModule());
        
        // Study session management
        document.getElementById('sessionForm').addEventListener('submit', (e) => this.logStudySession(e));
        document.getElementById('cancelSession').addEventListener('click', () => this.closeModal('logSessionModal'));
        
        // Timer controls
        document.getElementById('startTimer').addEventListener('click', () => this.startTimer());
        document.getElementById('pauseTimer').addEventListener('click', () => this.pauseTimer());
        document.getElementById('stopTimer').addEventListener('click', () => this.stopTimer());
        
        // Modal controls
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.closeModal(modal.id);
            });
        });
        
        // Checkbox toggles
        document.getElementById('addMilestone').addEventListener('change', (e) => {
            this.toggleSection('milestoneSection', e.target.checked);
        });
        
        document.getElementById('addReward').addEventListener('change', (e) => {
            this.toggleSection('rewardSection', e.target.checked);
        });
        
        // Color picker
        document.getElementById('moduleColor').addEventListener('input', (e) => {
            document.getElementById('moduleColorValue').textContent = e.target.value;
        });
        
        // Advice modal
        document.getElementById('closeAdvice').addEventListener('click', () => {
            this.closeModal('adviceModal');
        });
        
        // PDF Export
        document.getElementById('exportPdfBtn').addEventListener('click', () => {
            this.exportToPDF();
        });
        
        // Toast close
        document.querySelector('.toast-close').addEventListener('click', () => {
            this.hideToast();
        });
        
        // Close modals on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    }

    setDefaultDates() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('sessionDate').value = today;
        document.getElementById('milestoneStart').value = today;
        
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        document.getElementById('milestoneEnd').value = nextWeek.toISOString().split('T')[0];
    }

    toggleSection(sectionId, show) {
        const section = document.getElementById(sectionId);
        section.style.display = show ? 'block' : 'none';
    }

    showAddModuleModal(moduleId = null) {
        const modal = document.getElementById('addModuleModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('moduleForm');
        const deleteBtn = document.getElementById('deleteModuleBtn');
        
        if (moduleId) {
            // Edit mode
            const module = this.modules.find(m => m.id === moduleId);
            if (module) {
                title.textContent = 'Edit Module';
                this.populateModuleForm(module);
                deleteBtn.style.display = 'block';
            }
        } else {
            // Add mode
            title.textContent = 'Add New Module';
            form.reset();
            document.getElementById('moduleColorValue').textContent = '#4A90E2';
            deleteBtn.style.display = 'none';
            this.toggleSection('milestoneSection', false);
            this.toggleSection('rewardSection', false);
            document.getElementById('addMilestone').checked = false;
            document.getElementById('addReward').checked = false;
        }
        
        this.showModal('addModuleModal');
    }

    populateModuleForm(module) {
        document.getElementById('moduleId').value = module.id;
        document.getElementById('moduleName').value = module.name;
        document.getElementById('moduleColor').value = module.color;
        document.getElementById('moduleColorValue').textContent = module.color;
        document.getElementById('moduleTopics').value = module.topics.map(t => t.name).join('\n');
        
        if (module.milestone) {
            document.getElementById('addMilestone').checked = true;
            document.getElementById('milestoneDescription').value = module.milestone.description || '';
            document.getElementById('milestoneStart').value = module.milestone.start || '';
            document.getElementById('milestoneEnd').value = module.milestone.end || '';
            this.toggleSection('milestoneSection', true);
        }
        
        if (module.reward) {
            document.getElementById('addReward').checked = true;
            document.getElementById('rewardDescription').value = module.reward.description || '';
            this.toggleSection('rewardSection', true);
        }
    }

    saveModule(e) {
        e.preventDefault();
        
        const moduleId = document.getElementById('moduleId').value;
        const moduleData = {
            name: document.getElementById('moduleName').value.trim(),
            color: document.getElementById('moduleColor').value,
            topics: document.getElementById('moduleTopics').value
                .split('\n')
                .filter(topic => topic.trim())
                .map(topic => ({
                    name: topic.trim(),
                    completed: false,
                    completionDate: null
                })),
            createdAt: new Date().toISOString()
        };
        
        if (document.getElementById('addMilestone').checked) {
            moduleData.milestone = {
                description: document.getElementById('milestoneDescription').value.trim(),
                start: document.getElementById('milestoneStart').value,
                end: document.getElementById('milestoneEnd').value,
                completed: false
            };
        }
        
        if (document.getElementById('addReward').checked) {
            moduleData.reward = {
                description: document.getElementById('rewardDescription').value.trim(),
                earned: false
            };
        }
        
        if (moduleId) {
            // Update existing module
            const index = this.modules.findIndex(m => m.id === moduleId);
            if (index !== -1) {
                moduleData.id = moduleId;
                this.modules[index] = moduleData;
            }
        } else {
            // Add new module
            moduleData.id = Date.now().toString();
            this.modules.push(moduleData);
        }
        
        this.saveModules();
        this.loadModules();
        this.closeModal('addModuleModal');
        this.showToast('Module saved successfully!');
    }

    deleteModule() {
        const moduleId = document.getElementById('moduleId').value;
        if (moduleId && confirm('Are you sure you want to delete this module?')) {
            this.modules = this.modules.filter(m => m.id !== moduleId);
            this.saveModules();
            this.loadModules();
            this.closeModal('addModuleModal');
            this.showToast('Module deleted successfully!');
        }
    }

    saveModules() {
        localStorage.setItem('studentModules', JSON.stringify(this.modules));
        this.updateStats();
        this.updateCharts();
    }

    loadModules() {
        const grid = document.getElementById('modulesGrid');
        grid.innerHTML = '';
        
        if (this.modules.length === 0) {
            grid.innerHTML = `
                <div class="no-modules">
                    <i class="fas fa-book-open"></i>
                    <h3>No modules yet</h3>
                    <p>Start by adding your first module to track your progress!</p>
                    <button class="action-btn primary" onclick="progressTracker.showAddModuleModal()">
                        <i class="fas fa-plus"></i> Add Your First Module
                    </button>
                </div>
            `;
            return;
        }
        
        this.modules.forEach(module => {
            const completedTopics = module.topics.filter(topic => topic.completed).length;
            const totalTopics = module.topics.length;
            const progress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
            
            const moduleCard = document.createElement('div');
            moduleCard.className = 'module-card';
            moduleCard.innerHTML = `
                <div class="module-header" style="background: ${module.color}">
                    <div class="module-actions">
                        <button class="module-action-btn edit" onclick="progressTracker.showAddModuleModal('${module.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="module-action-btn delete" onclick="progressTracker.deleteModulePrompt('${module.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <h3 class="module-title">${module.name}</h3>
                    <div class="module-meta">
                        <span><i class="fas fa-tasks"></i> ${completedTopics}/${totalTopics} topics completed</span>
                        <span><i class="fas fa-chart-line"></i> ${progress}% complete</span>
                    </div>
                </div>
                <div class="module-details">
                    <div class="topics-list">
                        ${module.topics.map((topic, index) => `
                            <div class="topic-item">
                                <div class="topic-color-indicator" style="background: ${module.color}"></div>
                                <input type="checkbox" 
                                       class="topic-checkbox" 
                                       id="topic-${module.id}-${index}"
                                       ${topic.completed ? 'checked' : ''}
                                       onchange="progressTracker.toggleTopic('${module.id}', ${index})">
                                <label class="topic-label" for="topic-${module.id}-${index}">
                                    ${topic.name}
                                    ${topic.completionDate ? `<small>(${new Date(topic.completionDate).toLocaleDateString()})</small>` : ''}
                                </label>
                            </div>
                        `).join('')}
                    </div>
                    ${module.milestone ? `
                        <div class="milestone-info">
                            <strong>Milestone:</strong> ${module.milestone.description}
                            <br><small>Due: ${new Date(module.milestone.end).toLocaleDateString()}</small>
                        </div>
                    ` : ''}
                    ${module.reward ? `
                        <div class="reward-info">
                            <strong>Reward:</strong> ${module.reward.description}
                            ${module.reward.earned ? '<span class="reward-earned">✓ Earned</span>' : ''}
                        </div>
                    ` : ''}
                </div>
            `;
            grid.appendChild(moduleCard);
        });
        
        // Update session subject dropdown
        this.updateSessionSubjects();
    }

    deleteModulePrompt(moduleId) {
        if (confirm('Are you sure you want to delete this module?')) {
            this.modules = this.modules.filter(m => m.id !== moduleId);
            this.saveModules();
            this.loadModules();
            this.showToast('Module deleted successfully!');
        }
    }

    toggleTopic(moduleId, topicIndex) {
        const module = this.modules.find(m => m.id === moduleId);
        if (module && module.topics[topicIndex]) {
            const topic = module.topics[topicIndex];
            topic.completed = !topic.completed;
            topic.completionDate = topic.completed ? new Date().toISOString() : null;
            
            // Check if all topics are completed to earn reward
            if (topic.completed && module.reward && !module.reward.earned) {
                const allCompleted = module.topics.every(t => t.completed);
                if (allCompleted) {
                    module.reward.earned = true;
                    this.showToast(`Congratulations! You earned: ${module.reward.description}`);
                }
            }
            
            this.saveModules();
            this.loadModules();
            this.updateCompletedTopicsTable();
        }
    }

    updateSessionSubjects() {
        const select = document.getElementById('sessionSubject');
        select.innerHTML = '<option value="">Select a module...</option>';
        
        this.modules.forEach(module => {
            const option = document.createElement('option');
            option.value = module.id;
            option.textContent = module.name;
            select.appendChild(option);
        });
    }

    // Study Hours Tracking
    setupTimer() {
        this.updateTodayHours();
        this.loadStudyLog();
    }

    startTimer() {
        if (!this.currentTimer.isRunning) {
            this.currentTimer.startTime = Date.now() - this.currentTimer.elapsed;
            this.currentTimer.isRunning = true;
            
            this.currentTimer.interval = setInterval(() => {
                this.currentTimer.elapsed = Date.now() - this.currentTimer.startTime;
                this.updateTimerDisplay();
            }, 1000);
            
            document.getElementById('startTimer').disabled = true;
            document.getElementById('pauseTimer').disabled = false;
            document.getElementById('stopTimer').disabled = false;
        }
    }

    pauseTimer() {
        if (this.currentTimer.isRunning) {
            clearInterval(this.currentTimer.interval);
            this.currentTimer.isRunning = false;
            
            document.getElementById('startTimer').disabled = false;
            document.getElementById('pauseTimer').disabled = true;
        }
    }

    stopTimer() {
        if (this.currentTimer.isRunning) {
            clearInterval(this.currentTimer.interval);
        }
        
        if (this.currentTimer.elapsed > 0) {
            this.logStudySessionFromTimer();
        }
        
        this.currentTimer = {
            startTime: null,
            elapsed: 0,
            isRunning: false,
            interval: null
        };
        
        this.updateTimerDisplay();
        document.getElementById('startTimer').disabled = false;
        document.getElementById('pauseTimer').disabled = true;
        document.getElementById('stopTimer').disabled = true;
    }

    updateTimerDisplay() {
        const display = document.getElementById('timerDisplay');
        const hours = Math.floor(this.currentTimer.elapsed / 3600000);
        const minutes = Math.floor((this.currentTimer.elapsed % 3600000) / 60000);
        const seconds = Math.floor((this.currentTimer.elapsed % 60000) / 1000);
        
        display.textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    logStudySessionFromTimer() {
        const hours = this.currentTimer.elapsed / 3600000; // Convert ms to hours
        const session = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            duration: parseFloat(hours.toFixed(2)),
            subject: 'General Study',
            notes: 'Timer session'
        };
        
        this.studySessions.unshift(session);
        this.saveStudySessions();
        this.updateTodayHours();
        this.loadStudyLog();
        this.updateStudySessionsTable();
    }

    logStudySession(e) {
        e.preventDefault();
        
        const sessionData = {
            id: Date.now().toString(),
            date: document.getElementById('sessionDate').value,
            duration: parseFloat(document.getElementById('sessionDuration').value),
            subject: document.getElementById('sessionSubject').value,
            notes: document.getElementById('sessionNotes').value.trim()
        };
        
        this.studySessions.unshift(sessionData);
        this.saveStudySessions();
        this.closeModal('logSessionModal');
        this.updateTodayHours();
        this.loadStudyLog();
        this.updateStudySessionsTable();
        this.showToast('Study session logged successfully!');
    }

    saveStudySessions() {
        localStorage.setItem('studySessions', JSON.stringify(this.studySessions));
        this.updateStats();
        this.updateCharts();
    }

    loadStudySessions() {
        this.updateStudySessionsTable();
    }

    updateTodayHours() {
        const today = new Date().toDateString();
        const todaySessions = this.studySessions.filter(session => 
            new Date(session.date).toDateString() === today
        );
        
        const totalHours = todaySessions.reduce((sum, session) => sum + session.duration, 0);
        document.getElementById('todayHours').textContent = totalHours.toFixed(2);
    }

    loadStudyLog() {
        const logContainer = document.getElementById('studyLog');
        const recentSessions = this.studySessions.slice(0, 5);
        
        if (recentSessions.length === 0) {
            logContainer.innerHTML = '<p class="no-sessions">No study sessions logged yet.</p>';
            return;
        }
        
        logContainer.innerHTML = recentSessions.map(session => `
            <div class="log-entry">
                <div class="log-info">
                    <strong>${new Date(session.date).toLocaleDateString()}</strong>
                    <span>${session.duration} hours</span>
                </div>
                <div class="log-subject">${this.getModuleName(session.subject) || 'General Study'}</div>
            </div>
        `).join('');
    }

    getModuleName(moduleId) {
        const module = this.modules.find(m => m.id === moduleId);
        return module ? module.name : null;
    }

    // Tables
    updateCompletedTopicsTable() {
        const tbody = document.getElementById('completedTopicsBody');
        const completedTopics = [];
        
        this.modules.forEach(module => {
            module.topics.forEach(topic => {
                if (topic.completed) {
                    completedTopics.push({
                        topic: topic.name,
                        module: module.name,
                        date: topic.completionDate,
                        status: 'Completed'
                    });
                }
            });
        });
        
        // Sort by date (newest first)
        completedTopics.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        tbody.innerHTML = completedTopics.map(topic => `
            <tr>
                <td>${topic.topic}</td>
                <td>${topic.module}</td>
                <td>${new Date(topic.date).toLocaleDateString()}</td>
                <td><span class="status-badge completed">${topic.status}</span></td>
            </tr>
        `).join('');
    }

    updateStudySessionsTable() {
        const tbody = document.getElementById('studySessionsBody');
        const recentSessions = this.studySessions.slice(0, 10);
        
        tbody.innerHTML = recentSessions.map(session => `
            <tr>
                <td>${new Date(session.date).toLocaleDateString()}</td>
                <td>${session.duration} hours</td>
                <td>${this.getModuleName(session.subject) || 'General Study'}</td>
                <td>${session.notes || '-'}</td>
            </tr>
        `).join('');
    }

    // Stats
    updateStats() {
        const totalModules = this.modules.length;
        const completedTopics = this.modules.reduce((sum, module) => 
            sum + module.topics.filter(topic => topic.completed).length, 0
        );
        const totalHours = this.studySessions.reduce((sum, session) => sum + session.duration, 0);
        const rewardCount = this.modules.filter(module => 
            module.reward && module.reward.earned
        ).length;
        
        document.getElementById('moduleCount').textContent = totalModules;
        document.getElementById('completedCount').textContent = completedTopics;
        document.getElementById('totalHours').textContent = totalHours.toFixed(1);
        document.getElementById('rewardCount').textContent = rewardCount;
        
        this.updateCompletedTopicsTable();
    }

    // Charts
    initCharts() {
        this.progressChart = new Chart(document.getElementById('progressChart'), {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Remaining'],
                datasets: [{
                    data: [0, 100],
                    backgroundColor: ['#10b981', '#e5e7eb'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.raw}%`;
                            }
                        }
                    }
                }
            }
        });
        
        this.timeChart = new Chart(document.getElementById('timeChart'), {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Study Hours',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    backgroundColor: '#3b82f6',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Hours'
                        }
                    }
                }
            }
        });
        
        this.weeklyChart = new Chart(document.getElementById('weeklyChart'), {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Study Hours',
                    data: [0, 0, 0, 0],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
        
        this.moduleChart = new Chart(document.getElementById('moduleChart'), {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Completion %',
                    data: [],
                    backgroundColor: '#8b5cf6'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Completion %'
                        }
                    }
                }
            }
        });
        
        this.updateCharts();
    }

    updateCharts() {
        // Progress Chart
        const totalTopics = this.modules.reduce((sum, module) => sum + module.topics.length, 0);
        const completedTopics = this.modules.reduce((sum, module) => 
            sum + module.topics.filter(topic => topic.completed).length, 0
        );
        const progressPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
        
        this.progressChart.data.datasets[0].data = [progressPercentage, 100 - progressPercentage];
        this.progressChart.update();
        
        document.getElementById('progressPercentage').textContent = `${progressPercentage}% Complete`;
        
        // Time Chart (this week's data)
        const thisWeekData = this.getThisWeekStudyData();
        this.timeChart.data.datasets[0].data = thisWeekData;
        this.timeChart.update();
        
        // Weekly Chart (last 4 weeks)
        const weeklyData = this.getLastFourWeeksData();
        this.weeklyChart.data.datasets[0].data = weeklyData;
        this.weeklyChart.update();
        
        // Module Chart
        const moduleData = this.modules.map(module => {
            const completed = module.topics.filter(topic => topic.completed).length;
            const total = module.topics.length;
            return total > 0 ? Math.round((completed / total) * 100) : 0;
        });
        
        const moduleNames = this.modules.map(module => module.name);
        
        this.moduleChart.data.labels = moduleNames;
        this.moduleChart.data.datasets[0].data = moduleData;
        this.moduleChart.update();
        
        // Update time remaining message
        this.updateTimeRemainingMessage();
    }

    getThisWeekStudyData() {
        const data = [0, 0, 0, 0, 0, 0, 0];
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        
        this.studySessions.forEach(session => {
            const sessionDate = new Date(session.date);
            if (sessionDate >= startOfWeek) {
                const dayIndex = sessionDate.getDay();
                data[dayIndex] += session.duration;
            }
        });
        
        return data;
    }

    getLastFourWeeksData() {
        const data = [0, 0, 0, 0];
        const today = new Date();
        
        for (let i = 0; i < 4; i++) {
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - (today.getDay() + 7 * (3 - i)));
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            
            const weekHours = this.studySessions.reduce((sum, session) => {
                const sessionDate = new Date(session.date);
                return sessionDate >= weekStart && sessionDate <= weekEnd ? sum + session.duration : sum;
            }, 0);
            
            data[i] = parseFloat(weekHours.toFixed(1));
        }
        
        return data;
    }

    updateTimeRemainingMessage() {
        const messageElement = document.getElementById('timeRemaining');
        const upcomingMilestones = this.modules.filter(module => 
            module.milestone && !module.milestone.completed
        );
        
        if (upcomingMilestones.length === 0) {
            messageElement.textContent = 'All milestones on track!';
            messageElement.style.color = '#10b981';
        } else {
            const closestMilestone = upcomingMilestones.reduce((closest, module) => {
                const daysLeft = Math.ceil((new Date(module.milestone.end) - new Date()) / (1000 * 60 * 60 * 24));
                return daysLeft < closest.days ? {days: daysLeft, module} : closest;
            }, {days: Infinity});
            
            if (closestMilestone.days < 7) {
                messageElement.textContent = `${closestMilestone.days} days until ${closestMilestone.module.name} milestone!`;
                messageElement.style.color = '#ef4444';
            } else {
                messageElement.textContent = `${upcomingMilestones.length} upcoming milestones`;
                messageElement.style.color = '#f59e0b';
            }
        }
    }

    // Search functionality
    setupSearch() {
        const searchInput = document.getElementById('progressSearch');
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            this.filterModules(searchTerm);
        });
    }

    filterModules(searchTerm) {
        const modules = document.querySelectorAll('.module-card');
        
        modules.forEach(module => {
            const moduleText = module.textContent.toLowerCase();
            module.style.display = moduleText.includes(searchTerm) ? 'block' : 'none';
        });
    }

    // Modal management
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    // Toast notifications
    showToast(message) {
        const toast = document.getElementById('toast');
        const messageElement = document.getElementById('toastMessage');
        
        messageElement.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            this.hideToast();
        }, 3000);
    }

    hideToast() {
        const toast = document.getElementById('toast');
        toast.classList.remove('show');
    }

    // PDF Export functionality
    async exportToPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(20);
        doc.setTextColor(30, 64, 175);
        doc.text('Academic Progress Report', 105, 20, { align: 'center' });
        
        // Add date
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });
        
        let yPosition = 50;
        
        // Add stats section
        doc.setFontSize(16);
        doc.setTextColor(30, 64, 175);
        doc.text('Progress Overview', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Total Modules: ${this.modules.length}`, 20, yPosition);
        yPosition += 6;
        doc.text(`Topics Completed: ${this.modules.reduce((sum, module) => sum + module.topics.filter(topic => topic.completed).length, 0)}`, 20, yPosition);
        yPosition += 6;
        doc.text(`Total Study Hours: ${this.studySessions.reduce((sum, session) => sum + session.duration, 0).toFixed(1)}`, 20, yPosition);
        yPosition += 15;
        
        // Add modules section
        if (this.modules.length > 0) {
            doc.setFontSize(16);
            doc.setTextColor(30, 64, 175);
            doc.text('Modules Progress', 20, yPosition);
            yPosition += 10;
            
            this.modules.forEach((module, index) => {
                if (yPosition > 250) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                const completed = module.topics.filter(topic => topic.completed).length;
                const total = module.topics.length;
                const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                
                doc.setFontSize(12);
                doc.setTextColor(0, 0, 0);
                doc.text(`${module.name} (${percentage}%)`, 20, yPosition);
                yPosition += 6;
                
                doc.setFontSize(8);
                doc.text(`Completed: ${completed}/${total} topics`, 25, yPosition);
                yPosition += 10;
            });
        }
        
        // Add study sessions section
        if (this.studySessions.length > 0) {
            if (yPosition > 200) {
                doc.addPage();
                yPosition = 20;
            }
            
            doc.setFontSize(16);
            doc.setTextColor(30, 64, 175);
            doc.text('Recent Study Sessions', 20, yPosition);
            yPosition += 10;
            
            const recentSessions = this.studySessions.slice(0, 10);
            recentSessions.forEach(session => {
                if (yPosition > 270) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                doc.text(`${new Date(session.date).toLocaleDateString()} - ${session.duration} hours - ${this.getModuleName(session.subject) || 'General Study'}`, 20, yPosition);
                yPosition += 6;
            });
        }
        
        // Save the PDF
        doc.save(`progress-report-${new Date().toISOString().split('T')[0]}.pdf`);
        this.showToast('PDF exported successfully!');
    }
}

// Initialize the progress tracker when the page loads
let progressTracker;

document.addEventListener('DOMContentLoaded', function() {
    progressTracker = new ProgressTracker();
    
    // Add some sample data if none exists
    if (progressTracker.modules.length === 0) {
        progressTracker.modules = [
            {
                id: '1',
                name: 'Web Development',
                color: '#3b82f6',
                topics: [
                    { name: 'HTML Basics', completed: true, completionDate: new Date().toISOString() },
                    { name: 'CSS Fundamentals', completed: true, completionDate: new Date().toISOString() },
                    { name: 'JavaScript ES6+', completed: false, completionDate: null },
                    { name: 'React Framework', completed: false, completionDate: null }
                ],
                createdAt: new Date().toISOString(),
                milestone: {
                    description: 'Complete basic web development concepts',
                    start: new Date().toISOString().split('T')[0],
                    end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    completed: false
                },
                reward: {
                    description: 'Build a personal portfolio website',
                    earned: false
                }
            }
        ];
        progressTracker.saveModules();
        progressTracker.loadModules();
    }
});