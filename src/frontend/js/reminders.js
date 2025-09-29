// reminder.js - Calendar Email Reminder System
class ReminderSystem {
    constructor() {
        console.log('🔔 ReminderSystem constructor called');
        
        // Strong singleton pattern with debug tracking
        if (window._reminderSystemInstance) {
            console.warn('🚫 ReminderSystem instance already exists! Preventing duplicate.');
            return window._reminderSystemInstance;
        }
        window._reminderSystemInstance = this;
        
        // Track initialization source for debugging
        this.initializationSource = new Error().stack;
        this.initializationTime = new Date().toISOString();

        this.currentUser = null;
        this.activities = [];
        this.scheduledGroups = [];
        this.reminderIntervals = new Map();
        this.sentReminders = new Set(); // Track sent reminders to prevent duplicates
        this.isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.API_BASE_URL = this.isLocal 
            ? 'http://localhost:3000/api' 
            : 'https://wits-buddy-g9esajarfqe3dmh6.southafricanorth-01.azurewebsites.net/api';
        
        this.reminderTimes = [
            { hours: 23, label: '23 hours before' },
            { hours: 5, label: '5 hours before' },
            { hours: 1, label: '1 hour before' },
            { minutes: 5, label: '5 minutes before' }
        ];

        this.initialized = false;
        this.refreshInterval = null;
        this.isDestroyed = false;
        
        console.log('🔔 ReminderSystem created at:', this.initializationTime);
        this.init();
    }

    async init() {
        if (this.initialized) {
            console.warn('🚫 ReminderSystem already initialized, skipping');
            return;
        }

        if (this.isDestroyed) {
            console.error('🚫 ReminderSystem was destroyed, cannot reinitialize');
            return;
        }

        console.log('🔔 Initializing reminder system...');
        this.checkAuth();
        
        if (this.currentUser && this.isValidWitsEmail(this.currentUser.email)) {
            await this.loadUserData();
            this.setupReminderSystem();
            this.initialized = true;
            console.log('✅ Reminder system initialized successfully');
        } else {
            console.warn('⚠️ Reminder system: Invalid or non-Wits email address');
        }
    }

    checkAuth() {
        if (window.auth && window.auth.getCurrentUser()) {
            this.currentUser = window.auth.getCurrentUser();
            console.log('🔔 Reminder system user:', this.currentUser.email);
        } else {
            console.warn('⚠️ No user logged in for reminder system');
        }
    }

    isValidWitsEmail(email) {
        const emailRegex = /^\d+@students\.wits\.ac\.za$/i;
        return emailRegex.test(email);
    }

    async loadUserData() {
        if (!this.currentUser) return;

        try {
            await Promise.all([
                this.loadActivities(),
                this.loadScheduledGroups()
            ]);
        } catch (error) {
            console.error('❌ Error loading data for reminders:', error);
        }
    }

