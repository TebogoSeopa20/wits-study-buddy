// progressUtils.js - Utility functions for progress tracking

// Default module colors for when user doesn't specify
const defaultModuleColors = [
    '#4A90E2', '#50E3C2', '#B8E986', '#F5A623', 
    '#D0021B', '#9013FE', '#417505', '#8B572A',
    '#BD10E0', '#4A4A4A', '#7ED321', '#F8E71C'
];

// Motivational quotes for rewards and progress
const motivationalQuotes = [
    "Keep going! You're making great progress.",
    "Every topic completed is a step closer to your goal!",
    "Consistency is the key to mastery.",
    "You're building knowledge that will last a lifetime.",
    "Small steps every day lead to big achievements.",
    "Your hard work is paying off!",
    "Learning is a journey, enjoy every step.",
    "You're capable of amazing things!",
    "Progress, not perfection, is what matters.",
    "Your future self will thank you for this effort."
];

// Topic difficulty levels
const difficultyLevels = [
    { value: 'easy', label: 'Easy', color: '#7ED321' },
    { value: 'medium', label: 'Medium', color: '#F5A623' },
    { value: 'hard', label: 'Hard', color: '#D0021B' }
];

// Progress status options
const progressStatuses = [
    { value: 'not_started', label: 'Not Started', color: '#E5E7EB' },
    { value: 'in_progress', label: 'In Progress', color: '#3B82F6' },
    { value: 'completed', label: 'Completed', color: '#10B981' },
    { value: 'review_needed', label: 'Review Needed', color: '#F59E0B' }
];

// Get random color for module
function getRandomModuleColor() {
    return defaultModuleColors[Math.floor(Math.random() * defaultModuleColors.length)];
}

// Get motivational quote
function getMotivationalQuote() {
    return motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
}

// Parse topics from text input
function parseTopics(topicsText) {
    if (!topicsText || topicsText.trim().length === 0) return [];
    
    return topicsText.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map((name, index) => ({ 
            id: `topic-${Date.now()}-${index}`,
            name, 
            completed: false,
            color: getRandomModuleColor(),
            difficulty: 'medium',
            status: 'not_started',
            created_at: new Date().toISOString()
        }));
}

// Calculate module completion percentage
function calculateModuleCompletion(module) {
    if (!module.topics || module.topics.length === 0) return 0;
    
    const completedTopics = module.topics.filter(topic => topic.completed).length;
    const totalTopics = module.topics.length;
    
    return Math.round((completedTopics / totalTopics) * 100);
}

// Calculate overall progress statistics
function calculateProgressStats(modules) {
    const totalModules = modules.length;
    const totalTopics = modules.reduce((sum, module) => sum + (module.topics?.length || 0), 0);
    const completedTopics = modules.reduce((sum, module) => 
        sum + (module.topics?.filter(topic => topic.completed).length || 0), 0);
    
    const completionPercentage = totalTopics > 0 ? 
        Math.round((completedTopics / totalTopics) * 100) : 0;
    
    const earnedRewards = modules.filter(module => 
        module.reward && module.reward.earned
    ).length;

    const modulesWithMilestones = modules.filter(module => 
        module.milestone
    ).length;

    const onTrackMilestones = modules.filter(module => 
        module.milestone && isMilestoneOnTrack(module.milestone, module)
    ).length;

    return {
        totalModules,
        totalTopics,
        completedTopics,
        completionPercentage,
        earnedRewards,
        modulesWithMilestones,
        onTrackMilestones,
        timeManagementPercentage: modulesWithMilestones > 0 ? 
            Math.round((onTrackMilestones / modulesWithMilestones) * 100) : 100
    };
}

// Check if milestone is on track
function isMilestoneOnTrack(milestone, module) {
    if (!milestone.end_date) return true;
    
    const endDate = new Date(milestone.end_date);
    const today = new Date();
    const completionPercentage = calculateModuleCompletion(module);
    
    // If past due date and not 100% complete, not on track
    if (endDate < today && completionPercentage < 100) {
        return false;
    }
    
    // Calculate expected progress based on time elapsed
    if (milestone.start_date) {
        const startDate = new Date(milestone.start_date);
        const totalDuration = endDate - startDate;
        const elapsedDuration = today - startDate;
        
        if (totalDuration > 0 && elapsedDuration > 0) {
            const expectedProgress = (elapsedDuration / totalDuration) * 100;
            return completionPercentage >= expectedProgress;
        }
    }
    
    return true;
}

