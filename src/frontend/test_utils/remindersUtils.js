
// remindersUtils.js - Utility functions for reminder system management

// Reminder configuration
const reminderConfig = {
    times: [
        { hours: 23, label: '23 hours before' },
        { hours: 5, label: '5 hours before' },
        { hours: 1, label: '1 hour before' },
        { minutes: 5, label: '5 minutes before' }
    ],
    
    // Email templates
    emailTemplates: {
        subject: {
            activity: '🔔 Wits Study Buddy: {title} - {reminderTime}',
            studyGroup: '🔔 Wits Study Buddy: {title} - {reminderTime}'
        },
        
        styles: `
            <style>
                .reminder-email {
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 0 auto;
                    color: #333;
                }
                .reminder-header {
                    background: #2c5aa0;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 8px 8px 0 0;
                }
                .reminder-content {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 0 0 8px 8px;
                }
                .event-details {
                    background: white;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 15px 0;
                    border-left: 4px solid #2c5aa0;
                }
                .footer {
                    color: #666;
                    font-size: 12px;
                    text-align: center;
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                }
            </style>
        `
    },
    
    // Validation rules
    validation: {
        maxRemindersPerEvent: 10,
        maxEmailLength: 1000,
        minDelayMinutes: 1,
        maxDelayDays: 30
    }
};

// Email domain validation
const validEmailDomains = [
    'students.wits.ac.za',
    'wits.ac.za'
];

// Event types
const eventTypes = {
    ACTIVITY: 'activity',
    STUDY_GROUP: 'study_group'
};

// Reminder statuses
const reminderStatuses = {
    SCHEDULED: 'scheduled',
    SENT: 'sent',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
};

// Validate Wits email address
function isValidWitsEmail(email) {
    if (!email || typeof email !== 'string') {
        return false;
    }
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(students\.wits\.ac\.za|wits\.ac\.za)$/i;
    return emailRegex.test(email);
}

// Validate reminder data
function validateReminderData(reminderData) {
    const errors = [];
    
    if (!reminderData) {
        errors.push('Reminder data is required');
        return errors;
    }
    
    if (!reminderData.to || !isValidWitsEmail(reminderData.to)) {
        errors.push('Valid Wits email address is required');
    }
    
    if (!reminderData.subject || reminderData.subject.trim().length === 0) {
        errors.push('Email subject is required');
    }
    
    if (!reminderData.message || reminderData.message.trim().length === 0) {
        errors.push('Email message is required');
    }
    
    if (reminderData.message && reminderData.message.length > reminderConfig.validation.maxEmailLength) {
        errors.push(`Message too long (max ${reminderConfig.validation.maxEmailLength} characters)`);
    }
    
    if (!reminderData.event_type || !Object.values(eventTypes).includes(reminderData.event_type)) {
        errors.push('Valid event type is required');
    }
    
    if (!reminderData.event_id) {
        errors.push('Event ID is required');
    }
    
    return errors;
}

// Generate reminder subject
function generateReminderSubject(event, reminderTime, eventType = eventTypes.ACTIVITY) {
    if (!event || !event.title || !reminderTime) {
        return 'Wits Study Buddy Reminder';
    }
    
    const template = reminderConfig.emailTemplates.subject[eventType] || 
                    reminderConfig.emailTemplates.subject.activity;
    
    return template
        .replace('{title}', event.title)
        .replace('{reminderTime}', reminderTime);
}