    async loadActivities() {
        if (!this.currentUser?.id) return;

        try {
            const response = await fetch(
                `${this.API_BASE_URL}/activities/user/${this.currentUser.id}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                this.activities = data.activities || [];
                console.log('📅 Loaded activities for reminders:', this.activities.length);
            }
        } catch (error) {
            console.error('❌ Error loading activities for reminders:', error);
        }
    }

    async loadScheduledGroups() {
        if (!this.currentUser?.id) return;

        try {
            const userGroupsResponse = await fetch(
                `${this.API_BASE_URL}/groups/user/${this.currentUser.id}?status=active`
            );
            
            if (userGroupsResponse.ok) {
                const userGroupsData = await userGroupsResponse.json();
                const userGroupIds = userGroupsData.groups?.map(group => group.group_id) || [];

                if (userGroupIds.length === 0) {
                    this.scheduledGroups = [];
                    return;
                }

                const BATCH_SIZE = 5;
                const scheduledGroups = [];
                
                for (let i = 0; i < userGroupIds.length; i += BATCH_SIZE) {
                    const batch = userGroupIds.slice(i, i + BATCH_SIZE);
                    const batchPromises = batch.map(groupId => this.fetchGroupDetails(groupId));
                    
                    const batchResults = await Promise.allSettled(batchPromises);
                    const validGroups = batchResults
                        .filter(result => result.status === 'fulfilled' && result.value)
                        .map(result => result.value);
                    
                    scheduledGroups.push(...validGroups);
                }

                this.scheduledGroups = scheduledGroups;
                console.log('👥 Loaded scheduled groups for reminders:', this.scheduledGroups.length);
            }
        } catch (error) {
            console.error('❌ Error loading scheduled groups for reminders:', error);
        }
    }

    async fetchGroupDetails(groupId) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/groups/${groupId}`);
            if (!response.ok) return null;

            const groupData = await response.json();
            const group = groupData.group;
            
            if (group.is_scheduled && group.scheduled_start && group.scheduled_end) {
                const startDate = new Date(group.scheduled_start);
                const endDate = new Date(group.scheduled_end);
                
                const localStartDate = new Date(
                    startDate.getUTCFullYear(),
                    startDate.getUTCMonth(),
                    startDate.getUTCDate(),
                    startDate.getUTCHours(),
                    startDate.getUTCMinutes()
                );
                
                return {
                    id: group.id,
                    title: group.name,
                    description: group.description,
                    type: 'study_group',
                    date: localStartDate.toISOString().split('T')[0],
                    time: this.formatTime(localStartDate),
                    datetime: localStartDate,
                    duration: this.calculateDuration(group.scheduled_start, group.scheduled_end),
                    location: 'Study Group Session',
                    subject: group.subject,
                    faculty: group.faculty,
                    group_id: group.id,
                    group_name: group.name,
                    is_scheduled: true,
                    scheduled_start: group.scheduled_start,
                    scheduled_end: group.scheduled_end
                };
            }
            return null;
        } catch (error) {
            console.error(`❌ Error fetching group ${groupId} for reminders:`, error);
            return null;
        }
    }

    setupReminderSystem() {
        if (!this.currentUser) {
            console.warn('⚠️ No user available for reminder system');
            return;
        }

        if (!this.isValidWitsEmail(this.currentUser.email)) {
            console.warn('⚠️ Reminder system: Invalid email format. Only @students.wits.ac.za emails are supported.');
            return;
        }

        // Clear existing intervals
        this.clearAllReminders();

        // Schedule reminders for all upcoming events
        this.scheduleAllReminders();

        // Clear existing refresh interval
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        // Set up periodic refresh (every 5 minutes)
        this.refreshInterval = setInterval(() => {
            this.refreshReminders();
        }, 5 * 60 * 1000);

        console.log('✅ Reminder system setup complete for:', this.currentUser.email);
        console.log('⏰ Total scheduled reminders:', this.reminderIntervals.size);
    }

    scheduleAllReminders() {
        const allEvents = this.getAllUpcomingEvents();
        
        console.log(`📅 Scheduling reminders for ${allEvents.length} events`);
        
        allEvents.forEach(event => {
            this.scheduleRemindersForEvent(event);
        });

        console.log('✅ Total reminder intervals scheduled:', this.reminderIntervals.size);
    }

    getAllUpcomingEvents() {
        const now = new Date();
        const futureEvents = [];

        // Add activities
        this.activities.forEach(activity => {
            if (!activity.is_completed && activity.user_id === this.currentUser?.id) {
                const eventDate = new Date(activity.activity_date + 'T' + activity.activity_time);
                if (eventDate > now) {
                    futureEvents.push({
                        ...activity,
                        datetime: eventDate,
                        isStudyGroup: false
                    });
                }
            }
        });

        // Add study groups
        this.scheduledGroups.forEach(group => {
            const eventDate = group.datetime;
            if (eventDate > now) {
                futureEvents.push({
                    ...group,
                    isStudyGroup: true
                });
            }
        });

        const sortedEvents = futureEvents.sort((a, b) => a.datetime - b.datetime);
        console.log(`📅 Found ${sortedEvents.length} upcoming events`);
        return sortedEvents;
    }

