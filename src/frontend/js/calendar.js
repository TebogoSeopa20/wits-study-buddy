// calendar.js - Calendar with Full API Integration - FIXED API INTEGRATION
class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.currentView = 'month';
        this.activities = [];
        this.scheduledGroups = [];
        this.currentUser = null;
        this.isLoadingGroups = false;
        this.groupsCache = null;
        
        // API configuration
        this.isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.API_BASE_URL = this.isLocal 
            ? 'http://localhost:3000/api' 
            : 'https://wits-buddy-g9esajarfqe3dmh6.southafricanorth-01.azurewebsites.net/api';
        
        // Initialize with empty UI first for immediate display
        this.initUI();
        this.init();
    }

    async init() {
        this.checkAuth();
        this.setupEventListeners();
        
        // Render empty calendar immediately
        this.renderCalendar();
        this.renderActivitiesList();
        this.updateStats();
        
        // Load data in background
        await this.loadInitialData();
        
        // Update with real data once loaded
        this.renderCalendar();
        this.updateStats();
        this.renderActivitiesList();
    }

    initUI() {
        // Set up initial UI structure immediately
        this.renderMonthViewSkeleton();
        this.renderActivitiesListSkeleton();
        this.updateStatsSkeleton();
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

    async loadInitialData() {
        try {
            // Load activities and groups in parallel
            await Promise.all([
                this.loadActivities(),
                this.loadScheduledGroups()
            ]);
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showNotification('Error loading calendar data', 'error');
        }
    }

    async loadActivities() {
        if (!this.currentUser || !this.currentUser.id) {
            console.error('No user ID available');
            return;
        }

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

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.activities = (data.activities || []).map(activity => this.fixActivityDates(activity));
            console.log('Loaded activities:', this.activities.length);
        } catch (error) {
            console.error('Error loading activities:', error);
            this.activities = [];
            throw error;
        }
    }

    async loadScheduledGroups() {
        if (this.isLoadingGroups) return;
        
        if (!this.currentUser || !this.currentUser.id) {
            console.error('No user ID available');
            return;
        }

        this.isLoadingGroups = true;
        
        try {
            // Get user's groups
            const userGroupsResponse = await fetch(
                `${this.API_BASE_URL}/groups/user/${this.currentUser.id}?status=active`
            );
            
            if (!userGroupsResponse.ok) {
                throw new Error(`HTTP error! status: ${userGroupsResponse.status}`);
            }

            const userGroupsData = await userGroupsResponse.json();
            const userGroupIds = userGroupsData.groups?.map(group => group.group_id) || [];

            if (userGroupIds.length === 0) {
                this.scheduledGroups = [];
                return;
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

            this.scheduledGroups = scheduledGroups.map(group => this.fixGroupDates(group));
            console.log('Loaded scheduled groups:', this.scheduledGroups.length);

        } catch (error) {
            console.error('Error loading scheduled groups:', error);
            this.scheduledGroups = [];
        } finally {
            this.isLoadingGroups = false;
        }
    }

    // FIXED: Proper timezone handling for activities
    fixActivityDates(activity) {
        if (activity.activity_date) {
            // Parse the date string as UTC and convert to local timezone correctly
            const utcDate = new Date(activity.activity_date + 'T00:00:00Z'); // Force UTC
            
            // Get local date components
            const localYear = utcDate.getFullYear();
            const localMonth = utcDate.getMonth();
            const localDate = utcDate.getDate();
            
            // Create a new date in local timezone
            const localDateObj = new Date(localYear, localMonth, localDate);
            
            // Store the fixed date string for comparison (YYYY-MM-DD format)
            activity.activity_date_fixed = localDateObj.toISOString().split('T')[0];
            
            // Also store the original date for reference
            activity.activity_date_utc = activity.activity_date;
        }
        return activity;
    }

    // FIXED: Proper timezone handling for groups
    fixGroupDates(group) {
        if (group.date) {
            // Parse the date string as UTC and convert to local timezone correctly
            const utcDate = new Date(group.date + 'T00:00:00Z'); // Force UTC
            
            // Get local date components
            const localYear = utcDate.getFullYear();
            const localMonth = utcDate.getMonth();
            const localDate = utcDate.getDate();
            
            // Create a new date in local timezone
            const localDateObj = new Date(localYear, localMonth, localDate);
            
            group.date_fixed = localDateObj.toISOString().split('T')[0];
            group.date_utc = utcDate.toISOString().split('T')[0];
        }
        
        // Fix scheduled_start and scheduled_end for proper display
        if (group.scheduled_start) {
            const startDate = new Date(group.scheduled_start);
            group.scheduled_start_fixed = this.formatDateTimeLocal(startDate);
        }
        if (group.scheduled_end) {
            const endDate = new Date(group.scheduled_end);
            group.scheduled_end_fixed = this.formatDateTimeLocal(endDate);
        }
        
        return group;
    }

    // Helper method to format datetime in local timezone
    formatDateTimeLocal(date) {
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        });
    }

    async fetchGroupDetails(groupId) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/groups/${groupId}`);
            if (!response.ok) return null;

            const groupData = await response.json();
            const group = groupData.group;
            
            if (group.is_scheduled && group.scheduled_start && group.scheduled_end) {
                // Parse UTC dates and convert to local dates correctly
                const startDate = new Date(group.scheduled_start);
                const endDate = new Date(group.scheduled_end);
                
                // Get local date components from UTC dates
                const localStartDate = new Date(
                    startDate.getUTCFullYear(),
                    startDate.getUTCMonth(),
                    startDate.getUTCDate(),
                    startDate.getUTCHours(),
                    startDate.getUTCMinutes()
                );
                
                const localEndDate = new Date(
                    endDate.getUTCFullYear(),
                    endDate.getUTCMonth(),
                    endDate.getUTCDate(),
                    endDate.getUTCHours(),
                    endDate.getUTCMinutes()
                );
                
                return {
                    id: group.id,
                    title: group.name,
                    description: group.description,
                    type: 'study_group',
                    date: localStartDate.toISOString().split('T')[0], // Store as local date
                    time: this.formatTime(localStartDate),
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

        // Modal events - FIXED: Corrected API endpoints
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

        // Refresh button
        const refreshBtn = document.createElement('button');
        refreshBtn.id = 'refreshData';
        refreshBtn.className = 'refresh-btn';
        refreshBtn.addEventListener('click', () => this.refreshData());
        
        const calendarControls = document.querySelector('.calendar-controls');
        if (calendarControls) {
            calendarControls.appendChild(refreshBtn);
        }
    }

    async refreshData() {
        this.showNotification('Refreshing calendar data...', 'info');
        try {
            await Promise.all([
                this.loadActivities(),
                this.loadScheduledGroups()
            ]);
            
            this.renderCalendar();
            this.updateStats();
            this.renderActivitiesList();
            this.showNotification('Calendar data updated!', 'success');
        } catch (error) {
            console.error('Error refreshing data:', error);
            this.showNotification('Error refreshing data', 'error');
        }
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

    renderMonthViewSkeleton() {
        const monthYear = this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        const monthYearElement = document.getElementById('currentMonthYear');
        if (monthYearElement) monthYearElement.textContent = monthYear;

        const calendarDays = document.getElementById('calendarDays');
        if (!calendarDays) return;
        
        // Create skeleton loading state
        calendarDays.innerHTML = '';
        for (let i = 0; i < 42; i++) { // 6 weeks
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day loading';
            dayElement.innerHTML = `
                <div class="day-number">${i % 30 + 1}</div>
                <div class="day-activities">
                    <div class="activity-badge skeleton"></div>
                </div>
            `;
            calendarDays.appendChild(dayElement);
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

        // Add activities and study groups for this day - use fixed dates
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
                activityBadge.className = `activity-badge ${event.activity_type || event.type}`;
                activityBadge.textContent = event.title.substring(0, 12) + (event.title.length > 12 ? '...' : '');
                
                // Use fixed dates for display
                const displayDate = event.activity_date_fixed || event.date_fixed || event.activity_date || event.date;
                const displayTime = event.activity_time || event.time;
                activityBadge.title = `${event.title} - ${displayTime}`;
                
                if (event.is_scheduled) {
                    activityBadge.classList.add('study-group');
                    activityBadge.title = `Study Group: ${event.title}\nSubject: ${event.subject}\nTime: ${displayTime}`;
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
            
            // Add events for this day using fixed dates
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
                const eventTime = event.activity_time || event.time;
                const eventHour = parseInt(eventTime.split(':')[0]);
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
        eventElement.className = `week-event ${event.activity_type || event.type}`;
        
        if (event.is_scheduled) {
            eventElement.classList.add('study-group');
        }
        
        const eventTime = event.activity_time || event.time;
        const startHour = parseInt(eventTime.split(':')[0]);
        const duration = event.duration_hours || event.duration || 1;
        
        eventElement.style.top = `${startHour * 60}px`;
        eventElement.style.height = `${duration * 60}px`;
        eventElement.innerHTML = `
            <strong>${eventTime}</strong> - ${event.title}
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
        eventElement.className = `day-event ${event.activity_type || event.type}`;
        
        if (event.is_scheduled) {
            eventElement.classList.add('study-group');
        }
        
        const eventTime = event.activity_time || event.time;
        const startMinutes = parseInt(eventTime.split(':')[1]);
        const duration = event.duration_hours || event.duration || 1;
        
        eventElement.style.top = `${startMinutes}px`;
        eventElement.style.height = `${duration * 60}px`;
        eventElement.innerHTML = `
            <strong>${eventTime}</strong> - ${event.title}
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
                            <p><strong>Date & Time:</strong> ${this.formatDisplayDate(studyGroup.date_fixed || studyGroup.date)} at ${studyGroup.time}</p>
                            <p><strong>Duration:</strong> ${studyGroup.duration_hours || studyGroup.duration} hour(s)</p>
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

    // FIXED: Proper date comparison using fixed dates
    getActivitiesForDate(date) {
        const dateString = this.formatDateForInput(date);
        
        const activities = this.activities.filter(activity => {
            // Always use the fixed date which has been converted to local timezone
            const activityDate = activity.activity_date_fixed;
            const matches = activityDate === dateString && 
                   activity.user_id === this.currentUser?.id &&
                   !activity.is_completed;
            
            return matches;
        }).sort((a, b) => a.activity_time.localeCompare(b.activity_time));
        
        return activities;
    }

    // FIXED: Proper date comparison using fixed dates
    getStudyGroupsForDate(date) {
        const dateString = this.formatDateForInput(date);
        
        const groups = this.scheduledGroups.filter(group => {
            // Always use the fixed date which has been converted to local timezone
            const groupDate = group.date_fixed;
            const matches = groupDate === dateString;
            
            return matches;
        }).sort((a, b) => (a.activity_time || a.time).localeCompare(b.activity_time || b.time));
        
        return groups;
    }

    getAllUpcomingEvents() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const activities = this.activities
            .filter(activity => {
                const activityDate = new Date(activity.activity_date_fixed || activity.activity_date);
                activityDate.setHours(0, 0, 0, 0);
                return activityDate >= today && 
                       activity.user_id === this.currentUser?.id &&
                       !activity.is_completed;
            });
        
        const studyGroups = this.scheduledGroups
            .filter(group => {
                const groupDate = new Date(group.date_fixed || group.date);
                groupDate.setHours(0, 0, 0, 0);
                return groupDate >= today;
            });
        
        return [...activities, ...studyGroups]
            .sort((a, b) => {
                const aDate = new Date(a.activity_date_fixed || a.date_fixed || a.activity_date || a.date);
                const bDate = new Date(b.activity_date_fixed || b.date_fixed || b.activity_date || b.date);
                
                if (aDate.getTime() === bDate.getTime()) {
                    const aTime = a.activity_time || a.time;
                    const bTime = b.activity_time || b.time;
                    return aTime.localeCompare(bTime);
                }
                return aDate - bDate;
            })
            .slice(0, 8);
    }

    renderActivitiesListSkeleton() {
        const activitiesList = document.getElementById('activitiesList');
        if (!activitiesList) return;
        
        activitiesList.innerHTML = `
            <div class="activity-item skeleton">
                <div class="activity-time skeleton-text"></div>
                <div class="activity-title skeleton-text"></div>
                <div class="activity-meta skeleton-text"></div>
            </div>
            <div class="activity-item skeleton">
                <div class="activity-time skeleton-text"></div>
                <div class="activity-title skeleton-text"></div>
                <div class="activity-meta skeleton-text"></div>
            </div>
            <div class="activity-item skeleton">
                <div class="activity-time skeleton-text"></div>
                <div class="activity-title skeleton-text"></div>
                <div class="activity-meta skeleton-text"></div>
            </div>
        `;
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
            
            // Use fixed dates for display
            const displayDate = event.activity_date_fixed || event.date_fixed || event.activity_date || event.date;
            
            html += `
                <div class="activity-item ${event.activity_type || event.type} ${event.is_scheduled ? 'study-group' : ''}" 
                     onclick="${onClick}">
                    <div class="activity-time">
                        <i class="fas ${event.is_scheduled ? 'fa-users' : 'fa-clock'}"></i>
                        ${this.formatDisplayDate(displayDate)} at ${event.activity_time || event.time}
                    </div>
                    <div class="activity-title">${event.title}</div>
                    <div class="activity-meta">
                        <span><i class="fas fa-tag"></i> ${event.is_scheduled ? 'Study Group' : (event.activity_type || event.type)}</span>
                        ${event.location ? `<span><i class="fas fa-map-marker-alt"></i> ${event.location}</span>` : ''}
                        ${event.is_scheduled && event.subject ? `<span><i class="fas fa-book"></i> ${event.subject}</span>` : ''}
                    </div>
                </div>
            `;
        }
        
        activitiesList.innerHTML = html;
    }

    updateStatsSkeleton() {
        // Set initial skeleton values
        requestAnimationFrame(() => {
            document.getElementById('studySessionsCount').textContent = '0';
            document.getElementById('upcomingDeadlines').textContent = '0';
            document.getElementById('groupSessions').textContent = '0';
            document.getElementById('completedActivities').textContent = '0';
        });
    }

    updateStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        const monthActivities = this.activities.filter(activity => {
            const activityDate = new Date(activity.activity_date_fixed || activity.activity_date);
            activityDate.setHours(0, 0, 0, 0);
            return activityDate >= monthStart && 
                   activityDate <= monthEnd && 
                   activity.user_id === this.currentUser?.id;
        });

        const studySessions = monthActivities.filter(a => a.activity_type === 'study' && !a.is_completed).length;
        const upcomingDeadlines = this.getAllUpcomingEvents().length;
        const groupSessions = this.scheduledGroups.filter(group => {
            const groupDate = new Date(group.date_fixed || group.date);
            groupDate.setHours(0, 0, 0, 0);
            return groupDate >= monthStart && groupDate <= monthEnd;
        }).length;
        const completedActivities = monthActivities.filter(a => a.is_completed).length;

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
        
        document.getElementById('activityId').value = '';
        document.getElementById('activityTitle').value = '';
        document.getElementById('activityType').value = 'study';
        document.getElementById('activityDate').value = this.formatDateForInput(defaultDate);
        document.getElementById('activityTime').value = this.formatTimeForInput(now);
        document.getElementById('activityDuration').value = '1';
        document.getElementById('activityLocation').value = '';
        document.getElementById('activityDescription').value = '';
        document.getElementById('activityPriority').value = 'medium';
        
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
        
        document.getElementById('activityId').value = activity.id;
        document.getElementById('activityTitle').value = activity.title;
        document.getElementById('activityType').value = activity.activity_type;
        document.getElementById('activityDate').value = activity.activity_date_fixed || activity.activity_date;
        document.getElementById('activityTime').value = activity.activity_time;
        document.getElementById('activityDuration').value = activity.duration_hours || 1;
        document.getElementById('activityLocation').value = activity.location || '';
        document.getElementById('activityDescription').value = activity.description || '';
        document.getElementById('activityPriority').value = activity.priority || 'medium';
        
        modal.style.display = 'block';
    }

    async saveActivity(e) {
        e.preventDefault();
        
        const activityId = document.getElementById('activityId').value;
        const isEditing = !!activityId;
        
        const activityData = {
            user_id: this.currentUser.id,
            title: document.getElementById('activityTitle').value,
            activity_type: document.getElementById('activityType').value,
            description: document.getElementById('activityDescription').value,
            activity_date: document.getElementById('activityDate').value,
            activity_time: document.getElementById('activityTime').value,
            duration_hours: parseInt(document.getElementById('activityDuration').value) || 1,
            location: document.getElementById('activityLocation').value,
            priority: document.getElementById('activityPriority').value
        };

        try {
            const url = isEditing 
                ? `${this.API_BASE_URL}/activities/${activityId}`
                : `${this.API_BASE_URL}/activities/create`;
            
            const method = isEditing ? 'PATCH' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(activityData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            this.showNotification(isEditing ? 'Activity updated successfully!' : 'Activity created successfully!', 'success');
            
            await this.loadActivities();
            this.renderCalendar();
            this.updateStats();
            this.renderActivitiesList();
            this.closeModal();

        } catch (error) {
            console.error('Error saving activity:', error);
            this.showNotification('Error saving activity. Please try again.', 'error');
        }
    }

    // FIXED: Correct API endpoint for deletion
    async deleteActivity() {
        const form = document.getElementById('activityForm');
        const activityId = form.dataset.editId;
        
        if (!activityId) return;

        if (!confirm('Are you sure you want to delete this activity?')) {
            return;
        }

        try {
            const response = await fetch(`${this.API_BASE_URL}/activities/${activityId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.showNotification('Activity deleted successfully!', 'success');
            
            // Refresh data and UI
            await this.loadActivities();
            this.renderCalendar();
            this.updateStats();
            this.renderActivitiesList();
            this.closeModal();

        } catch (error) {
            console.error('Error deleting activity:', error);
            this.showNotification('Error deleting activity', 'error');
        }
    }

   closeModal() {
        const modal = document.getElementById('activityModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    toggleSidebar() {
        const sidebar = document.getElementById('calendarSidebar');
        sidebar.classList.toggle('collapsed');
    }

    validateDateSelection(selectedDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const selected = new Date(selectedDate);
        selected.setHours(0, 0, 0, 0);
        
        if (selected < today) {
            this.showNotification('Cannot add activities for past dates', 'warning');
            document.getElementById('activityDate').value = this.formatDateForInput(today);
        }
    }

    formatDateForInput(date) {
        return date.toISOString().split('T')[0];
    }

    formatTimeForInput(date) {
        return date.toTimeString().slice(0, 5);
    }

    formatDisplayDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span class="notification-icon">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            </span>
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        `;

        document.body.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // Auto remove after 5 seconds
        const autoRemove = setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);

        // Manual close
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            clearTimeout(autoRemove);
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
    }

    // Performance optimization: Debounce resize handler
    setupResizeHandler() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.renderCalendar();
            }, 250);
        });
    }
}

// Initialize calendar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.calendar = new Calendar();
    window.calendar.setupResizeHandler();
});

// Export for global access
window.Calendar = Calendar;