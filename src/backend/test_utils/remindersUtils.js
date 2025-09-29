// remindersUtils.js - Utility functions for reminder management

// Reminder constants
const REMINDER_TYPES = {
    ACTIVITY: 'activity',
    STUDY_SESSION: 'study_session',
    ASSIGNMENT: 'assignment',
    EXAM: 'exam',
    MEETING: 'meeting',
    GENERAL: 'general'
};

const REMINDER_STATUS = {
    PENDING: 'pending',
    SENT: 'sent',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
};

const REMINDER_TIMING = {
    MINUTES_15: 15,
    MINUTES_30: 30,
    HOUR_1: 60,
    HOURS_2: 120,
    HOURS_6: 360,
    HOURS_12: 720,
    DAY_1: 1440
};

// Validation functions
function validateReminderData(reminderData) {
    if (!reminderData || typeof reminderData !== 'object') {
        return { isValid: false, error: 'Reminder data must be an object' };
    }

    const { to, subject, message, event_type, reminder_time } = reminderData;

    // Validate required fields
    if (!to || !subject || !message) {
        return { isValid: false, error: 'to, subject, and message are required' };
    }

    // Validate email format
    if (!isValidWitsEmail(to)) {
        return { isValid: false, error: 'Invalid email format. Only @students.wits.ac.za emails are supported' };
    }

    // Validate subject length
    if (subject.length < 1 || subject.length > 200) {
        return { isValid: false, error: 'Subject must be between 1 and 200 characters' };
    }

    // Validate message length
    if (message.length < 1 || message.length > 5000) {
        return { isValid: false, error: 'Message must be between 1 and 5000 characters' };
    }

    // Validate event type if provided
    if (event_type && !validateReminderType(event_type)) {
        return { isValid: false, error: `Invalid event type. Must be one of: ${Object.values(REMINDER_TYPES).join(', ')}` };
    }

    // Validate reminder time if provided
    if (reminder_time && !isValidReminderTime(reminder_time)) {
        return { isValid: false, error: 'Invalid reminder time format. Use ISO 8601 format' };
    }

    return { isValid: true, error: null };
}

function validateReminderUpdateData(updateData) {
    if (!updateData || typeof updateData !== 'object') {
        return { isValid: false, error: 'Update data must be an object' };
    }

    const allowedFields = ['subject', 'message', 'reminder_time', 'status', 'sent_at', 'attempts'];
    const providedFields = Object.keys(updateData);
    
    const invalidFields = providedFields.filter(field => !allowedFields.includes(field));
    if (invalidFields.length > 0) {
        return { isValid: false, error: `Invalid fields: ${invalidFields.join(', ')}` };
    }

    // Validate subject if provided
    if (updateData.subject && (updateData.subject.length < 1 || updateData.subject.length > 200)) {
        return { isValid: false, error: 'Subject must be between 1 and 200 characters' };
    }

    // Validate message if provided
    if (updateData.message && (updateData.message.length < 1 || updateData.message.length > 5000)) {
        return { isValid: false, error: 'Message must be between 1 and 5000 characters' };
    }

    // Validate status if provided
    if (updateData.status && !validateReminderStatus(updateData.status)) {
        return { isValid: false, error: `Invalid status. Must be one of: ${Object.values(REMINDER_STATUS).join(', ')}` };
    }

    // Validate reminder time if provided
    if (updateData.reminder_time && !isValidReminderTime(updateData.reminder_time)) {
        return { isValid: false, error: 'Invalid reminder time format. Use ISO 8601 format' };
    }

    return { isValid: true, error: null };
}

function validateReminderType(type) {
    return Object.values(REMINDER_TYPES).includes(type);
}

function validateReminderStatus(status) {
    return Object.values(REMINDER_STATUS).includes(status);
}

function isValidWitsEmail(email) {
    const emailRegex = /^\d+@students\.wits\.ac\.za$/i;
    return emailRegex.test(email);
}

function isValidReminderTime(timeString) {
    try {
        const date = new Date(timeString);
        return date instanceof Date && !isNaN(date);
    } catch {
        return false;
    }
}

