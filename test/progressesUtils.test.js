// progressUtils.test.js - Comprehensive tests for progress utility functions
const {
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
} = require('../src/frontend/test_utils/progressUtils');

describe('Progress Utility Functions', () => {
    describe('Constants', () => {
        test('defaultModuleColors contains valid colors', () => {
            expect(Array.isArray(defaultModuleColors)).toBe(true);
            expect(defaultModuleColors.length).toBeGreaterThan(0);
            expect(defaultModuleColors.every(color => isValidColor(color))).toBe(true);
        });

        test('motivationalQuotes contains inspirational messages', () => {
            expect(Array.isArray(motivationalQuotes)).toBe(true);
            expect(motivationalQuotes.length).toBeGreaterThan(0);
            expect(motivationalQuotes.every(quote => typeof quote === 'string')).toBe(true);
        });

        test('difficultyLevels has correct structure', () => {
            expect(Array.isArray(difficultyLevels)).toBe(true);
            expect(difficultyLevels).toHaveLength(3);
            difficultyLevels.forEach(level => {
                expect(level).toHaveProperty('value');
                expect(level).toHaveProperty('label');
                expect(level).toHaveProperty('color');
            });
        });

        test('progressStatuses has correct structure', () => {
            expect(Array.isArray(progressStatuses)).toBe(true);
            expect(progressStatuses).toHaveLength(4);
            progressStatuses.forEach(status => {
                expect(status).toHaveProperty('value');
                expect(status).toHaveProperty('label');
                expect(status).toHaveProperty('color');
            });
        });
    });

    describe('getRandomModuleColor', () => {
        test('returns a valid color from defaultModuleColors', () => {
            const color = getRandomModuleColor();
            expect(defaultModuleColors).toContain(color);
            expect(isValidColor(color)).toBe(true);
        });

        test('returns different colors on multiple calls', () => {
            const colors = new Set();
            for (let i = 0; i < 100; i++) {
                colors.add(getRandomModuleColor());
            }
            // Should have multiple different colors
            expect(colors.size).toBeGreaterThan(1);
        });
    });

    describe('getMotivationalQuote', () => {
        test('returns a valid quote from motivationalQuotes', () => {
            const quote = getMotivationalQuote();
            expect(motivationalQuotes).toContain(quote);
            expect(typeof quote).toBe('string');
            expect(quote.length).toBeGreaterThan(0);
        });
    });

    describe('parseTopics', () => {
        test('parses topics from text input', () => {
            const topicsText = 'Topic 1\nTopic 2\nTopic 3';
            const topics = parseTopics(topicsText);
            
            expect(topics).toHaveLength(3);
            expect(topics[0].name).toBe('Topic 1');
            expect(topics[1].name).toBe('Topic 2');
            expect(topics[2].name).toBe('Topic 3');
        });

        test('handles empty input', () => {
            expect(parseTopics('')).toHaveLength(0);
            expect(parseTopics(null)).toHaveLength(0);
            expect(parseTopics(undefined)).toHaveLength(0);
        });

        test('trims whitespace from topics', () => {
            const topicsText = '  Topic 1  \nTopic 2  \n  Topic 3  ';
            const topics = parseTopics(topicsText);
            
            expect(topics[0].name).toBe('Topic 1');
            expect(topics[1].name).toBe('Topic 2');
            expect(topics[2].name).toBe('Topic 3');
        });

        test('filters out empty lines', () => {
            const topicsText = 'Topic 1\n\nTopic 2\n  \nTopic 3';
            const topics = parseTopics(topicsText);
            
            expect(topics).toHaveLength(3);
            expect(topics[0].name).toBe('Topic 1');
            expect(topics[1].name).toBe('Topic 2');
            expect(topics[2].name).toBe('Topic 3');
        });

        test('generates unique IDs for topics', () => {
            const topicsText = 'Topic 1\nTopic 2';
            const topics = parseTopics(topicsText);
            
            expect(topics[0].id).toBeDefined();
            expect(topics[1].id).toBeDefined();
            expect(topics[0].id).not.toBe(topics[1].id);
        });

        test('sets default properties for topics', () => {
            const topicsText = 'Test Topic';
            const topics = parseTopics(topicsText);
            
            expect(topics[0].completed).toBe(false);
            expect(topics[0].color).toBeDefined();
            expect(topics[0].difficulty).toBe('medium');
            expect(topics[0].status).toBe('not_started');
            expect(topics[0].created_at).toBeDefined();
        });
    });

    describe('calculateModuleCompletion', () => {
        test('calculates 0% for empty module', () => {
            const module = { topics: [] };
            expect(calculateModuleCompletion(module)).toBe(0);
        });

        test('calculates 0% for module with no topics', () => {
            const module = {};
            expect(calculateModuleCompletion(module)).toBe(0);
        });

        test('calculates 0% when no topics completed', () => {
            const module = {
                topics: [
                    { completed: false },
                    { completed: false },
                    { completed: false }
                ]
            };
            expect(calculateModuleCompletion(module)).toBe(0);
        });

        test('calculates 100% when all topics completed', () => {
            const module = {
                topics: [
                    { completed: true },
                    { completed: true },
                    { completed: true }
                ]
            };
            expect(calculateModuleCompletion(module)).toBe(100);
        });

        test('calculates 50% when half topics completed', () => {
            const module = {
                topics: [
                    { completed: true },
                    { completed: true },
                    { completed: false },
                    { completed: false }
                ]
            };
            expect(calculateModuleCompletion(module)).toBe(50);
        });

        test('calculates 33% for 1 out of 3 completed', () => {
            const module = {
                topics: [
                    { completed: true },
                    { completed: false },
                    { completed: false }
                ]
            };
            expect(calculateModuleCompletion(module)).toBe(33);
        });

        test('rounds percentage to nearest integer', () => {
            const module = {
                topics: [
                    { completed: true },
                    { completed: false }
                ]
            };
            expect(calculateModuleCompletion(module)).toBe(50);
        });
    });

    describe('calculateProgressStats', () => {
        const mockModules = [
            {
                name: 'Module 1',
                topics: [
                    { completed: true },
                    { completed: true },
                    { completed: false }
                ],
                reward: { earned: true },
                milestone: { end_date: '2024-12-31' }
            },
            {
                name: 'Module 2',
                topics: [
                    { completed: false },
                    { completed: false }
                ],
                reward: { earned: false },
                milestone: { end_date: '2024-10-31' }
            },
            {
                name: 'Module 3',
                topics: [
                    { completed: true },
                    { completed: true },
                    { completed: true },
                    { completed: true }
                ]
            }
        ];

        test('calculates correct statistics', () => {
            const stats = calculateProgressStats(mockModules);
            
            expect(stats.totalModules).toBe(3);
            expect(stats.totalTopics).toBe(9);
            expect(stats.completedTopics).toBe(6);
            expect(stats.completionPercentage).toBe(67);
            expect(stats.earnedRewards).toBe(1);
            expect(stats.modulesWithMilestones).toBe(2);
        });

        test('handles empty modules array', () => {
            const stats = calculateProgressStats([]);
            
            expect(stats.totalModules).toBe(0);
            expect(stats.totalTopics).toBe(0);
            expect(stats.completedTopics).toBe(0);
            expect(stats.completionPercentage).toBe(0);
            expect(stats.earnedRewards).toBe(0);
            expect(stats.modulesWithMilestones).toBe(0);
            expect(stats.timeManagementPercentage).toBe(100);
        });

        test('handles modules with no topics', () => {
            const modules = [{ name: 'Empty Module' }];
            const stats = calculateProgressStats(modules);
            
            expect(stats.totalModules).toBe(1);
            expect(stats.totalTopics).toBe(0);
            expect(stats.completedTopics).toBe(0);
            expect(stats.completionPercentage).toBe(0);
        });
    });

    describe('isMilestoneOnTrack', () => {
        test('returns true for milestone without end date', () => {
            const milestone = { description: 'Test' };
            const module = { topics: [] };
            expect(isMilestoneOnTrack(milestone, module)).toBe(true);
        });

        test('returns false for past due milestone with incomplete module', () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);
            
            const milestone = { end_date: pastDate.toISOString() };
            const module = { topics: [{ completed: false }] };
            
            expect(isMilestoneOnTrack(milestone, module)).toBe(false);
        });

        test('returns true for past due milestone with complete module', () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);
            
            const milestone = { end_date: pastDate.toISOString() };
            const module = { topics: [{ completed: true }] };
            
            expect(isMilestoneOnTrack(milestone, module)).toBe(true);
        });

        test('returns true for future milestone with good progress', () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 30);
            
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 15);
            
            const milestone = { 
                start_date: pastDate.toISOString(),
                end_date: futureDate.toISOString()
            };
            const module = { topics: [{ completed: true }, { completed: false }] };
            
            expect(isMilestoneOnTrack(milestone, module)).toBe(true);
        });
    });

    describe('checkRewardEligibility', () => {
        test('earns reward when module is 100% complete', () => {
            const module = {
                topics: [{ completed: true }, { completed: true }],
                reward: { description: 'Test Reward', earned: false }
            };
            
            const updatedModule = checkRewardEligibility(module);
            expect(updatedModule.reward.earned).toBe(true);
            expect(updatedModule.reward.earned_date).toBeDefined();
        });

        test('does not earn reward when module is not 100% complete', () => {
            const module = {
                topics: [{ completed: true }, { completed: false }],
                reward: { description: 'Test Reward', earned: false }
            };
            
            const updatedModule = checkRewardEligibility(module);
            expect(updatedModule.reward.earned).toBe(false);
            expect(updatedModule.reward.earned_date).toBeUndefined();
        });

        test('does not modify module without reward', () => {
            const module = {
                topics: [{ completed: true }, { completed: true }]
            };
            
            const updatedModule = checkRewardEligibility(module);
            expect(updatedModule).toEqual(module);
        });

        test('does not re-earn already earned reward', () => {
            const earnedDate = new Date().toISOString();
            const module = {
                topics: [{ completed: true }, { completed: true }],
                reward: { description: 'Test Reward', earned: true, earned_date: earnedDate }
            };
            
            const updatedModule = checkRewardEligibility(module);
            expect(updatedModule.reward.earned_date).toBe(earnedDate);
        });
    });

    describe('formatDate', () => {
        test('formats date correctly', () => {
            const dateString = '2024-01-15';
            const formatted = formatDate(dateString);
            expect(formatted).toMatch(/Jan 15, 2024/);
        });

        test('returns empty string for invalid date', () => {
            expect(formatDate('')).toBe('');
            expect(formatDate(null)).toBe('');
            expect(formatDate(undefined)).toBe('');
        });

    });

    describe('calculateDaysRemaining', () => {
        test('calculates correct days remaining', () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 5);
            
            const daysRemaining = calculateDaysRemaining(futureDate.toISOString());
            expect(daysRemaining).toBe(5);
        });

        test('returns negative for past dates', () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 3);
            
            const daysRemaining = calculateDaysRemaining(pastDate.toISOString());
            expect(daysRemaining).toBe(-3);
        });

        test('returns null for invalid date', () => {
            expect(calculateDaysRemaining('')).toBeNull();
            expect(calculateDaysRemaining(null)).toBeNull();
            expect(calculateDaysRemaining(undefined)).toBeNull();
        });
    });

    describe('getMilestoneStatus', () => {
        test('returns "no_milestone" when no milestone', () => {
            const module = { topics: [] };
            expect(getMilestoneStatus(null, module)).toBe('no_milestone');
        });

        test('returns "completed" when module is 100% complete', () => {
            const milestone = { end_date: '2024-12-31' };
            const module = { topics: [{ completed: true }] };
            expect(getMilestoneStatus(milestone, module)).toBe('completed');
        });

        test('returns "overdue" when past due and incomplete', () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);
            
            const milestone = { end_date: pastDate.toISOString() };
            const module = { topics: [{ completed: false }] };
            expect(getMilestoneStatus(milestone, module)).toBe('overdue');
        });

        test('returns "urgent" when less than 7 days remaining', () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 3);
            
            const milestone = { end_date: futureDate.toISOString() };
            const module = { topics: [{ completed: false }] };
            expect(getMilestoneStatus(milestone, module)).toBe('urgent');
        });
    });

    describe('filterModulesBySearch', () => {
        const mockModules = [
            {
                name: 'Mathematics',
                description: 'Advanced calculus topics',
                topics: [
                    { name: 'Differential Equations', completed: false },
                    { name: 'Linear Algebra', completed: true }
                ]
            },
            {
                name: 'Physics',
                description: 'Classical mechanics',
                topics: [
                    { name: 'Quantum Mechanics', completed: false },
                    { name: 'Thermodynamics', completed: false }
                ]
            }
        ];

        test('returns empty results for short query', () => {
            const result = filterModulesBySearch(mockModules, 'a');
            expect(result.modules).toHaveLength(0);
            expect(result.topics).toHaveLength(0);
        });

        test('finds modules by name', () => {
            const result = filterModulesBySearch(mockModules, 'math');
            expect(result.modules).toHaveLength(1);
            expect(result.modules[0].name).toBe('Mathematics');
        });

        test('finds modules by description', () => {
            const result = filterModulesBySearch(mockModules, 'calculus');
            expect(result.modules).toHaveLength(1);
            expect(result.modules[0].name).toBe('Mathematics');
        });

        test('finds topics by name', () => {
            const result = filterModulesBySearch(mockModules, 'quantum');
            expect(result.topics).toHaveLength(1);
            expect(result.topics[0].name).toBe('Quantum Mechanics');
            expect(result.topics[0].moduleName).toBe('Physics');
        });

        test('returns empty results for no match', () => {
            const result = filterModulesBySearch(mockModules, 'biology');
            expect(result.modules).toHaveLength(0);
            expect(result.topics).toHaveLength(0);
        });

        test('handles empty modules array', () => {
            const result = filterModulesBySearch([], 'math');
            expect(result.modules).toHaveLength(0);
            expect(result.topics).toHaveLength(0);
        });
    });

    describe('sortModules', () => {
        const mockModules = [
            { name: 'Physics', topics: [{ completed: true }, { completed: false }] },
            { name: 'Mathematics', topics: [{ completed: true }, { completed: true }, { completed: true }] },
            { name: 'Chemistry', topics: [{ completed: false }] }
        ];

        test('sorts by name ascending', () => {
            const sorted = sortModules(mockModules, 'name', 'asc');
            expect(sorted[0].name).toBe('Chemistry');
            expect(sorted[1].name).toBe('Mathematics');
            expect(sorted[2].name).toBe('Physics');
        });

        test('sorts by name descending', () => {
            const sorted = sortModules(mockModules, 'name', 'desc');
            expect(sorted[0].name).toBe('Physics');
            expect(sorted[1].name).toBe('Mathematics');
            expect(sorted[2].name).toBe('Chemistry');
        });

        test('sorts by completion ascending', () => {
            const sorted = sortModules(mockModules, 'completion', 'asc');
            expect(sorted[0].name).toBe('Chemistry'); // 0%
            expect(sorted[1].name).toBe('Physics');   // 50%
            expect(sorted[2].name).toBe('Mathematics'); // 100%
        });

        test('sorts by completion descending', () => {
            const sorted = sortModules(mockModules, 'completion', 'desc');
            expect(sorted[0].name).toBe('Mathematics'); // 100%
            expect(sorted[1].name).toBe('Physics');    // 50%
            expect(sorted[2].name).toBe('Chemistry');  // 0%
        });

        test('sorts by topics count', () => {
            const sorted = sortModules(mockModules, 'topics', 'asc');
            expect(sorted[0].name).toBe('Chemistry');  // 1 topic
            expect(sorted[1].name).toBe('Physics');    // 2 topics
            expect(sorted[2].name).toBe('Mathematics'); // 3 topics
        });
    });

    describe('validateModuleForm', () => {
        test('validates required fields', () => {
            const formData = {
                name: '',
                color: '',
                topics: ''
            };
            
            const errors = validateModuleForm(formData);
            expect(errors).toContain('Module name is required');
            expect(errors).toContain('Valid module color is required');
            expect(errors).toContain('At least one topic is required');
        });

        test('validates name length', () => {
            const longName = 'A'.repeat(101);
            const formData = {
                name: longName,
                color: '#000000',
                topics: 'Topic 1'
            };
            
            const errors = validateModuleForm(formData);
            expect(errors).toContain('Module name must be less than 100 characters');
        });

        test('validates topic count limit', () => {
            const manyTopics = Array.from({ length: 51 }, (_, i) => `Topic ${i + 1}`).join('\n');
            const formData = {
                name: 'Test Module',
                color: '#000000',
                topics: manyTopics
            };
            
            const errors = validateModuleForm(formData);
            expect(errors).toContain('Maximum 50 topics allowed per module');
        });

        test('validates milestone fields', () => {
            const formData = {
                name: 'Test Module',
                color: '#000000',
                topics: 'Topic 1',
                addMilestone: true,
                milestoneDescription: '',
                milestoneEnd: ''
            };
            
            const errors = validateModuleForm(formData);
            expect(errors).toContain('Milestone description is required');
            expect(errors).toContain('Milestone end date is required');
        });

        test('validates milestone dates', () => {
            const formData = {
                name: 'Test Module',
                color: '#000000',
                topics: 'Topic 1',
                addMilestone: true,
                milestoneDescription: 'Test milestone',
                milestoneStart: '2024-12-31',
                milestoneEnd: '2024-01-01'
            };
            
            const errors = validateModuleForm(formData);
            expect(errors).toContain('End date must be after start date');
        });

        test('validates reward description', () => {
            const formData = {
                name: 'Test Module',
                color: '#000000',
                topics: 'Topic 1',
                addReward: true,
                rewardDescription: ''
            };
            
            const errors = validateModuleForm(formData);
            expect(errors).toContain('Reward description is required');
        });

        test('returns empty array for valid form data', () => {
            const formData = {
                name: 'Test Module',
                color: '#000000',
                topics: 'Topic 1\nTopic 2\nTopic 3'
            };
            
            const errors = validateModuleForm(formData);
            expect(errors).toHaveLength(0);
        });
    });

    describe('formatModuleData', () => {
        test('formats basic module data correctly', () => {
            const formData = {
                name: '  Test Module  ',
                color: '#FF0000',
                topics: 'Topic 1\nTopic 2',
                description: '  Test Description  '
            };
            
            const moduleData = formatModuleData(formData);
            
            expect(moduleData.name).toBe('Test Module');
            expect(moduleData.color).toBe('#FF0000');
            expect(moduleData.description).toBe('Test Description');
            expect(moduleData.topics).toHaveLength(2);
            expect(moduleData.created_at).toBeDefined();
            expect(moduleData.updated_at).toBeDefined();
        });

        test('includes milestone when specified', () => {
            const formData = {
                name: 'Test Module',
                color: '#000000',
                topics: 'Topic 1',
                addMilestone: true,
                milestoneDescription: '  Test Milestone  ',
                milestoneStart: '2024-01-01',
                milestoneEnd: '2024-12-31'
            };
            
            const moduleData = formatModuleData(formData);
            
            expect(moduleData.milestone).toBeDefined();
            expect(moduleData.milestone.description).toBe('Test Milestone');
            expect(moduleData.milestone.start_date).toBe('2024-01-01');
            expect(moduleData.milestone.end_date).toBe('2024-12-31');
        });

        test('includes reward when specified', () => {
            const formData = {
                name: 'Test Module',
                color: '#000000',
                topics: 'Topic 1',
                addReward: true,
                rewardDescription: '  Test Reward  '
            };
            
            const moduleData = formatModuleData(formData);
            
            expect(moduleData.reward).toBeDefined();
            expect(moduleData.reward.description).toBe('Test Reward');
            expect(moduleData.reward.earned).toBe(false);
        });

        test('handles edit mode correctly', () => {
            const formData = {
                name: 'Test Module',
                color: '#000000',
                topics: 'Topic 1'
            };
            
            const moduleData = formatModuleData(formData, true);
            expect(moduleData.created_at).toBeUndefined();
        });
    });

    describe('generateAnalyticsData', () => {
        const mockModules = [
            {
                name: 'Math',
                color: '#FF0000',
                topics: [
                    { completed: true, difficulty: 'easy' },
                    { completed: false, difficulty: 'hard' }
                ]
            },
            {
                name: 'Science',
                color: '#00FF00',
                topics: [
                    { completed: true, difficulty: 'medium' },
                    { completed: true, difficulty: 'easy' }
                ]
            }
        ];

        test('generates correct analytics structure', () => {
            const stats = calculateProgressStats(mockModules);
            const analytics = generateAnalyticsData(mockModules, stats);
            
            expect(analytics.moduleCompletion).toHaveLength(2);
            expect(analytics.weeklyProgress).toBeDefined();
            expect(analytics.topicDifficulty).toBeDefined();
            expect(analytics.timeManagement).toBeDefined();
        });

        test('calculates module completion correctly', () => {
            const stats = calculateProgressStats(mockModules);
            const analytics = generateAnalyticsData(mockModules, stats);
            
            expect(analytics.moduleCompletion[0].moduleName).toBe('Math');
            expect(analytics.moduleCompletion[0].completion).toBe(50);
            expect(analytics.moduleCompletion[1].moduleName).toBe('Science');
            expect(analytics.moduleCompletion[1].completion).toBe(100);
        });

        test('analyzes topic difficulty distribution', () => {
            const stats = calculateProgressStats(mockModules);
            const analytics = generateAnalyticsData(mockModules, stats);
            
            expect(analytics.topicDifficulty.easy).toBe(2);
            expect(analytics.topicDifficulty.medium).toBe(1);
            expect(analytics.topicDifficulty.hard).toBe(1);
        });
    });

    describe('debounce', () => {
        jest.useFakeTimers();
        
        test('delays function execution', () => {
            const mockFn = jest.fn();
            const debouncedFn = debounce(mockFn, 100);
            
            debouncedFn('test');
            expect(mockFn).not.toHaveBeenCalled();
            
            jest.advanceTimersByTime(100);
            expect(mockFn).toHaveBeenCalledWith('test');
        });

        test('cancels previous calls', () => {
            const mockFn = jest.fn();
            const debouncedFn = debounce(mockFn, 100);
            
            debouncedFn('first');
            debouncedFn('second');
            debouncedFn('third');
            
            jest.advanceTimersByTime(100);
            expect(mockFn).toHaveBeenCalledTimes(1);
            expect(mockFn).toHaveBeenCalledWith('third');
        });
    });

    describe('preparePDFData', () => {
        const mockModules = [
            {
                name: 'Mathematics',
                color: '#FF0000',
                topics: [
                    { completed: true, name: 'Algebra' },
                    { completed: false, name: 'Calculus' }
                ],
                milestone: {
                    description: 'Complete by end of semester',
                    end_date: '2024-12-31'
                },
                reward: {
                    description: 'Certificate of Completion',
                    earned: false
                }
            }
        ];

        test('prepares correct PDF data structure', () => {
            const stats = calculateProgressStats(mockModules);
            const pdfData = preparePDFData(mockModules, stats);
            
            expect(pdfData.title).toBe('Academic Progress Report');
            expect(pdfData.generatedDate).toBeDefined();
            expect(pdfData.stats).toBeDefined();
            expect(pdfData.modules).toHaveLength(1);
        });

        test('includes correct statistics', () => {
            const stats = calculateProgressStats(mockModules);
            const pdfData = preparePDFData(mockModules, stats);
            
            expect(pdfData.stats.totalModules).toBe(1);
            expect(pdfData.stats.completedTopics).toBe(1);
            expect(pdfData.stats.earnedRewards).toBe(0);
            expect(pdfData.stats.completionPercentage).toBe(50);
        });

        test('formats module data correctly', () => {
            const stats = calculateProgressStats(mockModules);
            const pdfData = preparePDFData(mockModules, stats);
            const moduleData = pdfData.modules[0];
            
            expect(moduleData.name).toBe('Mathematics');
            expect(moduleData.completion).toBe(50);
            expect(moduleData.topics.completed).toBe(1);
            expect(moduleData.topics.total).toBe(2);
            expect(moduleData.milestone).toBeDefined();
            expect(moduleData.reward).toBeDefined();
        });
    });

    describe('isValidColor', () => {
        test('validates hex colors', () => {
            expect(isValidColor('#FF0000')).toBe(true);
            expect(isValidColor('#000')).toBe(true);
            expect(isValidColor('#123456')).toBe(true);
        });

        test('validates named colors', () => {
            expect(isValidColor('red')).toBe(true);
            expect(isValidColor('blue')).toBe(true);
            expect(isValidColor('transparent')).toBe(true);
        });

        test('validates rgb colors', () => {
            expect(isValidColor('rgb(255, 0, 0)')).toBe(true);
            expect(isValidColor('rgba(0, 0, 0, 0.5)')).toBe(true);
        });

        test('rejects invalid colors', () => {
            expect(isValidColor('notacolor')).toBe(false);
            expect(isValidColor('#ZZZ')).toBe(false);
            expect(isValidColor('')).toBe(false);
        });
    });
});