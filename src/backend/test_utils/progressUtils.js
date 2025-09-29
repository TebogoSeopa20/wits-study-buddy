// progressUtils.js - Utility functions for progress tracking management

// Progress constants
const MODULE_STATUS = {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    ARCHIVED: 'archived'
};

const TOPIC_STATUS = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    REVIEW_NEEDED: 'review_needed'
};

const MILESTONE_STATUS = {
    UPCOMING: 'upcoming',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    OVERDUE: 'overdue'
};

const REWARD_STATUS = {
    LOCKED: 'locked',
    UNLOCKED: 'unlocked',
    EARNED: 'earned'
};

// Default color palette for modules
const DEFAULT_COLORS = [
    '#4A90E2', '#50E3C2', '#9013FE', '#F5A623', '#D0021B',
    '#7ED321', '#BD10E0', '#417505', '#8B572A', '#4A4A4A'
];

// Validation functions
function validateModuleData(moduleData) {
    if (!moduleData || typeof moduleData !== 'object') {
        return { isValid: false, error: 'Module data must be an object' };
    }

    const { name, color, topics, milestone, reward } = moduleData;

    // Validate required fields
    if (!name || name.trim() === '') {
        return { isValid: false, error: 'Module name is required' };
    }

    // Validate name length
    if (name.length < 1 || name.length > 100) {
        return { isValid: false, error: 'Module name must be between 1 and 100 characters' };
    }

    // Validate color format
    if (color && !isValidColor(color)) {
        return { isValid: false, error: 'Invalid color format. Use hex color code (#RRGGBB)' };
    }

    // Validate topics if provided
    if (topics && Array.isArray(topics)) {
        for (let i = 0; i < topics.length; i++) {
            const topic = topics[i];
            if (!topic.name || topic.name.trim() === '') {
                return { isValid: false, error: `Topic ${i + 1} name is required` };
            }
            if (topic.name.length > 200) {
                return { isValid: false, error: `Topic ${i + 1} name must not exceed 200 characters` };
            }
            if (topic.color && !isValidColor(topic.color)) {
                return { isValid: false, error: `Topic ${i + 1} has invalid color format` };
            }
        }
    }

    // Validate milestone if provided
    if (milestone) {
        if (!milestone.description || milestone.description.trim() === '') {
            return { isValid: false, error: 'Milestone description is required' };
        }
        if (milestone.start && milestone.end) {
            const startDate = new Date(milestone.start);
            const endDate = new Date(milestone.end);
            if (startDate >= endDate) {
                return { isValid: false, error: 'Milestone start date must be before end date' };
            }
        }
    }

    // Validate reward if provided
    if (reward && (!reward.description || reward.description.trim() === '')) {
        return { isValid: false, error: 'Reward description is required' };
    }

    return { isValid: true, error: null };
}

function validateModuleUpdateData(updateData) {
    if (!updateData || typeof updateData !== 'object') {
        return { isValid: false, error: 'Update data must be an object' };
    }

    const allowedFields = ['name', 'color', 'topics', 'milestone', 'reward', 'status'];
    const providedFields = Object.keys(updateData);
    
    const invalidFields = providedFields.filter(field => !allowedFields.includes(field));
    if (invalidFields.length > 0) {
        return { isValid: false, error: `Invalid fields: ${invalidFields.join(', ')}` };
    }

    // Validate name if provided
    if (updateData.name && (updateData.name.length < 1 || updateData.name.length > 100)) {
        return { isValid: false, error: 'Module name must be between 1 and 100 characters' };
    }

    // Validate color if provided
    if (updateData.color && !isValidColor(updateData.color)) {
        return { isValid: false, error: 'Invalid color format. Use hex color code (#RRGGBB)' };
    }

    // Validate status if provided
    if (updateData.status && !validateModuleStatus(updateData.status)) {
        return { isValid: false, error: `Invalid status. Must be one of: ${Object.values(MODULE_STATUS).join(', ')}` };
    }

    return { isValid: true, error: null };
}

function validateTopicCompletionData(completionData) {
    if (!completionData || typeof completionData !== 'object') {
        return { isValid: false, error: 'Completion data must be an object' };
    }

    const { completed } = completionData;

    if (typeof completed !== 'boolean') {
        return { isValid: false, error: 'Completed status must be a boolean' };
    }

    return { isValid: true, error: null };
}