function isValidEmailConfig() {
    return !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

// Email template generators
function generateActivityReminderTemplate(activity, user, timing) {
    const { title, activity_type, activity_date, activity_time, duration_hours, location } = activity;
    const { name } = user;
    
    const timingText = getTimingText(timing);
    const formattedDate = new Date(activity_date).toLocaleDateString('en-ZA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return {
        subject: `🔔 Reminder: ${title} ${timingText}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <div style="background: linear-gradient(135deg, #2c5aa0, #1e3a8a); padding: 30px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px;">🔔 Study Buddy Reminder</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">${timingText}</p>
                </div>
                
                <div style="padding: 30px; background: #f8f9fa;">
                    <h2 style="color: #2c5aa0; margin-top: 0;">${title}</h2>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #2c5aa0;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #666; width: 120px;"><strong>Type:</strong></td>
                                <td style="padding: 8px 0;">${activity_type.charAt(0).toUpperCase() + activity_type.slice(1)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #666;"><strong>Date:</strong></td>
                                <td style="padding: 8px 0;">${formattedDate}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #666;"><strong>Time:</strong></td>
                                <td style="padding: 8px 0;">${activity_time}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #666;"><strong>Duration:</strong></td>
                                <td style="padding: 8px 0;">${duration_hours} hour${duration_hours !== 1 ? 's' : ''}</td>
                            </tr>
                            ${location ? `
                            <tr>
                                <td style="padding: 8px 0; color: #666;"><strong>Location:</strong></td>
                                <td style="padding: 8px 0;">${location}</td>
                            </tr>
                            ` : ''}
                        </table>
                    </div>
                    
                    <div style="margin-top: 25px; padding: 15px; background: #e8f4fd; border-radius: 6px; border: 1px solid #b6d7f2;">
                        <p style="margin: 0; color: #2c5aa0;">
                            <strong>Hi ${name},</strong> This is a reminder about your upcoming activity.
                        </p>
                    </div>
                    
                    <div style="margin-top: 25px; text-align: center;">
                        <p style="color: #666; font-size: 14px;">
                            This reminder was sent from Wits Study Buddy<br>
                            <small>Sent on: ${new Date().toLocaleString('en-ZA')}</small>
                        </p>
                    </div>
                </div>
            </div>
        `
    };
}

function generateAssignmentReminderTemplate(assignment, user, timing) {
    const { title, due_date, due_time, subject, priority } = assignment;
    const { name } = user;
    
    const timingText = getTimingText(timing);
    const formattedDueDate = new Date(due_date).toLocaleDateString('en-ZA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const priorityColor = {
        high: '#dc2626',
        medium: '#ea580c',
        low: '#16a34a'
    }[priority] || '#6b7280';

    return {
        subject: `📝 Assignment Due: ${title} ${timingText}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <div style="background: linear-gradient(135deg, ${priorityColor}, #1e3a8a); padding: 30px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px;">📝 Assignment Reminder</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">${timingText}</p>
                </div>
                
                <div style="padding: 30px; background: #f8f9fa;">
                    <h2 style="color: ${priorityColor}; margin-top: 0;">${title}</h2>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid ${priorityColor};">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #666; width: 120px;"><strong>Subject:</strong></td>
                                <td style="padding: 8px 0;">${subject}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #666;"><strong>Due Date:</strong></td>
                                <td style="padding: 8px 0;">${formattedDueDate}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #666;"><strong>Due Time:</strong></td>
                                <td style="padding: 8px 0;">${due_time}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #666;"><strong>Priority:</strong></td>
                                <td style="padding: 8px 0;">
                                    <span style="color: ${priorityColor}; font-weight: bold; text-transform: capitalize;">
                                        ${priority}
                                    </span>
                                </td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="margin-top: 25px; padding: 15px; background: #fef3f2; border-radius: 6px; border: 1px solid #fecaca;">
                        <p style="margin: 0; color: #dc2626;">
                            <strong>Hi ${name},</strong> Don't forget to submit your assignment on time!
                        </p>
                    </div>
                    
                    <div style="margin-top: 25px; text-align: center;">
                        <p style="color: #666; font-size: 14px;">
                            This reminder was sent from Wits Study Buddy<br>
                            <small>Sent on: ${new Date().toLocaleString('en-ZA')}</small>
                        </p>
                    </div>
                </div>
            </div>
        `
    };
}

function generateExamReminderTemplate(exam, user, timing) {
    const { title, exam_date, exam_time, duration, location, subject } = exam;
    const { name } = user;
    
    const timingText = getTimingText(timing);
    const formattedExamDate = new Date(exam_date).toLocaleDateString('en-ZA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return {
        subject: `📚 Exam Alert: ${title} ${timingText}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <div style="background: linear-gradient(135deg, #dc2626, #991b1b); padding: 30px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px;">📚 Exam Reminder</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">${timingText}</p>
                </div>
                
                <div style="padding: 30px; background: #f8f9fa;">
                    <h2 style="color: #dc2626; margin-top: 0;">${title}</h2>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #666; width: 120px;"><strong>Subject:</strong></td>
                                <td style="padding: 8px 0;">${subject}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #666;"><strong>Exam Date:</strong></td>
                                <td style="padding: 8px 0;">${formattedExamDate}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #666;"><strong>Exam Time:</strong></td>
                                <td style="padding: 8px 0;">${exam_time}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #666;"><strong>Duration:</strong></td>
                                <td style="padding: 8px 0;">${duration}</td>
                            </tr>
                            ${location ? `
                            <tr>
                                <td style="padding: 8px 0; color: #666;"><strong>Location:</strong></td>
                                <td style="padding: 8px 0;">${location}</td>
                            </tr>
                            ` : ''}
                        </table>
                    </div>
                    
                    <div style="margin-top: 25px; padding: 15px; background: #fef3f2; border-radius: 6px; border: 1px solid #fecaca;">
                        <p style="margin: 0; color: #dc2626;">
                            <strong>Hi ${name},</strong> Good luck with your exam! Make sure to get enough rest and arrive early.
                        </p>
                    </div>
                    
                    <div style="margin-top: 20px; background: #fffbeb; padding: 15px; border-radius: 6px; border: 1px solid #fcd34d;">
                        <h4 style="margin: 0 0 10px 0; color: #d97706;">📝 Exam Tips:</h4>
                        <ul style="margin: 0; padding-left: 20px; color: #92400e;">
                            <li>Review key concepts and formulas</li>
                            <li>Get a good night's sleep before the exam</li>
                            <li>Bring all necessary materials (calculator, ID, etc.)</li>
                            <li>Arrive at least 15 minutes early</li>
                        </ul>
                    </div>
                    
                    <div style="margin-top: 25px; text-align: center;">
                        <p style="color: #666; font-size: 14px;">
                            This reminder was sent from Wits Study Buddy<br>
                            <small>Sent on: ${new Date().toLocaleString('en-ZA')}</small>
                        </p>
                    </div>
                </div>
            </div>
        `
    };
}

function generateStudyGroupReminderTemplate(studyGroup, user, timing) {
    const { name: groupName, subject, meeting_time, meeting_date, location } = studyGroup;
    const { name: userName } = user;
    
    const timingText = getTimingText(timing);
    const formattedDate = new Date(meeting_date).toLocaleDateString('en-ZA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return {
        subject: `👥 Study Group: ${groupName} ${timingText}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <div style="background: linear-gradient(135deg, #16a34a, #15803d); padding: 30px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px;">👥 Study Group Reminder</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">${timingText}</p>
                </div>
                
                <div style="padding: 30px; background: #f8f9fa;">
                    <h2 style="color: #16a34a; margin-top: 0;">${groupName}</h2>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #16a34a;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #666; width: 120px;"><strong>Subject:</strong></td>
                                <td style="padding: 8px 0;">${subject}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #666;"><strong>Meeting Date:</strong></td>
                                <td style="padding: 8px 0;">${formattedDate}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #666;"><strong>Meeting Time:</strong></td>
                                <td style="padding: 8px 0;">${meeting_time}</td>
                            </tr>
                            ${location ? `
                            <tr>
                                <td style="padding: 8px 0; color: #666;"><strong>Location:</strong></td>
                                <td style="padding: 8px 0;">${location}</td>
                            </tr>
                            ` : ''}
                        </table>
                    </div>
                    
                    <div style="margin-top: 25px; padding: 15px; background: #f0fdf4; border-radius: 6px; border: 1px solid #bbf7d0;">
                        <p style="margin: 0; color: #16a34a;">
                            <strong>Hi ${userName},</strong> Don't forget about your study group session!
                        </p>
                    </div>
                    
                    <div style="margin-top: 25px; text-align: center;">
                        <p style="color: #666; font-size: 14px;">
                            This reminder was sent from Wits Study Buddy<br>
                            <small>Sent on: ${new Date().toLocaleString('en-ZA')}</small>
                        </p>
                    </div>
                </div>
            </div>
        `
    };
}

// Helper functions
function getTimingText(timingMinutes) {
    const timingMap = {
        15: 'in 15 minutes',
        30: 'in 30 minutes',
        60: 'in 1 hour',
        120: 'in 2 hours',
        360: 'in 6 hours',
        720: 'in 12 hours',
        1440: 'in 1 day'
    };
    
    return timingMap[timingMinutes] || 'soon';
}

function calculateReminderTime(eventTime, minutesBefore) {
    const eventDate = new Date(eventTime);
    const reminderDate = new Date(eventDate.getTime() - (minutesBefore * 60 * 1000));
    return reminderDate.toISOString();
}

function isReminderDue(reminderTime) {
    const now = new Date();
    const reminderDate = new Date(reminderTime);
    return reminderDate <= now;
}

function formatReminderLog(reminderData, status = 'sent') {
    const { to, subject, event_type, event_id, reminder_time } = reminderData;
    
    return {
        timestamp: new Date().toISOString(),
        to,
        subject,
        event_type: event_type || 'general',
        event_id: event_id || 'unknown',
        reminder_time: reminder_time || new Date().toISOString(),
        status,
        emailEnabled: isValidEmailConfig()
    };
}

// Email configuration helpers
function getEmailConfigStatus() {
    const hasUser = !!process.env.EMAIL_USER;
    const hasPass = !!process.env.EMAIL_PASS;
    
    return {
        emailUser: hasUser,
        emailPass: hasPass,
        fullyConfigured: hasUser && hasPass,
        missingFields: {
            user: !hasUser,
            pass: !hasPass
        }
    };
}

function generateConfigHelp() {
    const config = getEmailConfigStatus();
    
    return {
        currentStatus: config,
        stepsToFix: [
            '1. Go to your Google Account: https://myaccount.google.com/',
            '2. Enable 2-Factor Authentication',
            '3. Go to "Security" → "App passwords"',
            '4. Generate a new app password for "Mail"',
            '5. Use the 16-character app password (without spaces) in your .env file',
            '6. Restart your server'
        ],
        envExample: `
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=your-16-character-app-password
        `.trim()
    };
}

// Mock data generation
function generateMockReminder(overrides = {}) {
    const timestamp = new Date().toISOString();
    const reminderTime = new Date();
    reminderTime.setHours(reminderTime.getHours() + 1);
    
    return {
        id: overrides.id || `reminder_${Math.random().toString(36).substr(2, 9)}`,
        to: overrides.to || '1234567@students.wits.ac.za',
        subject: overrides.subject || 'Test Reminder',
        message: overrides.message || 'This is a test reminder message',
        event_type: overrides.event_type || REMINDER_TYPES.GENERAL,
        event_id: overrides.event_id || null,
        reminder_time: overrides.reminder_time || reminderTime.toISOString(),
        status: overrides.status || REMINDER_STATUS.PENDING,
        attempts: overrides.attempts || 0,
        created_at: overrides.created_at || timestamp,
        sent_at: overrides.sent_at || null,
        ...overrides
    };
}

// Validation for email responses
function validateEmailResponse(response) {
    if (!response || typeof response !== 'object') {
        return { isValid: false, error: 'Invalid response object' };
    }

    if (response.success === false) {
        return { 
            isValid: false, 
            error: response.error || 'Email sending failed',
            logged: response.logged || false
        };
    }

    if (response.success === true) {
        return { 
            isValid: true, 
            messageId: response.messageId,
            logged: response.logged || false,
            emailEnabled: response.emailEnabled
        };
    }

    return { isValid: false, error: 'Invalid response format' };
}

module.exports = {
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
};