// Generate reminder message HTML
function generateReminderMessage(event, reminderTime, userName = 'Wits Student') {
    if (!event || !event.datetime) {
        return '<p>Reminder: You have an upcoming event.</p>';
    }
    
    const eventDate = event.datetime instanceof Date ? 
        event.datetime.toLocaleDateString() : 
        new Date(event.datetime).toLocaleDateString();
    
    const eventTime = event.datetime instanceof Date ? 
        event.datetime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
        new Date(event.datetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    const isStudyGroup = event.isStudyGroup || event.type === eventTypes.STUDY_GROUP;
    
    return `
        ${reminderConfig.emailTemplates.styles}
        <div class="reminder-email">
            <div class="reminder-header">
                <h1>🔔 Wits Study Buddy Reminder</h1>
            </div>
            <div class="reminder-content">
                <p>Hello ${userName},</p>
                <p>This is a reminder for your upcoming event:</p>
                
                <div class="event-details">
                    <h2 style="margin-top: 0; color: #2c5aa0;">${event.title || 'Untitled Event'}</h2>
                    <p><strong>📅 Date:</strong> ${eventDate}</p>
                    <p><strong>⏰ Time:</strong> ${eventTime}</p>
                    ${event.location ? `<p><strong>📍 Location:</strong> ${event.location}</p>` : ''}
                    ${event.duration ? `<p><strong>⏱️ Duration:</strong> ${event.duration} hour(s)</p>` : ''}
                    ${isStudyGroup ? 
                        `<p><strong>👥 Type:</strong> Study Group Session</p>` : 
                        `<p><strong>📝 Type:</strong> ${event.activity_type || 'Activity'}</p>`
                    }
                    ${event.subject ? `<p><strong>📚 Subject:</strong> ${event.subject}</p>` : ''}
                    ${event.description ? `<p><strong>📋 Description:</strong> ${event.description}</p>` : ''}
                </div>
                
                <p style="color: #666;">
                    This is a <strong>${reminderTime.toLowerCase()}</strong> reminder for your scheduled event.
                </p>
            </div>
            
            <div class="footer">
                <p>Sent from Wits Campus Study Buddy System<br>
                University of the Witwatersrand<br>
                You can manage your reminders in your calendar settings.</p>
            </div>
        </div>
    `;
}

// Calculate reminder times for an event
function calculateReminderTimes(eventDateTime, reminderTimes = reminderConfig.times) {
    if (!(eventDateTime instanceof Date) || isNaN(eventDateTime.getTime())) {
        throw new Error('Valid event date/time is required');
    }
    
    const eventTime = eventDateTime.getTime();
    const now = Date.now();
    
    if (eventTime <= now) {
        throw new Error('Event must be in the future');
    }
    
    const reminderTimestamps = [];
    
    reminderTimes.forEach(reminder => {
        let reminderTime;
        
        if (reminder.hours !== undefined) {
            reminderTime = eventTime - (reminder.hours * 60 * 60 * 1000);
        } else if (reminder.minutes !== undefined) {
            reminderTime = eventTime - (reminder.minutes * 60 * 1000);
        }
        
        // Only include reminders that are in the future
        if (reminderTime > now) {
            reminderTimestamps.push({
                timestamp: reminderTime,
                delay: reminderTime - now,
                label: reminder.label,
                config: reminder
            });
        }
    });
    
    return reminderTimestamps.sort((a, b) => a.timestamp - b.timestamp);
}

// Generate unique reminder key
function generateReminderKey(event, reminderTime, eventType = eventTypes.ACTIVITY) {
    const eventId = event.id || event.event_id || 'unknown';
    const type = eventType || (event.isStudyGroup ? eventTypes.STUDY_GROUP : eventTypes.ACTIVITY);
    const timeKey = reminderTime.label ? 
        reminderTime.label.replace(/\s+/g, '_') : 
        String(reminderTime.timestamp || reminderTime);
    
    return `${eventId}_${type}_${timeKey}`;
}

// Validate event for reminders
function validateEventForReminders(event) {
    const errors = [];
    
    if (!event) {
        errors.push('Event is required');
        return errors;
    }
    
    if (!event.id && !event.event_id) {
        errors.push('Event ID is required');
    }
    
    if (!event.title) {
        errors.push('Event title is required');
    }
    
    let eventDateTime;
    try {
        eventDateTime = event.datetime instanceof Date ? event.datetime : new Date(event.datetime);
        if (isNaN(eventDateTime.getTime())) {
            errors.push('Valid event date/time is required');
        } else if (eventDateTime <= new Date()) {
            errors.push('Event must be in the future');
        }
    } catch (error) {
        errors.push('Invalid event date/time format');
    }
    
    return errors;
}

// Filter events for reminders
function filterEventsForReminders(events, userId = null) {
    if (!events || !Array.isArray(events)) {
        return [];
    }
    
    const now = new Date();
    
    return events.filter(event => {
        // Check if event is in the future
        let eventDateTime;
        try {
            eventDateTime = event.datetime instanceof Date ? event.datetime : new Date(event.datetime);
            if (isNaN(eventDateTime.getTime()) || eventDateTime <= now) {
                return false;
            }
        } catch (error) {
            return false;
        }
        
        // Check user ID if provided
        if (userId && event.user_id && event.user_id !== userId) {
            return false;
        }
        
        // Filter out completed activities
        if (event.is_completed) {
            return false;
        }
        
        return true;
    });
}

// Sort events by date
function sortEventsByDate(events, ascending = true) {
    if (!events || !Array.isArray(events)) {
        return [];
    }
    
    return [...events].sort((a, b) => {
        const aDate = a.datetime instanceof Date ? a.datetime : new Date(a.datetime);
        const bDate = b.datetime instanceof Date ? b.datetime : new Date(b.datetime);
        
        return ascending ? aDate - bDate : bDate - aDate;
    });
}

// Calculate next refresh time
function calculateNextRefreshTime(currentTime = new Date(), intervalMinutes = 5) {
    const nextRefresh = new Date(currentTime);
    nextRefresh.setMinutes(nextRefresh.getMinutes() + intervalMinutes);
    nextRefresh.setSeconds(0);
    nextRefresh.setMilliseconds(0);
    return nextRefresh;
}

// Format duration for display
function formatDuration(hours) {
    if (hours < 1) {
        const minutes = Math.round(hours * 60);
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (hours === 1) {
        return '1 hour';
    } else if (hours < 24) {
        return `${hours} hours`;
    } else {
        const days = (hours / 24).toFixed(1);
        return `${days} day${days !== '1.0' ? 's' : ''}`;
    }
}

// Debounce function for performance
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

// Throttle function for performance
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Create notification data
function createNotificationData(message, type = 'info') {
    const types = {
        info: {
            background: '#d1ecf1',
            color: '#0c5460',
            borderColor: '#17a2b8',
            icon: 'info-circle'
        },
        success: {
            background: '#d4edda',
            color: '#155724',
            borderColor: '#28a745',
            icon: 'check-circle'
        },
        error: {
            background: '#f8d7da',
            color: '#721c24',
            borderColor: '#dc3545',
            icon: 'exclamation-circle'
        },
        warning: {
            background: '#fff3cd',
            color: '#856404',
            borderColor: '#ffc107',
            icon: 'exclamation-triangle'
        }
    };
    
    const config = types[type] || types.info;
    
    return {
        message,
        type,
        background: config.background,
        color: config.color,
        borderColor: config.borderColor,
        icon: config.icon
    };
}

// Validate reminder timing
function validateReminderTiming(eventDateTime, reminderConfig) {
    const errors = [];
    const now = new Date();
    const eventTime = eventDateTime instanceof Date ? eventDateTime : new Date(eventDateTime);
    
    if (isNaN(eventTime.getTime())) {
        errors.push('Invalid event date/time');
        return errors;
    }
    
    if (eventTime <= now) {
        errors.push('Event must be in the future');
        return errors;
    }
    
    reminderConfig.times.forEach(reminder => {
        let reminderTime;
        
        if (reminder.hours !== undefined) {
            reminderTime = new Date(eventTime.getTime() - (reminder.hours * 60 * 60 * 1000));
        } else if (reminder.minutes !== undefined) {
            reminderTime = new Date(eventTime.getTime() - (reminder.minutes * 60 * 1000));
        }
        
        if (reminderTime <= now) {
            errors.push(`Reminder "${reminder.label}" is in the past`);
        }
        
        // Check minimum delay
        const delayMs = reminderTime.getTime() - now.getTime();
        const delayMinutes = delayMs / (60 * 1000);
        
        if (delayMinutes < reminderConfig.validation.minDelayMinutes) {
            errors.push(`Reminder "${reminder.label}" is too close to current time`);
        }
    });
    
    return errors;
}

// Merge events from different sources
function mergeEvents(activities = [], studyGroups = []) {
    const allEvents = [];
    
    // Add activities
    activities.forEach(activity => {
        allEvents.push({
            ...activity,
            id: activity.id,
            title: activity.title,
            datetime: activity.datetime || new Date(activity.activity_date + 'T' + (activity.activity_time || '00:00')),
            type: eventTypes.ACTIVITY,
            isStudyGroup: false,
            activity_type: activity.activity_type,
            location: activity.location,
            description: activity.description
        });
    });
    
    // Add study groups
    studyGroups.forEach(group => {
        allEvents.push({
            ...group,
            id: group.id,
            title: group.title,
            datetime: group.datetime || new Date(group.date + 'T' + (group.time || '00:00')),
            type: eventTypes.STUDY_GROUP,
            isStudyGroup: true,
            subject: group.subject,
            faculty: group.faculty,
            description: group.description
        });
    });
    
    return allEvents;
}

// Clean up old sent reminders
function cleanupOldReminders(sentReminders, maxAgeHours = 24) {
    const now = Date.now();
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    let cleanedCount = 0;
    
    for (const [key, timestamp] of sentReminders.entries()) {
        if (now - timestamp > maxAgeMs) {
            sentReminders.delete(key);
            cleanedCount++;
        }
    }
    
    return cleanedCount;
}

// Get reminder statistics
function getReminderStatistics(reminderIntervals, sentReminders, events) {
    const scheduledCount = reminderIntervals.size;
    const sentCount = sentReminders.size;
    const eventsCount = events.length;
    
    let upcomingReminders = 0;
    const now = Date.now();
    
    for (const interval of reminderIntervals.values()) {
        // This is a simplified check - in real implementation you'd need to track reminder times
        upcomingReminders++;
    }
    
    return {
        scheduledCount,
        sentCount,
        eventsCount,
        upcomingReminders,
        lastUpdated: new Date().toISOString()
    };
}

module.exports = {
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
};
