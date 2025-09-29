// progressUtils.test.js - Comprehensive tests for progress tracking utility functions
const {
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
} = require('../src/backend/test_utils/progressUtils');

describe('Progress Tracking Utility Functions', () => {
    describe('Constants', () => {
        test('MODULE_STATUS contains valid statuses', () => {
            expect(MODULE_STATUS).toEqual({
                ACTIVE: 'active',
                COMPLETED: 'completed',
                ARCHIVED: 'archived'
            });
        });

        test('TOPIC_STATUS contains valid statuses', () => {
            expect(TOPIC_STATUS).toEqual({
                PENDING: 'pending',
                IN_PROGRESS: 'in_progress',
                COMPLETED: 'completed',
                REVIEW_NEEDED: 'review_needed'
            });
        });

        test('MILESTONE_STATUS contains valid statuses', () => {
            expect(MILESTONE_STATUS).toEqual({
                UPCOMING: 'upcoming',
                IN_PROGRESS: 'in_progress',
                COMPLETED: 'completed',
                OVERDUE: 'overdue'
            });
        });

        test('REWARD_STATUS contains valid statuses', () => {
            expect(REWARD_STATUS).toEqual({
                LOCKED: 'locked',
                UNLOCKED: 'unlocked',
                EARNED: 'earned'
            });
        });

        test('DEFAULT_COLORS contains valid color palette', () => {
            expect(Array.isArray(DEFAULT_COLORS)).toBe(true);
            expect(DEFAULT_COLORS.length).toBeGreaterThan(0);
            DEFAULT_COLORS.forEach(color => {
                expect(isValidColor(color)).toBe(true);
            });
        });
    });

    describe('Validation Functions', () => {
        describe('validateModuleData', () => {
            const validModule = {
                name: 'Mathematics Fundamentals',
                color: '#4A90E2',
                topics: [
                    { name: 'Algebra Basics', completed: false },
                    { name: 'Geometry Introduction', completed: true }
                ],
                milestone: {
                    description: 'Complete all topics',
                    start: '2024-01-01',
                    end: '2024-01-31'
                },
                reward: {
                    description: 'Certificate of Completion'
                }
            };

            test('validates correct module data successfully', () => {
                const result = validateModuleData(validModule);
                expect(result.isValid).toBe(true);
                expect(result.error).toBeNull();
            });

            test('rejects missing module data object', () => {
                const result = validateModuleData(null);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Module data must be an object');
            });

            test('rejects missing module name', () => {
                const invalidModule = { ...validModule };
                delete invalidModule.name;
                
                const result = validateModuleData(invalidModule);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Module name is required');
            });

            test('rejects empty module name', () => {
                const invalidModule = { ...validModule, name: '   ' };
                
                const result = validateModuleData(invalidModule);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Module name is required');
            });

            test('rejects module name that is too long', () => {
                const invalidModule = { 
                    ...validModule, 
                    name: 'A'.repeat(101) 
                };
                
                const result = validateModuleData(invalidModule);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Module name must be between 1 and 100 characters');
            });

            test('rejects invalid color format', () => {
                const invalidModule = { 
                    ...validModule, 
                    color: 'invalid-color' 
                };
                
                const result = validateModuleData(invalidModule);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Invalid color format');
            });

            test('accepts valid color formats', () => {
                const validColors = ['#4A90E2', '#FFF', '#123456'];
                
                validColors.forEach(color => {
                    const moduleWithColor = { ...validModule, color };
                    const result = validateModuleData(moduleWithColor);
                    expect(result.isValid).toBe(true);
                });
            });

            test('rejects topic without name', () => {
                const invalidModule = {
                    ...validModule,
                    topics: [
                        { name: 'Valid Topic', completed: false },
                        { completed: true } // Missing name
                    ]
                };
                
                const result = validateModuleData(invalidModule);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Topic 2 name is required');
            });

            test('rejects topic with empty name', () => {
                const invalidModule = {
                    ...validModule,
                    topics: [
                        { name: '   ', completed: false }
                    ]
                };
                
                const result = validateModuleData(invalidModule);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Topic 1 name is required');
            });

            test('rejects topic with name too long', () => {
                const invalidModule = {
                    ...validModule,
                    topics: [
                        { name: 'A'.repeat(201), completed: false }
                    ]
                };
                
                const result = validateModuleData(invalidModule);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Topic 1 name must not exceed 200 characters');
            });

            test('rejects topic with invalid color', () => {
                const invalidModule = {
                    ...validModule,
                    topics: [
                        { name: 'Valid Topic', color: 'invalid', completed: false }
                    ]
                };
                
                const result = validateModuleData(invalidModule);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Topic 1 has invalid color format');
            });

            test('rejects milestone without description', () => {
                const invalidModule = {
                    ...validModule,
                    milestone: {
                        start: '2024-01-01',
                        end: '2024-01-31'
                    }
                };
                
                const result = validateModuleData(invalidModule);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Milestone description is required');
            });

            test('rejects milestone with empty description', () => {
                const invalidModule = {
                    ...validModule,
                    milestone: {
                        description: '   ',
                        start: '2024-01-01',
                        end: '2024-01-31'
                    }
                };
                
                const result = validateModuleData(invalidModule);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Milestone description is required');
            });

            test('rejects invalid milestone dates', () => {
                const invalidModule = {
                    ...validModule,
                    milestone: {
                        description: 'Test milestone',
                        start: '2024-01-31',
                        end: '2024-01-01' // End before start
                    }
                };
                
                const result = validateModuleData(invalidModule);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Milestone start date must be before end date');
            });

            test('rejects reward without description', () => {
                const invalidModule = {
                    ...validModule,
                    reward: {}
                };
                
                const result = validateModuleData(invalidModule);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Reward description is required');
            });

            test('rewards reward with empty description', () => {
                const invalidModule = {
                    ...validModule,
                    reward: {
                        description: '   '
                    }
                };
                
                const result = validateModuleData(invalidModule);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Reward description is required');
            });

            test('handles modules without optional fields', () => {
                const minimalModule = {
                    name: 'Minimal Module'
                };
                
                const result = validateModuleData(minimalModule);
                expect(result.isValid).toBe(true);
                expect(result.error).toBeNull();
            });
        });

        describe('validateModuleUpdateData', () => {
            test('validates correct update data successfully', () => {
                const updateData = {
                    name: 'Updated Module Name',
                    color: '#FF0000',
                    status: 'completed'
                };
                
                const result = validateModuleUpdateData(updateData);
                expect(result.isValid).toBe(true);
                expect(result.error).toBeNull();
            });

            test('rejects missing update data object', () => {
                const result = validateModuleUpdateData(null);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Update data must be an object');
            });

            test('rejects invalid fields', () => {
                const invalidUpdateData = {
                    invalid_field: 'value',
                    another_invalid: 'value'
                };
                
                const result = validateModuleUpdateData(invalidUpdateData);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Invalid fields');
            });

            test('rejects invalid name length', () => {
                const invalidUpdateData = {
                    name: 'A'.repeat(101)
                };
                
                const result = validateModuleUpdateData(invalidUpdateData);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Module name must be between 1 and 100 characters');
            });

            test('rejects invalid color format', () => {
                const invalidUpdateData = {
                    color: 'invalid-color'
                };
                
                const result = validateModuleUpdateData(invalidUpdateData);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Invalid color format');
            });

            test('rejects invalid status', () => {
                const invalidUpdateData = {
                    status: 'invalid-status'
                };
                
                const result = validateModuleUpdateData(invalidUpdateData);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Invalid status');
            });

            test('accepts valid status values', () => {
                Object.values(MODULE_STATUS).forEach(status => {
                    const updateData = { status };
                    const result = validateModuleUpdateData(updateData);
                    expect(result.isValid).toBe(true);
                });
            });

            test('accepts empty update data', () => {
                const result = validateModuleUpdateData({});
                expect(result.isValid).toBe(true);
            });
        });

        describe('validateTopicCompletionData', () => {
            test('validates correct completion data', () => {
                const result = validateTopicCompletionData({ completed: true });
                expect(result.isValid).toBe(true);
                expect(result.error).toBeNull();
            });

            test('rejects missing completion data object', () => {
                const result = validateTopicCompletionData(null);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Completion data must be an object');
            });

            test('rejects non-boolean completed status', () => {
                const result = validateTopicCompletionData({ completed: 'yes' });
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Completed status must be a boolean');
            });

            test('rejects missing completed field', () => {
                const result = validateTopicCompletionData({});
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Completed status must be a boolean');
            });
        });

        describe('validateModuleStatus', () => {
            test('validates correct module statuses', () => {
                Object.values(MODULE_STATUS).forEach(status => {
                    expect(validateModuleStatus(status)).toBe(true);
                });
            });

            test('rejects invalid module statuses', () => {
                expect(validateModuleStatus('invalid-status')).toBe(false);
                expect(validateModuleStatus('')).toBe(false);
                expect(validateModuleStatus(null)).toBe(false);
                expect(validateModuleStatus(undefined)).toBe(false);
            });
        });

        describe('validateTopicStatus', () => {
            test('validates correct topic statuses', () => {
                Object.values(TOPIC_STATUS).forEach(status => {
                    expect(validateTopicStatus(status)).toBe(true);
                });
            });

            test('rejects invalid topic statuses', () => {
                expect(validateTopicStatus('invalid-status')).toBe(false);
                expect(validateTopicStatus('')).toBe(false);
                expect(validateTopicStatus(null)).toBe(false);
                expect(validateTopicStatus(undefined)).toBe(false);
            });
        });

        describe('isValidColor', () => {
            test('validates correct color formats', () => {
                const validColors = [
                    '#4A90E2', '#FFF', '#123456', 
                    '#abc', '#ABCDEF', '#123abc'
                ];
                
                validColors.forEach(color => {
                    expect(isValidColor(color)).toBe(true);
                });
            });

            test('rejects invalid color formats', () => {
                const invalidColors = [
                    '4A90E2', // Missing #
                    '#GGGGGG', // Invalid hex
                    '#12345', // Wrong length
                    '#12345G', // Invalid character
                    'red', // Color name
                    '#1234567', // Too long
                    '', // Empty
                    null, // Null
                    undefined // Undefined
                ];
                
                invalidColors.forEach(color => {
                    expect(isValidColor(color)).toBe(false);
                });
            });
        });

        describe('isValidUUID', () => {
            test('validates correct UUID formats', () => {
                const validUUIDs = [
                    '123e4567-e89b-12d3-a456-426614174000',
                    '00000000-0000-0000-0000-000000000000',
                    'ffffffff-ffff-ffff-ffff-ffffffffffff'
                ];
                
                validUUIDs.forEach(uuid => {
                    expect(isValidUUID(uuid)).toBe(true);
                });
            });

            test('rejects invalid UUID formats', () => {
                const invalidUUIDs = [
                    'invalid-uuid',
                    '123e4567-e89b-12d3-a456',
                    '123e4567-e89b-12d3-a456-42661417400',
                    '123e4567-e89b-12d3-a456-4266141740000',
                    '',
                    null,
                    undefined
                ];
                
                invalidUUIDs.forEach(uuid => {
                    expect(isValidUUID(uuid)).toBe(false);
                });
            });
        });
    });

    describe('Color Generation Utilities', () => {
        describe('generateModuleColor', () => {
            test('returns valid color from default palette', () => {
                const color = generateModuleColor(0);
                expect(isValidColor(color)).toBe(true);
                expect(DEFAULT_COLORS).toContain(color);
            });

            test('cycles through palette for large indices', () => {
                const color1 = generateModuleColor(0);
                const color2 = generateModuleColor(DEFAULT_COLORS.length);
                expect(color1).toBe(color2);
                
                const color3 = generateModuleColor(1);
                const color4 = generateModuleColor(DEFAULT_COLORS.length + 1);
                expect(color3).toBe(color4);
            });


            test('returns different colors for different indices', () => {
                const color1 = generateModuleColor(0);
                const color2 = generateModuleColor(1);
                expect(color1).not.toBe(color2);
            });
        });

        describe('generateTopicColor', () => {
            test('generates valid color variations', () => {
                const baseColor = '#4A90E2';
                const color1 = generateTopicColor(baseColor, 0);
                const color2 = generateTopicColor(baseColor, 1);
                
                expect(isValidColor(color1)).toBe(true);
                expect(isValidColor(color2)).toBe(true);
                expect(color1).not.toBe(color2);
            });

            test('handles different base colors', () => {
                const baseColors = ['#FF0000', '#00FF00', '#0000FF'];
                
                baseColors.forEach(baseColor => {
                    const topicColor = generateTopicColor(baseColor, 0);
                    expect(isValidColor(topicColor)).toBe(true);
                    expect(topicColor).not.toBe(baseColor);
                });
            });

            test('generates consistent colors for same input', () => {
                const baseColor = '#4A90E2';
                const index = 2;
                
                const color1 = generateTopicColor(baseColor, index);
                const color2 = generateTopicColor(baseColor, index);
                
                expect(color1).toBe(color2);
            });
        });

        describe('getColorPalette', () => {
            test('returns copy of default colors', () => {
                const palette = getColorPalette();
                expect(palette).toEqual(DEFAULT_COLORS);
                expect(palette).not.toBe(DEFAULT_COLORS); // Should be a copy
            });

            test('palette contains valid colors', () => {
                const palette = getColorPalette();
                palette.forEach(color => {
                    expect(isValidColor(color)).toBe(true);
                });
            });
        });
    });

    describe('Data Formatting Utilities', () => {
        describe('formatModuleData', () => {
            test('formats complete module data correctly', () => {
                const rawModule = {
                    id: 'module-123',
                    name: 'Test Module',
                    color: '#4A90E2',
                    status: 'active',
                    created_at: '2024-01-01T00:00:00Z',
                    updated_at: '2024-01-02T00:00:00Z',
                    progress_topics: [
                        {
                            id: 'topic-1',
                            name: 'Test Topic 1',
                            color: '#50E3C2',
                            completed: true,
                            completed_at: '2024-01-01T12:00:00Z',
                            status: 'completed',
                            created_at: '2024-01-01T00:00:00Z',
                            updated_at: '2024-01-01T12:00:00Z'
                        },
                        {
                            id: 'topic-2',
                            name: 'Test Topic 2',
                            color: '#9013FE',
                            completed: false,
                            completed_at: null,
                            status: 'in_progress',
                            created_at: '2024-01-01T00:00:00Z',
                            updated_at: '2024-01-01T00:00:00Z'
                        }
                    ],
                    progress_milestones: [
                        {
                            id: 'milestone-1',
                            description: 'Test milestone',
                            start_date: '2024-01-01',
                            end_date: '2024-01-31',
                            created_at: '2024-01-01T00:00:00Z'
                        }
                    ],
                    progress_rewards: [
                        {
                            id: 'reward-1',
                            description: 'Test reward',
                            earned: false,
                            earned_at: null,
                            created_at: '2024-01-01T00:00:00Z'
                        }
                    ]
                };

                const formatted = formatModuleData(rawModule);
                
                expect(formatted.id).toBe('module-123');
                expect(formatted.name).toBe('Test Module');
                expect(formatted.color).toBe('#4A90E2');
                expect(formatted.status).toBe('active');
                expect(formatted.createdAt).toBe('2024-01-01T00:00:00Z');
                expect(formatted.updatedAt).toBe('2024-01-02T00:00:00Z');
                
                // Check topics
                expect(formatted.topics).toHaveLength(2);
                expect(formatted.topics[0].name).toBe('Test Topic 1');
                expect(formatted.topics[0].completed).toBe(true);
                expect(formatted.topics[1].name).toBe('Test Topic 2');
                expect(formatted.topics[1].completed).toBe(false);
                
                // Check milestone
                expect(formatted.milestone).toBeDefined();
                expect(formatted.milestone.description).toBe('Test milestone');
                expect(formatted.milestone.status).toBeDefined();
                
                // Check reward
                expect(formatted.reward).toBeDefined();
                expect(formatted.reward.description).toBe('Test reward');
                expect(formatted.reward.status).toBeDefined();
            });

            test('handles module with missing color', () => {
                const rawModule = {
                    id: 'module-123',
                    name: 'Test Module',
                    created_at: '2024-01-01T00:00:00Z',
                    updated_at: '2024-01-02T00:00:00Z'
                };

                const formatted = formatModuleData(rawModule);
                expect(formatted.color).toBe('#4A90E2'); // Default color
            });

            test('handles module with missing status', () => {
                const rawModule = {
                    id: 'module-123',
                    name: 'Test Module',
                    created_at: '2024-01-01T00:00:00Z',
                    updated_at: '2024-01-02T00:00:00Z'
                };

                const formatted = formatModuleData(rawModule);
                expect(formatted.status).toBe('active'); // Default status
            });

            test('handles missing related data', () => {
                const rawModule = {
                    id: 'module-123',
                    name: 'Test Module',
                    color: '#4A90E2',
                    created_at: '2024-01-01T00:00:00Z',
                    updated_at: '2024-01-02T00:00:00Z'
                };

                const formatted = formatModuleData(rawModule);
                
                expect(formatted.topics).toEqual([]);
                expect(formatted.milestone).toBeNull();
                expect(formatted.reward).toBeNull();
            });

            test('handles empty arrays for related data', () => {
                const rawModule = {
                    id: 'module-123',
                    name: 'Test Module',
                    color: '#4A90E2',
                    created_at: '2024-01-01T00:00:00Z',
                    updated_at: '2024-01-02T00:00:00Z',
                    progress_topics: [],
                    progress_milestones: [],
                    progress_rewards: []
                };

                const formatted = formatModuleData(rawModule);
                
                expect(formatted.topics).toEqual([]);
                expect(formatted.milestone).toBeNull();
                expect(formatted.reward).toBeNull();
            });

            test('returns null for null input', () => {
                const formatted = formatModuleData(null);
                expect(formatted).toBeNull();
            });

            test('handles module with only required fields', () => {
                const rawModule = {
                    id: 'module-123',
                    name: 'Test Module',
                    created_at: '2024-01-01T00:00:00Z',
                    updated_at: '2024-01-02T00:00:00Z'
                };

                const formatted = formatModuleData(rawModule);
                expect(formatted.id).toBe('module-123');
                expect(formatted.name).toBe('Test Module');
                expect(formatted.topics).toEqual([]);
                expect(formatted.milestone).toBeNull();
                expect(formatted.reward).toBeNull();
            });
        });

        describe('formatTopicData', () => {
            test('formats complete topic data correctly', () => {
                const rawTopic = {
                    id: 'topic-123',
                    name: 'Test Topic',
                    color: '#4A90E2',
                    completed: true,
                    completed_at: '2024-01-01T12:00:00Z',
                    status: 'completed',
                    created_at: '2024-01-01T00:00:00Z',
                    updated_at: '2024-01-01T12:00:00Z',
                    module_id: 'module-123'
                };

                const formatted = formatTopicData(rawTopic);
                
                expect(formatted.id).toBe('topic-123');
                expect(formatted.name).toBe('Test Topic');
                expect(formatted.color).toBe('#4A90E2');
                expect(formatted.completed).toBe(true);
                expect(formatted.completed_at).toBe('2024-01-01T12:00:00Z');
                expect(formatted.status).toBe('completed');
                expect(formatted.created_at).toBe('2024-01-01T00:00:00Z');
                expect(formatted.updated_at).toBe('2024-01-01T12:00:00Z');
                expect(formatted.module_id).toBe('module-123');
            });

            test('handles topic with missing fields', () => {
                const rawTopic = {
                    id: 'topic-123',
                    name: 'Test Topic',
                    module_id: 'module-123'
                };

                const formatted = formatTopicData(rawTopic);
                
                expect(formatted.completed).toBe(false);
                expect(formatted.completed_at).toBeUndefined();
                expect(formatted.status).toBe('pending');
                expect(formatted.color).toBeUndefined();
            });

            test('returns null for null input', () => {
                const formatted = formatTopicData(null);
                expect(formatted).toBeNull();
            });
        });
    });

    describe('Calculation Utilities', () => {
        const mockModules = [
            {
                id: 'module-1',
                name: 'Mathematics',
                color: '#4A90E2',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-02T00:00:00Z',
                progress_topics: [
                    { id: 'topic-1', name: 'Algebra', completed: true },
                    { id: 'topic-2', name: 'Geometry', completed: false },
                    { id: 'topic-3', name: 'Calculus', completed: true }
                ],
                progress_milestones: [
                    {
                        start_date: '2024-01-01',
                        end_date: '2024-01-31'
                    }
                ],
                progress_rewards: [
                    { earned: false }
                ]
            },
            {
                id: 'module-2',
                name: 'Science',
                color: '#50E3C2',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-02T00:00:00Z',
                progress_topics: [
                    { id: 'topic-4', name: 'Physics', completed: true },
                    { id: 'topic-5', name: 'Chemistry', completed: true }
                ],
                progress_rewards: [
                    { earned: true }
                ]
            },
            {
                id: 'module-3',
                name: 'History',
                color: '#9013FE',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-02T00:00:00Z',
                progress_topics: [], // No topics
                progress_rewards: []
            }
        ];

        describe('calculateModuleCompletion', () => {
            test('calculates completion percentages correctly', () => {
                const completion = calculateModuleCompletion(mockModules);
                
                expect(completion).toHaveLength(3);
                
                // Math module: 2 out of 3 topics = 67%
                expect(completion[0].moduleName).toBe('Mathematics');
                expect(completion[0].completion).toBe(67);
                expect(completion[0].totalTopics).toBe(3);
                expect(completion[0].completedTopics).toBe(2);
                
                // Science module: 2 out of 2 topics = 100%
                expect(completion[1].moduleName).toBe('Science');
                expect(completion[1].completion).toBe(100);
                expect(completion[1].totalTopics).toBe(2);
                expect(completion[1].completedTopics).toBe(2);
                
                // History module: 0 topics = 0%
                expect(completion[2].moduleName).toBe('History');
                expect(completion[2].completion).toBe(0);
                expect(completion[2].totalTopics).toBe(0);
                expect(completion[2].completedTopics).toBe(0);
            });

            test('handles empty modules array', () => {
                const completion = calculateModuleCompletion([]);
                expect(completion).toEqual([]);
            });

            test('throws error for non-array input', () => {
                expect(() => calculateModuleCompletion(null)).toThrow('Modules must be an array');
                expect(() => calculateModuleCompletion('invalid')).toThrow('Modules must be an array');
                expect(() => calculateModuleCompletion(123)).toThrow('Modules must be an array');
            });

            test('handles modules without topics property', () => {
                const modulesWithoutTopics = [
                    { id: 'module-1', name: 'Test Module' }
                ];
                
                const completion = calculateModuleCompletion(modulesWithoutTopics);
                expect(completion[0].completion).toBe(0);
                expect(completion[0].totalTopics).toBe(0);
                expect(completion[0].completedTopics).toBe(0);
            });
        });

        describe('calculateTimeManagement', () => {
            test('calculates time management stats correctly', () => {
                const timeManagement = calculateTimeManagement(mockModules);
                
                expect(timeManagement.total).toBe(3);
                expect(timeManagement.onTrack).toBeGreaterThanOrEqual(0);
                expect(timeManagement.behind).toBeGreaterThanOrEqual(0);
                expect(timeManagement.completed).toBeGreaterThanOrEqual(0);
                expect(timeManagement.onTrack + timeManagement.behind + timeManagement.completed).toBeLessThanOrEqual(3);
            });

            test('handles modules without milestones', () => {
                const modulesWithoutMilestones = [
                    {
                        id: 'module-1',
                        name: 'Test Module',
                        progress_topics: [
                            { completed: true },
                            { completed: false }
                        ]
                    }
                ];
                
                const timeManagement = calculateTimeManagement(modulesWithoutMilestones);
                expect(timeManagement.onTrack).toBe(1); // Module without milestone is considered on track
            });

            test('handles empty modules array', () => {
                const timeManagement = calculateTimeManagement([]);
                expect(timeManagement.total).toBe(0);
                expect(timeManagement.onTrack).toBe(0);
                expect(timeManagement.behind).toBe(0);
                expect(timeManagement.completed).toBe(0);
            });

            test('throws error for non-array input', () => {
                expect(() => calculateTimeManagement(null)).toThrow('Modules must be an array');
                expect(() => calculateTimeManagement('invalid')).toThrow('Modules must be an array');
            });
        });

        describe('calculateMilestoneStatus', () => {
            test('returns COMPLETED when all topics are completed', () => {
                const milestone = {
                    start_date: '2024-01-01',
                    end_date: '2024-01-31'
                };
                const topics = [
                    { completed: true },
                    { completed: true }
                ];
                
                const status = calculateMilestoneStatus(milestone, topics);
                expect(status).toBe(MILESTONE_STATUS.COMPLETED);
            });

            test('returns OVERDUE when current date is after end date', () => {
                const milestone = {
                    start_date: '2024-01-01',
                    end_date: '2024-01-15' // Past date
                };
                const topics = [
                    { completed: false },
                    { completed: false }
                ];
                
                const status = calculateMilestoneStatus(milestone, topics);
                expect(status).toBe(MILESTONE_STATUS.OVERDUE);
            });

            test('returns IN_PROGRESS when current date is within range', () => {
                const now = new Date();
                const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Yesterday
                const endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
                
                const milestone = {
                    start_date: startDate.toISOString().split('T')[0],
                    end_date: endDate.toISOString().split('T')[0]
                };
                const topics = [
                    { completed: false }
                ];
                
                const status = calculateMilestoneStatus(milestone, topics);
                expect(status).toBe(MILESTONE_STATUS.IN_PROGRESS);
            });

            test('returns UPCOMING when current date is before start date', () => {
                const now = new Date();
                const startDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
                const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Next week
                
                const milestone = {
                    start_date: startDate.toISOString().split('T')[0],
                    end_date: endDate.toISOString().split('T')[0]
                };
                const topics = [
                    { completed: false }
                ];
                
                const status = calculateMilestoneStatus(milestone, topics);
                expect(status).toBe(MILESTONE_STATUS.UPCOMING);
            });

            test('returns UPCOMING for null milestone', () => {
                const status = calculateMilestoneStatus(null, []);
                expect(status).toBe(MILESTONE_STATUS.UPCOMING);
            });

            test('handles incomplete topics with past end date', () => {
                const milestone = {
                    start_date: '2024-01-01',
                    end_date: '2024-01-15' // Past date
                };
                const topics = [
                    { completed: false },
                    { completed: true }
                ];
                
                const status = calculateMilestoneStatus(milestone, topics);
                expect(status).toBe(MILESTONE_STATUS.OVERDUE);
            });
        });

        describe('calculateRewardStatus', () => {
            test('returns EARNED when reward is earned', () => {
                const reward = { earned: true };
                const topics = [
                    { completed: true },
                    { completed: true }
                ];
                
                const status = calculateRewardStatus(reward, topics);
                expect(status).toBe(REWARD_STATUS.EARNED);
            });

            test('returns UNLOCKED when all topics are completed but reward not earned', () => {
                const reward = { earned: false };
                const topics = [
                    { completed: true },
                    { completed: true }
                ];
                
                const status = calculateRewardStatus(reward, topics);
                expect(status).toBe(REWARD_STATUS.UNLOCKED);
            });

            test('returns LOCKED when not all topics are completed', () => {
                const reward = { earned: false };
                const topics = [
                    { completed: true },
                    { completed: false }
                ];
                
                const status = calculateRewardStatus(reward, topics);
                expect(status).toBe(REWARD_STATUS.LOCKED);
            });

            test('returns LOCKED for null reward', () => {
                const status = calculateRewardStatus(null, []);
                expect(status).toBe(REWARD_STATUS.LOCKED);
            });

        });

        describe('calculateOverallProgress', () => {
            test('calculates overall progress correctly', () => {
                const progress = calculateOverallProgress(mockModules);
                
                expect(progress.totalModules).toBe(3);
                expect(progress.totalTopics).toBe(5); // 3 + 2 + 0
                expect(progress.completedTopics).toBe(4); // 2 + 2 + 0
                expect(progress.completionPercentage).toBe(80); // 4/5 = 80%
                expect(progress.earnedRewards).toBe(1); // Only science module has earned reward
            });

            test('handles empty modules array', () => {
                const progress = calculateOverallProgress([]);
                
                expect(progress.totalModules).toBe(0);
                expect(progress.totalTopics).toBe(0);
                expect(progress.completedTopics).toBe(0);
                expect(progress.completionPercentage).toBe(0);
                expect(progress.earnedRewards).toBe(0);
            });

            test('handles modules without progress arrays', () => {
                const minimalModules = [
                    { id: 'module-1', name: 'Test Module' }
                ];
                
                const progress = calculateOverallProgress(minimalModules);
                
                expect(progress.totalModules).toBe(1);
                expect(progress.totalTopics).toBe(0);
                expect(progress.completedTopics).toBe(0);
                expect(progress.completionPercentage).toBe(0);
                expect(progress.earnedRewards).toBe(0);
            });

            test('handles null input', () => {
                const progress = calculateOverallProgress(null);
                
                expect(progress.totalModules).toBe(0);
                expect(progress.totalTopics).toBe(0);
                expect(progress.completedTopics).toBe(0);
                expect(progress.completionPercentage).toBe(0);
                expect(progress.earnedRewards).toBe(0);
            });
        });
    });

    describe('Search and Filtering Utilities', () => {
        const mockModules = [
            {
                id: 'module-1',
                name: 'Advanced Mathematics',
                status: 'active',
                progress_topics: [
                    { id: 'topic-1', name: 'Linear Algebra', completed: true },
                    { id: 'topic-2', name: 'Differential Equations', completed: false }
                ]
            },
            {
                id: 'module-2',
                name: 'Computer Science',
                status: 'completed',
                progress_topics: [
                    { id: 'topic-3', name: 'Algorithms', completed: true },
                    { id: 'topic-4', name: 'Data Structures', completed: true }
                ]
            },
            {
                id: 'module-3',
                name: 'Physics Fundamentals',
                status: 'active',
                progress_topics: [
                    { id: 'topic-5', name: 'Quantum Mechanics', completed: false },
                    { id: 'topic-6', name: 'Thermodynamics', completed: false }
                ]
            }
        ];

        describe('searchModulesAndTopics', () => {

            test('returns case-insensitive search results', () => {
                const results = searchModulesAndTopics(mockModules, 'MATHEMATICS');
                
                expect(results.modules).toHaveLength(1);
                expect(results.modules[0].name).toBe('Advanced Mathematics');
            });

            test('returns partial match results', () => {
                const results = searchModulesAndTopics(mockModules, 'phys');
                
                expect(results.modules).toHaveLength(1);
                expect(results.modules[0].name).toBe('Physics Fundamentals');
            });

            test('returns all data for empty query', () => {
                const results = searchModulesAndTopics(mockModules, '');
                
                expect(results.modules).toHaveLength(3);
                expect(results.topics).toHaveLength(0);
            });

            test('returns all data for whitespace query', () => {
                const results = searchModulesAndTopics(mockModules, '   ');
                
                expect(results.modules).toHaveLength(3);
                expect(results.topics).toHaveLength(0);
            });

            test('returns empty results for no matches', () => {
                const results = searchModulesAndTopics(mockModules, 'nonexistent');
                
                expect(results.modules).toHaveLength(0);
                expect(results.topics).toHaveLength(0);
            });

            test('handles modules without topics', () => {
                const modulesWithoutTopics = [
                    { id: 'module-1', name: 'Test Module' }
                ];
                
                const results = searchModulesAndTopics(modulesWithoutTopics, 'test');
                expect(results.modules).toHaveLength(1);
                expect(results.topics).toHaveLength(0);
            });

            test('throws error for non-array input', () => {
                expect(() => searchModulesAndTopics(null, 'test')).toThrow('Modules must be an array');
                expect(() => searchModulesAndTopics('invalid', 'test')).toThrow('Modules must be an array');
            });

            test('handles null query', () => {
                const results = searchModulesAndTopics(mockModules, null);
                expect(results.modules).toHaveLength(3);
                expect(results.topics).toHaveLength(0);
            });
        });

        describe('filterModulesByStatus', () => {
            test('filters modules by status', () => {
                const activeModules = filterModulesByStatus(mockModules, 'active');
                
                expect(activeModules).toHaveLength(2);
                expect(activeModules[0].name).toBe('Advanced Mathematics');
                expect(activeModules[1].name).toBe('Physics Fundamentals');
            });

            test('returns empty array for no matches', () => {
                const archivedModules = filterModulesByStatus(mockModules, 'archived');
                expect(archivedModules).toHaveLength(0);
            });

            test('throws error for invalid status', () => {
                expect(() => filterModulesByStatus(mockModules, 'invalid-status')).toThrow('Invalid status');
            });

            test('throws error for non-array input', () => {
                expect(() => filterModulesByStatus(null, 'active')).toThrow('Modules must be an array');
            });
        });

        describe('filterTopicsByCompletion', () => {
            test('filters completed topics', () => {
                const completedTopics = filterTopicsByCompletion(mockModules, true);
                
                expect(completedTopics.length).toBeGreaterThan(0);
                completedTopics.forEach(topic => {
                    expect(topic.completed).toBe(true);
                });
            });

            test('filters incomplete topics', () => {
                const incompleteTopics = filterTopicsByCompletion(mockModules, false);
                
                expect(incompleteTopics.length).toBeGreaterThan(0);
                incompleteTopics.forEach(topic => {
                    expect(topic.completed).toBe(false);
                });
            });


            test('returns empty array for no matches', () => {
                const emptyModules = [{ id: 'module-1', name: 'Test Module' }];
                const completedTopics = filterTopicsByCompletion(emptyModules, true);
                
                expect(completedTopics).toHaveLength(0);
            });

            test('throws error for non-array input', () => {
                expect(() => filterTopicsByCompletion(null, true)).toThrow('Modules must be an array');
            });
        });
    });

    describe('Sorting Utilities', () => {
        const mockModules = [
            {
                id: 'module-1',
                name: 'Mathematics',
                created_at: '2024-01-03T00:00:00Z',
                updated_at: '2024-01-04T00:00:00Z',
                progress_topics: [
                    { completed: true },
                    { completed: false }
                ]
            },
            {
                id: 'module-2',
                name: 'Algebra',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-02T00:00:00Z',
                progress_topics: [
                    { completed: true },
                    { completed: true }
                ]
            },
            {
                id: 'module-3',
                name: 'Calculus',
                created_at: '2024-01-02T00:00:00Z',
                updated_at: '2024-01-03T00:00:00Z',
                progress_topics: [] // No topics
            }
        ];

        describe('sortModules', () => {
            test('sorts modules by name ascending', () => {
                const sorted = sortModules(mockModules, 'name', 'asc');
                
                expect(sorted[0].name).toBe('Algebra');
                expect(sorted[1].name).toBe('Calculus');
                expect(sorted[2].name).toBe('Mathematics');
            });

            test('sorts modules by name descending', () => {
                const sorted = sortModules(mockModules, 'name', 'desc');
                
                expect(sorted[0].name).toBe('Mathematics');
                expect(sorted[1].name).toBe('Calculus');
                expect(sorted[2].name).toBe('Algebra');
            });

            test('sorts modules by creation date ascending', () => {
                const sorted = sortModules(mockModules, 'created_at', 'asc');
                
                expect(sorted[0].name).toBe('Algebra'); // Jan 1
                expect(sorted[1].name).toBe('Calculus'); // Jan 2
                expect(sorted[2].name).toBe('Mathematics'); // Jan 3
            });

            test('sorts modules by creation date descending', () => {
                const sorted = sortModules(mockModules, 'created_at', 'desc');
                
                expect(sorted[0].name).toBe('Mathematics'); // Jan 3
                expect(sorted[1].name).toBe('Calculus'); // Jan 2
                expect(sorted[2].name).toBe('Algebra'); // Jan 1
            });

            test('sorts modules by completion percentage', () => {
                const sorted = sortModules(mockModules, 'completion', 'desc');
                
                // Algebra: 2/2 = 100%
                // Mathematics: 1/2 = 50% 
                // Calculus: 0/0 = 0%
                expect(sorted[0].name).toBe('Algebra');
                expect(sorted[1].name).toBe('Mathematics');
                expect(sorted[2].name).toBe('Calculus');
            });

            test('handles modules without topics for completion sorting', () => {
                const modulesWithMissingTopics = [
                    { id: 'module-1', name: 'Module 1' }, // No topics property
                    { id: 'module-2', name: 'Module 2', progress_topics: [] } // Empty topics
                ];
                
                const sorted = sortModules(modulesWithMissingTopics, 'completion', 'desc');
                expect(sorted).toHaveLength(2);
            });

            test('throws error for invalid sort field', () => {
                expect(() => sortModules(mockModules, 'invalid_field', 'asc')).toThrow('Invalid sort field');
            });

            test('throws error for invalid sort direction', () => {
                expect(() => sortModules(mockModules, 'name', 'invalid')).toThrow('Sort direction must be "asc" or "desc"');
            });

            test('throws error for non-array input', () => {
                expect(() => sortModules(null, 'name', 'asc')).toThrow('Modules must be an array');
            });
        });
    });

    describe('Analytics Utilities', () => {
        const mockModules = [
            {
                id: 'module-1',
                name: 'Mathematics',
                color: '#4A90E2',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-10T00:00:00Z',
                progress_topics: [
                    { 
                        name: 'Algebra', 
                        completed: true, 
                        completed_at: '2024-01-05T00:00:00Z',
                        status: 'completed'
                    },
                    { 
                        name: 'Geometry', 
                        completed: false,
                        status: 'in_progress'
                    },
                    { 
                        name: 'Calculus', 
                        completed: true,
                        completed_at: '2024-01-08T00:00:00Z',
                        status: 'completed'
                    }
                ],
                progress_milestones: [
                    {
                        start_date: '2024-01-01',
                        end_date: '2024-01-31'
                    }
                ],
                progress_rewards: [
                    { earned: false }
                ]
            },
            {
                id: 'module-2',
                name: 'Science',
                color: '#50E3C2',
                created_at: '2024-01-02T00:00:00Z',
                updated_at: '2024-01-09T00:00:00Z',
                progress_topics: [
                    { 
                        name: 'Physics', 
                        completed: true,
                        completed_at: '2024-01-06T00:00:00Z',
                        status: 'completed'
                    },
                    { 
                        name: 'Chemistry', 
                        completed: true,
                        completed_at: '2024-01-07T00:00:00Z',
                        status: 'completed'
                    }
                ],
                progress_rewards: [
                    { earned: true }
                ]
            }
        ];

        describe('generateProgressAnalytics', () => {
            test('generates comprehensive analytics', () => {
                const analytics = generateProgressAnalytics(mockModules);
                
                expect(analytics.overall).toBeDefined();
                expect(analytics.timeManagement).toBeDefined();
                expect(analytics.moduleCompletion).toBeDefined();
                expect(analytics.weeklyProgress).toBeDefined();
                expect(analytics.topicDistribution).toBeDefined();
                
                // Check overall progress
                expect(analytics.overall.totalModules).toBe(2);
                expect(analytics.overall.totalTopics).toBe(5);
                expect(analytics.overall.completedTopics).toBe(4);
                expect(analytics.overall.completionPercentage).toBe(80);
                expect(analytics.overall.earnedRewards).toBe(1);
                
                // Check topic distribution
                expect(analytics.topicDistribution.completed).toBe(4);
                expect(analytics.topicDistribution.inProgress).toBe(1);
                expect(analytics.topicDistribution.pending).toBe(0);
                expect(analytics.topicDistribution.total).toBe(5);
            });

            test('handles empty modules array', () => {
                const analytics = generateProgressAnalytics([]);
                
                expect(analytics.overall.totalModules).toBe(0);
                expect(analytics.overall.totalTopics).toBe(0);
                expect(analytics.topicDistribution.total).toBe(0);
                expect(analytics.weeklyProgress).toHaveLength(7);
            });

            test('throws error for non-array input', () => {
                expect(() => generateProgressAnalytics(null)).toThrow('Modules must be an array');
            });
        });

        describe('calculateWeeklyProgress', () => {
            test('calculates weekly progress data', () => {
                const weeklyProgress = calculateWeeklyProgress(mockModules);
                
                expect(weeklyProgress).toHaveLength(7);
                weeklyProgress.forEach(day => {
                    expect(day.date).toBeDefined();
                    expect(day.topicsCompleted).toBeGreaterThanOrEqual(0);
                    expect(day.modulesUpdated).toBeGreaterThanOrEqual(0);
                });
            });

            test('handles modules without completion dates', () => {
                const modulesWithoutDates = [
                    {
                        id: 'module-1',
                        name: 'Test Module',
                        updated_at: new Date().toISOString(),
                        progress_topics: [
                            { completed: true } // No completed_at
                        ]
                    }
                ];
                
                const weeklyProgress = calculateWeeklyProgress(modulesWithoutDates);
                expect(weeklyProgress).toHaveLength(7);
            });

            test('handles empty modules array', () => {
                const weeklyProgress = calculateWeeklyProgress([]);
                expect(weeklyProgress).toHaveLength(7);
                
                // All days should have zero counts
                weeklyProgress.forEach(day => {
                    expect(day.topicsCompleted).toBe(0);
                    expect(day.modulesUpdated).toBe(0);
                });
            });
        });

        describe('calculateTopicDistribution', () => {
            test('calculates topic distribution correctly', () => {
                const distribution = calculateTopicDistribution(mockModules);
                
                expect(distribution.completed).toBe(4);
                expect(distribution.inProgress).toBe(1);
                expect(distribution.pending).toBe(0);
                expect(distribution.total).toBe(5);
            });

            test('handles modules without topics', () => {
                const modulesWithoutTopics = [
                    { id: 'module-1', name: 'Test Module' }
                ];
                
                const distribution = calculateTopicDistribution(modulesWithoutTopics);
                expect(distribution.total).toBe(0);
                expect(distribution.completed).toBe(0);
                expect(distribution.inProgress).toBe(0);
                expect(distribution.pending).toBe(0);
            });

            test('handles topics without status', () => {
                const modulesWithBasicTopics = [
                    {
                        id: 'module-1',
                        name: 'Test Module',
                        progress_topics: [
                            { completed: true }, // No status
                            { completed: false } // No status
                        ]
                    }
                ];
                
                const distribution = calculateTopicDistribution(modulesWithBasicTopics);
                expect(distribution.completed).toBe(1);
                expect(distribution.pending).toBe(1); // Default to pending for incomplete topics without status
                expect(distribution.total).toBe(2);
            });
        });
    });

    describe('Mock Data Generation', () => {
        describe('generateMockModule', () => {
            test('generates mock module with default values', () => {
                const mockModule = generateMockModule();
                
                expect(mockModule).toHaveProperty('id');
                expect(mockModule).toHaveProperty('name');
                expect(mockModule).toHaveProperty('color');
                expect(isValidColor(mockModule.color)).toBe(true);
                expect(Array.isArray(mockModule.progress_topics)).toBe(true);
                expect(Array.isArray(mockModule.progress_milestones)).toBe(true);
                expect(Array.isArray(mockModule.progress_rewards)).toBe(true);
            });

            test('generates mock module with overrides', () => {
                const overrides = {
                    name: 'Custom Module',
                    color: '#FF0000',
                    topicCount: 5
                };
                
                const mockModule = generateMockModule(overrides);
                
                expect(mockModule.name).toBe('Custom Module');
                expect(mockModule.color).toBe('#FF0000');
                expect(mockModule.progress_topics).toHaveLength(5);
            });

            test('generates mock module with custom topics', () => {
                const customTopics = [
                    { name: 'Custom Topic 1', completed: true },
                    { name: 'Custom Topic 2', completed: false }
                ];
                
                const mockModule = generateMockModule({ topics: customTopics });
                
                expect(mockModule.progress_topics).toHaveLength(2);
                expect(mockModule.progress_topics[0].name).toBe('Custom Topic 1');
                expect(mockModule.progress_topics[1].name).toBe('Custom Topic 2');
            });

            test('generates valid UUID for user_id', () => {
                const mockModule = generateMockModule();
                expect(isValidUUID(mockModule.user_id)).toBe(true);
            });
        });

        describe('generateMockTopic', () => {
            test('generates mock topic with module reference', () => {
                const moduleId = 'test-module-123';
                const mockTopic = generateMockTopic(moduleId, 0);
                
                expect(mockTopic.module_id).toBe(moduleId);
                expect(mockTopic).toHaveProperty('name');
                expect(mockTopic).toHaveProperty('color');
                expect(isValidColor(mockTopic.color)).toBe(true);
                expect(typeof mockTopic.completed).toBe('boolean');
                expect(Object.values(TOPIC_STATUS)).toContain(mockTopic.status);
            });

            test('generates different topics for different indices', () => {
                const moduleId = 'test-module-123';
                const topic1 = generateMockTopic(moduleId, 0);
                const topic2 = generateMockTopic(moduleId, 1);
                
                expect(topic1.name).not.toBe(topic2.name);
                expect(topic1.color).not.toBe(topic2.color);
            });
        });

        describe('generateMockMilestone', () => {
            test('generates mock milestone with future end date', () => {
                const moduleId = 'test-module-123';
                const mockMilestone = generateMockMilestone(moduleId);
                
                expect(mockMilestone.module_id).toBe(moduleId);
                expect(mockMilestone).toHaveProperty('description');
                expect(mockMilestone.start_date).toBeDefined();
                expect(mockMilestone.end_date).toBeDefined();
                
                const startDate = new Date(mockMilestone.start_date);
                const endDate = new Date(mockMilestone.end_date);
                expect(endDate > startDate).toBe(true);
            });
        });

        describe('generateMockReward', () => {
            test('generates mock reward with module reference', () => {
                const moduleId = 'test-module-123';
                const mockReward = generateMockReward(moduleId);
                
                expect(mockReward.module_id).toBe(moduleId);
                expect(mockReward).toHaveProperty('description');
                expect(typeof mockReward.earned).toBe('boolean');
                
                if (mockReward.earned) {
                    expect(mockReward.earned_at).toBeDefined();
                } else {
                    expect(mockReward.earned_at).toBeNull();
                }
            });
        });
    });

    describe('Supabase Response Validation', () => {
        test('validates successful response', () => {
            const response = {
                data: [{ id: 1, name: 'test' }],
                error: null
            };
            
            const result = validateSupabaseResponse(response);
            expect(result.isValid).toBe(true);
            expect(result.error).toBeNull();
            expect(result.data).toEqual([{ id: 1, name: 'test' }]);
        });

        test('validates response with error', () => {
            const response = {
                data: null,
                error: { message: 'Database error' }
            };
            
            const result = validateSupabaseResponse(response);
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Database error');
            expect(result.data).toBeUndefined();
        });

        test('validates response with error but no message', () => {
            const response = {
                data: null,
                error: {}
            };
            
            const result = validateSupabaseResponse(response);
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Supabase error occurred');
        });

        test('validates response without data', () => {
            const response = {
                error: null
            };
            
            const result = validateSupabaseResponse(response);
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('No data in response');
        });

        test('validates null response', () => {
            const result = validateSupabaseResponse(null);
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Invalid response object');
        });

        test('validates non-object response', () => {
            const result = validateSupabaseResponse('invalid');
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Invalid response object');
        });
    });
});