// Check if reward should be earned
function checkRewardEligibility(module) {
    if (!module.reward) return module;
    
    const completionPercentage = calculateModuleCompletion(module);
    const shouldEarnReward = completionPercentage === 100 && !module.reward.earned;
    
    if (shouldEarnReward) {
        return {
            ...module,
            reward: {
                ...module.reward,
                earned: true,
                earned_date: new Date().toISOString()
            }
        };
    }
    
    return module;
}

// Format date for display
function formatDate(dateString, options = {}) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const defaultOptions = { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    };
    
    return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
}

// Calculate days remaining for milestone
function calculateDaysRemaining(endDate) {
    if (!endDate) return null;
    
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}

// Get milestone status
function getMilestoneStatus(milestone, module) {
    if (!milestone) return 'no_milestone';
    
    const daysRemaining = calculateDaysRemaining(milestone.end_date);
    const completionPercentage = calculateModuleCompletion(module);
    
    if (completionPercentage === 100) return 'completed';
    if (daysRemaining < 0) return 'overdue';
    if (daysRemaining <= 7) return 'urgent';
    if (daysRemaining <= 30) return 'approaching';
    
    return isMilestoneOnTrack(milestone, module) ? 'on_track' : 'behind';
}

// Filter modules by search query
function filterModulesBySearch(modules, query) {
    if (!query || query.trim().length < 2) return { modules: [], topics: [] };
    
    const searchTerm = query.toLowerCase().trim();
    
    const matchingModules = modules.filter(module => 
        module.name.toLowerCase().includes(searchTerm) ||
        (module.description && module.description.toLowerCase().includes(searchTerm))
    );
    
    const matchingTopics = modules.flatMap(module => 
        (module.topics || [])
            .filter(topic => topic.name.toLowerCase().includes(searchTerm))
            .map(topic => ({
                ...topic,
                moduleName: module.name,
                moduleColor: module.color
            }))
    );
    
    return {
        modules: matchingModules,
        topics: matchingTopics
    };
}

// Sort modules by various criteria
function sortModules(modules, sortBy = 'name', order = 'asc') {
    const sorted = [...modules];
    
    switch (sortBy) {
        case 'completion':
            sorted.sort((a, b) => {
                const aCompletion = calculateModuleCompletion(a);
                const bCompletion = calculateModuleCompletion(b);
                return order === 'asc' ? aCompletion - bCompletion : bCompletion - aCompletion;
            });
            break;
            
        case 'milestone':
            sorted.sort((a, b) => {
                const aDate = a.milestone?.end_date ? new Date(a.milestone.end_date) : new Date('9999-12-31');
                const bDate = b.milestone?.end_date ? new Date(b.milestone.end_date) : new Date('9999-12-31');
                return order === 'asc' ? aDate - bDate : bDate - aDate;
            });
            break;
            
        case 'topics':
            sorted.sort((a, b) => {
                const aTopics = a.topics?.length || 0;
                const bTopics = b.topics?.length || 0;
                return order === 'asc' ? aTopics - bTopics : bTopics - aTopics;
            });
            break;
            
        case 'name':
        default:
            sorted.sort((a, b) => {
                const aName = a.name.toLowerCase();
                const bName = b.name.toLowerCase();
                if (order === 'asc') {
                    return aName.localeCompare(bName);
                } else {
                    return bName.localeCompare(aName);
                }
            });
            break;
    }
    
    return sorted;
}

// Validate module form data
function validateModuleForm(formData) {
    const errors = [];
    
    if (!formData.name || formData.name.trim().length === 0) {
        errors.push('Module name is required');
    }
    
    if (formData.name && formData.name.trim().length > 100) {
        errors.push('Module name must be less than 100 characters');
    }
    
    if (!formData.color || !isValidColor(formData.color)) {
        errors.push('Valid module color is required');
    }
    
    const topics = parseTopics(formData.topics);
    if (topics.length === 0) {
        errors.push('At least one topic is required');
    }
    
    if (topics.length > 50) {
        errors.push('Maximum 50 topics allowed per module');
    }
    
    // Validate milestone dates if milestone is added
    if (formData.addMilestone) {
        if (!formData.milestoneDescription || formData.milestoneDescription.trim().length === 0) {
            errors.push('Milestone description is required');
        }
        
        if (!formData.milestoneEnd) {
            errors.push('Milestone end date is required');
        }
        
        if (formData.milestoneStart && formData.milestoneEnd) {
            const startDate = new Date(formData.milestoneStart);
            const endDate = new Date(formData.milestoneEnd);
            
            if (endDate <= startDate) {
                errors.push('End date must be after start date');
            }
            
            if (endDate < new Date()) {
                errors.push('End date cannot be in the past');
            }
        }
    }
    
    // Validate reward if reward is added
    if (formData.addReward && (!formData.rewardDescription || formData.rewardDescription.trim().length === 0)) {
        errors.push('Reward description is required');
    }
    
    return errors;
}

