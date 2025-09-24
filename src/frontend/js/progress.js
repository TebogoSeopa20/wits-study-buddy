// Progress Page JavaScript - Enhanced with Color Management and Edit/Delete Features

// Module and Topic Management
class ProgressManager {
    constructor() {
        this.modules = JSON.parse(localStorage.getItem('studentModules')) || [];
        this.currentEditId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderModules();
        this.updateStats();
        this.initializeCharts();
        this.updateAnalytics();
    }

    setupEventListeners() {
        // Add Module Button
        document.getElementById('addModuleBtn').addEventListener('click', () => {
            this.openAddModuleModal();
        });

        // Modal Controls
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.closeAllModals();
            });
        });

        // Module Form Submit
        document.getElementById('moduleForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveModule();
        });

        // Cancel Module Button
        document.getElementById('cancelModule').addEventListener('click', () => {
            this.closeAllModals();
        });

        // Delete Module Button
        document.getElementById('deleteModuleBtn').addEventListener('click', () => {
            this.deleteModule();
        });

        // Checkbox Toggles
        document.getElementById('addMilestone').addEventListener('change', (e) => {
            this.toggleMilestoneSection(e.target.checked);
        });

        document.getElementById('addReward').addEventListener('change', (e) => {
            this.toggleRewardSection(e.target.checked);
        });

        // Color Input
        document.getElementById('moduleColor').addEventListener('input', (e) => {
            document.getElementById('moduleColorValue').textContent = e.target.value;
        });

        // Search Functionality
        document.getElementById('progressSearch').addEventListener('input', (e) => {
            this.filterModules(e.target.value);
        });

        // Close Advice Button
        document.getElementById('closeAdvice').addEventListener('click', () => {
            document.getElementById('adviceModal').classList.remove('active');
        });

        // Close Toast
        document.querySelector('.toast-close').addEventListener('click', () => {
            document.getElementById('toast').classList.remove('active');
        });

        // Click outside modal to close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
    }

    openAddModuleModal(moduleId = null) {
        const modal = document.getElementById('addModuleModal');
        const title = document.getElementById('modalTitle');
        const deleteBtn = document.getElementById('deleteModuleBtn');
        
        if (moduleId) {
            // Edit mode
            title.textContent = 'Edit Module';
            deleteBtn.style.display = 'block';
            this.currentEditId = moduleId;
            this.populateModuleForm(moduleId);
        } else {
            // Add mode
            title.textContent = 'Add New Module';
            deleteBtn.style.display = 'none';
            this.currentEditId = null;
            this.resetModuleForm();
        }
        
        modal.classList.add('active');
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
        
        // Milestone
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
        
        // Reward
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
        document.getElementById('milestoneSection').style.display = show ? 'block' : 'none';
    }

    toggleRewardSection(show) {
        document.getElementById('rewardSection').style.display = show ? 'block' : 'none';
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

        // Parse topics
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

        // Add milestone if checked
        if (document.getElementById('addMilestone').checked) {
            moduleData.milestone = {
                description: document.getElementById('milestoneDescription').value.trim(),
                start: document.getElementById('milestoneStart').value,
                end: document.getElementById('milestoneEnd').value
            };
        }

        // Add reward if checked
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
                this.modules[index] = moduleData;
                this.showToast('Module updated successfully!');
            }
        } else {
            // Add new module
            this.modules.push(moduleData);
            this.showToast('Module added successfully!');
        }

        this.saveToStorage();
        this.renderModules();
        this.updateStats();
        this.updateAnalytics();
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
            this.showToast('Module deleted successfully!');
            this.closeAllModals();
        }
    }

    generateTopicColor(moduleColor, index) {
        // Generate a slightly different color for each topic based on module color
        const baseColor = moduleColor.replace('#', '');
        const r = parseInt(baseColor.substr(0, 2), 16);
        const g = parseInt(baseColor.substr(2, 2), 16);
        const b = parseInt(baseColor.substr(4, 2), 16);
        
        // Adjust color based on index
        const factor = (index % 5) * 20; // Vary by up to 100
        const newR = Math.max(0, Math.min(255, r + factor));
        const newG = Math.max(0, Math.min(255, g + factor));
        const newB = Math.max(0, Math.min(255, b + factor));
        
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }

    renderModules() {
        const modulesGrid = document.getElementById('modulesGrid');
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
                </div>
            `;
            
            modulesGrid.appendChild(moduleCard);
        });

        // Add event listeners for edit and delete buttons
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
                    this.showToast('Module deleted successfully!');
                }
            });
        });

        // Add event listeners for topic checkboxes
        document.querySelectorAll('.topic-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const moduleId = e.target.getAttribute('data-module');
                const topicId = e.target.getAttribute('data-topic');
                this.toggleTopicCompletion(moduleId, topicId, e.target.checked);
            });
        });
    }

    toggleTopicCompletion(moduleId, topicId, completed) {
        const module = this.modules.find(m => m.id === moduleId);
        if (!module) return;

        const topic = module.topics.find(t => t.id === topicId);
        if (!topic) return;

        topic.completed = completed;
        module.updatedAt = new Date().toISOString();
        
        // Check if all topics are completed to earn reward
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
        
        // Re-render the specific module to update the UI
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
        const earnedRewards = this.modules.filter(module => 
            module.reward && module.reward.earned).length;

        document.getElementById('moduleCount').textContent = totalModules;
        document.getElementById('completedCount').textContent = completedTopics;
        document.getElementById('rewardCount').textContent = earnedRewards;
    }

    initializeCharts() {
        // Progress Chart (Doughnut)
        const progressCtx = document.getElementById('progressChart').getContext('2d');
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
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.parsed}%`;
                            }
                        }
                    }
                }
            }
        });

        // Time Management Chart (Bar)
        const timeCtx = document.getElementById('timeChart').getContext('2d');
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

    updateAnalytics() {
        // Update Progress Chart
        const totalTopics = this.modules.reduce((sum, module) => sum + module.topics.length, 0);
        const completedTopics = this.modules.reduce((sum, module) => 
            sum + module.topics.filter(topic => topic.completed).length, 0);
        
        const completionPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
        
        this.progressChart.data.datasets[0].data = [completionPercentage, 100 - completionPercentage];
        this.progressChart.update();
        
        document.getElementById('progressPercentage').textContent = `${completionPercentage}% Complete`;
        
        // Update Time Management Chart
        const moduleLabels = this.modules.map(module => module.name);
        const moduleData = this.modules.map(module => {
            const completed = module.topics.filter(topic => topic.completed).length;
            const total = module.topics.length;
            return total > 0 ? Math.round((completed / total) * 100) : 0;
        });
        const moduleColors = this.modules.map(module => module.color);
        
        this.timeChart.data.labels = moduleLabels;
        this.timeChart.data.datasets[0].data = moduleData;
        this.timeChart.data.datasets[0].backgroundColor = moduleColors;
        this.timeChart.update();
        
        // Update time remaining message
        const onTrackModules = this.modules.filter(module => {
            if (!module.milestone || !module.milestone.end) return true;
            
            const completed = module.topics.filter(topic => topic.completed).length;
            const total = module.topics.length;
            const progress = total > 0 ? completed / total : 0;
            
            // Simple heuristic: if we're more than halfway through the time but less than halfway through topics, we're behind
            const endDate = new Date(module.milestone.end);
            const now = new Date();
            const totalTime = endDate - new Date(module.milestone.start || module.createdAt);
            const timePassed = now - new Date(module.milestone.start || module.createdAt);
            
            return timePassed / totalTime <= progress || progress === 1;
        }).length;
        
        const timeMessage = onTrackModules === this.modules.length ? 
            'All milestones on track' : 
            `${onTrackModules}/${this.modules.length} modules on track`;
        
        document.getElementById('timeRemaining').textContent = timeMessage;
        
        // Update color summaries
        this.updateColorSummaries();
    }

    updateColorSummaries() {
        // Completion Progress Color Summary
        const completionSummary = document.getElementById('completionColorSummary');
        completionSummary.innerHTML = '<h3>Module Colors</h3><div class="color-items"></div>';
        
        const completionColorItems = completionSummary.querySelector('.color-items');
        this.modules.forEach(module => {
            const colorItem = document.createElement('div');
            colorItem.className = 'color-item';
            colorItem.innerHTML = `
                <div class="color-swatch" style="background-color: ${module.color}"></div>
                <span>${module.name}</span>
            `;
            completionColorItems.appendChild(colorItem);
        });
        
        // Time Management Color Summary
        const timeSummary = document.getElementById('timeColorSummary');
        timeSummary.innerHTML = '<h3>Topic Colors by Module</h3><div class="color-items"></div>';
        
        const timeColorItems = timeSummary.querySelector('.color-items');
        this.modules.forEach(module => {
            // Show a sample of topic colors for this module
            const sampleTopics = module.topics.slice(0, 3); // Show first 3 topics as sample
            sampleTopics.forEach(topic => {
                const colorItem = document.createElement('div');
                colorItem.className = 'color-item';
                colorItem.innerHTML = `
                    <div class="color-swatch" style="background-color: ${topic.color}"></div>
                    <span>${module.name}: ${topic.name}</span>
                `;
                timeColorItems.appendChild(colorItem);
            });
        });
    }

    saveToStorage() {
        localStorage.setItem('studentModules', JSON.stringify(this.modules));
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        toastMessage.textContent = message;
        
        // Set icon based on type
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
        
        // Auto hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('active');
        }, 3000);
    }
}

// Initialize the Progress Manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ProgressManager();
});