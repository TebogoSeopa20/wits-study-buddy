// progress.js - Student Progress Tracking Functionality
class ProgressManager {
    constructor() {
        this.modules = [];
        this.stats = {};
        this.analytics = {};
        
        // API configuration
        this.isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.API_BASE_URL = this.isLocal 
            ? 'http://localhost:3000/api' 
            : 'https://wits-buddy-g9esajarfqe3dmh6.southafricanorth-01.azurewebsites.net/api';
        
        this.init();
    }

    init() {
        // Check authentication
        if (!this.isAuthenticated()) {
            this.redirectToLogin();
            return;
        }

        this.setupEventListeners();
        this.loadProgressData();
        this.setupCharts();
    }

    isAuthenticated() {
        return auth.isLoggedIn();
    }

    redirectToLogin() {
        window.location.href = 'login.html';
    }

    getAuthHeaders() {
        const user = auth.getCurrentUser();
        return {
            'Content-Type': 'application/json',
            'x-user-data': JSON.stringify(user)
        };
    }

    async apiCall(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.API_BASE_URL}${endpoint}`, {
                headers: this.getAuthHeaders(),
                ...options
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            this.showToast('Error connecting to server', 'error');
            throw error;
        }
    }

    setupEventListeners() {
        // Add module button
        document.getElementById('addModuleBtn').addEventListener('click', () => this.showAddModuleModal());
        
        // Export PDF button
        document.getElementById('exportPdfBtn').addEventListener('click', () => this.exportToPDF());
        
        // Search functionality
        document.getElementById('progressSearch').addEventListener('input', (e) => this.handleSearch(e.target.value));
        
        // Modal events
        this.setupModalEvents();
        
        // Form submission
        document.getElementById('moduleForm').addEventListener('submit', (e) => this.handleModuleSubmit(e));
    }

    setupModalEvents() {
        const modal = document.getElementById('addModuleModal');
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = document.getElementById('cancelModule');
        const deleteBtn = document.getElementById('deleteModuleBtn');
        const adviceCloseBtn = document.getElementById('closeAdvice');
        const toastCloseBtn = document.querySelector('.toast-close');

        // Close modal events
        [closeBtn, cancelBtn].forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });

        // Delete module
        deleteBtn.addEventListener('click', () => this.handleDeleteModule());

        // Advice modal
        adviceCloseBtn.addEventListener('click', () => this.closeAdviceModal());

        // Toast close
        toastCloseBtn.addEventListener('click', () => this.hideToast());

        // Checkbox toggles
        document.getElementById('addMilestone').addEventListener('change', (e) => {
            document.getElementById('milestoneSection').style.display = e.target.checked ? 'block' : 'none';
        });

        document.getElementById('addReward').addEventListener('change', (e) => {
            document.getElementById('rewardSection').style.display = e.target.checked ? 'block' : 'none';
        });

        // Color picker
        document.getElementById('moduleColor').addEventListener('input', (e) => {
            document.getElementById('moduleColorValue').textContent = e.target.value;
        });

        // Close modal on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    async loadProgressData() {
        try {
            this.showLoading(true);
            
            // Load modules and stats simultaneously
            const [modulesData, statsData] = await Promise.all([
                this.apiCall('/progress/modules'),
                this.apiCall('/progress/stats')
            ]);

            this.modules = modulesData.modules || [];
            this.stats = statsData.stats || {};
            this.analytics = statsData.analytics || {};

            this.renderModules();
            this.updateStats();
            this.updateCharts();
            this.showLoading(false);

        } catch (error) {
            console.error('Error loading progress data:', error);
            this.showLoading(false);
        }
    }

    showLoading(show) {
        const modulesGrid = document.getElementById('modulesGrid');
        if (show) {
            modulesGrid.innerHTML = '<div class="loading-spinner">Loading your progress...</div>';
        }
    }

    renderModules() {
        const modulesGrid = document.getElementById('modulesGrid');
        
        if (this.modules.length === 0) {
            modulesGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book-open"></i>
                    <h3>No modules yet</h3>
                    <p>Start by adding your first study module!</p>
                    <button class="action-btn primary" onclick="progressManager.showAddModuleModal()">
                        <i class="fas fa-plus"></i> Add Your First Module
                    </button>
                </div>
            `;
            return;
        }

        modulesGrid.innerHTML = this.modules.map(module => this.createModuleCard(module)).join('');
        
        // Add event listeners to topic checkboxes
        this.attachTopicEventListeners();
    }

    createModuleCard(module) {
        const completedTopics = module.topics.filter(topic => topic.completed).length;
        const totalTopics = module.topics.length;
        const completionPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
        
        const milestone = module.milestone ? `
            <span><i class="fas fa-flag"></i> ${this.formatDate(module.milestone.end_date)}</span>
        ` : '';

        const topicsHtml = module.topics.map((topic, index) => `
            <div class="topic-item">
                <div class="topic-color-indicator" style="background-color: ${topic.color}"></div>
                <input type="checkbox" class="topic-checkbox" id="topic-${topic.id}" 
                    ${topic.completed ? 'checked' : ''} data-module-id="${module.id}" data-topic-id="${topic.id}">
                <label for="topic-${topic.id}" class="topic-label">${topic.name}</label>
            </div>
        `).join('');

        const rewardHtml = module.reward ? this.createRewardSection(module) : '';

        return `
            <article class="module-card">
                <div class="module-header" style="background-color: ${module.color}">
                    <div class="module-actions">
                        <button class="module-action-btn edit" data-module-id="${module.id}" title="Edit Module">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="module-action-btn delete" data-module-id="${module.id}" title="Delete Module">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <h3 class="module-title">${module.name}</h3>
                    <div class="module-meta">
                        <span><i class="fas fa-tasks"></i> ${completedTopics}/${totalTopics} topics completed</span>
                        <span><i class="fas fa-chart-pie"></i> ${completionPercentage}% complete</span>
                        ${milestone}
                    </div>
                </div>
                <div class="module-details">
                    <div class="topics-list">
                        ${topicsHtml}
                    </div>
                    ${rewardHtml}
                </div>
            </article>
        `;
    }

    createRewardSection(module) {
        const completedTopics = module.topics.filter(topic => topic.completed).length;
        const totalTopics = module.topics.length;
        const allCompleted = completedTopics === totalTopics && totalTopics > 0;

        if (allCompleted && module.reward.earned) {
            return `
                <div class="reward-section">
                    <div class="reward-earned">
                        <i class="fas fa-trophy"></i>
                        Reward Earned: ${module.reward.description}
                    </div>
                </div>
            `;
        }

        return `
            <div class="reward-section">
                <div class="reward-title">
                    <i class="fas fa-gift"></i>
                    Completion Reward
                </div>
                <div class="reward-description">${module.reward.description}</div>
                <div class="reward-progress">
                    <i class="fas fa-spinner"></i>
                    <span class="progress-text">${completedTopics}/${totalTopics} topics completed</span>
                </div>
                <p class="motivational-quote">Keep going! You're making great progress.</p>
            </div>
        `;
    }

    attachTopicEventListeners() {
        document.querySelectorAll('.topic-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const moduleId = e.target.dataset.moduleId;
                const topicId = e.target.dataset.topicId;
                const completed = e.target.checked;
                
                this.toggleTopicCompletion(moduleId, topicId, completed);
            });
        });

        // Edit and delete buttons
        document.querySelectorAll('.module-action-btn.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const moduleId = e.currentTarget.dataset.moduleId;
                this.editModule(moduleId);
            });
        });

        document.querySelectorAll('.module-action-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const moduleId = e.currentTarget.dataset.moduleId;
                this.confirmDeleteModule(moduleId);
            });
        });
    }

    async toggleTopicCompletion(moduleId, topicId, completed) {
        try {
            await this.apiCall(`/progress/modules/${moduleId}/topics/${topicId}`, {
                method: 'PATCH',
                body: JSON.stringify({ completed })
            });

            this.showToast(`Topic marked as ${completed ? 'completed' : 'incomplete'}`);
            this.loadProgressData(); // Reload to update stats and rewards

        } catch (error) {
            console.error('Error updating topic:', error);
            this.showToast('Error updating topic', 'error');
        }
    }

    updateStats() {
        document.getElementById('moduleCount').textContent = this.stats.totalModules || 0;
        document.getElementById('completedCount').textContent = this.stats.completedTopics || 0;
        document.getElementById('rewardCount').textContent = this.stats.earnedRewards || 0;
    }

    setupCharts() {
        // Progress chart
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
                                return `${context.label}: ${context.parsed}%`;
                            }
                        }
                    }
                }
            }
        });

        // Time management chart
        this.timeChart = new Chart(document.getElementById('timeChart'), {
            type: 'doughnut',
            data: {
                labels: ['On Track', 'Needs Attention'],
                datasets: [{
                    data: [100, 0],
                    backgroundColor: ['#3b82f6', '#f59e0b'],
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

    updateCharts() {
        // Update progress chart
        const completionPercentage = this.stats.completionPercentage || 0;
        this.progressChart.data.datasets[0].data = [completionPercentage, 100 - completionPercentage];
        this.progressChart.update();

        document.getElementById('progressPercentage').textContent = `${completionPercentage}% Complete`;

        // Update time management chart
        const timeManagement = this.analytics.timeManagement || { onTrack: 0, total: 0 };
        const onTrackPercentage = timeManagement.total > 0 ? 
            Math.round((timeManagement.onTrack / timeManagement.total) * 100) : 100;
        
        this.timeChart.data.datasets[0].data = [onTrackPercentage, 100 - onTrackPercentage];
        this.timeChart.update();

        document.getElementById('timeRemaining').textContent = 
            onTrackPercentage === 100 ? 'All milestones on track' : `${100 - onTrackPercentage}% need attention`;

        // Update color summaries
        this.updateColorSummaries();
    }

    updateColorSummaries() {
        const completionSummary = document.getElementById('completionColorSummary');
        const timeSummary = document.getElementById('timeColorSummary');

        // Completion color summary
        const moduleCompletion = this.analytics.moduleCompletion || [];
        completionSummary.innerHTML = `
            <h3>Module Progress</h3>
            <div class="color-items">
                ${moduleCompletion.map(module => `
                    <div class="color-item">
                        <div class="color-swatch" style="background-color: ${module.color}"></div>
                        <span>${module.moduleName}: ${module.completion}%</span>
                    </div>
                `).join('')}
            </div>
        `;

        // Time management color summary
        timeSummary.innerHTML = `
            <h3>Milestone Status</h3>
            <div class="color-items">
                <div class="color-item">
                    <div class="color-swatch" style="background-color: #3b82f6"></div>
                    <span>On Track</span>
                </div>
                <div class="color-item">
                    <div class="color-swatch" style="background-color: #f59e0b"></div>
                    <span>Needs Attention</span>
                </div>
            </div>
        `;
    }

    showAddModuleModal(module = null) {
        const modal = document.getElementById('addModuleModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('moduleForm');
        const deleteBtn = document.getElementById('deleteModuleBtn');

        if (module) {
            // Edit mode
            title.textContent = 'Edit Module';
            deleteBtn.style.display = 'block';
            this.populateForm(module);
        } else {
            // Add mode
            title.textContent = 'Add New Module';
            deleteBtn.style.display = 'none';
            form.reset();
            document.getElementById('moduleColorValue').textContent = '#4A90E2';
        }

        modal.classList.add('active');
    }

    populateForm(module) {
        document.getElementById('moduleId').value = module.id;
        document.getElementById('moduleName').value = module.name;
        document.getElementById('moduleColor').value = module.color;
        document.getElementById('moduleColorValue').textContent = module.color;

        // Populate topics
        const topicsText = module.topics.map(topic => topic.name).join('\n');
        document.getElementById('moduleTopics').value = topicsText;

        // Populate milestone
        if (module.milestone) {
            document.getElementById('addMilestone').checked = true;
            document.getElementById('milestoneSection').style.display = 'block';
            document.getElementById('milestoneDescription').value = module.milestone.description || '';
            document.getElementById('milestoneStart').value = module.milestone.start_date || '';
            document.getElementById('milestoneEnd').value = module.milestone.end_date || '';
        }

        // Populate reward
        if (module.reward) {
            document.getElementById('addReward').checked = true;
            document.getElementById('rewardSection').style.display = 'block';
            document.getElementById('rewardDescription').value = module.reward.description || '';
        }
    }

    closeModal() {
        document.getElementById('addModuleModal').classList.remove('active');
        document.getElementById('moduleForm').reset();
    }

    closeAdviceModal() {
        document.getElementById('adviceModal').classList.remove('active');
    }

    async handleModuleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const moduleId = document.getElementById('moduleId').value;
        const isEdit = !!moduleId;

        try {
            const moduleData = {
                name: document.getElementById('moduleName').value,
                color: document.getElementById('moduleColor').value,
                topics: this.parseTopics(document.getElementById('moduleTopics').value),
                milestone: this.getMilestoneData(),
                reward: this.getRewardData()
            };

            if (isEdit) {
                await this.apiCall(`/progress/modules/${moduleId}`, {
                    method: 'PUT',
                    body: JSON.stringify(moduleData)
                });
                this.showToast('Module updated successfully');
            } else {
                await this.apiCall('/progress/modules', {
                    method: 'POST',
                    body: JSON.stringify(moduleData)
                });
                this.showToast('Module created successfully');
            }

            this.closeModal();
            this.loadProgressData();

        } catch (error) {
            console.error('Error saving module:', error);
            this.showToast('Error saving module', 'error');
        }
    }

    parseTopics(topicsText) {
        return topicsText.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map((name, index) => ({ name, completed: false }));
    }

    getMilestoneData() {
        if (!document.getElementById('addMilestone').checked) return null;

        return {
            description: document.getElementById('milestoneDescription').value,
            start: document.getElementById('milestoneStart').value,
            end: document.getElementById('milestoneEnd').value
        };
    }

    getRewardData() {
        if (!document.getElementById('addReward').checked) return null;

        return {
            description: document.getElementById('rewardDescription').value
        };
    }

    async editModule(moduleId) {
        try {
            const response = await this.apiCall(`/progress/modules/${moduleId}`);
            this.showAddModuleModal(response.module);
        } catch (error) {
            console.error('Error loading module for edit:', error);
            this.showToast('Error loading module', 'error');
        }
    }

    confirmDeleteModule(moduleId) {
        if (confirm('Are you sure you want to delete this module? This action cannot be undone.')) {
            this.handleDeleteModule(moduleId);
        }
    }

    async handleDeleteModule(moduleId = null) {
        if (!moduleId) {
            moduleId = document.getElementById('moduleId').value;
        }

        try {
            await this.apiCall(`/progress/modules/${moduleId}`, {
                method: 'DELETE'
            });

            this.showToast('Module deleted successfully');
            this.closeModal();
            this.loadProgressData();

        } catch (error) {
            console.error('Error deleting module:', error);
            this.showToast('Error deleting module', 'error');
        }
    }

    async handleSearch(query) {
        if (query.length < 2) {
            if (query.length === 0) {
                this.renderModules();
            }
            return;
        }

        try {
            const response = await this.apiCall(`/progress/search?q=${encodeURIComponent(query)}`);
            this.displaySearchResults(response.results);
        } catch (error) {
            console.error('Error searching:', error);
        }
    }

    displaySearchResults(results) {
        const modulesGrid = document.getElementById('modulesGrid');
        
        if (results.modules.length === 0 && results.topics.length === 0) {
            modulesGrid.innerHTML = '<div class="empty-state">No results found</div>';
            return;
        }

        let html = '';

        // Display matching modules
        if (results.modules.length > 0) {
            html += '<h3>Matching Modules</h3>';
            html += results.modules.map(module => this.createModuleCard(module)).join('');
        }

        // Display matching topics
        if (results.topics.length > 0) {
            html += '<h3>Matching Topics</h3>';
            html += results.topics.map(topic => `
                <div class="search-topic-item">
                    <span class="topic-name">${topic.name}</span>
                    <span class="module-name">in ${topic.module.name}</span>
                    <span class="topic-status ${topic.completed ? 'completed' : ''}">
                        ${topic.completed ? 'Completed' : 'In Progress'}
                    </span>
                </div>
            `).join('');
        }

        modulesGrid.innerHTML = html;
        this.attachTopicEventListeners();
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        toastMessage.textContent = message;
        toast.className = `toast-notification ${type}`;
        toast.classList.add('show');

        setTimeout(() => {
            this.hideToast();
        }, 3000);
    }

    hideToast() {
        document.getElementById('toast').classList.remove('show');
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    // NEW: PDF Export Functionality
    async exportToPDF() {
        try {
            this.showToast('Preparing PDF export...', 'info');
            
            // Use jsPDF from window object
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Add title
            doc.setFontSize(20);
            doc.setTextColor(33, 37, 41);
            doc.text('Academic Progress Report', 105, 20, { align: 'center' });
            
            // Add date
            doc.setFontSize(10);
            doc.setTextColor(108, 117, 125);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });
            
            let yPosition = 50;
            
            // Add summary statistics
            doc.setFontSize(16);
            doc.setTextColor(33, 37, 41);
            doc.text('Summary Statistics', 20, yPosition);
            yPosition += 10;
            
            doc.setFontSize(12);
            doc.setTextColor(73, 80, 87);
            doc.text(`Total Modules: ${this.stats.totalModules || 0}`, 30, yPosition);
            yPosition += 8;
            doc.text(`Topics Completed: ${this.stats.completedTopics || 0}`, 30, yPosition);
            yPosition += 8;
            doc.text(`Rewards Earned: ${this.stats.earnedRewards || 0}`, 30, yPosition);
            yPosition += 15;
            
            // Add module details
            doc.setFontSize(16);
            doc.setTextColor(33, 37, 41);
            doc.text('Module Progress', 20, yPosition);
            yPosition += 10;
            
            for (const module of this.modules) {
                // Check if we need a new page
                if (yPosition > 250) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                const completedTopics = module.topics.filter(topic => topic.completed).length;
                const totalTopics = module.topics.length;
                const completionPercentage = totalTopics > 0 ? 
                    Math.round((completedTopics / totalTopics) * 100) : 0;
                
                // Module header
                doc.setFontSize(14);
                doc.setTextColor(33, 37, 41);
                doc.text(module.name, 30, yPosition);
                yPosition += 8;
                
                // Progress information
                doc.setFontSize(10);
                doc.setTextColor(73, 80, 87);
                doc.text(`Progress: ${completedTopics}/${totalTopics} topics (${completionPercentage}%)`, 35, yPosition);
                yPosition += 6;
                
                // Topics list
                doc.text('Topics:', 35, yPosition);
                yPosition += 6;
                
                for (const topic of module.topics) {
                    if (yPosition > 270) {
                        doc.addPage();
                        yPosition = 20;
                    }
                    
                    const status = topic.completed ? '✓' : '○';
                    doc.text(`${status} ${topic.name}`, 40, yPosition);
                    yPosition += 5;
                }
                
                yPosition += 5; // Extra space between modules
            }
            
            // Add analytics section
            if (yPosition > 220) {
                doc.addPage();
                yPosition = 20;
            }
            
            doc.setFontSize(16);
            doc.setTextColor(33, 37, 41);
            doc.text('Analytics Overview', 20, yPosition);
            yPosition += 10;
            
            doc.setFontSize(12);
            doc.setTextColor(73, 80, 87);
            doc.text(`Overall Completion: ${this.stats.completionPercentage || 0}%`, 30, yPosition);
            yPosition += 8;
            
            // Save the PDF
            const fileName = `Academic_Progress_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);
            
            this.showToast('PDF exported successfully!');
            
        } catch (error) {
            console.error('Error exporting PDF:', error);
            this.showToast('Error exporting PDF', 'error');
        }
    }
}

// Initialize the progress manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.progressManager = new ProgressManager();
});