function validateModuleStatus(status) {
    return Object.values(MODULE_STATUS).includes(status);
}

function validateTopicStatus(status) {
    return Object.values(TOPIC_STATUS).includes(status);
}

function isValidColor(color) {
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return colorRegex.test(color);
}

function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

// Color generation utilities
function generateModuleColor(index) {
    return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

function generateTopicColor(moduleColor, index) {
    const baseColor = moduleColor.replace('#', '');
    const r = parseInt(baseColor.substr(0, 2), 16);
    const g = parseInt(baseColor.substr(2, 2), 16);
    const b = parseInt(baseColor.substr(4, 2), 16);
    
    // Generate variations based on index
    const factor = (index % 5) * 20;
    const newR = Math.max(0, Math.min(255, r + factor));
    const newG = Math.max(0, Math.min(255, g + factor));
    const newB = Math.max(0, Math.min(255, b + factor));
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

function getColorPalette() {
    return [...DEFAULT_COLORS];
}

// Data formatting utilities
function formatModuleData(module) {
    if (!module) return null;

    const {
        id,
        name,
        color,
        status,
        created_at,
        updated_at,
        progress_topics,
        progress_milestones,
        progress_rewards
    } = module;

    const formattedModule = {
        id,
        name,
        color: color || generateModuleColor(0),
        status: status || MODULE_STATUS.ACTIVE,
        createdAt: created_at,
        updatedAt: updated_at,
        topics: [],
        milestone: null,
        reward: null
    };

    // Format topics
    if (progress_topics && Array.isArray(progress_topics)) {
        formattedModule.topics = progress_topics.map(topic => ({
            id: topic.id,
            name: topic.name,
            color: topic.color,
            completed: topic.completed || false,
            completed_at: topic.completed_at,
            status: topic.status || TOPIC_STATUS.PENDING,
            created_at: topic.created_at,
            updated_at: topic.updated_at
        }));
    }

    // Format milestone
    if (progress_milestones && progress_milestones.length > 0) {
        const milestone = progress_milestones[0];
        formattedModule.milestone = {
            id: milestone.id,
            description: milestone.description,
            start_date: milestone.start_date,
            end_date: milestone.end_date,
            status: calculateMilestoneStatus(milestone, formattedModule.topics)
        };
    }

    // Format reward
    if (progress_rewards && progress_rewards.length > 0) {
        const reward = progress_rewards[0];
        formattedModule.reward = {
            id: reward.id,
            description: reward.description,
            earned: reward.earned || false,
            earned_at: reward.earned_at,
            status: calculateRewardStatus(reward, formattedModule.topics)
        };
    }

    return formattedModule;
}

function formatTopicData(topic) {
    if (!topic) return null;

    const {
        id,
        name,
        color,
        completed,
        completed_at,
        status,
        created_at,
        updated_at,
        module_id
    } = topic;

    return {
        id,
        name,
        color,
        completed: completed || false,
        completed_at: completed_at,
        status: status || TOPIC_STATUS.PENDING,
        created_at: created_at,
        updated_at: updated_at,
        module_id: module_id
    };
}

// Calculation utilities
function calculateModuleCompletion(modules) {
    if (!Array.isArray(modules)) {
        throw new Error('Modules must be an array');
    }

    return modules.map(module => {
        const total = module.progress_topics ? module.progress_topics.length : 0;
        const completed = module.progress_topics ? 
            module.progress_topics.filter(topic => topic.completed).length : 0;
        
        return {
            moduleId: module.id,
            moduleName: module.name,
            totalTopics: total,
            completedTopics: completed,
            completion: total > 0 ? Math.round((completed / total) * 100) : 0,
            color: module.color
        };
    });
}

function calculateTimeManagement(modules) {
    if (!Array.isArray(modules)) {
        throw new Error('Modules must be an array');
    }

    const now = new Date();
    let onTrack = 0;
    let behind = 0;
    let completed = 0;

    modules.forEach(module => {
        // Check if module is completed
        const total = module.progress_topics ? module.progress_topics.length : 0;
        const completedCount = module.progress_topics ? 
            module.progress_topics.filter(topic => topic.completed).length : 0;
        
        if (total > 0 && completedCount === total) {
            completed++;
            return;
        }

        if (!module.progress_milestones || module.progress_milestones.length === 0) {
            onTrack++; // Modules without milestones are considered on track
            return;
        }

        const milestone = module.progress_milestones[0];
        if (!milestone.end_date) {
            onTrack++;
            return;
        }

        const progress = total > 0 ? completedCount / total : 0;
        const endDate = new Date(milestone.end_date);
        const startDate = new Date(milestone.start_date || module.created_at);
        const totalTime = endDate - startDate;
        const timePassed = now - startDate;

        const expectedProgress = totalTime > 0 ? timePassed / totalTime : 0;

        if (progress >= expectedProgress || progress === 1) {
            onTrack++;
        } else {
            behind++;
        }
    });

    return {
        onTrack,
        behind,
        completed,
        total: modules.length
    };
}

function calculateMilestoneStatus(milestone, topics) {
    if (!milestone) return MILESTONE_STATUS.UPCOMING;

    const now = new Date();
    const startDate = new Date(milestone.start_date);
    const endDate = new Date(milestone.end_date);

    // Check if all topics are completed
    const allCompleted = topics && topics.every(topic => topic.completed);
    if (allCompleted) {
        return MILESTONE_STATUS.COMPLETED;
    }

    // Check if overdue
    if (now > endDate) {
        return MILESTONE_STATUS.OVERDUE;
    }

    // Check if in progress
    if (now >= startDate && now <= endDate) {
        return MILESTONE_STATUS.IN_PROGRESS;
    }

    return MILESTONE_STATUS.UPCOMING;
}

function calculateRewardStatus(reward, topics) {
    if (!reward) return REWARD_STATUS.LOCKED;

    if (reward.earned) {
        return REWARD_STATUS.EARNED;
    }

    // Check if all topics are completed (reward can be unlocked)
    const allCompleted = topics && topics.every(topic => topic.completed);
    if (allCompleted) {
        return REWARD_STATUS.UNLOCKED;
    }

    return REWARD_STATUS.LOCKED;
}

function calculateOverallProgress(modules) {
    if (!Array.isArray(modules)) {
        return {
            totalModules: 0,
            totalTopics: 0,
            completedTopics: 0,
            completionPercentage: 0,
            earnedRewards: 0
        };
    }

    let totalModules = modules.length;
    let totalTopics = 0;
    let completedTopics = 0;
    let earnedRewards = 0;

    modules.forEach(module => {
        if (module.progress_topics) {
            totalTopics += module.progress_topics.length;
            completedTopics += module.progress_topics.filter(topic => topic.completed).length;
        }
        if (module.progress_rewards) {
            earnedRewards += module.progress_rewards.filter(reward => reward.earned).length;
        }
    });

    const completionPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    return {
        totalModules,
        totalTopics,
        completedTopics,
        earnedRewards,
        completionPercentage
    };
}

// Search and filtering utilities
function searchModulesAndTopics(modules, query) {
    if (!Array.isArray(modules)) {
        throw new Error('Modules must be an array');
    }

    if (typeof query !== 'string' || query.trim() === '') {
        return {
            modules: modules.map(formatModuleData),
            topics: []
        };
    }

    const searchTerm = query.toLowerCase().trim();
    
    const matchingModules = modules.filter(module => 
        module.name && module.name.toLowerCase().includes(searchTerm)
    );

    const matchingTopics = [];
    modules.forEach(module => {
        if (module.progress_topics) {
            module.progress_topics.forEach(topic => {
                if (topic.name && topic.name.toLowerCase().includes(searchTerm)) {
                    matchingTopics.push({
                        ...topic,
                        module: {
                            id: module.id,
                            name: module.name
                        }
                    });
                }
            });
        }
    });

    return {
        modules: matchingModules.map(formatModuleData),
        topics: matchingTopics
    };
}

function filterModulesByStatus(modules, status) {
    if (!Array.isArray(modules)) {
        throw new Error('Modules must be an array');
    }

    if (!validateModuleStatus(status)) {
        throw new Error(`Invalid status. Must be one of: ${Object.values(MODULE_STATUS).join(', ')}`);
    }

    return modules.filter(module => module.status === status).map(formatModuleData);
}

function filterTopicsByCompletion(modules, completed) {
    if (!Array.isArray(modules)) {
        throw new Error('Modules must be an array');
    }

    const allTopics = [];
    modules.forEach(module => {
        if (module.progress_topics) {
            module.progress_topics.forEach(topic => {
                if (topic.completed === completed) {
                    allTopics.push({
                        ...formatTopicData(topic),
                        moduleName: module.name,
                        moduleColor: module.color
                    });
                }
            });
        }
    });

    return allTopics;
}

// Sorting utilities
function sortModules(modules, field = 'created_at', direction = 'desc') {
    if (!Array.isArray(modules)) {
        throw new Error('Modules must be an array');
    }

    const validFields = ['name', 'created_at', 'updated_at', 'completion'];
    if (!validFields.includes(field)) {
        throw new Error(`Invalid sort field. Must be one of: ${validFields.join(', ')}`);
    }

    const validDirections = ['asc', 'desc'];
    if (!validDirections.includes(direction)) {
        throw new Error('Sort direction must be "asc" or "desc"');
    }

    return [...modules].sort((a, b) => {
        let valueA, valueB;

        if (field === 'completion') {
            const totalA = a.progress_topics ? a.progress_topics.length : 0;
            const completedA = a.progress_topics ? a.progress_topics.filter(t => t.completed).length : 0;
            const totalB = b.progress_topics ? b.progress_topics.length : 0;
            const completedB = b.progress_topics ? b.progress_topics.filter(t => t.completed).length : 0;
            
            valueA = totalA > 0 ? completedA / totalA : 0;
            valueB = totalB > 0 ? completedB / totalB : 0;
        } else if (field === 'name') {
            valueA = String(a[field] || '').toLowerCase();
            valueB = String(b[field] || '').toLowerCase();
        } else {
            valueA = new Date(a[field]).getTime();
            valueB = new Date(b[field]).getTime();
        }

        if (valueA < valueB) {
            return direction === 'asc' ? -1 : 1;
        }
        if (valueA > valueB) {
            return direction === 'asc' ? 1 : -1;
        }
        return 0;
    });
}

// Analytics utilities
function generateProgressAnalytics(modules) {
    if (!Array.isArray(modules)) {
        throw new Error('Modules must be an array');
    }

    const overallProgress = calculateOverallProgress(modules);
    const timeManagement = calculateTimeManagement(modules);
    const moduleCompletion = calculateModuleCompletion(modules);

    // Calculate weekly progress
    const weeklyProgress = calculateWeeklyProgress(modules);

    // Calculate topic distribution
    const topicDistribution = calculateTopicDistribution(modules);

    return {
        overall: overallProgress,
        timeManagement,
        moduleCompletion,
        weeklyProgress,
        topicDistribution
    };
}

function calculateWeeklyProgress(modules) {
    const weeklyData = {};
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateKey = date.toISOString().split('T')[0];
        weeklyData[dateKey] = {
            date: dateKey,
            topicsCompleted: 0,
            modulesUpdated: 0
        };
    }

    // Count completions per day
    modules.forEach(module => {
        if (module.progress_topics) {
            module.progress_topics.forEach(topic => {
                if (topic.completed_at) {
                    const completedDate = new Date(topic.completed_at);
                    if (completedDate >= oneWeekAgo) {
                        const dateKey = completedDate.toISOString().split('T')[0];
                        if (weeklyData[dateKey]) {
                            weeklyData[dateKey].topicsCompleted++;
                        }
                    }
                }
            });
        }

        // Count module updates
        const updatedDate = new Date(module.updated_at);
        if (updatedDate >= oneWeekAgo) {
            const dateKey = updatedDate.toISOString().split('T')[0];
            if (weeklyData[dateKey]) {
                weeklyData[dateKey].modulesUpdated++;
            }
        }
    });

    return Object.values(weeklyData);
}

function calculateTopicDistribution(modules) {
    const distribution = {
        completed: 0,
        inProgress: 0,
        pending: 0,
        total: 0
    };

    modules.forEach(module => {
        if (module.progress_topics) {
            module.progress_topics.forEach(topic => {
                distribution.total++;
                if (topic.completed) {
                    distribution.completed++;
                } else if (topic.status === TOPIC_STATUS.IN_PROGRESS) {
                    distribution.inProgress++;
                } else {
                    distribution.pending++;
                }
            });
        }
    });

    return distribution;
}

// Mock data generation
function generateMockModule(overrides = {}) {
    const timestamp = new Date().toISOString();
    const moduleId = overrides.id || `module_${Math.random().toString(36).substr(2, 9)}`;
    
    const baseModule = {
        id: moduleId,
        user_id: overrides.user_id || '123e4567-e89b-12d3-a456-426614174000',
        name: overrides.name || `Study Module ${Math.floor(Math.random() * 1000)}`,
        color: overrides.color || generateModuleColor(Math.floor(Math.random() * DEFAULT_COLORS.length)),
        status: overrides.status || MODULE_STATUS.ACTIVE,
        created_at: overrides.created_at || timestamp,
        updated_at: overrides.updated_at || timestamp
    };

    // Generate mock topics if not provided
    const topicCount = overrides.topicCount || Math.floor(Math.random() * 5) + 3;
    const topics = overrides.topics || Array.from({ length: topicCount }, (_, i) => 
        generateMockTopic(moduleId, i)
    );

    // Generate mock milestone if not provided
    const milestone = overrides.milestone || (Math.random() > 0.3 ? generateMockMilestone(moduleId) : null);

    // Generate mock reward if not provided
    const reward = overrides.reward || (Math.random() > 0.5 ? generateMockReward(moduleId) : null);

    return {
        ...baseModule,
        progress_topics: topics,
        progress_milestones: milestone ? [milestone] : [],
        progress_rewards: reward ? [reward] : []
    };
}

function generateMockTopic(moduleId, index) {
    const timestamp = new Date().toISOString();
    const completed = Math.random() > 0.7;
    
    return {
        id: `topic_${Math.random().toString(36).substr(2, 9)}`,
        module_id: moduleId,
        name: `Topic ${index + 1}: ${['Introduction', 'Advanced Concepts', 'Practice Problems', 'Review', 'Assessment'][index % 5]}`,
        color: generateTopicColor('#4A90E2', index),
        completed: completed,
        completed_at: completed ? timestamp : null,
        status: completed ? TOPIC_STATUS.COMPLETED : 
                Math.random() > 0.5 ? TOPIC_STATUS.IN_PROGRESS : TOPIC_STATUS.PENDING,
        created_at: timestamp,
        updated_at: timestamp
    };
}

function generateMockMilestone(moduleId) {
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000); // 2 weeks later
    
    return {
        id: `milestone_${Math.random().toString(36).substr(2, 9)}`,
        module_id: moduleId,
        description: 'Complete all topics and pass assessment',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        created_at: new Date().toISOString()
    };
}

