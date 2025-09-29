

// Activity types with icons and colors
const activityTypes = {
    'study': {
        name: 'Study Session',
        icon: 'fa-book',
        color: '#3498db',
        bgColor: '#ebf5fb'
    },
    'assignment': {
        name: 'Assignment',
        icon: 'fa-tasks',
        color: '#e74c3c',
        bgColor: '#fdedec'
    },
    'exam': {
        name: 'Exam',
        icon: 'fa-file-alt',
        color: '#9b59b6',
        bgColor: '#f4ecf7'
    },
    'meeting': {
        name: 'Meeting',
        icon: 'fa-users',
        color: '#2ecc71',
        bgColor: '#eafaf1'
    },
    'personal': {
        name: 'Personal',
        icon: 'fa-user',
        color: '#f39c12',
        bgColor: '#fef9e7'
    },
    'break': {
        name: 'Break',
        icon: 'fa-coffee',
        color: '#95a5a6',
        bgColor: '#f4f6f6'
    },
    'exercise': {
        name: 'Exercise',
        icon: 'fa-running',
        color: '#1abc9c',
        bgColor: '#e8f8f5'
    }
};

// Priority levels
const priorityLevels = {
    'low': {
        name: 'Low',
        color: '#27ae60',
        weight: 1
    },
    'medium': {
        name: 'Medium',
        color: '#f39c12',
        weight: 2
    },
    'high': {
        name: 'High',
        color: '#e74c3c',
        weight: 3
    },
    'urgent': {
        name: 'Urgent',
        color: '#c0392b',
        weight: 4
    }
};

// Default activity duration options (in hours)
const durationOptions = [
    { value: 0.5, label: '30 minutes' },
    { value: 1, label: '1 hour' },
    { value: 1.5, label: '1.5 hours' },
    { value: 2, label: '2 hours' },
    { value: 3, label: '3 hours' },
    { value: 4, label: '4 hours' },
    { value: 6, label: '6 hours' },
    { value: 8, label: '8 hours' }
];

// Time slots for scheduling
const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return {
        value: `${hour.toString().padStart(2, '0')}:${minute}`,
        label: `${displayHour}:${minute} ${period}`
    };
});

// Recurrence options
const recurrenceOptions = [
    { value: 'none', label: 'No recurrence' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Bi-weekly' },
    { value: 'monthly', label: 'Monthly' }
];

// Day of week options
const dayOfWeekOptions = [
    { value: 0, label: 'Sunday', short: 'Sun' },
    { value: 1, label: 'Monday', short: 'Mon' },
    { value: 2, label: 'Monday', short: 'Tue' },
    { value: 3, label: 'Wednesday', short: 'Wed' },
    { value: 4, label: 'Thursday', short: 'Thu' },
    { value: 5, label: 'Friday', short: 'Fri' },
    { value: 6, label: 'Saturday', short: 'Sat' }
];

// Fix activity dates for timezone handling
function fixActivityDates(activity) {
    if (!activity) return activity;

    const activityCopy = { ...activity };
    
    if (activityCopy.activity_date) {
        // Parse the date string as UTC and convert to local timezone correctly
        const utcDate = new Date(activityCopy.activity_date + 'T00:00:00Z');
        
        // Get local date components
        const localYear = utcDate.getFullYear();
        const localMonth = utcDate.getMonth();
        const localDate = utcDate.getDate();
        
        // Create a new date in local timezone
        const localDateObj = new Date(localYear, localMonth, localDate);
        
        // Store the fixed date string for comparison (YYYY-MM-DD format)
        activityCopy.activity_date_fixed = localDateObj.toISOString().split('T')[0];
        activityCopy.activity_date_utc = activityCopy.activity_date;
    }

    // Fix scheduled_start and scheduled_end if they exist
    if (activityCopy.scheduled_start) {
        const startDate = new Date(activityCopy.scheduled_start);
        activityCopy.scheduled_start_fixed = formatDateTimeLocal(startDate);
    }
    
    if (activityCopy.scheduled_end) {
        const endDate = new Date(activityCopy.scheduled_end);
        activityCopy.scheduled_end_fixed = formatDateTimeLocal(endDate);
    }
    
    return activityCopy;
}

// Fix group dates for timezone handling
function fixGroupDates(group) {
    if (!group) return group;

    const groupCopy = { ...group };
    
    if (groupCopy.date) {
        // Parse the date string as UTC and convert to local timezone correctly
        const utcDate = new Date(groupCopy.date + 'T00:00:00Z');
        
        // Get local date components
        const localYear = utcDate.getFullYear();
        const localMonth = utcDate.getMonth();
        const localDate = utcDate.getDate();
        
        // Create a new date in local timezone
        const localDateObj = new Date(localYear, localMonth, localDate);
        
        groupCopy.date_fixed = localDateObj.toISOString().split('T')[0];
        groupCopy.date_utc = utcDate.toISOString().split('T')[0];
    }
    
    // Fix scheduled_start and scheduled_end for proper display
    if (groupCopy.scheduled_start) {
        const startDate = new Date(groupCopy.scheduled_start);
        groupCopy.scheduled_start_fixed = formatDateTimeLocal(startDate);
    }
    
    if (groupCopy.scheduled_end) {
        const endDate = new Date(groupCopy.scheduled_end);
        groupCopy.scheduled_end_fixed = formatDateTimeLocal(endDate);
    }
    
    return groupCopy;
}

// Helper method to format datetime in local timezone
function formatDateTimeLocal(date) {
    if (!(date instanceof Date) || isNaN(date)) {
        return '';
    }
    
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    });
}

