
// remindersUtils.test.js - Comprehensive tests for reminder utility functions
const {
    reminderConfig,
    validEmailDomains,
    eventTypes,
    reminderStatuses,
    isValidWitsEmail,
    validateReminderData,
    generateReminderSubject,
    generateReminderMessage,
    calculateReminderTimes,
    generateReminderKey,
    validateEventForReminders,
    filterEventsForReminders,
    sortEventsByDate,
    calculateNextRefreshTime,
    formatDuration,
    debounce,
    throttle,
    createNotificationData,
    validateReminderTiming,
    mergeEvents,
    cleanupOldReminders,
    getReminderStatistics
} = require('../src/frontend/test_utils/remindersUtils');

describe('Reminders Utility Functions', () => {
    describe('Constants', () => {
        test('reminderConfig is defined correctly', () => {
            expect(reminderConfig).toBeDefined();
            expect(reminderConfig.times).toBeDefined();
            expect(Array.isArray(reminderConfig.times)).toBe(true);
        });

        test('reminderConfig.times contains valid reminder times', () => {
            expect(reminderConfig.times).toHaveLength(4);
            expect(reminderConfig.times[0]).toEqual({ hours: 23, label: '23 hours before' });
            expect(reminderConfig.times[1]).toEqual({ hours: 5, label: '5 hours before' });
            expect(reminderConfig.times[2]).toEqual({ hours: 1, label: '1 hour before' });
            expect(reminderConfig.times[3]).toEqual({ minutes: 5, label: '5 minutes before' });
        });

        test('reminderConfig.validation contains valid rules', () => {
            expect(reminderConfig.validation).toBeDefined();
            expect(reminderConfig.validation.maxRemindersPerEvent).toBe(10);
            expect(reminderConfig.validation.maxEmailLength).toBe(1000);
            expect(reminderConfig.validation.minDelayMinutes).toBe(1);
            expect(reminderConfig.validation.maxDelayDays).toBe(30);
        });

        test('validEmailDomains contains Wits domains', () => {
            expect(validEmailDomains).toContain('students.wits.ac.za');
            expect(validEmailDomains).toContain('wits.ac.za');
            expect(validEmailDomains).toHaveLength(2);
        });

        test('eventTypes contains all expected types', () => {
            expect(eventTypes.ACTIVITY).toBe('activity');
            expect(eventTypes.STUDY_GROUP).toBe('study_group');
            expect(Object.keys(eventTypes)).toHaveLength(2);
        });

        test('reminderStatuses contains all expected statuses', () => {
            expect(reminderStatuses.SCHEDULED).toBe('scheduled');
            expect(reminderStatuses.SENT).toBe('sent');
            expect(reminderStatuses.FAILED).toBe('failed');
            expect(reminderStatuses.CANCELLED).toBe('cancelled');
            expect(Object.keys(reminderStatuses)).toHaveLength(4);
        });
    });

    describe('Email Validation', () => {
        describe('isValidWitsEmail', () => {
            test('validates correct Wits student emails', () => {
                expect(isValidWitsEmail('1234567@students.wits.ac.za')).toBe(true);
                expect(isValidWitsEmail('9876543@students.wits.ac.za')).toBe(true);
            });

            test('validates correct Wits staff emails', () => {
                expect(isValidWitsEmail('staff.member@wits.ac.za')).toBe(true);
                expect(isValidWitsEmail('first.last@wits.ac.za')).toBe(true);
            });

            test('rejects invalid email domains', () => {
                expect(isValidWitsEmail('invalid@email.com')).toBe(false);
                expect(isValidWitsEmail('student@other.ac.za')).toBe(false);
            });

            test('rejects malformed email addresses', () => {
                expect(isValidWitsEmail('@students.wits.ac.za')).toBe(false);
                expect(isValidWitsEmail('student@.wits.ac.za')).toBe(false);
            });

            test('rejects non-string inputs', () => {
                expect(isValidWitsEmail('')).toBe(false);
                expect(isValidWitsEmail(null)).toBe(false);
                expect(isValidWitsEmail(undefined)).toBe(false);
                expect(isValidWitsEmail(1234567)).toBe(false);
            });
        });
    });

    describe('Reminder Data Validation', () => {
        describe('validateReminderData', () => {
            test('validates correct reminder data for activity', () => {
                const validData = {
                    to: '1234567@students.wits.ac.za',
                    subject: 'Test Reminder',
                    message: 'Test message',
                    event_type: eventTypes.ACTIVITY,
                    event_id: 'event123'
                };

                const errors = validateReminderData(validData);
                expect(errors).toHaveLength(0);
            });

            test('validates correct reminder data for study group', () => {
                const validData = {
                    to: 'staff@wits.ac.za',
                    subject: 'Study Group Reminder',
                    message: 'Physics study group session',
                    event_type: eventTypes.STUDY_GROUP,
                    event_id: 'group_456'
                };

                const errors = validateReminderData(validData);
                expect(errors).toHaveLength(0);
            });

            test('detects missing required fields', () => {
                const invalidData = {
                    to: '',
                    subject: '',
                    message: '',
                    event_type: '',
                    event_id: ''
                };

                const errors = validateReminderData(invalidData);
                expect(errors.length).toBeGreaterThan(0);
            });

            test('detects invalid email addresses', () => {
                const invalidData = {
                    to: 'invalid@email.com',
                    subject: 'Test',
                    message: 'Test message',
                    event_type: eventTypes.ACTIVITY,
                    event_id: 'event123'
                };

                const errors = validateReminderData(invalidData);
                expect(errors).toContain('Valid Wits email address is required');
            });

            test('handles null data gracefully', () => {
                const errors = validateReminderData(null);
                expect(errors).toContain('Reminder data is required');
            });
        });
    });

    describe('Reminder Content Generation', () => {
        const mockActivity = {
            id: 'activity_123',
            title: 'Mathematics Study Session',
            datetime: new Date('2024-01-15T14:00:00Z'),
            location: 'Main Library',
            duration: 2,
            activity_type: 'study',
            subject: 'Advanced Calculus',
            description: 'Reviewing limits and derivatives'
        };

        const mockStudyGroup = {
            id: 'group_456',
            title: 'Physics Study Group',
            datetime: new Date('2024-01-16T16:00:00Z'),
            location: 'Science Building',
            duration: 1.5,
            subject: 'Quantum Mechanics',
            faculty: 'Faculty of Science',
            description: 'Weekly study group'
        };

        describe('generateReminderSubject', () => {
            test('generates subject for activity with reminder time', () => {
                const subject = generateReminderSubject(mockActivity, '1 hour before', eventTypes.ACTIVITY);
                expect(subject).toContain('Mathematics Study Session');
                expect(subject).toContain('1 hour before');
            });

            test('generates subject for study group with reminder time', () => {
                const subject = generateReminderSubject(mockStudyGroup, '5 hours before', eventTypes.STUDY_GROUP);
                expect(subject).toContain('Physics Study Group');
                expect(subject).toContain('5 hours before');
            });

            test('handles missing event title', () => {
                const eventWithoutTitle = { ...mockActivity, title: '' };
                const subject = generateReminderSubject(eventWithoutTitle, '1 hour before');
                expect(subject).toBe('Wits Study Buddy Reminder');
            });


            test('handles null event', () => {
                const subject = generateReminderSubject(null, '1 hour before');
                expect(subject).toBe('Wits Study Buddy Reminder');
            });
        });

        describe('generateReminderMessage', () => {
            test('generates complete HTML message for activity', () => {
                const message = generateReminderMessage(mockActivity, '1 hour before', 'John Doe');
                
                expect(message).toContain('Mathematics Study Session');
                expect(message).toContain('John Doe');
                expect(message).toContain('1 hour before');
                expect(message).toContain('Main Library');
                expect(message).toContain('Advanced Calculus');
            });

            test('handles activity without optional fields', () => {
                const minimalActivity = {
                    title: 'Minimal Activity',
                    datetime: new Date('2024-01-15T10:00:00Z')
                };
                
                const message = generateReminderMessage(minimalActivity, '1 hour before');
                expect(message).toContain('Minimal Activity');
            });

            test('handles string datetime', () => {
                const eventWithStringDate = {
                    title: 'Test Event',
                    datetime: '2024-01-15T10:00:00Z'
                };
                
                const message = generateReminderMessage(eventWithStringDate, '1 hour before');
                expect(message).toContain('Test Event');
            });

            test('handles null event', () => {
                const message = generateReminderMessage(null, '1 hour before');
                expect(message).toContain('upcoming event');
            });
        });
    });

    describe('Reminder Timing Calculations', () => {
        describe('calculateReminderTimes', () => {
            test('calculates reminder times for future event', () => {
                const eventDateTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
                const reminderTimes = calculateReminderTimes(eventDateTime);
                
                expect(Array.isArray(reminderTimes)).toBe(true);
                expect(reminderTimes.length).toBeGreaterThan(0);
            });

            test('throws error for past event', () => {
                const pastDateTime = new Date(Date.now() - 1000);
                expect(() => calculateReminderTimes(pastDateTime)).toThrow('Event must be in the future');
            });

        });

        describe('validateReminderTiming', () => {
            test('validates correct timing for future event', () => {
                const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
                const errors = validateReminderTiming(futureDate, reminderConfig);
                expect(errors).toHaveLength(0);
            });

            test('detects past event', () => {
                const pastDate = new Date(Date.now() - 1000);
                const errors = validateReminderTiming(pastDate, reminderConfig);
                expect(errors).toContain('Event must be in the future');
            });
        });
    });

    describe('Event Management', () => {
        const mockEvents = [
            {
                id: '1',
                title: 'Past Event',
                datetime: new Date('2023-01-01T10:00:00Z'),
                user_id: 'user1',
                is_completed: false
            },
            {
                id: '2',
                title: 'Future Event',
                datetime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                user_id: 'user1',
                is_completed: false
            },
            {
                id: '3',
                title: 'Completed Event',
                datetime: new Date(Date.now() + 48 * 60 * 60 * 1000),
                user_id: 'user1',
                is_completed: true
            }
        ];

        describe('validateEventForReminders', () => {
            test('validates correct event data', () => {
                const validEvent = {
                    id: 'event123',
                    title: 'Test Event',
                    datetime: new Date(Date.now() + 1000)
                };
                
                const errors = validateEventForReminders(validEvent);
                expect(errors).toHaveLength(0);
            });

            test('detects missing event ID', () => {
                const eventWithoutId = {
                    title: 'Test Event',
                    datetime: new Date(Date.now() + 1000)
                };
                
                const errors = validateEventForReminders(eventWithoutId);
                expect(errors).toContain('Event ID is required');
            });

            test('detects past event datetime', () => {
                const pastEvent = {
                    id: 'event123',
                    title: 'Past Event',
                    datetime: new Date('2020-01-01T10:00:00Z')
                };
                
                const errors = validateEventForReminders(pastEvent);
                expect(errors).toContain('Event must be in the future');
            });
        });

        describe('filterEventsForReminders', () => {
            test('filters events for specific user', () => {
                const filtered = filterEventsForReminders(mockEvents, 'user1');
                expect(filtered.length).toBeGreaterThan(0);
            });

            test('filters events without user filter', () => {
                const filtered = filterEventsForReminders(mockEvents);
                expect(filtered.length).toBeGreaterThan(0);
            });

            test('returns empty array for empty input', () => {
                expect(filterEventsForReminders([])).toEqual([]);
                expect(filterEventsForReminders(null)).toEqual([]);
            });
        });

        describe('sortEventsByDate', () => {
            test('sorts events in ascending order', () => {
                const events = [
                    { id: '1', datetime: new Date('2024-01-20T10:00:00Z') },
                    { id: '2', datetime: new Date('2024-01-15T10:00:00Z') },
                    { id: '3', datetime: new Date('2024-01-25T10:00:00Z') }
                ];
                
                const sorted = sortEventsByDate(events);
                expect(sorted[0].id).toBe('2');
                expect(sorted[1].id).toBe('1');
                expect(sorted[2].id).toBe('3');
            });

            test('handles empty array', () => {
                expect(sortEventsByDate([])).toEqual([]);
            });
        });

        describe('mergeEvents', () => {
            test('merges activities and study groups correctly', () => {
                const activities = [
                    {
                        id: 'act1',
                        title: 'Math Study',
                        activity_date: '2024-01-15',
                        activity_time: '10:00'
                    }
                ];
                
                const studyGroups = [
                    {
                        id: 'grp1',
                        title: 'Physics Group',
                        date: '2024-01-16',
                        time: '14:00'
                    }
                ];
                
                const merged = mergeEvents(activities, studyGroups);
                expect(merged).toHaveLength(2);
            });

            test('handles empty arrays', () => {
                const merged = mergeEvents([], []);
                expect(merged).toHaveLength(0);
            });
        });
    });

    describe('Utility Functions', () => {
        describe('generateReminderKey', () => {
            test('generates consistent key for activity', () => {
                const event = { id: 'event123', isStudyGroup: false };
                const reminderTime = { label: '1_hour_before' };
                
                const key = generateReminderKey(event, reminderTime);
                expect(key).toContain('event123');
                expect(key).toContain('1_hour_before');
            });

            test('generates consistent key for study group', () => {
                const event = { id: 'group456', isStudyGroup: true };
                const reminderTime = { label: '5_hours_before' };
                
                const key = generateReminderKey(event, reminderTime, eventTypes.STUDY_GROUP);
                expect(key).toContain('group456');
                expect(key).toContain('study_group');
            });
        });

        describe('calculateNextRefreshTime', () => {
            test('calculates refresh time with specific interval', () => {
                const currentTime = new Date('2024-01-15T10:00:00Z');
                const nextRefresh = calculateNextRefreshTime(currentTime, 10);
                
                expect(nextRefresh instanceof Date).toBe(true);
                expect(nextRefresh.getMinutes()).toBe(10);
            });

            test('uses default interval when not specified', () => {
                const currentTime = new Date('2024-01-15T10:00:00Z');
                const nextRefresh = calculateNextRefreshTime(currentTime);
                expect(nextRefresh.getMinutes()).toBe(5);
            });
        });

        describe('formatDuration', () => {
            test('formats minutes correctly', () => {
                expect(formatDuration(0.5)).toBe('30 minutes');
                expect(formatDuration(0.25)).toBe('15 minutes');
            });

            test('formats hours correctly', () => {
                expect(formatDuration(1)).toBe('1 hour');
                expect(formatDuration(2)).toBe('2 hours');
                expect(formatDuration(1.5)).toBe('1.5 hours');
            });

            test('formats days correctly', () => {
                expect(formatDuration(24)).toBe('1.0 day');
                expect(formatDuration(48)).toBe('2.0 days');
            });
        });

        describe('createNotificationData', () => {
            test('creates info notification data', () => {
                const notification = createNotificationData('Information message', 'info');
                expect(notification.type).toBe('info');
                expect(notification.icon).toBe('info-circle');
            });

            test('creates success notification data', () => {
                const notification = createNotificationData('Success message', 'success');
                expect(notification.type).toBe('success');
                expect(notification.icon).toBe('check-circle');
            });
        });

        describe('Performance Functions', () => {
            describe('debounce', () => {
                test('delays function execution', (done) => {
                    let callCount = 0;
                    const debouncedFn = debounce(() => {
                        callCount++;
                    }, 100);

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

        describe('Cleanup and Statistics', () => {
            describe('cleanupOldReminders', () => {
                test('removes old reminders', () => {
                    const sentReminders = new Map();
                    const now = Date.now();
                    const oneDayAgo = now - (25 * 60 * 60 * 1000);
                    const oneHourAgo = now - (1 * 60 * 60 * 1000);
                    
                    sentReminders.set('old', oneDayAgo);
                    sentReminders.set('recent', oneHourAgo);
                    
                    const cleanedCount = cleanupOldReminders(sentReminders, 24);
                    expect(cleanedCount).toBe(1);
                });

                test('handles empty map', () => {
                    const sentReminders = new Map();
                    const cleanedCount = cleanupOldReminders(sentReminders, 24);
                    expect(cleanedCount).toBe(0);
                });
            });

            describe('getReminderStatistics', () => {
                test('calculates statistics with data', () => {
                    const reminderIntervals = new Map([['reminder1', 'interval1']]);
                    const sentReminders = new Map([['sent1', Date.now()]]);
                    const events = [{ id: '1', title: 'Event 1' }];
                    
                    const stats = getReminderStatistics(reminderIntervals, sentReminders, events);
                    
                    expect(stats.scheduledCount).toBe(1);
                    expect(stats.sentCount).toBe(1);
                    expect(stats.eventsCount).toBe(1);
                });

                test('calculates statistics with empty data', () => {
                    const stats = getReminderStatistics(new Map(), new Map(), []);
                    expect(stats.scheduledCount).toBe(0);
                    expect(stats.sentCount).toBe(0);
                    expect(stats.eventsCount).toBe(0);
                });
            });
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('handles malformed event data in filtering', () => {
            const malformedEvents = [
                null,
                undefined,
                {},
                { datetime: 'invalid-date-string' },
                { id: 'valid', datetime: new Date(Date.now() + 1000) }
            ];

            const filtered = filterEventsForReminders(malformedEvents);
            expect(Array.isArray(filtered)).toBe(true);
            expect(filtered).toHaveLength(1);
        });

        test('handles timezone edge cases in datetime calculations', () => {
            const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const reminders = calculateReminderTimes(futureDate);
            expect(Array.isArray(reminders)).toBe(true);
        });
    });
});