// Check if color is valid
function isValidColor(color) {
    const s = new Option().style;
    s.color = color;
    return s.color !== '';
}

// Format module data for API request
function formatModuleData(formData, isEdit = false) {
    const baseData = {
        name: formData.name.trim(),
        color: formData.color,
        topics: parseTopics(formData.topics),
        description: formData.description ? formData.description.trim() : '',
        created_at: isEdit ? undefined : new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    // Add milestone if specified
    if (formData.addMilestone) {
        baseData.milestone = {
            description: formData.milestoneDescription.trim(),
            start_date: formData.milestoneStart || new Date().toISOString().split('T')[0],
            end_date: formData.milestoneEnd,
            created_at: new Date().toISOString()
        };
    }
    
    // Add reward if specified
    if (formData.addReward) {
        baseData.reward = {
            description: formData.rewardDescription.trim(),
            earned: false,
            created_at: new Date().toISOString()
        };
    }
    
    return baseData;
}

// Generate analytics data for charts
function generateAnalyticsData(modules, stats) {
    const moduleCompletion = modules.map(module => ({
        moduleName: module.name,
        completion: calculateModuleCompletion(module),
        color: module.color,
        topicCount: module.topics?.length || 0
    }));
    
    const weeklyProgress = generateWeeklyProgressData(modules);
    const topicDifficulty = analyzeTopicDifficulty(modules);
    
    return {
        moduleCompletion,
        weeklyProgress,
        topicDifficulty,
        timeManagement: {
            onTrack: stats.onTrackMilestones,
            total: stats.modulesWithMilestones
        }
    };
}

// Generate weekly progress data (mock for now)
function generateWeeklyProgressData(modules) {
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Current'];
    const progress = [10, 25, 45, 70, calculateProgressStats(modules).completionPercentage];
    
    return weeks.map((week, index) => ({
        week,
        progress: progress[index]
    }));
}

// Analyze topic difficulty distribution
function analyzeTopicDifficulty(modules) {
    const difficultyCount = {
        easy: 0,
        medium: 0,
        hard: 0
    };
    
    modules.forEach(module => {
        module.topics?.forEach(topic => {
            difficultyCount[topic.difficulty] = (difficultyCount[topic.difficulty] || 0) + 1;
        });
    });
    
    return difficultyCount;
}

// Debounce function for search input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export data for PDF generation
function preparePDFData(modules, stats) {
    return {
        title: 'Academic Progress Report',
        generatedDate: new Date().toLocaleDateString(),
        stats: {
            totalModules: stats.totalModules,
            completedTopics: stats.completedTopics,
            earnedRewards: stats.earnedRewards,
            completionPercentage: stats.completionPercentage
        },
        modules: modules.map(module => ({
            name: module.name,
            completion: calculateModuleCompletion(module),
            topics: {
                completed: module.topics?.filter(t => t.completed).length || 0,
                total: module.topics?.length || 0
            },
            milestone: module.milestone ? {
                description: module.milestone.description,
                end_date: formatDate(module.milestone.end_date),
                status: getMilestoneStatus(module.milestone, module)
            } : null,
            reward: module.reward ? {
                description: module.reward.description,
                earned: module.reward.earned
            } : null
        }))
    };
}

module.exports = {
    defaultModuleColors,
    motivationalQuotes,
    difficultyLevels,
    progressStatuses,
    getRandomModuleColor,
    getMotivationalQuote,
    parseTopics,
    calculateModuleCompletion,
    calculateProgressStats,
    isMilestoneOnTrack,
    checkRewardEligibility,
    formatDate,
    calculateDaysRemaining,
    getMilestoneStatus,
    filterModulesBySearch,
    sortModules,
    validateModuleForm,
    formatModuleData,
    generateAnalyticsData,
    debounce,
    preparePDFData,
    isValidColor
};