// Format time for display
function formatTime(date) {
    if (!(date instanceof Date) || isNaN(date)) {
        return '';
    }
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Calculate duration between two dates in hours
function calculateDuration(start, end) {
    if (!start || !end) return 1;
    
    try {
        const startTime = new Date(start);
        const endTime = new Date(end);
        
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
            return 1;
        }
        
        const durationHours = (endTime - startTime) / (1000 * 60 * 60);
        return Math.max(0.5, Math.ceil(durationHours * 2) / 2); // Round to nearest 0.5 hours
    } catch (error) {
        console.error('Error calculating duration:', error);
        return 1;
    }
}

// Format date for input fields (YYYY-MM-DD)
function formatDateForInput(date) {
    if (!(date instanceof Date) || isNaN(date)) {
        return '';
    }
    
    return date.toISOString().split('T')[0];
}

// Format time for input fields (HH:MM)
function formatTimeForInput(date) {
    if (!(date instanceof Date) || isNaN(date)) {
        return '00:00';
    }
    
    return date.toTimeString().slice(0, 5);
}

// Format date for display
function formatDisplayDate(dateString) {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });
    } catch (error) {
        console.error('Error formatting display date:', error);
        return dateString;
    }
}

// Get activities for a specific date
function getActivitiesForDate(activities, date, userId = null) {
    if (!activities || !Array.isArray(activities) || !date) {
        return [];
    }
    
    const dateString = formatDateForInput(date);
    
    return activities.filter(activity => {
        // Always use the fixed date which has been converted to local timezone
        const activityDate = activity.activity_date_fixed || activity.activity_date;
        const matchesDate = activityDate === dateString;
        const matchesUser = !userId || activity.user_id === userId;
        const notCompleted = !activity.is_completed;
        
        return matchesDate && matchesUser && notCompleted;
    }).sort((a, b) => (a.activity_time || '').localeCompare(b.activity_time || ''));
}

// Get study groups for a specific date
function getStudyGroupsForDate(studyGroups, date) {
    if (!studyGroups || !Array.isArray(studyGroups) || !date) {
        return [];
    }
    
    const dateString = formatDateForInput(date);
    
    return studyGroups.filter(group => {
        // Always use the fixed date which has been converted to local timezone
        const groupDate = group.date_fixed || group.date;
        return groupDate === dateString;
    }).sort((a, b) => (a.activity_time || a.time || '').localeCompare(b.activity_time || b.time || ''));
}

