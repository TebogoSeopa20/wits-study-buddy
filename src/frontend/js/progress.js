// Enhanced Progress Page JavaScript - Complete Study Tracking System

class ProgressManager {
    constructor() {
        this.modules = JSON.parse(localStorage.getItem('studentModules')) || [];
        this.studySessions = JSON.parse(localStorage.getItem('studySessions')) || [];
        this.currentEditId = null;
        this.timer = {
            startTime: null,
            elapsedTime: 0,
            isRunning: false,
            interval: null
        };
        
        // Initialize charts as null first
        this.progressChart = null;
        this.timeChart = null;
        this.weeklyChart = null;
        this.moduleChart = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSampleData();
        this.initializeCharts();
        this.renderModules();
        this.updateStats();
        this.updateAnalytics();
        this.renderTables();
        this.updateStudyLog();
    }

    loadSampleData() {
        if (this.modules.length === 0) {
            this.modules = [
                {
                    id: 'module-1',
                    name: 'Web Development Fundamentals',
                    color: '#3b82f6',
                    topics: [
                        { id: 'topic-1', name: 'HTML Basics', completed: true, color: '#3b82f6', completedDate: '2024-01-15' },
                        { id: 'topic-2', name: 'CSS Styling', completed: true, color: '#1d4ed8', completedDate: '2024-01-18' },
                        { id: 'topic-3', name: 'JavaScript Fundamentals', completed: false, color: '#1e40af' },
                        { id: 'topic-4', name: 'DOM Manipulation', completed: false, color: '#1e3a8a' }
                    ],
                    createdAt: '2024-01-10T08:00:00Z'
                }
            ];
            this.saveToStorage();
        }

        if (this.studySessions.length === 0) {
            this.studySessions = [
                {
                    id: 'session-1',
                    date: new Date().toISOString().split('T')[0],
                    duration: 2.5,
                    subject: 'Web Development Fundamentals',
                    notes: 'Sample study session'
                }
            ];
            this.saveStudySessions();
        }
    }

