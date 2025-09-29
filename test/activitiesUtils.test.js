// activitiesUtils.test.js - Tests for activity utility functions
const {
    ACTIVITY_TYPES,
    PRIORITY_LEVELS,
    RECURRENCE_PATTERNS,
    validateActivityData,
    validateActivityUpdateData,
    validateActivityType,
    validatePriority,
    validateRecurrencePattern,
    isValidUUID,
    isValidDate,
    isValidTime,
    filterActivitiesByType,
    filterActivitiesByPriority,
    filterActivitiesByCompletion,
    filterActivitiesByDateRange,
    sortActivities,
    searchActivities,
    getUpcomingActivities,
    getOverdueActivities,
    paginateItems,
    calculateActivityStats,
    formatActivityResponse,
    generateMockActivity,
    canUpdateActivity,
    canDeleteActivity,
    validateSupabaseResponse
} = require('../src/backend/test_utils/activitiesUtils');

describe('Activity Utility Functions', () => {
    describe('Constants', () => {
        test('ACTIVITY_TYPES contains valid types', () => {
            expect(ACTIVITY_TYPES).toEqual({
                STUDY: 'study',
                ASSIGNMENT: 'assignment',
                EXAM: 'exam',
                MEETING: 'meeting',
                PERSONAL: 'personal',
                OTHER: 'other'
            });
        });

        test('PRIORITY_LEVELS contains valid priorities', () => {
            expect(PRIORITY_LEVELS).toEqual({
                LOW: 'low',
                MEDIUM: 'medium',
                HIGH: 'high'
            });
        });

        test('RECURRENCE_PATTERNS contains valid patterns', () => {
            expect(RECURRENCE_PATTERNS).toEqual({
                DAILY: 'daily',
                WEEKLY: 'weekly',
                MONTHLY: 'monthly',
                YEARLY: 'yearly'
            });
        });
    });

    describe('Validation Functions', () => {
        describe('validateActivityData', () => {
            const validActivity = {
                user_id: '123e4567-e89b-12d3-a456-426614174000',
                title: 'Math Study Session',
                activity_type: 'study',
                activity_date: '2024-01-15',
                activity_time: '14:00:00',
                duration_hours: 2,
                priority: 'medium'
            };

            test('validates correct activity data successfully', () => {
                const result = validateActivityData(validActivity);
                expect(result.isValid).toBe(true);
                expect(result.error).toBeNull();
            });

            test('rejects missing required fields', () => {
                const incompleteActivity = { ...validActivity };
                delete incompleteActivity.title;
                
                const result = validateActivityData(incompleteActivity);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('user_id, title, activity_type, activity_date, activity_time, and duration_hours are required');
            });

            test('rejects invalid activity type', () => {
                const invalidTypeActivity = { 
                    ...validActivity, 
                    activity_type: 'invalid-type' 
                };
                
                const result = validateActivityData(invalidTypeActivity);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Invalid activity type');
            });

            test('rejects invalid priority', () => {
                const invalidPriorityActivity = { 
                    ...validActivity, 
                    priority: 'invalid-priority' 
                };
                
                const result = validateActivityData(invalidPriorityActivity);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Invalid priority');
            });

            test('rejects invalid date format', () => {
                const invalidDateActivity = { 
                    ...validActivity, 
                    activity_date: '15-01-2024' // Wrong format
                };
                
                const result = validateActivityData(invalidDateActivity);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Invalid activity_date format');
            });

            test('rejects invalid time format', () => {
                const invalidTimeActivity = { 
                    ...validActivity, 
                    activity_time: '2 PM' // Wrong format
                };
                
                const result = validateActivityData(invalidTimeActivity);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Invalid activity_time format');
            });

            test('validates recurrence data correctly', () => {
                const recurringActivity = {
                    ...validActivity,
                    is_recurring: true,
                    recurrence_pattern: 'weekly',
                    recurrence_end_date: '2024-12-31'
                };
                
                const result = validateActivityData(recurringActivity);
                expect(result.isValid).toBe(true);
            });

            test('rejects invalid recurrence pattern', () => {
                const invalidRecurrenceActivity = {
                    ...validActivity,
                    is_recurring: true,
                    recurrence_pattern: 'invalid-pattern'
                };
                
                const result = validateActivityData(invalidRecurrenceActivity);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Invalid recurrence pattern');
            });
        });

        describe('validateActivityUpdateData', () => {
            test('validates correct update data successfully', () => {
                const updateData = {
                    title: 'Updated Study Session',
                    priority: 'high',
                    duration_hours: 3
                };
                
                const result = validateActivityUpdateData(updateData);
                expect(result.isValid).toBe(true);
                expect(result.error).toBeNull();
            });

            test('rejects invalid fields', () => {
                const invalidUpdateData = {
                    invalid_field: 'value',
                    another_invalid: 'value'
                };
                
                const result = validateActivityUpdateData(invalidUpdateData);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Invalid fields');
            });

        });

        describe('validateActivityType', () => {
            test('validates correct types', () => {
                expect(validateActivityType('study')).toBe(true);
                expect(validateActivityType('assignment')).toBe(true);
                expect(validateActivityType('exam')).toBe(true);
                expect(validateActivityType('meeting')).toBe(true);
                expect(validateActivityType('personal')).toBe(true);
                expect(validateActivityType('other')).toBe(true);
            });

            test('rejects invalid types', () => {
                expect(validateActivityType('invalid-type')).toBe(false);
                expect(validateActivityType('')).toBe(false);
                expect(validateActivityType(null)).toBe(false);
            });
        });

        describe('validatePriority', () => {
            test('validates correct priorities', () => {
                expect(validatePriority('low')).toBe(true);
                expect(validatePriority('medium')).toBe(true);
                expect(validatePriority('high')).toBe(true);
            });

            test('rejects invalid priorities', () => {
                expect(validatePriority('invalid-priority')).toBe(false);
                expect(validatePriority('')).toBe(false);
                expect(validatePriority(null)).toBe(false);
            });
        });

        describe('validateRecurrencePattern', () => {
            test('validates correct patterns', () => {
                expect(validateRecurrencePattern('daily')).toBe(true);
                expect(validateRecurrencePattern('weekly')).toBe(true);
                expect(validateRecurrencePattern('monthly')).toBe(true);
                expect(validateRecurrencePattern('yearly')).toBe(true);
            });

            test('rejects invalid patterns', () => {
                expect(validateRecurrencePattern('invalid-pattern')).toBe(false);
                expect(validateRecurrencePattern('')).toBe(false);
                expect(validateRecurrencePattern(null)).toBe(false);
            });
        });

        describe('isValidDate', () => {
            test('validates correct date formats', () => {
                expect(isValidDate('2024-01-15')).toBe(true);
                expect(isValidDate('2024-12-31')).toBe(true);
            });

            test('rejects invalid date formats', () => {
                expect(isValidDate('15-01-2024')).toBe(false);
                expect(isValidDate('2024/01/15')).toBe(false);
                expect(isValidDate('invalid-date')).toBe(false);
                expect(isValidDate('2024-13-45')).toBe(false);
            });
        });

        describe('isValidTime', () => {
            test('validates correct time formats', () => {
                expect(isValidTime('14:00:00')).toBe(true);
                expect(isValidTime('09:30')).toBe(true);
                expect(isValidTime('23:59:59')).toBe(true);
            });

            test('rejects invalid time formats', () => {
                expect(isValidTime('2 PM')).toBe(false);
                expect(isValidTime('14:00:00:00')).toBe(false);
                expect(isValidTime('24:00:00')).toBe(false);
                expect(isValidTime('14:60:00')).toBe(false);
            });
        });
    });

    describe('Activity Management Utilities', () => {
        const activities = [
            { 
                title: 'Math Study', 
                activity_type: 'study', 
                priority: 'high', 
                is_completed: false,
                activity_date: '2024-01-15',
                activity_time: '14:00:00',
                duration_hours: 2
            },
            { 
                title: 'Physics Assignment', 
                activity_type: 'assignment', 
                priority: 'medium', 
                is_completed: true,
                activity_date: '2024-01-10',
                activity_time: '10:00:00',
                duration_hours: 1
            },
            { 
                title: 'Chemistry Exam', 
                activity_type: 'exam', 
                priority: 'high', 
                is_completed: false,
                activity_date: '2024-01-20',
                activity_time: '09:00:00',
                duration_hours: 3
            },
            { 
                title: 'Group Meeting', 
                activity_type: 'meeting', 
                priority: 'low', 
                is_completed: false,
                activity_date: '2024-01-12',
                activity_time: '16:00:00',
                duration_hours: 1
            }
        ];

        describe('filterActivitiesByType', () => {
            test('filters activities by type correctly', () => {
                const studyActivities = filterActivitiesByType(activities, 'study');
                expect(studyActivities.length).toBe(1);
                expect(studyActivities.every(activity => activity.activity_type === 'study')).toBe(true);
            });

            test('throws error for invalid type', () => {
                expect(() => filterActivitiesByType(activities, 'invalid-type')).toThrow('Invalid activity type');
            });
        });

        describe('filterActivitiesByPriority', () => {
            test('filters activities by priority correctly', () => {
                const highPriorityActivities = filterActivitiesByPriority(activities, 'high');
                expect(highPriorityActivities.length).toBe(2);
                expect(highPriorityActivities.every(activity => activity.priority === 'high')).toBe(true);
            });
        });

        describe('filterActivitiesByCompletion', () => {
            test('filters activities by completion status correctly', () => {
                const completedActivities = filterActivitiesByCompletion(activities, true);
                expect(completedActivities.length).toBe(1);
                expect(completedActivities.every(activity => activity.is_completed === true)).toBe(true);
            });
        });

        describe('filterActivitiesByDateRange', () => {
            test('filters activities by date range correctly', () => {
                const filtered = filterActivitiesByDateRange(activities, '2024-01-12', '2024-01-15');
                expect(filtered.length).toBe(2);
                expect(filtered.some(activity => activity.title === 'Math Study')).toBe(true);
                expect(filtered.some(activity => activity.title === 'Group Meeting')).toBe(true);
            });

            test('throws error for invalid date range', () => {
                expect(() => filterActivitiesByDateRange(activities, 'invalid-date', '2024-01-15')).toThrow('Invalid date range');
            });
        });

        describe('sortActivities', () => {
            test('sorts activities by date ascending', () => {
                const sorted = sortActivities(activities, 'activity_date', 'asc');
                expect(sorted[0].activity_date).toBe('2024-01-10');
                expect(sorted[3].activity_date).toBe('2024-01-20');
            });

            test('sorts activities by priority descending', () => {
                const sorted = sortActivities(activities, 'priority', 'desc');
                expect(sorted[0].priority).toBe('high');
                expect(sorted[3].priority).toBe('low');
            });

            test('sorts activities by duration descending', () => {
                const sorted = sortActivities(activities, 'duration_hours', 'desc');
                expect(sorted[0].duration_hours).toBe(3);
                expect(sorted[3].duration_hours).toBe(1);
            });
        });

        describe('searchActivities', () => {
            test('searches activities by title', () => {
                const results = searchActivities(activities, 'math');
                expect(results.length).toBe(1);
                expect(results[0].title).toBe('Math Study');
            });

            test('returns all activities for empty query', () => {
                const results = searchActivities(activities, '');
                expect(results.length).toBe(activities.length);
            });
        });

        describe('getOverdueActivities', () => {
            test('gets overdue activities correctly', () => {
                const pastActivity = {
                    title: 'Past Due Assignment',
                    activity_type: 'assignment',
                    is_completed: false,
                    activity_date: '2020-01-01', // Definitely in the past
                    activity_time: '14:00:00',
                    duration_hours: 2
                };
                
                const allActivities = [...activities, pastActivity];
                const overdue = getOverdueActivities(allActivities);
                
                expect(overdue.some(activity => activity.title === 'Past Due Assignment')).toBe(true);
                expect(overdue.every(activity => !activity.is_completed)).toBe(true);
            });
        });
    });

    describe('Pagination Utilities', () => {
        const items = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));

        test('paginates items correctly', () => {
            const result = paginateItems(items, 2, 10);
            
            expect(result.data.length).toBe(10);
            expect(result.data[0].id).toBe(11);
            expect(result.pagination.currentPage).toBe(2);
            expect(result.pagination.totalPages).toBe(3);
            expect(result.pagination.totalItems).toBe(25);
            expect(result.pagination.hasNext).toBe(true);
            expect(result.pagination.hasPrev).toBe(true);
        });

        test('handles empty array', () => {
            const result = paginateItems([], 1, 10);
            
            expect(result.data.length).toBe(0);
            expect(result.pagination.totalPages).toBe(0);
            expect(result.pagination.totalItems).toBe(0);
        });
    });

    describe('Statistics Calculation', () => {
        const activities = [
            { activity_type: 'study', priority: 'high', is_completed: true, duration_hours: 2 },
            { activity_type: 'assignment', priority: 'medium', is_completed: false, duration_hours: 1 },
            { activity_type: 'exam', priority: 'high', is_completed: false, duration_hours: 3 },
            { activity_type: 'study', priority: 'low', is_completed: true, duration_hours: 2 }
        ];

        test('calculates activity statistics correctly', () => {
            const stats = calculateActivityStats(activities);
            
            expect(stats.total).toBe(4);
            expect(stats.completed).toBe(2);
            expect(stats.pending).toBe(2);
            expect(stats.by_type.study).toBe(2);
            expect(stats.by_type.assignment).toBe(1);
            expect(stats.by_type.exam).toBe(1);
            expect(stats.by_priority.high).toBe(2);
            expect(stats.by_priority.medium).toBe(1);
            expect(stats.by_priority.low).toBe(1);
            expect(stats.total_study_hours).toBe(8);
            expect(stats.average_duration).toBe(2);
            expect(stats.completion_rate).toBe(50);
        });
    });

    describe('Response Formatting', () => {
        test('formats activity response correctly', () => {
            const activity = {
                id: '123',
                user_id: '456',
                title: 'Test Activity',
                activity_type: 'study',
                description: 'Test description',
                activity_date: '2024-01-15',
                activity_time: '14:00:00',
                duration_hours: 2,
                location: 'Library',
                priority: 'high',
                group_id: null,
                is_completed: false,
                completed_at: null,
                is_recurring: false,
                recurrence_pattern: null,
                recurrence_end_date: null,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z'
            };

            const formatted = formatActivityResponse(activity);
            
            expect(formatted.id).toBe('123');
            expect(formatted.title).toBe('Test Activity');
            expect(formatted.activity_type).toBe('study');
            expect(formatted.duration_hours).toBe(2);
            expect(formatted.priority).toBe('high');
            expect(formatted.created_at).toBe('2024-01-01T00:00:00.000Z');
        });

        test('includes user and group details when available', () => {
            const activity = {
                id: '123',
                user_id: '456',
                title: 'Test Activity',
                activity_type: 'study',
                activity_date: '2024-01-15',
                activity_time: '14:00:00',
                duration_hours: 2,
                created_at: '2024-01-01T00:00:00Z',
                profiles: {
                    name: 'John Doe',
                    email: 'john@example.com',
                    faculty: 'Science',
                    course: 'Computer Science'
                },
                study_groups: {
                    name: 'Study Group',
                    subject: 'Math',
                    description: 'Math study group'
                }
            };

            const formatted = formatActivityResponse(activity);
            
            expect(formatted.user_details.name).toBe('John Doe');
            expect(formatted.user_details.email).toBe('john@example.com');
            expect(formatted.group_details.name).toBe('Study Group');
            expect(formatted.group_details.subject).toBe('Math');
        });
    });

    describe('Mock Data Generation', () => {
        test('generates mock activity with default values', () => {
            const mockActivity = generateMockActivity();
            
            expect(mockActivity.title).toContain('Study Session');
            expect(Object.values(ACTIVITY_TYPES)).toContain(mockActivity.activity_type);
            expect(Object.values(PRIORITY_LEVELS)).toContain(mockActivity.priority);
            expect(mockActivity.duration_hours).toBeGreaterThan(0);
            expect(mockActivity.duration_hours).toBeLessThanOrEqual(24);
        });

        test('generates mock activity with overrides', () => {
            const overrides = {
                title: 'Custom Activity',
                activity_type: 'exam',
                priority: 'high'
            };
            
            const mockActivity = generateMockActivity(overrides);
            
            expect(mockActivity.title).toBe('Custom Activity');
            expect(mockActivity.activity_type).toBe('exam');
            expect(mockActivity.priority).toBe('high');
        });
    });

    describe('Permission Checking', () => {
        test('allows update when user IDs match', () => {
            expect(canUpdateActivity('user123', 'user123')).toBe(true);
        });

        test('denies update when user IDs do not match', () => {
            expect(canUpdateActivity('user123', 'user456')).toBe(false);
        });

        test('allows delete when user IDs match', () => {
            expect(canDeleteActivity('user123', 'user123')).toBe(true);
        });

        test('denies delete when user IDs do not match', () => {
            expect(canDeleteActivity('user123', 'user456')).toBe(false);
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
        });

        test('validates response without data', () => {
            const response = {
                error: null
            };
            
            const result = validateSupabaseResponse(response);
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('No data in response');
        });
    });
});