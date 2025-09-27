// calendar.js - Optimized Calendar Functionality with Reminders
class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.currentView = 'month';
        this.activities = this.loadActivities();
        this.scheduledGroups = [];
        this.currentUser = null;
        this.isLoadingGroups = false;
        this.groupsCache = this.loadCachedGroups();
        
        // API configuration
        this.isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.API_BASE_URL = this.isLocal 
            ? 'http://localhost:3000/api' 
            : 'https://wits-buddy-g9esajarfqe3dmh6.southafricanorth-01.azurewebsites.net/api';
        
        this.init();
    }

    async init() {
        this.checkAuth();
        this.setupEventListeners();
        this.setupReminderListeners();
        
        // Render immediately with available data
        this.renderCalendar();
        this.updateStats();
        this.renderActivitiesList();
        
        // Load scheduled groups in background
        this.loadScheduledGroupsBackground();
    }

    checkAuth() {
        const userData = sessionStorage.getItem('user');
        if (!userData) {
            window.location.href = 'login.html';
            return;
        }
        
        try {
            this.currentUser = JSON.parse(userData);
            console.log('Logged in as:', this.currentUser.name);
        } catch (error) {
            console.error('Error parsing user data:', error);
            window.location.href = 'login.html';
        }
    }

    async loadActivitiesFromDatabase() {
    if (!this.currentUser?.id) return [];

    try {
        const response = await fetch(`${this.API_BASE_URL}/tasks/user/${this.currentUser.id}`, {
            headers: {
                'Authorization': `Bearer ${this.currentUser.session?.access_token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            return data.tasks.map(task => ({
                id: task.id,
                title: task.title,
                type: task.category,
                date: new Date(task.date).toISOString().split('T')[0],
                time: new Date(task.date).toTimeString().slice(0, 5),
                duration: task.duration,
                location: task.location,
                description: task.description,
                priority: task.priority,
                reminder_enabled: task.reminder_enabled,
                reminder_intervals: task.reminder_intervals,
                email_notifications: task.email_notifications,
                userId: task.user_id,
                createdAt: task.created_at,
                updatedAt: task.updated_at,
                fromDatabase: true
            }));
        }
    } catch (error) {
        console.error('Error loading activities from database:', error);
    }

    return [];
}

// Update the init method to load from database
async init() {
    this.checkAuth();
    this.setupEventListeners();
    this.setupReminderListeners();
    
    // Load activities from database first, then fallback to local storage
    const dbActivities = await this.loadActivitiesFromDatabase();
    if (dbActivities.length > 0) {
        this.activities = dbActivities;
    } else {
        this.activities = this.loadActivities();
    }
    
    this.renderCalendar();
    this.updateStats();
    this.renderActivitiesList();
    
    this.loadScheduledGroupsBackground();
}

    async loadScheduledGroupsBackground() {
        if (this.isLoadingGroups) return;
        
        if (!this.currentUser || !this.currentUser.id) {
            console.error('No user ID available');
            return;
        }

        this.isLoadingGroups = true;
        
        try {
            // Use cached data immediately if available and fresh (less than 5 minutes old)
            if (this.groupsCache && this.isCacheFresh(this.groupsCache.timestamp)) {
                this.scheduledGroups = this.groupsCache.groups || [];
                console.log('Using cached scheduled groups');
            } else {
                // Show loading state
                this.showLoadingState(true);
            }

            // Fetch fresh data in background
            const freshGroups = await this.fetchScheduledGroupsWithTimeout();
            this.scheduledGroups = freshGroups;
            
            // Cache the fresh data
            this.cacheGroups(freshGroups);
            
            // Update UI with fresh data
            this.renderCalendar();
            this.updateStats();
            this.renderActivitiesList();
            
        } catch (error) {
            console.error('Error loading scheduled groups:', error);
            // Keep using cached data if available
            if (!this.scheduledGroups.length && this.groupsCache) {
                this.scheduledGroups = this.groupsCache.groups || [];
            }
        } finally {
            this.isLoadingGroups = false;
            this.showLoadingState(false);
        }
    }

    async fetchScheduledGroupsWithTimeout() {
        return new Promise(async (resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Request timeout'));
            }, 8000); // 8 second timeout

            try {
                const groups = await this.fetchScheduledGroups();
                clearTimeout(timeout);
                resolve(groups);
            } catch (error) {
                clearTimeout(timeout);
                reject(error);
            }
        });
    }

    async fetchScheduledGroups() {
        try {
            // Get user's groups with abort controller for cleanup
            const controller = new AbortController();
            
            const userGroupsResponse = await fetch(
                `${this.API_BASE_URL}/groups/user/${this.currentUser.id}?status=active`,
                { signal: controller.signal }
            );
            
            if (!userGroupsResponse.ok) {
                throw new Error(`HTTP error! status: ${userGroupsResponse.status}`);
            }

            const userGroupsData = await userGroupsResponse.json();
            const userGroupIds = userGroupsData.groups?.map(group => group.group_id) || [];

            if (userGroupIds.length === 0) {
                return [];
            }

            // Fetch group details in parallel with concurrency limit
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

            console.log('Loaded scheduled groups:', scheduledGroups);
            return scheduledGroups;

        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn('Request aborted');
            }
            throw error;
        }
    }

    async fetchGroupDetails(groupId) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/groups/${groupId}`);
            if (!response.ok) return null;

            const groupData = await response.json();
            const group = groupData.group;
            
            if (group.is_scheduled && group.scheduled_start && group.scheduled_end) {
                return {
                    id: group.id,
                    title: group.name,
                    description: group.description,
                    type: 'study_group',
                    date: new Date(group.scheduled_start).toISOString().split('T')[0],
                    time: new Date(group.scheduled_start).toTimeString().slice(0, 5),
                    duration: this.calculateDuration(group.scheduled_start, group.scheduled_end),
                    location: 'Study Group Session',
                    subject: group.subject,
                    faculty: group.faculty,
                    group_id: group.id,
                    group_name: group.name,
                    is_scheduled: true,
                    scheduled_start: group.scheduled_start,
                    scheduled_end: group.scheduled_end,
                    meeting_times: group.meeting_times
                };
            }
            return null;
        } catch (error) {
            console.error(`Error fetching group ${groupId}:`, error);
            return null;
        }
    }

    // Cache management methods
    loadCachedGroups() {
        try {
            const cached = localStorage.getItem('scheduledGroupsCache');
            if (!cached) return null;
            
            const cacheData = JSON.parse(cached);
            // Only return cache for same user
            if (cacheData.userId === this.currentUser?.id) {
                return cacheData;
            }
        } catch (error) {
            console.error('Error loading cached groups:', error);
        }
        return null;
    }

    cacheGroups(groups) {
        try {
            const cacheData = {
                groups: groups,
                timestamp: Date.now(),
                userId: this.currentUser.id
            };
            localStorage.setItem('scheduledGroupsCache', JSON.stringify(cacheData));
        } catch (error) {
            console.error('Error caching groups:', error);
        }
    }

    isCacheFresh(timestamp) {
        return Date.now() - timestamp < 300000; // 5 minutes
    }

    calculateDuration(start, end) {
        if (!start || !end) return 1;
        
        const startTime = new Date(start);
        const endTime = new Date(end);
        const durationHours = (endTime - startTime) / (1000 * 60 * 60);
        
        return Math.max(1, Math.ceil(durationHours));
    }

    setupEventListeners() {
        // Navigation
        document.getElementById('prevMonth')?.addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth')?.addEventListener('click', () => this.changeMonth(1));
        document.getElementById('prevWeek')?.addEventListener('click', () => this.changeWeek(-1));
        document.getElementById('nextWeek')?.addEventListener('click', () => this.changeWeek(1));
        document.getElementById('prevDay')?.addEventListener('click', () => this.changeDay(-1));
        document.getElementById('nextDay')?.addEventListener('click', () => this.changeDay(1));
        
        // View controls
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchView(e.target.dataset.view));
        });

        // Today button
        document.getElementById('todayBtn')?.addEventListener('click', () => this.goToToday());

        // Add activity button
        document.getElementById('addActivityBtn')?.addEventListener('click', () => this.openActivityModal());

        // Modal events
        document.getElementById('activityForm')?.addEventListener('submit', (e) => this.saveActivity(e));
        document.getElementById('cancelActivity')?.addEventListener('click', () => this.closeModal());
        document.querySelector('.close-modal')?.addEventListener('click', () => this.closeModal());
        document.getElementById('deleteActivity')?.addEventListener('click', () => this.deleteActivity());

        // Sidebar toggle
        document.getElementById('toggleSidebar')?.addEventListener('click', () => this.toggleSidebar());

        // Close modal when clicking outside
        document.getElementById('activityModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'activityModal') this.closeModal();
        });

        // Date change handler
        document.getElementById('activityDate')?.addEventListener('change', (e) => {
            this.validateDateSelection(e.target.value);
        });

        // Refresh scheduled groups button
        document.getElementById('refreshGroups')?.addEventListener('click', () => this.refreshScheduledGroups());

        // Reminder options toggle
        document.getElementById('activityReminderEnabled')?.addEventListener('change', (e) => {
            const reminderOptions = document.getElementById('reminderOptions');
            if (reminderOptions) {
                reminderOptions.style.display = e.target.checked ? 'block' : 'none';
            }
        });
    }

    // Reminder management methods
    setupReminderListeners() {
        // Check for reminders every minute
        setInterval(() => this.checkReminders(), 60000);
        
        // Initial check
        this.checkReminders();
    }

    async checkReminders() {
        if (!this.currentUser?.id) return;

        try {
            const response = await fetch(`${this.API_BASE_URL}/reminders/user/${this.currentUser.id}`);
            if (!response.ok) return;

            const data = await response.json();
            this.displayReminders(data.reminders);
        } catch (error) {
            console.error('Error checking reminders:', error);
        }
    }

    displayReminders(reminders) {
        // Remove existing reminders
        document.querySelectorAll('.global-reminder').forEach(el => el.remove());

        reminders.forEach(reminder => {
            this.createReminderNotification(reminder);
        });
    }

    createReminderNotification(reminder) {
        const reminderEl = document.createElement('div');
        reminderEl.className = 'global-reminder';
        reminderEl.innerHTML = `
            <div class="reminder-content">
                <div class="reminder-icon">
                    <i class="fas fa-bell"></i>
                </div>
                <div class="reminder-details">
                    <div class="reminder-title">${reminder.title}</div>
                    <div class="reminder-time">Starts at ${new Date(reminder.date).toLocaleTimeString()}</div>
                    <div class="reminder-actions">
                        <button class="btn-reminder-snooze" data-task-id="${reminder.id}">Snooze 5min</button>
                        <button class="btn-reminder-dismiss" data-task-id="${reminder.id}">Dismiss</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(reminderEl);

        // Add event listeners
        reminderEl.querySelector('.btn-reminder-snooze').addEventListener('click', (e) => {
            e.stopPropagation();
            this.snoozeReminder(reminder.id, 5);
            reminderEl.remove();
        });

        reminderEl.querySelector('.btn-reminder-dismiss').addEventListener('click', (e) => {
            e.stopPropagation();
            this.dismissReminder(reminder.id);
            reminderEl.remove();
        });

        // Auto-remove after 5 minutes
        setTimeout(() => {
            if (reminderEl.parentNode) {
                reminderEl.remove();
            }
        }, 300000);
    }

    async snoozeReminder(taskId, minutes) {
        try {
            await fetch(`${this.API_BASE_URL}/reminders/${taskId}/snooze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ minutes })
            });
        } catch (error) {
            console.error('Error snoozing reminder:', error);
        }
    }

    async dismissReminder(taskId) {
        try {
            await fetch(`${this.API_BASE_URL}/reminders/${taskId}/sent`, {
                method: 'POST'
            });
        } catch (error) {
            console.error('Error dismissing reminder:', error);
        }
    }

    async refreshScheduledGroups() {
        this.showNotification('Refreshing scheduled groups...', 'info');
        // Clear cache to force fresh load
        localStorage.removeItem('scheduledGroupsCache');
        this.groupsCache = null;
        await this.loadScheduledGroupsBackground();
        this.showNotification('Scheduled groups updated!', 'success');
    }

    changeMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.renderCalendar();
    }

    changeWeek(direction) {
        this.currentDate.setDate(this.currentDate.getDate() + (direction * 7));
        this.renderCalendar();
    }

    changeDay(direction) {
        this.currentDate.setDate(this.currentDate.getDate() + direction);
        this.renderCalendar();
    }

    switchView(view) {
        this.currentView = view;
        
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        document.getElementById('monthView')?.classList.toggle('active', view === 'month');
        document.getElementById('weekView')?.classList.toggle('active', view === 'week');
        document.getElementById('dayView')?.classList.toggle('active', view === 'day');

        this.renderCalendar();
    }

    goToToday() {
        this.currentDate = new Date();
        this.renderCalendar();
    }

    renderCalendar() {
        // Use requestAnimationFrame for smooth rendering
        requestAnimationFrame(() => {
            switch (this.currentView) {
                case 'month':
                    this.renderMonthView();
                    break;
                case 'week':
                    this.renderWeekView();
                    break;
                case 'day':
                    this.renderDayView();
                    break;
            }
        });
    }

    showLoadingState(show) {
        const loadingIndicator = document.getElementById('calendarLoading');
        
        if (show) {
            if (!loadingIndicator) {
                const indicator = document.createElement('div');
                indicator.id = 'calendarLoading';
                indicator.className = 'calendar-loading';
                indicator.innerHTML = `
                    <div class="loading-spinner"></div>
                    <span>Loading activities...</span>
                `;
                document.querySelector('.calendar-container')?.prepend(indicator);
            }
        } else {
            if (loadingIndicator) {
                loadingIndicator.remove();
            }
        }
    }

    renderMonthView() {
        const monthYear = this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        document.getElementById('currentMonthYear').textContent = monthYear;

        const calendarDays = document.getElementById('calendarDays');
        if (!calendarDays) return;
        
        // Use document fragment for efficient rendering
        const fragment = document.createDocumentFragment();

        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        
        const prevMonthLastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 0).getDate();
        const firstDayOfWeek = firstDay.getDay();

        // Previous month days
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const dayElement = this.createDayElement(prevMonthLastDay - i, true);
            fragment.appendChild(dayElement);
        }

        // Current month days
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dayDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
            const isPast = dayDate < today;
            const dayElement = this.createDayElement(day, false, isPast);
            fragment.appendChild(dayElement);
        }

        // Next month days
        const totalCells = 42;
        const daysSoFar = firstDayOfWeek + lastDay.getDate();
        const nextMonthDays = totalCells - daysSoFar;

        for (let day = 1; day <= nextMonthDays; day++) {
            const dayElement = this.createDayElement(day, true);
            fragment.appendChild(dayElement);
        }

        // Clear and append in one operation
        calendarDays.innerHTML = '';
        calendarDays.appendChild(fragment);
    }

    createDayElement(day, isOtherMonth, isPast = false) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        if (isOtherMonth) {
            dayElement.classList.add('other-month');
        }
        
        const dayDate = new Date(this.currentDate.getFullYear(), 
            isOtherMonth ? this.currentDate.getMonth() + (day < 15 ? -1 : 1) : this.currentDate.getMonth(), 
            day);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dayDate.setHours(0, 0, 0, 0);
        
        if (dayDate.getTime() === today.getTime() && !isOtherMonth) {
            dayElement.classList.add('today');
        }

        if (!isPast && !isOtherMonth) {
            dayElement.style.cursor = 'pointer';
            dayElement.addEventListener('click', () => this.openActivityModal(dayDate));
        } else {
            dayElement.style.cursor = 'not-allowed';
            dayElement.style.opacity = '0.6';
        }

        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayElement.appendChild(dayNumber);

        // Add activities and study groups for this day
        const dayActivities = this.getActivitiesForDate(dayDate);
        const dayStudyGroups = this.getStudyGroupsForDate(dayDate);
        const allDayEvents = [...dayActivities, ...dayStudyGroups];

        if (allDayEvents.length > 0) {
            dayElement.classList.add('has-activities');
            
            const activitiesContainer = document.createElement('div');
            activitiesContainer.className = 'day-activities';
            
            // Limit to 2 events for better performance
            allDayEvents.slice(0, 2).forEach(event => {
                const activityBadge = document.createElement('div');
                activityBadge.className = `activity-badge ${event.type}`;
                activityBadge.textContent = event.title.substring(0, 12) + (event.title.length > 12 ? '...' : '');
                activityBadge.title = `${event.title} - ${event.time}`;
                
                if (event.is_scheduled) {
                    activityBadge.classList.add('study-group');
                    activityBadge.title = `Study Group: ${event.title}\nSubject: ${event.subject}\nTime: ${event.time}`;
                }
                
                activityBadge.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (event.is_scheduled) {
                        this.viewStudyGroupDetails(event);
                    } else {
                        this.editActivity(event.id);
                    }
                });
                activitiesContainer.appendChild(activityBadge);
            });
            
            if (allDayEvents.length > 2) {
                const moreBadge = document.createElement('div');
                moreBadge.className = 'activity-badge more-badge';
                moreBadge.textContent = `+${allDayEvents.length - 2}`;
                moreBadge.title = `${allDayEvents.length - 2} more events`;
                activitiesContainer.appendChild(moreBadge);
            }
            
            dayElement.appendChild(activitiesContainer);
        }

        return dayElement;
    }

    renderWeekView() {
        const weekStart = new Date(this.currentDate);
        weekStart.setDate(this.currentDate.getDate() - this.currentDate.getDay());
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        document.getElementById('currentWeekRange').textContent = 
            `Week of ${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}, ${weekStart.getFullYear()}`;

        const weekGrid = document.getElementById('weekGrid');
        if (!weekGrid) return;
        
        const fragment = document.createDocumentFragment();

        // Time column
        const timeColumn = document.createElement('div');
        timeColumn.className = 'time-column';
        
        for (let hour = 0; hour < 24; hour++) {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.textContent = `${hour.toString().padStart(2, '0')}:00`;
            timeColumn.appendChild(timeSlot);
        }
        
        fragment.appendChild(timeColumn);

        // Day columns
        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(weekStart);
            dayDate.setDate(weekStart.getDate() + i);
            
            const dayColumn = document.createElement('div');
            dayColumn.className = 'week-day-column';
            
            const dayHeader = document.createElement('div');
            dayHeader.className = 'week-day-header';
            dayHeader.textContent = dayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            dayColumn.appendChild(dayHeader);
            
            const dayEvents = document.createElement('div');
            dayEvents.className = 'week-day-events';
            
            // Add events for this day
            const dayActivities = this.getActivitiesForDate(dayDate);
            const dayStudyGroups = this.getStudyGroupsForDate(dayDate);
            const allDayEvents = [...dayActivities, ...dayStudyGroups];
            
            allDayEvents.forEach(event => {
                const eventElement = this.createWeekEventElement(event);
                dayEvents.appendChild(eventElement);
            });
            
            dayColumn.appendChild(dayEvents);
            fragment.appendChild(dayColumn);
        }

        weekGrid.innerHTML = '';
        weekGrid.appendChild(fragment);
    }

    renderDayView() {
        document.getElementById('currentDay').textContent = 
            this.currentDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });

        const dayTimeline = document.getElementById('dayTimeline');
        if (!dayTimeline) return;
        
        const fragment = document.createDocumentFragment();

        const dayActivities = this.getActivitiesForDate(this.currentDate);
        const dayStudyGroups = this.getStudyGroupsForDate(this.currentDate);
        const allDayEvents = [...dayActivities, ...dayStudyGroups];
        
        for (let hour = 0; hour < 24; hour++) {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'day-time-slot';
            
            const timeLabel = document.createElement('div');
            timeLabel.className = 'day-time';
            timeLabel.textContent = `${hour.toString().padStart(2, '0')}:00`;
            timeSlot.appendChild(timeLabel);
            
            const eventsContainer = document.createElement('div');
            eventsContainer.className = 'day-events';
            
            // Add events for this hour
            const hourEvents = allDayEvents.filter(event => {
                const eventHour = parseInt(event.time.split(':')[0]);
                return eventHour === hour;
            });
            
            hourEvents.forEach(event => {
                const eventElement = this.createDayEventElement(event);
                eventsContainer.appendChild(eventElement);
            });
            
            timeSlot.appendChild(eventsContainer);
            fragment.appendChild(timeSlot);
        }

        dayTimeline.innerHTML = '';
        dayTimeline.appendChild(fragment);
    }

    createWeekEventElement(event) {
        const eventElement = document.createElement('div');
        eventElement.className = `week-event ${event.type}`;
        
        if (event.is_scheduled) {
            eventElement.classList.add('study-group');
        }
        
        const startHour = parseInt(event.time.split(':')[0]);
        const duration = event.duration || 1;
        
        eventElement.style.top = `${startHour * 60}px`;
        eventElement.style.height = `${duration * 60}px`;
        eventElement.innerHTML = `
            <strong>${event.time}</strong> - ${event.title}
            ${event.is_scheduled ? '<br><small>👥 Study Group</small>' : ''}
        `;
        
        eventElement.addEventListener('click', () => {
            if (event.is_scheduled) {
                this.viewStudyGroupDetails(event);
            } else {
                this.editActivity(event.id);
            }
        });
        
        return eventElement;
    }

    createDayEventElement(event) {
        const eventElement = document.createElement('div');
        eventElement.className = `day-event ${event.type}`;
        
        if (event.is_scheduled) {
            eventElement.classList.add('study-group');
        }
        
        const startMinutes = parseInt(event.time.split(':')[1]);
        const duration = event.duration || 1;
        
        eventElement.style.top = `${startMinutes}px`;
        eventElement.style.height = `${duration * 60}px`;
        eventElement.innerHTML = `
            <strong>${event.time}</strong> - ${event.title}
            ${event.location ? `<br><small>📍 ${event.location}</small>` : ''}
            ${event.is_scheduled ? `<br><small>👥 ${event.subject} Study Group</small>` : ''}
        `;
        
        eventElement.addEventListener('click', () => {
            if (event.is_scheduled) {
                this.viewStudyGroupDetails(event);
            } else {
                this.editActivity(event.id);
            }
        });
        
        return eventElement;
    }

    viewStudyGroupDetails(studyGroup) {
        const modalHTML = `
            <div class="modal active" id="studyGroupModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Study Group Session</h2>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="study-group-details">
                            <h3>${studyGroup.title}</h3>
                            <p><strong>Subject:</strong> ${studyGroup.subject || 'Not specified'}</p>
                            <p><strong>Date & Time:</strong> ${this.formatDisplayDate(studyGroup.date)} at ${studyGroup.time}</p>
                            <p><strong>Duration:</strong> ${studyGroup.duration} hour(s)</p>
                            <p><strong>Faculty:</strong> ${studyGroup.faculty || 'Not specified'}</p>
                            ${studyGroup.description ? `<p><strong>Description:</strong> ${studyGroup.description}</p>` : ''}
                            ${studyGroup.meeting_times ? `<p><strong>Regular Meetings:</strong> ${studyGroup.meeting_times}</p>` : ''}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" id="closeStudyGroupBtn">Close</button>
                        <button class="btn btn-primary" id="goToGroupBtn">
                            <i class="fas fa-users"></i> Go to Group
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = document.getElementById('studyGroupModal');
        const closeBtn = modal.querySelector('.modal-close');
        const closeBtn2 = modal.querySelector('#closeStudyGroupBtn');
        const goToGroupBtn = modal.querySelector('#goToGroupBtn');

        const closeModal = () => modal.remove();

        closeBtn.addEventListener('click', closeModal);
        closeBtn2.addEventListener('click', closeModal);
        
        goToGroupBtn.addEventListener('click', () => {
            window.location.href = `student-groups.html?viewGroup=${studyGroup.group_id}`;
        });

        modal.addEventListener('click', (e) => e.target === modal && closeModal());
    }

    getActivitiesForDate(date) {
        const dateString = this.formatDateForInput(date);
        return this.activities.filter(activity => 
            activity.date === dateString && activity.userId === this.currentUser?.id
        ).sort((a, b) => a.time.localeCompare(b.time));
    }

    getStudyGroupsForDate(date) {
        const dateString = this.formatDateForInput(date);
        return this.scheduledGroups.filter(group => 
            group.date === dateString
        ).sort((a, b) => a.time.localeCompare(b.time));
    }

    getAllUpcomingEvents() {
        const today = new Date().toISOString().split('T')[0];
        const activities = this.activities
            .filter(activity => activity.date >= today && activity.userId === this.currentUser?.id);
        
        const studyGroups = this.scheduledGroups
            .filter(group => group.date >= today);
        
        return [...activities, ...studyGroups]
            .sort((a, b) => {
                if (a.date === b.date) return a.time.localeCompare(b.time);
                return a.date.localeCompare(b.date);
            })
            .slice(0, 8); // Reduced from 10 to 8 for better performance
    }

    renderActivitiesList() {
        const activitiesList = document.getElementById('activitiesList');
        if (!activitiesList) return;
        
        const upcomingEvents = this.getAllUpcomingEvents();
        
        if (upcomingEvents.length === 0) {
            activitiesList.innerHTML = `
                <div class="empty-activities">
                    <i class="fas fa-calendar-plus"></i>
                    <p>No upcoming activities</p>
                    <button class="btn btn-primary" onclick="calendar.openActivityModal()">Add Your First Activity</button>
                </div>
            `;
            return;
        }
        
        // Use efficient string building
        let html = '';
        for (const event of upcomingEvents) {
            const onClick = event.is_scheduled 
                ? `calendar.viewStudyGroupDetails(${JSON.stringify(event).replace(/"/g, '&quot;')})`
                : `calendar.editActivity('${event.id}')`;
            
            html += `
                <div class="activity-item ${event.type} ${event.is_scheduled ? 'study-group' : ''}" 
                     onclick="${onClick}">
                    <div class="activity-time">
                        <i class="fas ${event.is_scheduled ? 'fa-users' : 'fa-clock'}"></i>
                        ${this.formatDisplayDate(event.date)} at ${event.time}
                    </div>
                    <div class="activity-title">${event.title}</div>
                    <div class="activity-meta">
                        <span><i class="fas fa-tag"></i> ${event.is_scheduled ? 'Study Group' : event.type}</span>
                        ${event.location ? `<span><i class="fas fa-map-marker-alt"></i> ${event.location}</span>` : ''}
                        ${event.is_scheduled && event.subject ? `<span><i class="fas fa-book"></i> ${event.subject}</span>` : ''}
                    </div>
                </div>
            `;
        }
        
        activitiesList.innerHTML = html;
    }

    updateStats() {
        const today = new Date();
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        const monthActivities = this.activities.filter(activity => {
            const activityDate = new Date(activity.date);
            return activityDate >= monthStart && activityDate <= monthEnd && activity.userId === this.currentUser.id;
        });

        const studySessions = monthActivities.filter(a => a.type === 'study').length;
        const upcomingDeadlines = this.getAllUpcomingEvents().length;
        const groupSessions = this.scheduledGroups.filter(group => {
            const groupDate = new Date(group.date);
            return groupDate >= monthStart && groupDate <= monthEnd;
        }).length;
        const completedActivities = monthActivities.filter(a => {
            const activityDate = new Date(a.date);
            return activityDate < today;
        }).length;

        // Batch DOM updates
        requestAnimationFrame(() => {
            document.getElementById('studySessionsCount').textContent = studySessions;
            document.getElementById('upcomingDeadlines').textContent = upcomingDeadlines;
            document.getElementById('groupSessions').textContent = groupSessions;
            document.getElementById('completedActivities').textContent = completedActivities;
        });
    }

    openActivityModal(prefilledDate = null) {
        const modal = document.getElementById('activityModal');
        if (!modal) return;
        
        const form = document.getElementById('activityForm');
        const modalTitle = document.getElementById('modalTitle');
        const deleteBtn = document.getElementById('deleteActivity');
        
        form.reset();
        deleteBtn.style.display = 'none';
        modalTitle.textContent = 'Add New Activity';
        
        const now = new Date();
        const defaultDate = prefilledDate || now;
        
        document.getElementById('selectedDate').value = this.formatDateForInput(defaultDate);
        document.getElementById('activityDate').value = this.formatDateForInput(defaultDate);
        document.getElementById('activityTime').value = this.formatTimeForInput(now);
        
        // Reset reminder options
        document.getElementById('activityReminderEnabled').checked = false;
        document.getElementById('reminderOptions').style.display = 'none';
        document.querySelectorAll('input[name="reminderIntervals"]').forEach(cb => {
            cb.checked = cb.value === '15'; // Default to 15 minutes
        });
        document.getElementById('activityEmailNotifications').checked = false;
        
        modal.style.display = 'block';
        this.validateDateSelection(document.getElementById('activityDate').value);
    }

    editActivity(activityId) {
        const activity = this.activities.find(a => a.id === activityId);
        if (!activity) return;

        const modal = document.getElementById('activityModal');
        if (!modal) return;
        
        const form = document.getElementById('activityForm');
        const modalTitle = document.getElementById('modalTitle');
        const deleteBtn = document.getElementById('deleteActivity');
        
        form.reset();
        deleteBtn.style.display = 'block';
        modalTitle.textContent = 'Edit Activity';
        
        // Populate basic fields
        document.getElementById('activityId').value = activity.id;
        document.getElementById('activityTitle').value = activity.title;
        document.getElementById('activityType').value = activity.type;
        document.getElementById('activityDate').value = activity.date;
        document.getElementById('activityTime').value = activity.time;
        document.getElementById('activityDuration').value = activity.duration || 1;
        document.getElementById('activityLocation').value = activity.location || '';
        document.getElementById('activityDescription').value = activity.description || '';
        document.getElementById('activityPriority').value = activity.priority || 'medium';
        
        // Populate reminder fields
        document.getElementById('activityReminderEnabled').checked = activity.reminder_enabled || false;
        
        // Show/hide reminder options
        const reminderOptions = document.getElementById('reminderOptions');
        if (reminderOptions) {
            reminderOptions.style.display = activity.reminder_enabled ? 'block' : 'none';
        }
        
        // Set reminder intervals
        if (activity.reminder_intervals) {
            document.querySelectorAll('input[name="reminderIntervals"]').forEach(checkbox => {
                checkbox.checked = activity.reminder_intervals.includes(parseInt(checkbox.value));
            });
        }
        
        // Set email notifications
        document.getElementById('activityEmailNotifications').checked = activity.email_notifications || false;
        
        modal.style.display = 'block';
    }

    closeModal() {
        const modal = document.getElementById('activityModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    saveActivity(e) {
        e.preventDefault();
        
        const activityId = document.getElementById('activityId').value;
        const reminderEnabled = document.getElementById('activityReminderEnabled').checked;
        const emailNotifications = document.getElementById('activityEmailNotifications').checked;
        
        // Get selected reminder intervals
        const reminderIntervalCheckboxes = document.querySelectorAll('input[name="reminderIntervals"]:checked');
        const reminderIntervals = Array.from(reminderIntervalCheckboxes).map(cb => parseInt(cb.value));
        
        const activity = {
            id: activityId || this.generateId(),
            title: document.getElementById('activityTitle').value,
            type: document.getElementById('activityType').value,
            date: document.getElementById('activityDate').value,
            time: document.getElementById('activityTime').value,
            duration: parseFloat(document.getElementById('activityDuration').value),
            location: document.getElementById('activityLocation').value,
            description: document.getElementById('activityDescription').value,
            priority: document.getElementById('activityPriority').value,
            reminder_enabled: reminderEnabled,
            reminder_intervals: reminderIntervals.length > 0 ? reminderIntervals : [15], // Default to 15 min
            email_notifications: emailNotifications,
            userId: this.currentUser.id,
            createdAt: activityId ? this.activities.find(a => a.id === activityId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const activityDate = new Date(activity.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (activityDate < today) {
            alert('Cannot create activities for past dates. Please select a present or future date.');
            return;
        }

        if (activityId) {
            const index = this.activities.findIndex(a => a.id === activityId);
            if (index !== -1) {
                this.activities[index] = activity;
            }
        } else {
            this.activities.push(activity);
        }

        this.saveActivities();
        this.renderCalendar();
        this.updateStats();
        this.renderActivitiesList();
        this.closeModal();
        
        this.showNotification('Activity saved successfully!', 'success');
        
        // Save to database with reminders
        this.saveActivityToDatabase(activity);
    }

   async saveActivityToDatabase(activity) {
    try {
        const taskData = {
            title: activity.title,
            date: new Date(`${activity.date}T${activity.time}`).toISOString(),
            user_id: this.currentUser.id,
            description: activity.description,
            category: activity.type,
            priority: activity.priority,
            duration: activity.duration,
            location: activity.location,
            reminder_enabled: activity.reminder_enabled,
            reminder_intervals: activity.reminder_intervals || [15],
            email_notifications: activity.email_notifications || false
        };

        console.log('Saving task to database:', taskData);

        const response = await fetch(`${this.API_BASE_URL}/tasks`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.currentUser.session?.access_token}`
            },
            body: JSON.stringify(taskData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log('Activity saved to database:', result);
        
        // Update the activity with the database ID
        activity.db_id = result.task.id;
        this.saveActivities(); // Update local storage
        
    } catch (error) {
        console.error('Error saving activity to database:', error);
        this.showNotification('Failed to save activity to cloud. Using local storage only.', 'error');
    }
}

    deleteActivity() {
        const activityId = document.getElementById('activityId').value;
        
        if (confirm('Are you sure you want to delete this activity?')) {
            this.activities = this.activities.filter(a => a.id !== activityId);
            this.saveActivities();
            this.renderCalendar();
            this.updateStats();
            this.renderActivitiesList();
            this.closeModal();
            
            this.showNotification('Activity deleted successfully!', 'success');
        }
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.activities-sidebar');
        const toggleBtn = document.getElementById('toggleSidebar');
        
        if (sidebar && toggleBtn) {
            sidebar.classList.toggle('collapsed');
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-chevron-left');
                icon.classList.toggle('fa-chevron-right');
            }
        }
    }

    // Utility methods
    formatDateForInput(date) {
        if (!(date instanceof Date)) date = new Date(date);
        return date.toISOString().split('T')[0];
    }

    formatTimeForInput(date) {
        return date.toTimeString().slice(0, 5);
    }

    formatDisplayDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    loadActivities() {
        const saved = localStorage.getItem('calendarActivities');
        if (!saved) return [];
        
        try {
            const activities = JSON.parse(saved);
            const userData = sessionStorage.getItem('user');
            if (userData) {
                const currentUser = JSON.parse(userData);
                return activities.filter(activity => activity.userId === currentUser.id);
            }
            return [];
        } catch (error) {
            console.error('Error loading activities:', error);
            return [];
        }
    }

    saveActivities() {
        try {
            const existingActivities = JSON.parse(localStorage.getItem('calendarActivities') || '[]');
            const otherUsersActivities = existingActivities.filter(activity => activity.userId !== this.currentUser.id);
            const allActivities = [...otherUsersActivities, ...this.activities];
            localStorage.setItem('calendarActivities', JSON.stringify(allActivities));
        } catch (error) {
            console.error('Error saving activities:', error);
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
    }

    validateDateSelection(dateString) {
        // Optional: Add date validation logic here
    }
}

// Add optimized CSS for loading states and reminders
const optimizedStyles = document.createElement('style');
optimizedStyles.textContent = `
    .calendar-loading {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 255, 255, 0.9);
        padding: 1rem 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    
    .loading-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid var(--study-blue);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    .more-badge {
        font-size: 0.8em;
        padding: 2px 4px;
    }
    
    .calendar-day {
        transition: opacity 0.2s ease;
    }
    
    /* Global Reminder Styles */
    .global-reminder {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        border-left: 4px solid var(--study-warning);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        max-width: 350px;
    }

    .reminder-content {
        display: flex;
        padding: 15px;
        gap: 15px;
    }

    .reminder-icon {
        color: var(--study-warning);
        font-size: 1.5rem;
    }

    .reminder-details {
        flex: 1;
    }

    .reminder-title {
        font-weight: 600;
        color: var(--study-dark);
        margin-bottom: 5px;
    }

    .reminder-time {
        color: var(--study-muted);
        font-size: 0.9rem;
        margin-bottom: 10px;
    }

    .reminder-actions {
        display: flex;
        gap: 10px;
    }

    .btn-reminder-snooze,
    .btn-reminder-dismiss {
        padding: 5px 10px;
        border: none;
        border-radius: 5px;
        font-size: 0.8rem;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .btn-reminder-snooze {
        background: var(--study-blue-lighter);
        color: var(--study-blue);
    }

    .btn-reminder-dismiss {
        background: var(--study-border);
        color: var(--study-muted);
    }

    .btn-reminder-snooze:hover {
        background: var(--study-blue-light);
        color: white;
    }

    .btn-reminder-dismiss:hover {
        background: var(--study-muted);
        color: white;
    }

    /* Reminder Options in Modal */
    .reminder-intervals {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-top: 10px;
    }

    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        padding: 8px;
        border-radius: 5px;
        transition: background 0.3s ease;
    }

    .checkbox-label:hover {
        background: var(--study-blue-lighter);
    }

    .checkbox-label input[type="checkbox"] {
        margin: 0;
        width: auto;
    }

    /* Animations */
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    /* Responsive */
    @media (max-width: 768px) {
        .global-reminder {
            left: 20px;
            right: 20px;
            max-width: none;
        }
        
        .reminder-intervals {
            grid-template-columns: 1fr;
        }
    }
`;
document.head.appendChild(optimizedStyles);

// Initialize calendar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.calendar = new Calendar();
});

// Global function for modal opening from HTML
function openActivityModal() {
    if (window.calendar) {
        window.calendar.openActivityModal();
    }
}