// Get all upcoming events (activities + study groups)
function getAllUpcomingEvents(activities, studyGroups, userId = null, limit = 8) {
    if ((!activities || !Array.isArray(activities)) && (!studyGroups || !Array.isArray(studyGroups))) {
        return [];
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const filteredActivities = (activities || [])
        .filter(activity => {
            const activityDate = new Date(activity.activity_date_fixed || activity.activity_date);
            activityDate.setHours(0, 0, 0, 0);
            return activityDate >= today && 
                   (!userId || activity.user_id === userId) &&
                   !activity.is_completed;
        });
    
    const filteredStudyGroups = (studyGroups || [])
        .filter(group => {
            const groupDate = new Date(group.date_fixed || group.date);
            groupDate.setHours(0, 0, 0, 0);
            return groupDate >= today;
        });
    
    return [...filteredActivities, ...filteredStudyGroups]
        .sort((a, b) => {
            const aDate = new Date(a.activity_date_fixed || a.date_fixed || a.activity_date || a.date);
            const bDate = new Date(b.activity_date_fixed || b.date_fixed || b.activity_date || b.date);
            
            if (aDate.getTime() === bDate.getTime()) {
                const aTime = a.activity_time || a.time || '00:00';
                const bTime = b.activity_time || b.time || '00:00';
                return aTime.localeCompare(bTime);
            }
            return aDate - bDate;
        })
        .slice(0, limit);
}

// Calculate calendar statistics
function calculateCalendarStats(activities, studyGroups, userId = null) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const monthActivities = (activities || []).filter(activity => {
        const activityDate = new Date(activity.activity_date_fixed || activity.activity_date);
        activityDate.setHours(0, 0, 0, 0);
        return activityDate >= monthStart && 
               activityDate <= monthEnd && 
               (!userId || activity.user_id === userId);
    });

    const studySessions = monthActivities.filter(a => a.activity_type === 'study' && !a.is_completed).length;
    const upcomingDeadlines = getAllUpcomingEvents(activities, studyGroups, userId).length;
    const groupSessions = (studyGroups || []).filter(group => {
        const groupDate = new Date(group.date_fixed || group.date);
        groupDate.setHours(0, 0, 0, 0);
        return groupDate >= monthStart && groupDate <= monthEnd;
    }).length;
    const completedActivities = monthActivities.filter(a => a.is_completed).length;

    return {
        studySessions,
        upcomingDeadlines,
        groupSessions,
        completedActivities
    };
}

// Validate activity form data
function validateActivityForm(formData) {
    const errors = [];
    
    if (!formData.title || formData.title.trim().length === 0) {
        errors.push('Activity title is required');
    }
    
    if (!formData.activity_date) {
        errors.push('Activity date is required');
    } else {
        const selectedDate = new Date(formData.activity_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            errors.push('Cannot add activities for past dates');
        }
    }
    
    if (!formData.activity_time) {
        errors.push('Activity time is required');
    }
    
    if (!formData.activity_type || !activityTypes[formData.activity_type]) {
        errors.push('Valid activity type is required');
    }
    
    const duration = parseInt(formData.duration_hours) || 1;
    if (duration < 0.5 || duration > 24) {
        errors.push('Duration must be between 0.5 and 24 hours');
    }
    
    if (formData.priority && !priorityLevels[formData.priority]) {
        errors.push('Invalid priority level');
    }
    
    return errors;
}

// Format activity data for API request
function formatActivityData(formData, userId) {
    if (!formData || !userId) {
        throw new Error('Form data and user ID are required');
    }
    
    return {
        user_id: userId,
        title: (formData.title || '').trim(),
        activity_type: formData.activity_type || 'study',
        description: (formData.description || '').trim(),
        activity_date: formData.activity_date,
        activity_time: formData.activity_time,
        duration_hours: parseFloat(formData.duration_hours) || 1,
        location: (formData.location || '').trim(),
        priority: formData.priority || 'medium',
        is_completed: Boolean(formData.is_completed),
        recurrence: formData.recurrence || 'none',
        recurrence_end_date: formData.recurrence_end_date || null
    };
}