    setupEventListeners() {
        // Module management
        const addModuleBtn = document.getElementById('addModuleBtn');
        if (addModuleBtn) {
            addModuleBtn.addEventListener('click', () => {
                this.openAddModuleModal();
            });
        }

        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeAllModals();
            });
        });

        const moduleForm = document.getElementById('moduleForm');
        if (moduleForm) {
            moduleForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveModule();
            });
        }

        const cancelModule = document.getElementById('cancelModule');
        if (cancelModule) {
            cancelModule.addEventListener('click', () => {
                this.closeAllModals();
            });
        }

        const deleteModuleBtn = document.getElementById('deleteModuleBtn');
        if (deleteModuleBtn) {
            deleteModuleBtn.addEventListener('click', () => {
                this.deleteModule();
            });
        }

        // Checkbox toggles
        const addMilestone = document.getElementById('addMilestone');
        if (addMilestone) {
            addMilestone.addEventListener('change', (e) => {
                this.toggleMilestoneSection(e.target.checked);
            });
        }

        const addReward = document.getElementById('addReward');
        if (addReward) {
            addReward.addEventListener('change', (e) => {
                this.toggleRewardSection(e.target.checked);
            });
        }

        // Color input
        const moduleColor = document.getElementById('moduleColor');
        if (moduleColor) {
            moduleColor.addEventListener('input', (e) => {
                document.getElementById('moduleColorValue').textContent = e.target.value;
            });
        }

        // Search functionality
        const progressSearch = document.getElementById('progressSearch');
        if (progressSearch) {
            progressSearch.addEventListener('input', (e) => {
                this.filterModules(e.target.value);
            });
        }

        // Timer controls
        const startTimer = document.getElementById('startTimer');
        if (startTimer) {
            startTimer.addEventListener('click', () => {
                this.startTimer();
            });
        }

        const pauseTimer = document.getElementById('pauseTimer');
        if (pauseTimer) {
            pauseTimer.addEventListener('click', () => {
                this.pauseTimer();
            });
        }

        const stopTimer = document.getElementById('stopTimer');
        if (stopTimer) {
            stopTimer.addEventListener('click', () => {
                this.stopTimer();
            });
        }

        // Session logging
        const sessionForm = document.getElementById('sessionForm');
        if (sessionForm) {
            sessionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.logStudySession();
            });
        }

        const cancelSession = document.getElementById('cancelSession');
        if (cancelSession) {
            cancelSession.addEventListener('click', () => {
                this.closeAllModals();
            });
        }

        // Close advice modal
        const closeAdvice = document.getElementById('closeAdvice');
        if (closeAdvice) {
            closeAdvice.addEventListener('click', () => {
                document.getElementById('adviceModal').classList.remove('active');
            });
        }

        // Toast close
        const toastClose = document.querySelector('.toast-close');
        if (toastClose) {
            toastClose.addEventListener('click', () => {
                document.getElementById('toast').classList.remove('active');
            });
        }

        // Click outside modal to close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });

        // Set today's date as default
        const sessionDate = document.getElementById('sessionDate');
        if (sessionDate) {
            sessionDate.value = new Date().toISOString().split('T')[0];
        }
    }

    // Timer Methods
    startTimer() {
        if (!this.timer.isRunning) {
            this.timer.startTime = Date.now() - this.timer.elapsedTime;
            this.timer.isRunning = true;
            this.timer.interval = setInterval(() => {
                this.updateTimerDisplay();
            }, 1000);
            
            document.getElementById('startTimer').disabled = true;
            document.getElementById('pauseTimer').disabled = false;
            document.getElementById('stopTimer').disabled = false;
        }
    }

    pauseTimer() {
        if (this.timer.isRunning) {
            this.timer.isRunning = false;
            clearInterval(this.timer.interval);
            
            document.getElementById('startTimer').disabled = false;
            document.getElementById('pauseTimer').disabled = true;
        }
    }

    stopTimer() {
        if (this.timer.elapsedTime > 0) {
            const duration = this.timer.elapsedTime / (1000 * 60 * 60);
            if (duration >= 0.1) {
                this.openLogSessionModal(duration);
            }
        }
        
        this.resetTimer();
    }

    resetTimer() {
        this.timer.isRunning = false;
        this.timer.elapsedTime = 0;
        this.timer.startTime = null;
        if (this.timer.interval) {
            clearInterval(this.timer.interval);
        }
        
        document.getElementById('timerDisplay').textContent = '00:00:00';
        document.getElementById('startTimer').disabled = false;
        document.getElementById('pauseTimer').disabled = true;
        document.getElementById('stopTimer').disabled = true;
    }

    updateTimerDisplay() {
        if (this.timer.isRunning) {
            this.timer.elapsedTime = Date.now() - this.timer.startTime;
        }
        
        const totalSeconds = Math.floor(this.timer.elapsedTime / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        const display = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('timerDisplay').textContent = display;
    }

    openLogSessionModal(duration = null) {
        const modal = document.getElementById('logSessionModal');
        const durationInput = document.getElementById('sessionDuration');
        const subjectSelect = document.getElementById('sessionSubject');
        
        if (subjectSelect) {
            subjectSelect.innerHTML = '<option value="">Select a module...</option>';
            this.modules.forEach(module => {
                const option = document.createElement('option');
                option.value = module.name;
                option.textContent = module.name;
                subjectSelect.appendChild(option);
            });
        }
        
        if (duration && durationInput) {
            durationInput.value = duration.toFixed(1);
        }
        
        if (modal) {
            modal.classList.add('active');
        }
    }

    logStudySession() {
        const date = document.getElementById('sessionDate')?.value;
        const duration = parseFloat(document.getElementById('sessionDuration')?.value);
        const subject = document.getElementById('sessionSubject')?.value;
        const notes = document.getElementById('sessionNotes')?.value;
        
        if (!date || !duration || !subject) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }
        
        const session = {
            id: `session-${Date.now()}`,
            date,
            duration,
            subject,
            notes,
            createdAt: new Date().toISOString()
        };
        
        this.studySessions.push(session);
        this.saveStudySessions();
        this.updateStats();
        this.updateAnalytics();
        this.renderTables();
        this.updateStudyLog();
        
        this.showToast('Study session logged successfully!');
        this.closeAllModals();
        document.getElementById('sessionForm').reset();
        document.getElementById('sessionDate').value = new Date().toISOString().split('T')[0];
    }

    // Module Management (other methods remain the same as previous version)
    openAddModuleModal(moduleId = null) {
        const modal = document.getElementById('addModuleModal');
        const title = document.getElementById('modalTitle');
        const deleteBtn = document.getElementById('deleteModuleBtn');
        
        if (modal && title) {
            if (moduleId) {
                title.textContent = 'Edit Module';
                if (deleteBtn) deleteBtn.style.display = 'block';
                this.currentEditId = moduleId;
                this.populateModuleForm(moduleId);
            } else {
                title.textContent = 'Add New Module';
                if (deleteBtn) deleteBtn.style.display = 'none';
                this.currentEditId = null;
                this.resetModuleForm();
            }
            
            modal.classList.add('active');
        }
    }

    resetModuleForm() {
        document.getElementById('moduleForm').reset();
        document.getElementById('moduleColor').value = '#4A90E2';
        document.getElementById('moduleColorValue').textContent = '#4A90E2';
        document.getElementById('milestoneSection').style.display = 'none';
        document.getElementById('rewardSection').style.display = 'none';
        document.getElementById('moduleId').value = '';
    }

    populateModuleForm(moduleId) {
        const module = this.modules.find(m => m.id === moduleId);
        if (!module) return;

        document.getElementById('moduleId').value = module.id;
        document.getElementById('moduleName').value = module.name;
        document.getElementById('moduleColor').value = module.color;
        document.getElementById('moduleColorValue').textContent = module.color;
        document.getElementById('moduleTopics').value = module.topics.map(t => t.name).join('\n');
        
        if (module.milestone) {
            document.getElementById('addMilestone').checked = true;
            document.getElementById('milestoneSection').style.display = 'block';
            document.getElementById('milestoneDescription').value = module.milestone.description || '';
            document.getElementById('milestoneStart').value = module.milestone.start || '';
            document.getElementById('milestoneEnd').value = module.milestone.end || '';
        } else {
            document.getElementById('addMilestone').checked = false;
            document.getElementById('milestoneSection').style.display = 'none';
        }
        
        if (module.reward) {
            document.getElementById('addReward').checked = true;
            document.getElementById('rewardSection').style.display = 'block';
            document.getElementById('rewardDescription').value = module.reward.description || '';
        } else {
            document.getElementById('addReward').checked = false;
            document.getElementById('rewardSection').style.display = 'none';
        }
    }

    toggleMilestoneSection(show) {
        const section = document.getElementById('milestoneSection');
        if (section) section.style.display = show ? 'block' : 'none';
    }

    toggleRewardSection(show) {
        const section = document.getElementById('rewardSection');
        if (section) section.style.display = show ? 'block' : 'none';
    }

    saveModule() {
        const moduleId = document.getElementById('moduleId').value;
        const name = document.getElementById('moduleName').value.trim();
        const color = document.getElementById('moduleColor').value;
        const topicsText = document.getElementById('moduleTopics').value.trim();
        
        if (!name || !topicsText) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        const topics = topicsText.split('\n')
            .map(topic => topic.trim())
            .filter(topic => topic !== '')
            .map((topic, index) => ({
                id: `topic-${Date.now()}-${index}`,
                name: topic,
                completed: false,
                color: this.generateTopicColor(color, index)
            }));

        const moduleData = {
            id: moduleId || `module-${Date.now()}`,
            name,
            color,
            topics,
            createdAt: moduleId ? this.modules.find(m => m.id === moduleId).createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (document.getElementById('addMilestone').checked) {
            moduleData.milestone = {
                description: document.getElementById('milestoneDescription').value.trim(),
                start: document.getElementById('milestoneStart').value,
                end: document.getElementById('milestoneEnd').value
            };
        }

        if (document.getElementById('addReward').checked) {
            moduleData.reward = {
                description: document.getElementById('rewardDescription').value.trim(),
                earned: false
            };
        }

        if (moduleId) {
            const index = this.modules.findIndex(m => m.id === moduleId);
            if (index !== -1) {
                this.modules[index] = moduleData;
                this.showToast('Module updated successfully!');
            }
        } else {
            this.modules.push(moduleData);
            this.showToast('Module added successfully!');
        }

        this.saveToStorage();
        this.renderModules();
        this.updateStats();
        this.updateAnalytics();
        this.renderTables();
        this.closeAllModals();
    }

    deleteModule() {
        if (!this.currentEditId) return;

        if (confirm('Are you sure you want to delete this module? This action cannot be undone.')) {
            this.modules = this.modules.filter(m => m.id !== this.currentEditId);
            this.saveToStorage();
            this.renderModules();
            this.updateStats();
            this.updateAnalytics();
            this.renderTables();
            this.showToast('Module deleted successfully!');
            this.closeAllModals();
        }
    }

    generateTopicColor(moduleColor, index) {
        const baseColor = moduleColor.replace('#', '');
        const r = parseInt(baseColor.substr(0, 2), 16);
        const g = parseInt(baseColor.substr(2, 2), 16);
        const b = parseInt(baseColor.substr(4, 2), 16);
        
        const factor = (index % 5) * 20;
        const newR = Math.max(0, Math.min(255, r + factor));
        const newG = Math.max(0, Math.min(255, g + factor));
        const newB = Math.max(0, Math.min(255, b + factor));
        
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }

    renderModules() {
        const modulesGrid = document.getElementById('modulesGrid');
        if (!modulesGrid) return;

        modulesGrid.innerHTML = '';

        if (this.modules.length === 0) {
            modulesGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book-open"></i>
                    <h3>No modules yet</h3>
                    <p>Start by adding your first module to track your progress!</p>
                    <button class="action-btn primary" id="addFirstModule">
                        <i class="fas fa-plus"></i> Add Your First Module
                    </button>
                </div>
            `;
            
            document.getElementById('addFirstModule')?.addEventListener('click', () => {
                this.openAddModuleModal();
            });
            return;
        }

        this.modules.forEach(module => {
            const completedTopics = module.topics.filter(topic => topic.completed).length;
            const totalTopics = module.topics.length;
            const completionPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
            
            const moduleCard = document.createElement('article');
            moduleCard.className = 'module-card';
            moduleCard.innerHTML = `
                <div class="module-header" style="background-color: ${module.color}">
                    <div class="module-actions">
                        <button class="module-action-btn edit" data-id="${module.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="module-action-btn delete" data-id="${module.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <h3 class="module-title">${module.name}</h3>
                    <div class="module-meta">
                        <span><i class="fas fa-tasks"></i> ${completedTopics}/${totalTopics} topics completed</span>
                        <span><i class="fas fa-percentage"></i> ${completionPercentage}% complete</span>
                    </div>
                </div>
                <div class="module-details">
                    <div class="topics-list">
                        ${module.topics.map(topic => `
                            <div class="topic-item">
                                <div class="topic-color-indicator" style="background-color: ${topic.color}"></div>
                                <input type="checkbox" class="topic-checkbox" id="topic-${topic.id}" 
                                    ${topic.completed ? 'checked' : ''} data-module="${module.id}" data-topic="${topic.id}">
                                <label class="topic-label" for="topic-${topic.id}">${topic.name}</label>
                            </div>
                        `).join('')}
                    </div>
                    ${module.reward ? `
                        <div class="reward-section">
                            <h4 class="reward-title"><i class="fas fa-gift"></i> Reward</h4>
                            <p class="reward-description">${module.reward.description}</p>
                            <div class="reward-progress">
                                <i class="fas ${completionPercentage === 100 ? 'fa-check-circle' : 'fa-hourglass-half'}"></i>
                                <span class="progress-text">${completionPercentage === 100 ? 'Reward earned!' : `${completionPercentage}% to reward`}</span>
                            </div>
                            ${completionPercentage === 100 ? `
                                <div class="reward-earned">
                                    <i class="fas fa-trophy"></i>
                                    <span>Congratulations! You've earned your reward!</span>
                                </div>
                            ` : `
                                <p class="motivational-quote">Keep going! You're making great progress toward your reward.</p>
                            `}
                        </div>
                    ` : ''}
                    <div style="margin-top: 1rem;">
                        <button class="action-btn primary log-study-btn" data-module="${module.name}" style="width: 100%;">
                            <i class="fas fa-clock"></i> Log Study Time
                        </button>
                    </div>
                </div>
            `;
            
            modulesGrid.appendChild(moduleCard);
        });

        this.attachModuleEventListeners();
    }

    attachModuleEventListeners() {
        document.querySelectorAll('.module-action-btn.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const moduleId = e.currentTarget.getAttribute('data-id');
                this.openAddModuleModal(moduleId);
            });
        });

        document.querySelectorAll('.module-action-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const moduleId = e.currentTarget.getAttribute('data-id');
                if (confirm('Are you sure you want to delete this module?')) {
                    this.modules = this.modules.filter(m => m.id !== moduleId);
                    this.saveToStorage();
                    this.renderModules();
                    this.updateStats();
                    this.updateAnalytics();
                    this.renderTables();
                    this.showToast('Module deleted successfully!');
                }
            });
        });

        document.querySelectorAll('.topic-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const moduleId = e.target.getAttribute('data-module');
                const topicId = e.target.getAttribute('data-topic');
                this.toggleTopicCompletion(moduleId, topicId, e.target.checked);
            });
        });

        document.querySelectorAll('.log-study-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const moduleName = e.currentTarget.getAttribute('data-module');
                this.openLogSessionModal();
                setTimeout(() => {
                    document.getElementById('sessionSubject').value = moduleName;
                }, 100);
            });
        });
    }

    toggleTopicCompletion(moduleId, topicId, completed) {
        const module = this.modules.find(m => m.id === moduleId);
        if (!module) return;

        const topic = module.topics.find(t => t.id === topicId);
        if (!topic) return;

        topic.completed = completed;
        if (completed && !topic.completedDate) {
            topic.completedDate = new Date().toISOString().split('T')[0];
        } else if (!completed) {
            delete topic.completedDate;
        }
        
        module.updatedAt = new Date().toISOString();
        
        if (module.reward && !module.reward.earned) {
            const allCompleted = module.topics.every(t => t.completed);
            if (allCompleted) {
                module.reward.earned = true;
                this.showToast(`Congratulations! You've earned the reward for ${module.name}`, 'success');
            }
        }

        this.saveToStorage();
        this.updateStats();
        this.updateAnalytics();
        this.renderTables();
        this.renderModules();
    }

    filterModules(searchTerm) {
        const modules = document.querySelectorAll('.module-card');
        const term = searchTerm.toLowerCase();
        
        modules.forEach(module => {
            const title = module.querySelector('.module-title').textContent.toLowerCase();
            const topics = module.querySelectorAll('.topic-label');
            let topicMatch = false;
            
            topics.forEach(topic => {
                if (topic.textContent.toLowerCase().includes(term)) {
                    topicMatch = true;
                }
            });
            
            if (title.includes(term) || topicMatch) {
                module.style.display = 'block';
            } else {
                module.style.display = 'none';
            }
        });
    }

    updateStats() {
        const totalModules = this.modules.length;
        const totalTopics = this.modules.reduce((sum, module) => sum + module.topics.length, 0);
        const completedTopics = this.modules.reduce((sum, module) => 
            sum + module.topics.filter(topic => topic.completed).length, 0);
        const totalHours = this.studySessions.reduce((sum, session) => sum + session.duration, 0);
        const earnedRewards = this.modules.filter(module => 
            module.reward && module.reward.earned).length;

        document.getElementById('moduleCount').textContent = totalModules;
        document.getElementById('completedCount').textContent = completedTopics;
        document.getElementById('totalHours').textContent = totalHours.toFixed(1);
        document.getElementById('rewardCount').textContent = earnedRewards;

        const today = new Date().toISOString().split('T')[0];
        const todayHours = this.studySessions
            .filter(session => session.date === today)
            .reduce((sum, session) => sum + session.duration, 0);
        
        const hours = Math.floor(todayHours);
        const minutes = Math.round((todayHours - hours) * 60);
        document.getElementById('todayHours').textContent = `${hours}:${minutes.toString().padStart(2, '0')}`;
    }

    renderTables() {
        this.renderCompletedTopicsTable();
        this.renderStudySessionsTable();
    }

    renderCompletedTopicsTable() {
        const tbody = document.getElementById('completedTopicsBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        const completedTopics = [];
        this.modules.forEach(module => {
            module.topics.forEach(topic => {
                if (topic.completed) {
                    completedTopics.push({
                        ...topic,
                        moduleName: module.name,
                        moduleColor: module.color
                    });
                }
            });
        });

        completedTopics.sort((a, b) => new Date(b.completedDate || 0) - new Date(a.completedDate || 0));

        if (completedTopics.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; color: var(--study-muted); padding: 2rem;">
                        <i class="fas fa-info-circle" style="margin-right: 0.5rem;"></i>
                        No completed topics yet. Start studying to see your progress here!
                    </td>
                </tr>
            `;
            return;
        }

        completedTopics.forEach(topic => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div class="topic-color-indicator" style="background-color: ${topic.color}"></div>
                        ${topic.name}
                    </div>
                </td>
                <td style="color: ${topic.moduleColor}; font-weight: 500;">${topic.moduleName}</td>
                <td>${new Date(topic.completedDate).toLocaleDateString() || 'Today'}</td>
                <td>
                    <span class="status-badge status-completed">
                        <i class="fas fa-check"></i> Completed
                    </span>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    renderStudySessionsTable() {
        const tbody = document.getElementById('studySessionsBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        const sortedSessions = [...this.studySessions].sort((a, b) => new Date(b.date) - new Date(a.date));

        if (sortedSessions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; color: var(--study-muted); padding: 2rem;">
                        <i class="fas fa-info-circle" style="margin-right: 0.5rem;"></i>
                        No study sessions logged yet. Use the timer or manually log your study time!
                    </td>
                </tr>
            `;
            return;
        }

        sortedSessions.slice(0, 15).forEach(session => {
            const row = document.createElement('tr');
            const formattedDate = new Date(session.date).toLocaleDateString();
            const duration = `${Math.floor(session.duration)}h ${Math.round((session.duration % 1) * 60)}m`;
            
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td style="font-weight: 600; color: var(--study-blue);">${duration}</td>
                <td>${session.subject}</td>
                <td style="color: var(--study-muted); max-width: 200px; overflow: hidden; text-overflow: ellipsis;">
                    ${session.notes || 'No notes'}
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    updateStudyLog() {
        const logContainer = document.getElementById('studyLog');
        if (!logContainer) return;

        const recentSessions = this.studySessions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        if (recentSessions.length === 0) {
            logContainer.innerHTML = `
                <div class="log-entry">
                    <div>
                        <i class="fas fa-info-circle" style="color: var(--study-blue);"></i>
                        No study sessions yet
                    </div>
                    <div style="color: var(--study-muted); font-size: 0.9rem;">
                        Start the timer to track your study time
                    </div>
                </div>
            `;
            return;
        }

        logContainer.innerHTML = recentSessions.map(session => {
            const duration = `${Math.floor(session.duration)}h ${Math.round((session.duration % 1) * 60)}m`;
            return `
                <div class="log-entry">
                    <div>
                        <strong>${session.subject}</strong>
                        <div style="font-size: 0.9rem; color: var(--study-muted);">
                            ${new Date(session.date).toLocaleDateString()} • ${session.notes ? session.notes.substring(0, 50) + (session.notes.length > 50 ? '...' : '') : 'No notes'}
                        </div>
                    </div>
                    <div style="color: var(--study-blue); font-weight: 600;">
                        ${duration}
                    </div>
                </div>
            `;
        }).join('');
    }

    initializeCharts() {
        // Only initialize if Chart is available
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded yet');
            return;
        }

        try {
            // Progress Chart (Doughnut)
            const progressCtx = document.getElementById('progressChart')?.getContext('2d');
            if (progressCtx) {
                this.progressChart = new Chart(progressCtx, {
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
                            }
                        }
                    }
                });
            }

            // Time Management Chart (Bar)
            const timeCtx = document.getElementById('timeChart')?.getContext('2d');
            if (timeCtx) {
                this.timeChart = new Chart(timeCtx, {
                    type: 'bar',
                    data: {
                        labels: [],
                        datasets: [{
                            label: 'Completion %',
                            data: [],
                            backgroundColor: [],
                            borderWidth: 0,
                            borderRadius: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: 100,
                                ticks: {
                                    callback: function(value) {
                                        return value + '%';
                                    }
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: false
                            }
                        }
                    }
                });
            }

            // Weekly Hours Chart (Line)
            const weeklyCtx = document.getElementById('weeklyChart')?.getContext('2d');
            if (weeklyCtx) {
                this.weeklyChart = new Chart(weeklyCtx, {
                    type: 'line',
                    data: {
                        labels: [],
                        datasets: [{
                            label: 'Hours Studied',
                            data: [],
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function(value) {
                                        return value + 'h';
                                    }
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: false
                            }
                        }
                    }
                });
            }

            // Module Progress Chart (Horizontal Bar)
            const moduleCtx = document.getElementById('moduleChart')?.getContext('2d');
            if (moduleCtx) {
                this.moduleChart = new Chart(moduleCtx, {
                    type: 'bar',
                    data: {
                        labels: [],
                        datasets: [{
                            label: 'Progress %',
                            data: [],
                            backgroundColor: [],
                            borderWidth: 0,
                            borderRadius: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        indexAxis: 'y',
                        scales: {
                            x: {
                                beginAtZero: true,
                                max: 100,
                                ticks: {
                                    callback: function(value) {
                                        return value + '%';
                                    }
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: false
                            }
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error initializing charts:', error);
        }
    }

    updateAnalytics() {
        // Update Progress Chart
        const totalTopics = this.modules.reduce((sum, module) => sum + module.topics.length, 0);
        const completedTopics = this.modules.reduce((sum, module) => 
            sum + module.topics.filter(topic => topic.completed).length, 0);
        
        const completionPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
        
        if (this.progressChart) {
            this.progressChart.data.datasets[0].data = [completionPercentage, 100 - completionPercentage];
            this.progressChart.update();
        }
        
        // Safely update progress percentage
        const progressElement = document.getElementById('progressPercentage');
        if (progressElement) {
            progressElement.textContent = `${completionPercentage}% Complete`;
        }
        
        // Update Time Management Chart
        const moduleLabels = this.modules.map(module => module.name);
        const moduleData = this.modules.map(module => {
            const completed = module.topics.filter(topic => topic.completed).length;
            const total = module.topics.length;
            return total > 0 ? Math.round((completed / total) * 100) : 0;
        });
        const moduleColors = this.modules.map(module => module.color);
        
        if (this.timeChart) {
            this.timeChart.data.labels = moduleLabels;
            this.timeChart.data.datasets[0].data = moduleData;
            this.timeChart.data.datasets[0].backgroundColor = moduleColors;
            this.timeChart.update();
        }

        // Update Weekly Hours Chart
        this.updateWeeklyChart();

        // Update Module Progress Chart
        if (this.moduleChart) {
            this.moduleChart.data.labels = moduleLabels;
            this.moduleChart.data.datasets[0].data = moduleData;
            this.moduleChart.data.datasets[0].backgroundColor = moduleColors;
            this.moduleChart.update();
        }

        // Safely update time remaining message - FIXED
        const timeRemainingElement = document.getElementById('timeRemaining');
        if (timeRemainingElement) {
            const onTrackModules = this.modules.filter(module => {
                if (!module.milestone || !module.milestone.end) return true;
                
                const completed = module.topics.filter(topic => topic.completed).length;
                const total = module.topics.length;
                const progress = total > 0 ? completed / total : 0;
                
                const endDate = new Date(module.milestone.end);
                const today = new Date();
                const totalDays = Math.ceil((endDate - new Date(module.milestone.start || module.createdAt)) / (1000 * 60 * 60 * 24));
                const daysPassed = Math.ceil((today - new Date(module.milestone.start || module.createdAt)) / (1000 * 60 * 60 * 24));
                const expectedProgress = daysPassed / totalDays;
                
                return progress >= expectedProgress || progress === 1;
            }).length;

            const totalTrackedModules = this.modules.filter(module => module.milestone && module.milestone.end).length;
            
            if (totalTrackedModules > 0) {
                const onTrackPercentage = Math.round((onTrackModules / totalTrackedModules) * 100);
                const message = onTrackPercentage >= 75 ? 
                    `Great work! ${onTrackPercentage}% of milestones on track` :
                    onTrackPercentage >= 50 ?
                    `Good progress! ${onTrackPercentage}% of milestones on track` :
                    `Keep going! ${onTrackPercentage}% of milestones on track`;
                
                timeRemainingElement.textContent = message;
            } else {
                timeRemainingElement.textContent = 'All milestones on track';
            }
        }
    }

    updateWeeklyChart() {
        if (!this.weeklyChart) return;

        const last7Days = Array.from({length: 7}, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toISOString().split('T')[0];
        }).reverse();

        const dailyHours = last7Days.map(date => {
            const sessions = this.studySessions.filter(session => session.date === date);
            return sessions.reduce((sum, session) => sum + session.duration, 0);
        });

        const dayLabels = last7Days.map(date => {
            const d = new Date(date);
            return d.toLocaleDateString('en-US', { weekday: 'short' });
        });

        this.weeklyChart.data.labels = dayLabels;
        this.weeklyChart.data.datasets[0].data = dailyHours;
        this.weeklyChart.update();
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        if (!toast || !toastMessage) return;
        
        toastMessage.textContent = message;
        
        const icon = toast.querySelector('i');
        if (type === 'error') {
            icon.className = 'fas fa-exclamation-circle';
            toast.style.borderLeftColor = '#ef4444';
        } else if (type === 'warning') {
            icon.className = 'fas fa-exclamation-triangle';
            toast.style.borderLeftColor = '#f59e0b';
        } else {
            icon.className = 'fas fa-check-circle';
            toast.style.borderLeftColor = '#10b981';
        }
        
        toast.classList.add('active');
        
        setTimeout(() => {
            toast.classList.remove('active');
        }, 3000);
    }

    saveToStorage() {
        localStorage.setItem('studentModules', JSON.stringify(this.modules));
    }

    saveStudySessions() {
        localStorage.setItem('studySessions', JSON.stringify(this.studySessions));
    }
}

// Initialize the Progress Manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait for Chart.js to load if it's loaded asynchronously
    if (typeof Chart === 'undefined') {
        // If Chart.js is not loaded, wait a bit and try again
        setTimeout(() => {
            if (typeof Chart !== 'undefined') {
                window.progressManager = new ProgressManager();
            } else {
                console.warn('Chart.js not loaded, initializing without charts');
                window.progressManager = new ProgressManager();
            }
        }, 1000);
    } else {
        window.progressManager = new ProgressManager();
    }
});