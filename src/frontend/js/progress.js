// progress.js - Progress Tracking Functionality

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initProgressApp();
});

function initProgressApp() {
    // Load modules from localStorage or initialize empty array
    let modules = JSON.parse(localStorage.getItem('progressModules')) || [];
    
    // Initialize charts
    let progressChart = null;
    let timeChart = null;
    
    // DOM Elements
    const addModuleBtn = document.getElementById('addModuleBtn');
    const addModuleModal = document.getElementById('addModuleModal');
    const moduleForm = document.getElementById('moduleForm');
    const cancelModuleBtn = document.getElementById('cancelModule');
    const modalCloseBtns = document.querySelectorAll('.modal-close');
    const progressSearch = document.getElementById('progressSearch');
    const modulesGrid = document.getElementById('modulesGrid');
    const managementAdviceBtn = document.getElementById('managementAdviceBtn');
    const adviceModal = document.getElementById('adviceModal');
    const closeAdviceBtn = document.getElementById('closeAdvice');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastClose = document.querySelector('.toast-close');
    
    // Checkbox toggles
    const addMilestoneCheckbox = document.getElementById('addMilestone');
    const addRewardCheckbox = document.getElementById('addReward');
    const milestoneSection = document.getElementById('milestoneSection');
    const rewardSection = document.getElementById('rewardSection');
    
    // Stats elements
    const moduleCountEl = document.getElementById('moduleCount');
    const completedCountEl = document.getElementById('completedCount');
    const rewardCountEl = document.getElementById('rewardCount');
    const progressPercentageEl = document.getElementById('progressPercentage');
    const timeRemainingEl = document.getElementById('timeRemaining');
    
    // Event Listeners
    addModuleBtn.addEventListener('click', openAddModuleModal);
    moduleForm.addEventListener('submit', handleModuleSubmit);
    cancelModuleBtn.addEventListener('click', closeAllModals);
    modalCloseBtns.forEach(btn => btn.addEventListener('click', closeAllModals));
    addMilestoneCheckbox.addEventListener('change', toggleMilestoneSection);
    addRewardCheckbox.addEventListener('change', toggleRewardSection);
    progressSearch.addEventListener('input', handleSearch);
    managementAdviceBtn.addEventListener('click', showManagementAdvice);
    closeAdviceBtn.addEventListener('click', () => adviceModal.classList.remove('active'));
    toastClose.addEventListener('click', () => toast.style.display = 'none');
    
    // Initialize the page
    updateStats();
    renderModules(modules);
    initCharts();
    
    // Function to open Add Module modal
    function openAddModuleModal() {
        addModuleModal.classList.add('active');
    }
    
    // Function to close all modals
    function closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        moduleForm.reset();
        milestoneSection.style.display = 'none';
        rewardSection.style.display = 'none';
    }
    
    // Toggle milestone section
    function toggleMilestoneSection() {
        milestoneSection.style.display = addMilestoneCheckbox.checked ? 'block' : 'none';
    }
    
    // Toggle reward section
    function toggleRewardSection() {
        rewardSection.style.display = addRewardCheckbox.checked ? 'block' : 'none';
    }
    
    // Handle module form submission
    function handleModuleSubmit(e) {
        e.preventDefault();
        
        const moduleName = document.getElementById('moduleName').value;
        const moduleTopics = document.getElementById('moduleTopics').value.split('\n').filter(topic => topic.trim() !== '');
        
        if (!moduleName || moduleTopics.length === 0) {
            showToast('Please fill in all required fields', 'error');
            return;
        }
        
        const newModule = {
            id: Date.now(),
            name: moduleName,
            topics: moduleTopics.map(topic => ({
                name: topic.trim(),
                completed: false
            })),
            createdAt: new Date().toISOString()
        };
        
        // Add milestone if selected
        if (addMilestoneCheckbox.checked) {
            const milestoneDescription = document.getElementById('milestoneDescription').value;
            const milestoneStart = document.getElementById('milestoneStart').value;
            const milestoneEnd = document.getElementById('milestoneEnd').value;
            
            if (milestoneDescription && milestoneStart && milestoneEnd) {
                newModule.milestone = {
                    description: milestoneDescription,
                    startDate: milestoneStart,
                    endDate: milestoneEnd,
                    completed: false
                };
                
                showToast('Milestone added successfully!', 'success');
            }
        }
        
        // Add reward if selected
        if (addRewardCheckbox.checked) {
            const rewardDescription = document.getElementById('rewardDescription').value;
            
            if (rewardDescription) {
                newModule.reward = {
                    description: rewardDescription,
                    earned: false
                };
                
                showToast('Reward set successfully!', 'success');
            }
        }
        
        // Add to modules array and save
        modules.push(newModule);
        saveModules();
        
        // Update UI
        renderModules(modules);
        updateStats();
        closeAllModals();
        
        showToast('Module added successfully!', 'success');
    }
    
    // Save modules to localStorage
    function saveModules() {
        localStorage.setItem('progressModules', JSON.stringify(modules));
    }
    
    // Render modules to the grid
    function renderModules(modulesToRender) {
        modulesGrid.innerHTML = '';
        
        if (modulesToRender.length === 0) {
            modulesGrid.innerHTML = `
                <article class="empty-state">
                    <i class="fas fa-book-open"></i>
                    <h3>No modules yet</h3>
                    <p>Add your first module to start tracking your progress</p>
                    <button class="action-btn primary" id="addFirstModule">Add Module</button>
                </article>
            `;
            
            document.getElementById('addFirstModule').addEventListener('click', openAddModuleModal);
            return;
        }
        
        modulesToRender.forEach(module => {
            const completedTopics = module.topics.filter(topic => topic.completed).length;
            const totalTopics = module.topics.length;
            const completionPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
            
            const moduleCard = document.createElement('article');
            moduleCard.className = 'module-card';
            moduleCard.innerHTML = `
                <header class="module-header">
                    <h3 class="module-title">${module.name}</h3>
                    <div class="module-meta">
                        <span><i class="fas fa-check-circle"></i> ${completedTopics}/${totalTopics} topics</span>
                        <span><i class="fas fa-percent"></i> ${completionPercentage}% complete</span>
                    </div>
                </header>
                <section class="module-details">
                    <div class="topics-list">
                        ${module.topics.map((topic, index) => `
                            <div class="topic-item">
                                <input type="checkbox" id="topic-${module.id}-${index}" class="topic-checkbox" ${topic.completed ? 'checked' : ''}>
                                <label for="topic-${module.id}-${index}" class="topic-label">${topic.name}</label>
                            </div>
                        `).join('')}
                    </div>
                    
                    ${module.reward ? `
                        <div class="reward-section">
                            <h4 class="reward-title"><i class="fas fa-gift"></i> Your Reward</h4>
                            <p class="reward-description">${module.reward.description}</p>
                            <div class="reward-progress">
                                <i class="fas fa-trophy"></i>
                                <span class="progress-text">${totalTopics - completedTopics} steps to go!</span>
                            </div>
                            <p class="motivational-quote">"${getRandomMotivationalQuote()}"</p>
                        </div>
                    ` : ''}
                </section>
            `;
            
            // Add event listeners to checkboxes
            moduleCard.querySelectorAll('.topic-checkbox').forEach((checkbox, index) => {
                checkbox.addEventListener('change', () => {
                    module.topics[index].completed = checkbox.checked;
                    saveModules();
                    updateStats();
                    
                    // Check if all topics are completed to mark reward as earned
                    if (module.reward && module.topics.every(topic => topic.completed)) {
                        module.reward.earned = true;
                        showToast(`Congratulations! You've earned your reward: ${module.reward.description}`, 'success');
                    }
                });
            });
            
            modulesGrid.appendChild(moduleCard);
        });
    }
    
    // Handle search functionality
    function handleSearch() {
        const searchTerm = progressSearch.value.toLowerCase().trim();
        
        if (searchTerm === '') {
            renderModules(modules);
            return;
        }
        
        const filteredModules = modules.filter(module => {
            // Search in module name
            if (module.name.toLowerCase().includes(searchTerm)) return true;
            
            // Search in topics
            if (module.topics.some(topic => topic.name.toLowerCase().includes(searchTerm))) return true;
            
            // Search in milestone description
            if (module.milestone && module.milestone.description.toLowerCase().includes(searchTerm)) return true;
            
            return false;
        });
        
        renderModules(filteredModules);
    }
    
    // Update statistics
    function updateStats() {
        const totalModules = modules.length;
        const totalTopics = modules.reduce((sum, module) => sum + module.topics.length, 0);
        const completedTopics = modules.reduce((sum, module) => 
            sum + module.topics.filter(topic => topic.completed).length, 0);
        const earnedRewards = modules.filter(module => 
            module.reward && module.reward.earned).length;
        
        // Update DOM elements
        moduleCountEl.textContent = totalModules;
        completedCountEl.textContent = completedTopics;
        rewardCountEl.textContent = earnedRewards;
        
        // Update progress percentage
        const overallPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
        progressPercentageEl.textContent = `${overallPercentage}% Complete`;
        
        // Update charts
        updateCharts(overallPercentage, completedTopics, totalTopics);
        
        // Check if any milestones exist to show management advice button
        const hasMilestones = modules.some(module => module.milestone);
        managementAdviceBtn.style.display = hasMilestones ? 'block' : 'none';
    }
    
    // Initialize charts
    function initCharts() {
        const progressCtx = document.getElementById('progressChart').getContext('2d');
        const timeCtx = document.getElementById('timeChart').getContext('2d');
        
        progressChart = new Chart(progressCtx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Remaining'],
                datasets: [{
                    data: [0, 100],
                    backgroundColor: [
                        '#10b981',
                        '#e2e8f0'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                cutout: '70%',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false
                    }
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
        });
        
        timeChart = new Chart(timeCtx, {
            type: 'bar',
            data: {
                labels: ['This Week'],
                datasets: [{
                    label: 'Topics Completed',
                    data: [0],
                    backgroundColor: '#3b82f6',
                    borderRadius: 6
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            display: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
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
    
    // Update charts with new data
    function updateCharts(percentage, completed, total) {
        if (progressChart) {
            progressChart.data.datasets[0].data = [percentage, 100 - percentage];
            progressChart.update();
        }
        
        if (timeChart) {
            // For demo purposes, we'll use random data
            const weeklyCompleted = Math.min(completed, Math.floor(Math.random() * 15) + 5);
            timeChart.data.datasets[0].data = [weeklyCompleted];
            timeChart.update();
            
            // Update time remaining text
            const remaining = total - completed;
            timeRemainingEl.textContent = `${remaining} topics remaining`;
        }
    }
    
    // Show management advice
    function showManagementAdvice() {
        const adviceList = document.getElementById('adviceList');
        adviceList.innerHTML = '';
        
        const adviceItems = [
            "Break down large topics into smaller, manageable chunks",
            "Use the Pomodoro technique: 25 minutes focused work, 5 minutes break",
            "Schedule specific times for studying each module",
            "Eliminate distractions during your study sessions",
            "Review previous topics regularly to reinforce learning",
            "Set specific goals for each study session",
            "Take regular breaks to maintain focus and avoid burnout"
        ];
        
        adviceItems.forEach(advice => {
            const li = document.createElement('li');
            li.textContent = advice;
            adviceList.appendChild(li);
        });
        
        adviceModal.classList.add('active');
    }
    
    // Show toast notification
    function showToast(message, type = 'success') {
        toastMessage.textContent = message;
        toast.className = `toast-notification ${type}`;
        toast.style.display = 'flex';
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            toast.style.display = 'none';
        }, 5000);
    }
    
    // Get random motivational quote
    function getRandomMotivationalQuote() {
        const quotes = [
            "The harder you work for something, the greater you'll feel when you achieve it.",
            "Education is the most powerful weapon which you can use to change the world.",
            "Your time is limited, don't waste it living someone else's life.",
            "The beautiful thing about learning is that no one can take it away from you.",
            "Success is the sum of small efforts, repeated day in and day out.",
            "The expert in anything was once a beginner.",
            "Don't let what you cannot do interfere with what you can do.",
            "Learning is not attained by chance, it must be sought for with ardor and diligence.",
            "The more that you read, the more things you will know. The more that you learn, the more places you'll go.",
            "Believe you can and you're halfway there."
        ];
        
        return quotes[Math.floor(Math.random() * quotes.length)];
    }
    
    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
    
    // Close modals with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}