// Check if date is today
function isToday(date) {
    if (!(date instanceof Date) || isNaN(date)) {
        return false;
    }
    
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

// Check if date is in the past
function isPastDate(date) {
    if (!(date instanceof Date) || isNaN(date)) {
        return false;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    return checkDate < today;
}

// Check if date is in the future
function isFutureDate(date) {
    if (!(date instanceof Date) || isNaN(date)) {
        return false;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    return checkDate > today;
}

// Get week range for a given date
function getWeekRange(date) {
    if (!(date instanceof Date) || isNaN(date)) {
        date = new Date();
    }
    
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return {
        start: weekStart,
        end: weekEnd
    };
}

// Get month range for a given date
function getMonthRange(date) {
    if (!(date instanceof Date) || isNaN(date)) {
        date = new Date();
    }
    
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    return {
        start: monthStart,
        end: monthEnd
    };
}

// Generate calendar days for month view
function generateMonthDays(year, month) {
    if (typeof year !== 'number' || typeof month !== 'number') {
        const now = new Date();
        year = now.getFullYear();
        month = now.getMonth();
    }
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const firstDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Previous month days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        days.push({
            day,
            isOtherMonth: true,
            date: new Date(year, month - 1, day),
            isPast: isPastDate(new Date(year, month - 1, day))
        });
    }
    
    // Current month days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dayDate = new Date(year, month, day);
        days.push({
            day,
            isOtherMonth: false,
            date: dayDate,
            isPast: dayDate < today,
            isToday: isToday(dayDate)
        });
    }
    
    // Next month days
    const totalCells = 42; // 6 weeks
    const daysSoFar = firstDayOfWeek + lastDay.getDate();
    const nextMonthDays = totalCells - daysSoFar;
    
    for (let day = 1; day <= nextMonthDays; day++) {
        days.push({
            day,
            isOtherMonth: true,
            date: new Date(year, month + 1, day),
            isPast: isPastDate(new Date(year, month + 1, day))
        });
    }
    
    return days;
}

// Debounce function for performance optimization
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

// Throttle function for performance optimization
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

// Get activity type info
function getActivityTypeInfo(type) {
    return activityTypes[type] || activityTypes.study;
}

// Get priority info
function getPriorityInfo(priority) {
    return priorityLevels[priority] || priorityLevels.medium;
}

// Filter activities by type
function filterActivitiesByType(activities, type) {
    if (!activities || !Array.isArray(activities)) {
        return [];
    }
    
    return activities.filter(activity => activity.activity_type === type);
}

// Sort activities by date and time
function sortActivitiesByDateTime(activities, ascending = true) {
    if (!activities || !Array.isArray(activities)) {
        return [];
    }
    
    return [...activities].sort((a, b) => {
        const aDate = new Date(a.activity_date_fixed || a.activity_date);
        const bDate = new Date(b.activity_date_fixed || b.activity_date);
        
        if (aDate.getTime() === bDate.getTime()) {
            const aTime = a.activity_time || '00:00';
            const bTime = b.activity_time || '00:00';
            return ascending ? aTime.localeCompare(bTime) : bTime.localeCompare(aTime);
        }
        
        return ascending ? aDate - bDate : bDate - aDate;
    });
}

// Search activities by title or description
function searchActivities(activities, searchTerm) {
    if (!activities || !Array.isArray(activities) || !searchTerm) {
        return activities || [];
    }
    
    const term = searchTerm.toLowerCase();
    return activities.filter(activity => 
        (activity.title && activity.title.toLowerCase().includes(term)) ||
        (activity.description && activity.description.toLowerCase().includes(term)) ||
        (activity.location && activity.location.toLowerCase().includes(term))
    );
}

module.exports = {
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
};
