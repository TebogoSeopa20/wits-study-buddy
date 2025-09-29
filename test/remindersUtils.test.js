// remindersUtils.test.js - Tests for reminder utility functions
const {
    REMINDER_TYPES,
    REMINDER_STATUS,
    REMINDER_TIMING,
    validateReminderData,
    validateReminderUpdateData,
    validateReminderType,
    validateReminderStatus,
    isValidWitsEmail,
    isValidReminderTime,
    isValidEmailConfig,
    generateActivityReminderTemplate,
    generateAssignmentReminderTemplate,
    generateExamReminderTemplate,
    generateStudyGroupReminderTemplate,
    getTimingText,
    calculateReminderTime,
    isReminderDue,
    formatReminderLog,
    getEmailConfigStatus,
    generateConfigHelp,
    generateMockReminder,
    validateEmailResponse
} = require('../src/backend/test_utils/remindersUtils');

describe('Reminder Utility Functions', () => {
    // Mock process.env for email config tests
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    describe('Constants', () => {
        test('REMINDER_TYPES contains valid types', () => {
            expect(REMINDER_TYPES).toEqual({
                ACTIVITY: 'activity',
                STUDY_SESSION: 'study_session',
                ASSIGNMENT: 'assignment',
                EXAM: 'exam',
                MEETING: 'meeting',
                GENERAL: 'general'
            });
        });

        test('REMINDER_STATUS contains valid statuses', () => {
            expect(REMINDER_STATUS).toEqual({
                PENDING: 'pending',
                SENT: 'sent',
                FAILED: 'failed',
                CANCELLED: 'cancelled'
            });
        });

        test('REMINDER_TIMING contains valid timing options', () => {
            expect(REMINDER_TIMING).toEqual({
                MINUTES_15: 15,
                MINUTES_30: 30,
                HOUR_1: 60,
                HOURS_2: 120,
                HOURS_6: 360,
                HOURS_12: 720,
                DAY_1: 1440
            });
        });
    });

    describe('Validation Functions', () => {
        describe('validateReminderData', () => {
            const validReminder = {
                to: '1234567@students.wits.ac.za',
                subject: 'Test Reminder',
                message: 'This is a test reminder message',
                event_type: 'activity',
                reminder_time: '2024-01-15T10:00:00Z'
            };

            test('validates correct reminder data successfully', () => {
                const result = validateReminderData(validReminder);
                expect(result.isValid).toBe(true);
                expect(result.error).toBeNull();
            });

            test('rejects missing required fields', () => {
                const incompleteReminder = { ...validReminder };
                delete incompleteReminder.to;
                
                const result = validateReminderData(incompleteReminder);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('to, subject, and message are required');
            });

            test('rejects invalid Wits email format', () => {
                const invalidEmailReminder = { 
                    ...validReminder, 
                    to: 'invalid@email.com' 
                };
                
                const result = validateReminderData(invalidEmailReminder);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Invalid email format');
            });

            test('rejects invalid message length', () => {
                const invalidMessageReminder = { 
                    ...validReminder, 
                    message: 'a'.repeat(5001) // Too long
                };
                
                const result = validateReminderData(invalidMessageReminder);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Message must be between 1 and 5000 characters');
            });

            test('rejects invalid event type', () => {
                const invalidTypeReminder = { 
                    ...validReminder, 
                    event_type: 'invalid-type' 
                };
                
                const result = validateReminderData(invalidTypeReminder);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Invalid event type');
            });

            test('rejects invalid reminder time format', () => {
                const invalidTimeReminder = { 
                    ...validReminder, 
                    reminder_time: 'invalid-time' 
                };
                
                const result = validateReminderData(invalidTimeReminder);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Invalid reminder time format');
            });
        });

        describe('validateReminderUpdateData', () => {
            test('validates correct update data successfully', () => {
                const updateData = {
                    subject: 'Updated Subject',
                    status: 'sent',
                    attempts: 1
                };
                
                const result = validateReminderUpdateData(updateData);
                expect(result.isValid).toBe(true);
                expect(result.error).toBeNull();
            });

            test('rejects invalid fields', () => {
                const invalidUpdateData = {
                    invalid_field: 'value',
                    to: 'should-not-be-updatable@students.wits.ac.za'
                };
                
                const result = validateReminderUpdateData(invalidUpdateData);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Invalid fields');
            });

            test('rejects invalid status', () => {
                const invalidUpdateData = {
                    status: 'invalid-status'
                };
                
                const result = validateReminderUpdateData(invalidUpdateData);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Invalid status');
            });
        });

        describe('validateReminderType', () => {
            test('validates correct types', () => {
                expect(validateReminderType('activity')).toBe(true);
                expect(validateReminderType('assignment')).toBe(true);
                expect(validateReminderType('exam')).toBe(true);
                expect(validateReminderType('meeting')).toBe(true);
                expect(validateReminderType('general')).toBe(true);
            });

            test('rejects invalid types', () => {
                expect(validateReminderType('invalid-type')).toBe(false);
                expect(validateReminderType('')).toBe(false);
                expect(validateReminderType(null)).toBe(false);
            });
        });

        describe('validateReminderStatus', () => {
            test('validates correct statuses', () => {
                expect(validateReminderStatus('pending')).toBe(true);
                expect(validateReminderStatus('sent')).toBe(true);
                expect(validateReminderStatus('failed')).toBe(true);
                expect(validateReminderStatus('cancelled')).toBe(true);
            });

            test('rejects invalid statuses', () => {
                expect(validateReminderStatus('invalid-status')).toBe(false);
                expect(validateReminderStatus('')).toBe(false);
                expect(validateReminderStatus(null)).toBe(false);
            });
        });

        describe('isValidWitsEmail', () => {
            test('validates correct Wits email formats', () => {
                expect(isValidWitsEmail('1234567@students.wits.ac.za')).toBe(true);
                expect(isValidWitsEmail('9876543@students.wits.ac.za')).toBe(true);
            });

            test('rejects invalid Wits email formats', () => {
                expect(isValidWitsEmail('invalid@email.com')).toBe(false);
                expect(isValidWitsEmail('student@wits.ac.za')).toBe(false);
                expect(isValidWitsEmail('1234567@staff.wits.ac.za')).toBe(false);
                expect(isValidWitsEmail('not-a-number@students.wits.ac.za')).toBe(false);
                expect(isValidWitsEmail('')).toBe(false);
                expect(isValidWitsEmail(null)).toBe(false);
            });
        });

        describe('isValidReminderTime', () => {
            test('validates correct time formats', () => {
                expect(isValidReminderTime('2024-01-15T10:00:00Z')).toBe(true);
                expect(isValidReminderTime('2024-01-15T10:00:00.000Z')).toBe(true);
                expect(isValidReminderTime('2024-01-15')).toBe(true);
            });

        });
    });

    describe('Email Template Generators', () => {
        const mockUser = { name: 'John Doe' };

        describe('generateActivityReminderTemplate', () => {
            test('generates activity reminder template correctly', () => {
                const activity = {
                    title: 'Math Study Session',
                    activity_type: 'study',
                    activity_date: '2024-01-15',
                    activity_time: '14:00:00',
                    duration_hours: 2,
                    location: 'Library'
                };

                const template = generateActivityReminderTemplate(activity, mockUser, 60);
                
                expect(template.subject).toContain('Math Study Session');
                expect(template.subject).toContain('in 1 hour');
                expect(template.html).toContain('Math Study Session');
                expect(template.html).toContain('Library');
                expect(template.html).toContain('John Doe');
            });
        });

        describe('generateAssignmentReminderTemplate', () => {
            test('generates assignment reminder template correctly', () => {
                const assignment = {
                    title: 'Calculus Assignment 1',
                    due_date: '2024-01-20',
                    due_time: '23:59:00',
                    subject: 'Mathematics',
                    priority: 'high'
                };

                const template = generateAssignmentReminderTemplate(assignment, mockUser, 1440);
                
                expect(template.subject).toContain('Calculus Assignment 1');
                expect(template.subject).toContain('in 1 day');
                expect(template.html).toContain('Mathematics');
                expect(template.html).toContain('high');
                expect(template.html).toContain('John Doe');
            });
        });

        describe('generateExamReminderTemplate', () => {
            test('generates exam reminder template correctly', () => {
                const exam = {
                    title: 'Final Mathematics Exam',
                    exam_date: '2024-06-15',
                    exam_time: '09:00:00',
                    duration: '3 hours',
                    location: 'Great Hall',
                    subject: 'Mathematics'
                };

                const template = generateExamReminderTemplate(exam, mockUser, 720);
                
                expect(template.subject).toContain('Final Mathematics Exam');
                expect(template.subject).toContain('in 12 hours');
                expect(template.html).toContain('Great Hall');
                expect(template.html).toContain('Exam Tips');
                expect(template.html).toContain('John Doe');
            });
        });

        describe('generateStudyGroupReminderTemplate', () => {
            test('generates study group reminder template correctly', () => {
                const studyGroup = {
                    name: 'Advanced Calculus Group',
                    subject: 'Mathematics',
                    meeting_date: '2024-01-18',
                    meeting_time: '16:00:00',
                    location: 'Science Library'
                };

                const template = generateStudyGroupReminderTemplate(studyGroup, mockUser, 30);
                
                expect(template.subject).toContain('Advanced Calculus Group');
                expect(template.subject).toContain('in 30 minutes');
                expect(template.html).toContain('Mathematics');
                expect(template.html).toContain('Science Library');
                expect(template.html).toContain('John Doe');
            });
        });
    });

    describe('Helper Functions', () => {
        describe('getTimingText', () => {
            test('returns correct timing text for known values', () => {
                expect(getTimingText(15)).toBe('in 15 minutes');
                expect(getTimingText(60)).toBe('in 1 hour');
                expect(getTimingText(1440)).toBe('in 1 day');
            });

            test('returns "soon" for unknown values', () => {
                expect(getTimingText(999)).toBe('soon');
                expect(getTimingText(0)).toBe('soon');
            });
        });

        describe('calculateReminderTime', () => {
            test('calculates reminder time correctly', () => {
                const eventTime = '2024-01-15T10:00:00Z';
                const reminderTime = calculateReminderTime(eventTime, 60); // 60 minutes before
                
                const expectedTime = new Date('2024-01-15T09:00:00Z').toISOString();
                expect(reminderTime).toBe(expectedTime);
            });
        });

        describe('isReminderDue', () => {
            test('returns true for past reminder times', () => {
                const pastTime = new Date(Date.now() - 60000).toISOString(); // 1 minute ago
                expect(isReminderDue(pastTime)).toBe(true);
            });

            test('returns false for future reminder times', () => {
                const futureTime = new Date(Date.now() + 60000).toISOString(); // 1 minute from now
                expect(isReminderDue(futureTime)).toBe(false);
            });
        });

        describe('formatReminderLog', () => {
            test('formats reminder log correctly', () => {
                const reminderData = {
                    to: '1234567@students.wits.ac.za',
                    subject: 'Test Reminder',
                    event_type: 'activity',
                    event_id: 'event-123',
                    reminder_time: '2024-01-15T10:00:00Z'
                };

                const log = formatReminderLog(reminderData, 'sent');
                
                expect(log.to).toBe('1234567@students.wits.ac.za');
                expect(log.subject).toBe('Test Reminder');
                expect(log.event_type).toBe('activity');
                expect(log.event_id).toBe('event-123');
                expect(log.status).toBe('sent');
                expect(log.timestamp).toBeDefined();
            });
        });
    });

    describe('Email Configuration', () => {
        describe('isValidEmailConfig', () => {
            test('returns true when both email user and pass are set', () => {
                process.env.EMAIL_USER = 'test@example.com';
                process.env.EMAIL_PASS = 'test-password';
                expect(isValidEmailConfig()).toBe(true);
            });

            test('returns false when email user is missing', () => {
                delete process.env.EMAIL_USER;
                process.env.EMAIL_PASS = 'test-password';
                expect(isValidEmailConfig()).toBe(false);
            });

            test('returns false when email pass is missing', () => {
                process.env.EMAIL_USER = 'test@example.com';
                delete process.env.EMAIL_PASS;
                expect(isValidEmailConfig()).toBe(false);
            });

            test('returns false when both are missing', () => {
                delete process.env.EMAIL_USER;
                delete process.env.EMAIL_PASS;
                expect(isValidEmailConfig()).toBe(false);
            });
        });

        describe('getEmailConfigStatus', () => {
            test('returns correct configuration status', () => {
                process.env.EMAIL_USER = 'test@example.com';
                process.env.EMAIL_PASS = 'test-password';
                
                const status = getEmailConfigStatus();
                
                expect(status.emailUser).toBe(true);
                expect(status.emailPass).toBe(true);
                expect(status.fullyConfigured).toBe(true);
                expect(status.missingFields.user).toBe(false);
                expect(status.missingFields.pass).toBe(false);
            });
        });

        describe('generateConfigHelp', () => {
            test('generates help information', () => {
                const help = generateConfigHelp();
                
                expect(help.currentStatus).toBeDefined();
                expect(help.stepsToFix).toBeInstanceOf(Array);
                expect(help.stepsToFix.length).toBeGreaterThan(0);
                expect(help.envExample).toContain('EMAIL_USER');
                expect(help.envExample).toContain('EMAIL_PASS');
            });
        });
    });

    describe('Mock Data Generation', () => {
        test('generates mock reminder with default values', () => {
            const mockReminder = generateMockReminder();
            
            expect(mockReminder.to).toMatch(/^\d+@students\.wits\.ac\.za$/);
            expect(mockReminder.subject).toContain('Test Reminder');
            expect(mockReminder.event_type).toBe('general');
            expect(mockReminder.status).toBe('pending');
            expect(mockReminder.attempts).toBe(0);
        });

        test('generates mock reminder with overrides', () => {
            const overrides = {
                to: '9999999@students.wits.ac.za',
                subject: 'Custom Subject',
                event_type: 'exam',
                status: 'sent'
            };
            
            const mockReminder = generateMockReminder(overrides);
            
            expect(mockReminder.to).toBe('9999999@students.wits.ac.za');
            expect(mockReminder.subject).toBe('Custom Subject');
            expect(mockReminder.event_type).toBe('exam');
            expect(mockReminder.status).toBe('sent');
        });
    });

    describe('Email Response Validation', () => {
        test('validates successful email response', () => {
            const response = {
                success: true,
                messageId: 'test-message-id',
                emailEnabled: true
            };
            
            const result = validateEmailResponse(response);
            expect(result.isValid).toBe(true);
            expect(result.messageId).toBe('test-message-id');
        });

        test('validates failed email response', () => {
            const response = {
                success: false,
                error: 'Email sending failed',
                logged: true
            };
            
            const result = validateEmailResponse(response);
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Email sending failed');
            expect(result.logged).toBe(true);
        });

        test('handles invalid response format', () => {
            const response = { invalid: 'format' };
            
            const result = validateEmailResponse(response);
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Invalid response format');
        });
    });
});