    scheduleRemindersForEvent(event) {
        const eventTime = event.datetime.getTime();
        const now = Date.now();
        const eventKey = `${event.id}_${event.isStudyGroup ? 'group' : 'activity'}`;

        // Clear any existing reminders for this event first
        this.clearEventReminders(eventKey);

        this.reminderTimes.forEach(reminder => {
            let reminderTime;
            
            if (reminder.hours) {
                reminderTime = eventTime - (reminder.hours * 60 * 60 * 1000);
            } else if (reminder.minutes) {
                reminderTime = eventTime - (reminder.minutes * 60 * 1000);
            }

            // Only schedule if reminder is in the future
            if (reminderTime > now) {
                const delay = reminderTime - now;
                const reminderKey = `${eventKey}_${reminder.label.replace(/\s+/g, '_')}`;
                
                // Check if this reminder is already scheduled
                if (this.reminderIntervals.has(reminderKey)) {
                    console.warn(`⚠️ Reminder already scheduled: ${reminderKey}`);
                    return;
                }
                
                const intervalId = setTimeout(() => {
                    console.log(`🔔 Executing reminder: ${reminderKey}`);
                    this.sendReminder(event, reminder.label);
                    // Remove from map after execution
                    this.reminderIntervals.delete(reminderKey);
                }, delay);

                this.reminderIntervals.set(reminderKey, intervalId);
                
                console.log(`⏰ Scheduled ${reminder.label} reminder for:`, event.title, 
                           `at ${new Date(reminderTime).toLocaleString()}`);
            }
        });
    }

    clearEventReminders(eventKey) {
        let clearedCount = 0;
        for (const [key, intervalId] of this.reminderIntervals.entries()) {
            if (key.startsWith(eventKey)) {
                clearTimeout(intervalId);
                this.reminderIntervals.delete(key);
                clearedCount++;
            }
        }
        if (clearedCount > 0) {
            console.log(`🗑️ Cleared ${clearedCount} existing reminders for event: ${eventKey}`);
        }
    }

    clearAllReminders() {
        let clearedCount = 0;
        for (const intervalId of this.reminderIntervals.values()) {
            clearTimeout(intervalId);
            clearedCount++;
        }
        this.reminderIntervals.clear();
        this.sentReminders.clear();
        console.log(`🗑️ Cleared all ${clearedCount} reminder intervals`);
    }