function generateMockReward(moduleId) {
    const earned = Math.random() > 0.8;
    
    return {
        id: `reward_${Math.random().toString(36).substr(2, 9)}`,
        module_id: moduleId,
        description: 'Certificate of Completion',
        earned: earned,
        earned_at: earned ? new Date().toISOString() : null,
        created_at: new Date().toISOString()
    };
}

// Validation for Supabase responses
function validateSupabaseResponse(response) {
    if (!response || typeof response !== 'object') {
        return { isValid: false, error: 'Invalid response object' };
    }

    if (response.error) {
        return { isValid: false, error: response.error.message || 'Supabase error occurred' };
    }

    if (response.data === undefined) {
        return { isValid: false, error: 'No data in response' };
    }

    return { isValid: true, error: null, data: response.data };
}

module.exports = {
    MODULE_STATUS,
    TOPIC_STATUS,
    MILESTONE_STATUS,
    REWARD_STATUS,
    DEFAULT_COLORS,
    validateModuleData,
    validateModuleUpdateData,
    validateTopicCompletionData,
    validateModuleStatus,
    validateTopicStatus,
    isValidColor,
    isValidUUID,
    generateModuleColor,
    generateTopicColor,
    getColorPalette,
    formatModuleData,
    formatTopicData,
    calculateModuleCompletion,
    calculateTimeManagement,
    calculateMilestoneStatus,
    calculateRewardStatus,
    calculateOverallProgress,
    searchModulesAndTopics,
    filterModulesByStatus,
    filterTopicsByCompletion,
    sortModules,
    generateProgressAnalytics,
    calculateWeeklyProgress,
    calculateTopicDistribution,
    generateMockModule,
    generateMockTopic,
    generateMockMilestone,
    generateMockReward,
    validateSupabaseResponse
};