
// calendarUtils.test.js - Comprehensive tests for calendar utility functions
const {
    activityTypes,
    priorityLevels,
    durationOptions,
    timeSlots,
    recurrenceOptions,
    dayOfWeekOptions,
    fixActivityDates,
    fixGroupDates,
    formatDateTimeLocal,
    formatTime,
    calculateDuration,
    formatDateForInput,
    formatTimeForInput,
    formatDisplayDate,
    getActivitiesForDate,
    getStudyGroupsForDate,
    getAllUpcomingEvents,
    calculateCalendarStats,
    validateActivityForm,
    formatActivityData,
    isToday,
    isPastDate,
    isFutureDate,
    getWeekRange,
    getMonthRange,
    generateMonthDays,
    debounce,
    throttle,
    getActivityTypeInfo,
    getPriorityInfo,
    filterActivitiesByType,
    sortActivitiesByDateTime,
    searchActivities
} = require('../src/frontend/test_utils/calendarUtils');

describe('Calendar Utility Functions', () => {
    describe('Constants', () => {
        test('activityTypes contains all expected types', () => {
            expect(activityTypes.study).toBeDefined();
            expect(activityTypes.assignment).toBeDefined();
            expect(activityTypes.exam).toBeDefined();
            expect(activityTypes.meeting).toBeDefined();
            expect(activityTypes.personal).toBeDefined();
            expect(activityTypes.break).toBeDefined();
            expect(activityTypes.exercise).toBeDefined();
        });

        test('priorityLevels contains all expected levels', () => {
            expect(priorityLevels.low).toBeDefined();
            expect(priorityLevels.medium).toBeDefined();
            expect(priorityLevels.high).toBeDefined();
            expect(priorityLevels.urgent).toBeDefined();
        });

        test('durationOptions contains expected values', () => {
            expect(durationOptions).toHaveLength(8);
            expect(durationOptions[0].value).toBe(0.5);
            expect(durationOptions[3].value).toBe(2);
        });

        test('timeSlots contains 48 slots (24 hours * 2)', () => {
            expect(timeSlots).toHaveLength(48);
            expect(timeSlots[0].value).toBe('00:00');
            expect(timeSlots[47].value).toBe('23:30');
        });

        test('recurrenceOptions contains expected options', () => {
            expect(recurrenceOptions).toHaveLength(5);
            expect(recurrenceOptions[0].value).toBe('none');
        });

        test('dayOfWeekOptions contains all 7 days', () => {
            expect(dayOfWeekOptions).toHaveLength(7);
            expect(dayOfWeekOptions[0].label).toBe('Sunday');
            expect(dayOfWeekOptions[6].label).toBe('Saturday');
        });
    });

    describe('Date/Time Functions', () => {
        describe('fixActivityDates', () => {
            test('fixes activity dates with timezone handling', () => {
                const activity = {
                    activity_date: '2024-01-15',
                    scheduled_start: '2024-01-15T10:00:00Z'
                };

                const fixedActivity = fixActivityDates(activity);
                
                expect(fixedActivity.activity_date_fixed).toBeDefined();
                expect(fixedActivity.activity_date_utc).toBe('2024-01-15');
                expect(fixedActivity.scheduled_start_fixed).toBeDefined();
            });

            test('handles empty activity gracefully', () => {
                expect(fixActivityDates(null)).toBeNull();
                expect(fixActivityDates(undefined)).toBeUndefined();
            });

            test('handles activity without dates', () => {
                const activity = { title: 'Test Activity' };
                const fixedActivity = fixActivityDates(activity);
                
                expect(fixedActivity.title).toBe('Test Activity');
                expect(fixedActivity.activity_date_fixed).toBeUndefined();
            });
        });

        describe('fixGroupDates', () => {
            test('fixes group dates with timezone handling', () => {
                const group = {
                    date: '2024-01-15',
                    scheduled_start: '2024-01-15T14:00:00Z',
                    scheduled_end: '2024-01-15T16:00:00Z'
                };

                const fixedGroup = fixGroupDates(group);
                
                expect(fixedGroup.date_fixed).toBeDefined();
                expect(fixedGroup.date_utc).toBeDefined();
                expect(fixedGroup.scheduled_start_fixed).toBeDefined();
                expect(fixedGroup.scheduled_end_fixed).toBeDefined();
            });

            test('handles empty group gracefully', () => {
                expect(fixGroupDates(null)).toBeNull();
                expect(fixGroupDates(undefined)).toBeUndefined();
            });
        });

        describe('formatDateTimeLocal', () => {
            test('formats date correctly', () => {
                const date = new Date('2024-01-15T14:30:00Z');
                const formatted = formatDateTimeLocal(date);
                
                expect(typeof formatted).toBe('string');
                expect(formatted).toContain('2024');
            });

            test('handles invalid date', () => {
                expect(formatDateTimeLocal(new Date('invalid'))).toBe('');
                expect(formatDateTimeLocal('not a date')).toBe('');
            });
        });

        describe('formatTime', () => {
            test('formats time correctly', () => {
                const date = new Date('2024-01-15T14:30:00Z');
                const formatted = formatTime(date);
                
                expect(typeof formatted).toBe('string');
                expect(formatted).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/);
            });

            test('handles invalid date', () => {
                expect(formatTime(new Date('invalid'))).toBe('');
            });
        });

        describe('calculateDuration', () => {
            test('calculates duration correctly', () => {
                const start = '2024-01-15T10:00:00Z';
                const end = '2024-01-15T12:00:00Z';
                
                expect(calculateDuration(start, end)).toBe(2);
            });

            test('handles invalid dates', () => {
                expect(calculateDuration('invalid', '2024-01-15T10:00:00Z')).toBe(1);
                expect(calculateDuration(null, null)).toBe(1);
            });

            test('returns minimum 0.5 hours', () => {
                const start = '2024-01-15T10:00:00Z';
                const end = '2024-01-15T10:15:00Z';
                
                expect(calculateDuration(start, end)).toBe(0.5);
            });
        });

        describe('formatDateForInput', () => {
            test('formats date for input field', () => {
                const date = new Date('2024-01-15');
                expect(formatDateForInput(date)).toBe('2024-01-15');
            });

            test('handles invalid date', () => {
                expect(formatDateForInput(new Date('invalid'))).toBe('');
            });
        });

        describe('formatTimeForInput', () => {

            test('handles invalid date', () => {
                expect(formatTimeForInput(new Date('invalid'))).toBe('00:00');
            });
        });

        describe('formatDisplayDate', () => {
            test('formats date for display', () => {
                expect(formatDisplayDate('2024-01-15')).toContain('Jan');
                expect(formatDisplayDate('2024-01-15')).toContain('15');
            });

            test('handles invalid date string', () => {
                expect(formatDisplayDate('invalid-date')).toBe('invalid-date');
            });

            test('handles empty input', () => {
                expect(formatDisplayDate('')).toBe('');
            });
        });
    });

    describe('Activity and Group Filtering', () => {
        const mockActivities = [
            {
                id: '1',
                user_id: 'user1',
                title: 'Math Study',
                activity_type: 'study',
                activity_date: '2024-01-15',
                activity_date_fixed: '2024-01-15',
                activity_time: '10:00',
                is_completed: false
            },
            {
                id: '2',
                user_id: 'user1',
                title: 'Physics Assignment',
                activity_type: 'assignment',
                activity_date: '2024-01-16',
                activity_date_fixed: '2024-01-16',
                activity_time: '14:00',
                is_completed: true
            },
            {
                id: '3',
                user_id: 'user2',
                title: 'Chemistry Review',
                activity_type: 'study',
                activity_date: '2024-01-15',
                activity_date_fixed: '2024-01-15',
                activity_time: '16:00',
                is_completed: false
            }
        ];

        const mockStudyGroups = [
            {
                id: '1',
                title: 'Study Group A',
                date: '2024-01-15',
                date_fixed: '2024-01-15',
                time: '13:00',
                subject: 'Mathematics'
            },
            {
                id: '2',
                title: 'Study Group B',
                date: '2024-01-17',
                date_fixed: '2024-01-17',
                time: '15:00',
                subject: 'Physics'
            }
        ];

        describe('getActivitiesForDate', () => {
            test('filters activities for specific date', () => {
                const date = new Date('2024-01-15');
                const activities = getActivitiesForDate(mockActivities, date, 'user1');
                
                expect(activities).toHaveLength(1);
                expect(activities[0].title).toBe('Math Study');
            });

            test('filters out completed activities', () => {
                const date = new Date('2024-01-16');
                const activities = getActivitiesForDate(mockActivities, date, 'user1');
                
                expect(activities).toHaveLength(0);
            });

            test('handles empty inputs', () => {
                expect(getActivitiesForDate(null, new Date())).toEqual([]);
                expect(getActivitiesForDate([], new Date())).toEqual([]);
                expect(getActivitiesForDate(mockActivities, null)).toEqual([]);
            });
        });

        describe('getStudyGroupsForDate', () => {
            test('filters study groups for specific date', () => {
                const date = new Date('2024-01-15');
                const groups = getStudyGroupsForDate(mockStudyGroups, date);
                
                expect(groups).toHaveLength(1);
                expect(groups[0].title).toBe('Study Group A');
            });

            test('handles empty inputs', () => {
                expect(getStudyGroupsForDate(null, new Date())).toEqual([]);
                expect(getStudyGroupsForDate([], new Date())).toEqual([]);
            });
        });

        describe('getAllUpcomingEvents', () => {
            test('combines and sorts upcoming events', () => {
                const today = new Date();
                const futureDate = new Date(today);
                futureDate.setDate(today.getDate() + 1);
                
                const futureActivities = mockActivities.map(activity => ({
                    ...activity,
                    activity_date: formatDateForInput(futureDate),
                    activity_date_fixed: formatDateForInput(futureDate)
                }));
                
                const futureGroups = mockStudyGroups.map(group => ({
                    ...group,
                    date: formatDateForInput(futureDate),
                    date_fixed: formatDateForInput(futureDate)
                }));
                
                const events = getAllUpcomingEvents(futureActivities, futureGroups, 'user1', 5);
                
                expect(events.length).toBeGreaterThan(0);
            });

            test('filters out past events', () => {
                const pastDate = new Date('2020-01-01');
                
                const pastActivities = mockActivities.map(activity => ({
                    ...activity,
                    activity_date: formatDateForInput(pastDate),
                    activity_date_fixed: formatDateForInput(pastDate)
                }));
                
                const events = getAllUpcomingEvents(pastActivities, [], 'user1');
                expect(events).toHaveLength(0);
            });

            test('handles empty inputs', () => {
                expect(getAllUpcomingEvents(null, null)).toEqual([]);
                expect(getAllUpcomingEvents([], [])).toEqual([]);
            });
        });
    });

    describe('Statistics Calculation', () => {
        const mockActivities = [
            {
                user_id: 'user1',
                activity_type: 'study',
                activity_date: '2024-01-15',
                activity_date_fixed: '2024-01-15',
                is_completed: false
            },
            {
                user_id: 'user1',
                activity_type: 'assignment',
                activity_date: '2024-01-16',
                activity_date_fixed: '2024-01-16',
                is_completed: true
            },
            {
                user_id: 'user2',
                activity_type: 'study',
                activity_date: '2024-01-15',
                activity_date_fixed: '2024-01-15',
                is_completed: false
            }
        ];

        const mockStudyGroups = [
            {
                date: '2024-01-15',
                date_fixed: '2024-01-15'
            },
            {
                date: '2024-01-20',
                date_fixed: '2024-01-20'
            }
        ];

        describe('calculateCalendarStats', () => {
            test('calculates correct statistics', () => {
                const stats = calculateCalendarStats(mockActivities, mockStudyGroups, 'user1');
                
                expect(stats).toHaveProperty('studySessions');
                expect(stats).toHaveProperty('upcomingDeadlines');
                expect(stats).toHaveProperty('groupSessions');
                expect(stats).toHaveProperty('completedActivities');
            });

            test('handles empty inputs', () => {
                const stats = calculateCalendarStats([], [], 'user1');
                
                expect(stats.studySessions).toBe(0);
                expect(stats.groupSessions).toBe(0);
                expect(stats.completedActivities).toBe(0);
            });
        });
    });

    describe('Form Validation and Data Formatting', () => {
        describe('validateActivityForm', () => {

            test('detects missing required fields', () => {
                const formData = {
                    title: '',
                    activity_date: '',
                    activity_time: '',
                    activity_type: ''
                };
                
                const errors = validateActivityForm(formData);
                expect(errors.length).toBeGreaterThan(0);
            });

            test('detects past dates', () => {
                const pastDate = new Date();
                pastDate.setDate(pastDate.getDate() - 1);
                
                const formData = {
                    title: 'Test Activity',
                    activity_date: formatDateForInput(pastDate),
                    activity_time: '10:00',
                    activity_type: 'study',
                    duration_hours: '2'
                };
                
                const errors = validateActivityForm(formData);
                expect(errors).toContain('Cannot add activities for past dates');
            });

            test('validates duration range', () => {
                const formData = {
                    title: 'Test Activity',
                    activity_date: '2024-01-15',
                    activity_time: '10:00',
                    activity_type: 'study',
                    duration_hours: '25'
                };
                
                const errors = validateActivityForm(formData);
                expect(errors).toContain('Duration must be between 0.5 and 24 hours');
            });
        });

        describe('formatActivityData', () => {
            test('formats activity data correctly', () => {
                const formData = {
                    title: '  Test Activity  ',
                    activity_type: 'study',
                    description: '  Test Description  ',
                    activity_date: '2024-01-15',
                    activity_time: '10:00',
                    duration_hours: '2',
                    location: '  Library  ',
                    priority: 'high',
                    is_completed: true,
                    recurrence: 'weekly'
                };
                
                const result = formatActivityData(formData, 'user123');
                
                expect(result.user_id).toBe('user123');
                expect(result.title).toBe('Test Activity');
                expect(result.description).toBe('Test Description');
                expect(result.location).toBe('Library');
                expect(result.priority).toBe('high');
                expect(result.is_completed).toBe(true);
                expect(result.recurrence).toBe('weekly');
            });

            test('throws error for missing data', () => {
                expect(() => formatActivityData(null, 'user123')).toThrow();
                expect(() => formatActivityData({}, null)).toThrow();
            });
        });
    });

    describe('Date Utility Functions', () => {
        describe('isToday', () => {
            test('identifies today correctly', () => {
                const today = new Date();
                expect(isToday(today)).toBe(true);
            });

            test('identifies non-today dates', () => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                expect(isToday(tomorrow)).toBe(false);
            });

            test('handles invalid date', () => {
                expect(isToday(new Date('invalid'))).toBe(false);
            });
        });

        describe('isPastDate', () => {
            test('identifies past dates', () => {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                expect(isPastDate(yesterday)).toBe(true);
            });

            test('identifies non-past dates', () => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                expect(isPastDate(tomorrow)).toBe(false);
            });
        });

        describe('isFutureDate', () => {
            test('identifies future dates', () => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                expect(isFutureDate(tomorrow)).toBe(true);
            });

            test('identifies non-future dates', () => {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                expect(isFutureDate(yesterday)).toBe(false);
            });
        });

        describe('getWeekRange', () => {
            test('calculates week range correctly', () => {
                const date = new Date('2024-01-15'); // Monday
                const weekRange = getWeekRange(date);
                
                expect(weekRange.start.getDay()).toBe(0); // Sunday
                expect(weekRange.end.getDay()).toBe(6); // Saturday
            });

            test('handles invalid date', () => {
                const weekRange = getWeekRange(new Date('invalid'));
                expect(weekRange.start).toBeInstanceOf(Date);
                expect(weekRange.end).toBeInstanceOf(Date);
            });
        });

        describe('getMonthRange', () => {
            test('calculates month range correctly', () => {
                const date = new Date('2024-01-15');
                const monthRange = getMonthRange(date);
                
                expect(monthRange.start.getMonth()).toBe(0); // January
                expect(monthRange.end.getMonth()).toBe(0); // January
                expect(monthRange.start.getDate()).toBe(1);
            });

            test('handles invalid date', () => {
                const monthRange = getMonthRange(new Date('invalid'));
                expect(monthRange.start).toBeInstanceOf(Date);
                expect(monthRange.end).toBeInstanceOf(Date);
            });
        });

        describe('generateMonthDays', () => {
            test('generates correct number of days', () => {
                const days = generateMonthDays(2024, 0); // January 2024
                expect(days).toHaveLength(42); // 6 weeks
            });

            test('includes previous and next month days', () => {
                const days = generateMonthDays(2024, 0);
                const otherMonthDays = days.filter(day => day.isOtherMonth);
                expect(otherMonthDays.length).toBeGreaterThan(0);
            });

            test('handles invalid parameters', () => {
                const days = generateMonthDays('invalid', 'invalid');
                expect(days).toHaveLength(42);
            });
        });
    });

    describe('Performance and Utility Functions', () => {
        describe('debounce', () => {
            test('delays function execution', (done) => {
                let callCount = 0;
                const debouncedFn = debounce(() => {
                    callCount++;
                }, 100);

                debouncedFn();
                debouncedFn();
                debouncedFn();

                expect(callCount).toBe(0);

                setTimeout(() => {
                    expect(callCount).toBe(1);
                    done();
                }, 150);
            });
        });

        describe('throttle', () => {
            test('limits function execution rate', (done) => {
                let callCount = 0;
                const throttledFn = throttle(() => {
                    callCount++;
                }, 100);

                throttledFn();
                throttledFn();
                throttledFn();

                expect(callCount).toBe(1);

                setTimeout(() => {
                    throttledFn();
                    expect(callCount).toBe(2);
                    done();
                }, 150);
            });
        });
    });

    describe('Activity Management Functions', () => {
        const mockActivities = [
            {
                title: 'Math Study',
                activity_type: 'study',
                activity_date: '2024-01-15',
                activity_date_fixed: '2024-01-15',
                activity_time: '10:00',
                priority: 'high'
            },
            {
                title: 'Physics Assignment',
                activity_type: 'assignment',
                activity_date: '2024-01-16',
                activity_date_fixed: '2024-01-16',
                activity_time: '14:00',
                priority: 'medium'
            },
            {
                title: 'Chemistry Review',
                activity_type: 'study',
                activity_date: '2024-01-15',
                activity_date_fixed: '2024-01-15',
                activity_time: '09:00',
                priority: 'low'
            }
        ];

        describe('getActivityTypeInfo', () => {
            test('returns correct activity type info', () => {
                const studyInfo = getActivityTypeInfo('study');
                expect(studyInfo.name).toBe('Study Session');
                expect(studyInfo.icon).toBe('fa-book');

                const defaultInfo = getActivityTypeInfo('unknown');
                expect(defaultInfo.name).toBe('Study Session');
            });
        });

        describe('getPriorityInfo', () => {
            test('returns correct priority info', () => {
                const highInfo = getPriorityInfo('high');
                expect(highInfo.name).toBe('High');
                expect(highInfo.color).toBe('#e74c3c');

                const defaultInfo = getPriorityInfo('unknown');
                expect(defaultInfo.name).toBe('Medium');
            });
        });

        describe('filterActivitiesByType', () => {
            test('filters activities by type', () => {
                const studyActivities = filterActivitiesByType(mockActivities, 'study');
                expect(studyActivities).toHaveLength(2);
                expect(studyActivities.every(a => a.activity_type === 'study')).toBe(true);
            });

            test('handles empty inputs', () => {
                expect(filterActivitiesByType(null, 'study')).toEqual([]);
                expect(filterActivitiesByType([], 'study')).toEqual([]);
            });
        });

        describe('sortActivitiesByDateTime', () => {
            test('sorts activities by date and time', () => {
                const sorted = sortActivitiesByDateTime(mockActivities, true);
                
                expect(sorted[0].activity_time).toBe('09:00');
                expect(sorted[1].activity_time).toBe('10:00');
                expect(sorted[2].activity_date).toBe('2024-01-16');
            });

            test('sorts in descending order', () => {
                const sorted = sortActivitiesByDateTime(mockActivities, false);
                
                expect(sorted[0].activity_date).toBe('2024-01-16');
                expect(sorted[2].activity_time).toBe('09:00');
            });

            test('handles empty inputs', () => {
                expect(sortActivitiesByDateTime(null)).toEqual([]);
                expect(sortActivitiesByDateTime([])).toEqual([]);
            });
        });

        describe('searchActivities', () => {
            test('searches activities by title', () => {
                const results = searchActivities(mockActivities, 'math');
                expect(results).toHaveLength(1);
                expect(results[0].title).toBe('Math Study');
            });

            test('searches activities by description', () => {
                const activitiesWithDesc = [
                    {
                        ...mockActivities[0],
                        description: 'Advanced calculus topics'
                    }
                ];
                
                const results = searchActivities(activitiesWithDesc, 'calculus');
                expect(results).toHaveLength(1);
            });

            test('returns all activities when no search term', () => {
                const results = searchActivities(mockActivities, '');
                expect(results).toHaveLength(3);
            });

            test('handles empty inputs', () => {
                expect(searchActivities(null, 'test')).toEqual([]);
                expect(searchActivities([], 'test')).toEqual([]);
            });
        });
    });

    describe('Edge Cases and Error Handling', () => {

        test('handles timezone edge cases', () => {
            const activity = {
                activity_date: '2024-01-15',
                scheduled_start: '2024-01-15T00:00:00Z',
                scheduled_end: '2024-01-15T23:59:59Z'
            };

            const fixedActivity = fixActivityDates(activity);
            
            expect(fixedActivity.activity_date_fixed).toBeDefined();
            expect(fixedActivity.scheduled_start_fixed).toBeDefined();
            expect(fixedActivity.scheduled_end_fixed).toBeDefined();
        });

        test('handles boundary dates', () => {
            const minDate = new Date('1970-01-01');
            const maxDate = new Date('2038-01-19');
            
            expect(isPastDate(minDate)).toBe(true);
            expect(isFutureDate(maxDate)).toBe(true);
        });
    });
});