    async sendReminder(event, reminderTime) {
        if (!this.currentUser?.email) {
            console.error('❌ No user email available for reminder');
            return;
        }

        if (!this.isValidWitsEmail(this.currentUser.email)) {
            console.error('❌ Cannot send reminder: Invalid email format');
            return;
        }

        // Create a unique key for this specific reminder
        const reminderKey = `${event.id}_${reminderTime}_${event.datetime.getTime()}`;
        
        // Check if we've already sent this exact reminder
        if (this.sentReminders.has(reminderKey)) {
            console.warn(`🚫 Duplicate reminder prevented: ${reminderKey}`);
            return;
        }

        // Mark as sent
        this.sentReminders.add(reminderKey);

        try {
            const reminderData = {
                to: this.currentUser.email,
                subject: this.generateReminderSubject(event, reminderTime),
                message: this.generateReminderMessage(event, reminderTime),
                event_type: event.isStudyGroup ? 'study_group' : 'activity',
                event_id: event.id,
                reminder_time: reminderTime,
                user_name: this.currentUser.name || 'Wits Student'
            };

            console.log(`📧 Sending reminder for: ${event.title} (${reminderTime})`);

            const response = await fetch(`${this.API_BASE_URL}/reminders/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reminderData)
            });

            if (response.ok) {
                console.log(`✅ Reminder sent successfully for: ${event.title}`);
                this.showNotification(`Reminder sent for: ${event.title}`, 'success');
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Error sending reminder:', error);
            // Remove from sent reminders so it can be retried
            this.sentReminders.delete(reminderKey);
            this.showNotification('Failed to send reminder', 'error');
        }
    }

    generateReminderSubject(event, reminderTime) {
        const eventType = event.isStudyGroup ? 'Study Group' : 'Activity';
        return `🔔 Wits Study Buddy: ${event.title} - ${reminderTime}`;
    }

    generateReminderMessage(event, reminderTime) {
        const eventDate = event.datetime.toLocaleDateString();
        const eventTime = event.datetime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        let message = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c5aa0;">🔔 Wits Study Buddy Reminder</h2>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #2c5aa0;">${event.title}</h3>
                    <p><strong>📅 Date:</strong> ${eventDate}</p>
                    <p><strong>⏰ Time:</strong> ${eventTime}</p>
                    ${event.location ? `<p><strong>📍 Location:</strong> ${event.location}</p>` : ''}
                    ${event.duration ? `<p><strong>⏱️ Duration:</strong> ${event.duration} hour(s)</p>` : ''}
                    ${event.isStudyGroup ? `<p><strong>👥 Type:</strong> Study Group Session</p>` : `<p><strong>📝 Type:</strong> ${event.activity_type}</p>`}
                    ${event.subject ? `<p><strong>📚 Subject:</strong> ${event.subject}</p>` : ''}
                    ${event.description ? `<p><strong>📋 Description:</strong> ${event.description}</p>` : ''}
                </div>
                <p style="color: #666; font-size: 14px;">
                    This is a ${reminderTime.toLowerCase()} reminder for your scheduled event.
                </p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #999; font-size: 12px;">
                    Sent from Wits Campus Study Buddy System<br>
                    University of the Witwatersrand<br>
                    You can manage your reminders in your calendar settings.
                </p>
            </div>
        `;

        return message;
    }

    async refreshReminders() {
        console.log('🔄 Refreshing reminders...');
        await this.loadUserData();
        this.clearAllReminders();
        this.scheduleAllReminders();
    }

    formatTime(date) {
        return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }

    calculateDuration(start, end) {
        if (!start || !end) return 1;
        const startTime = new Date(start);
        const endTime = new Date(end);
        const durationHours = (endTime - startTime) / (1000 * 60 * 60);
        return Math.max(1, Math.ceil(durationHours));
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
            color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
            padding: 15px 20px;
            border-radius: 5px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            max-width: 400px;
            transform: translateX(400px);
            opacity: 0;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            border-left: 4px solid ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        `;

        notification.innerHTML = `
            <span class="notification-icon" style="margin-right: 10px; font-size: 18px;">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            </span>
            <span class="notification-message" style="flex: 1;">${message}</span>
            <button class="notification-close" style="background: none; border: none; font-size: 18px; cursor: pointer; margin-left: 10px; color: inherit;">&times;</button>
        `;

        document.body.appendChild(notification);

        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        });

        const autoRemove = setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 5000);

        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            clearTimeout(autoRemove);
            notification.style.transform = 'translateX(400px)';
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        });
    }

    async manualRefresh() {
        await this.refreshReminders();
        this.showNotification('Reminders refreshed', 'success');
    }

    destroy() {
        console.log('🗑️ Destroying reminder system...');
        this.clearAllReminders();
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
        this.initialized = false;
        this.isDestroyed = true;
        window._reminderSystemInstance = null;
        console.log('✅ Reminder system destroyed');
    }
}

// Global initialization control
let reminderSystemInitialized = false;

function initializeReminderSystem() {
    if (reminderSystemInitialized) {
        console.warn('🚫 Reminder system initialization already attempted');
        return;
    }

    console.log('🔔 Starting reminder system initialization...');
    
    // Clear any existing instance
    if (window.reminderSystem) {
        console.log('🗑️ Cleaning up existing reminder system instance');
        window.reminderSystem.destroy();
        window.reminderSystem = null;
    }

    // Wait for auth to be ready
    const checkAuthAndInitialize = () => {
        if (window.auth && window.auth.isLoggedIn && window.auth.isLoggedIn()) {
            console.log('✅ User is logged in, initializing reminder system');
            window.reminderSystem = new ReminderSystem();
            reminderSystemInitialized = true;
        } else {
            console.log('⏳ Waiting for user login...');
            // Try again in 1 second
            setTimeout(checkAuthAndInitialize, 1000);
        }
    };

    // Start checking after a short delay
    setTimeout(checkAuthAndInitialize, 2000);
}

// Single DOMContentLoaded listener
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔔 DOM loaded, scheduling reminder system initialization');
    
    // Initialize after a longer delay to ensure everything is loaded
    setTimeout(initializeReminderSystem, 3000);
});

// Prevent multiple initializations from other events
let initializationTimeout = null;
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !reminderSystemInitialized) {
        console.log('🔔 Page visible, checking if reminder system needs initialization');
        if (initializationTimeout) clearTimeout(initializationTimeout);
        initializationTimeout = setTimeout(initializeReminderSystem, 1000);
    }
});

// Export for global access
window.ReminderSystem = ReminderSystem;
window.initializeReminderSystem = initializeReminderSystem;