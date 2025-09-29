// activitiesUtils.js - Utility functions for activity management

// Activity constants
const ACTIVITY_TYPES = {
    STUDY: 'study',
    ASSIGNMENT: 'assignment',
    EXAM: 'exam',
    MEETING: 'meeting',
    PERSONAL: 'personal',
    OTHER: 'other'
};

const PRIORITY_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
};

const RECURRENCE_PATTERNS = {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    YEARLY: 'yearly'
};

// Validation functions
function validateActivityData(activityData) {
    if (!activityData || typeof activityData !== 'object') {
        return { isValid: false, error: 'Activity data must be an object' };
    }

    const { 
        user_id, 
        title, 
        activity_type, 
        activity_date, 
        activity_time, 
        duration_hours 
    } = activityData;

    // Validate required fields
    if (!user_id || !title || !activity_type || !activity_date || !activity_time || !duration_hours) {
        return { isValid: false, error: 'user_id, title, activity_type, activity_date, activity_time, and duration_hours are required' };
    }

    // Validate title length
    if (title.length < 1 || title.length > 200) {
        return { isValid: false, error: 'Title must be between 1 and 200 characters' };
    }

    // Validate activity type
    if (!validateActivityType(activity_type)) {
        return { isValid: false, error: `Invalid activity type. Must be one of: ${Object.values(ACTIVITY_TYPES).join(', ')}` };
    }

    // Validate priority if provided
    if (activityData.priority && !validatePriority(activityData.priority)) {
        return { isValid: false, error: `Invalid priority. Must be one of: ${Object.values(PRIORITY_LEVELS).join(', ')}` };
    }

    // Validate duration
    if (duration_hours <= 0 || duration_hours > 24) {
        return { isValid: false, error: 'duration_hours must be between 0.1 and 24 hours' };
    }

    // Validate date format
    if (!isValidDate(activity_date)) {
        return { isValid: false, error: 'Invalid activity_date format. Use YYYY-MM-DD' };
    }

    // Validate time format
    if (!isValidTime(activity_time)) {
        return { isValid: false, error: 'Invalid activity_time format. Use HH:MM:SS' };
    }

    // Validate UUID format for user_id
    if (!isValidUUID(user_id)) {
        return { isValid: false, error: 'Invalid UUID format for user_id' };
    }

    // Validate recurrence if provided
    if (activityData.is_recurring) {
        if (!activityData.recurrence_pattern || !validateRecurrencePattern(activityData.recurrence_pattern)) {
            return { isValid: false, error: `Invalid recurrence pattern. Must be one of: ${Object.values(RECURRENCE_PATTERNS).join(', ')}` };
        }
        if (activityData.recurrence_end_date && !isValidDate(activityData.recurrence_end_date)) {
            return { isValid: false, error: 'Invalid recurrence_end_date format. Use YYYY-MM-DD' };
        }
    }

    return { isValid: true, error: null };
}

function validateActivityUpdateData(updateData) {
    if (!updateData || typeof updateData !== 'object') {
        return { isValid: false, error: 'Update data must be an object' };
    }

    const allowedFields = [
        'title', 'activity_type', 'description', 'activity_date', 
        'activity_time', 'duration_hours', 'location', 'priority',
        'is_completed', 'completed_at', 'group_id', 'is_recurring',
        'recurrence_pattern', 'recurrence_end_date'
    ];
    
    const providedFields = Object.keys(updateData);
    const invalidFields = providedFields.filter(field => !allowedFields.includes(field));
    
    if (invalidFields.length > 0) {
        return { isValid: false, error: `Invalid fields: ${invalidFields.join(', ')}` };
    }

    // Validate title if provided
    if (updateData.title && (updateData.title.length < 1 || updateData.title.length > 200)) {
        return { isValid: false, error: 'Title must be between 1 and 200 characters' };
    }

    // Validate activity type if provided
    if (updateData.activity_type && !validateActivityType(updateData.activity_type)) {
        return { isValid: false, error: `Invalid activity type. Must be one of: ${Object.values(ACTIVITY_TYPES).join(', ')}` };
    }

    // Validate priority if provided
    if (updateData.priority && !validatePriority(updateData.priority)) {
        return { isValid: false, error: `Invalid priority. Must be one of: ${Object.values(PRIORITY_LEVELS).join(', ')}` };
    }

    // Validate duration if provided
    if (updateData.duration_hours && (updateData.duration_hours <= 0 || updateData.duration_hours > 24)) {
        return { isValid: false, error: 'duration_hours must be between 0.1 and 24 hours' };
    }

    // Validate date if provided
    if (updateData.activity_date && !isValidDate(updateData.activity_date)) {
        return { isValid: false, error: 'Invalid activity_date format. Use YYYY-MM-DD' };
    }

    // Validate time if provided
    if (updateData.activity_time && !isValidTime(updateData.activity_time)) {
        return { isValid: false, error: 'Invalid activity_time format. Use HH:MM:SS' };
    }

    // Validate recurrence if provided
    if (updateData.is_recurring !== undefined) {
        if (updateData.is_recurring && (!updateData.recurrence_pattern || !validateRecurrencePattern(updateData.recurrence_pattern))) {
            return { isValid: false, error: `Invalid recurrence pattern. Must be one of: ${Object.values(RECURRENCE_PATTERNS).join(', ')}` };
        }
        if (updateData.recurrence_end_date && !isValidDate(updateData.recurrence_end_date)) {
            return { isValid: false, error: 'Invalid recurrence_end_date format. Use YYYY-MM-DD' };
        }
    }

    return { isValid: true, error: null };
}

function validateActivityType(type) {
    return Object.values(ACTIVITY_TYPES).includes(type);
}

function validatePriority(priority) {
    return Object.values(PRIORITY_LEVELS).includes(priority);
}

function validateRecurrencePattern(pattern) {
    return Object.values(RECURRENCE_PATTERNS).includes(pattern);
}

function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

function isValidDate(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
}

function isValidTime(timeString) {
    const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    return regex.test(timeString);
}

// Activity filtering and sorting
function filterActivitiesByType(activities, type) {
    if (!Array.isArray(activities)) {
        throw new Error('Activities must be an array');
    }

    if (!validateActivityType(type)) {
        throw new Error(`Invalid activity type. Must be one of: ${Object.values(ACTIVITY_TYPES).join(', ')}`);
    }

    return activities.filter(activity => activity.activity_type === type);
}

function filterActivitiesByPriority(activities, priority) {
    if (!Array.isArray(activities)) {
        throw new Error('Activities must be an array');
    }

    if (!validatePriority(priority)) {
        throw new Error(`Invalid priority. Must be one of: ${Object.values(PRIORITY_LEVELS).join(', ')}`);
    }

    return activities.filter(activity => activity.priority === priority);
}

function filterActivitiesByCompletion(activities, isCompleted) {
    if (!Array.isArray(activities)) {
        throw new Error('Activities must be an array');
    }

    return activities.filter(activity => activity.is_completed === isCompleted);
}

function filterActivitiesByDateRange(activities, startDate, endDate) {
    if (!Array.isArray(activities)) {
        throw new Error('Activities must be an array');
    }

    if (!isValidDate(startDate) || !isValidDate(endDate)) {
        throw new Error('Invalid date range. Use YYYY-MM-DD format');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    return activities.filter(activity => {
        const activityDate = new Date(activity.activity_date);
        return activityDate >= start && activityDate <= end;
    });
}

function sortActivities(activities, field = 'activity_date', direction = 'asc') {
    if (!Array.isArray(activities)) {
        throw new Error('Activities must be an array');
    }

    const validFields = ['title', 'activity_type', 'activity_date', 'activity_time', 'priority', 'duration_hours', 'created_at'];
    if (!validFields.includes(field)) {
        throw new Error(`Invalid sort field. Must be one of: ${validFields.join(', ')}`);
    }

    const validDirections = ['asc', 'desc'];
    if (!validDirections.includes(direction)) {
        throw new Error('Sort direction must be "asc" or "desc"');
    }

    return [...activities].sort((a, b) => {
        let valueA = a[field];
        let valueB = b[field];

        // Handle date fields
        if (field === 'activity_date' || field === 'created_at') {
            valueA = new Date(valueA).getTime();
            valueB = new Date(valueB).getTime();
        }
        // Handle time fields
        else if (field === 'activity_time') {
            valueA = timeToMinutes(valueA);
            valueB = timeToMinutes(valueB);
        }
        // Handle numeric fields
        else if (field === 'duration_hours') {
            valueA = Number(valueA) || 0;
            valueB = Number(valueB) || 0;
        }
        // Handle priority fields (custom order)
        else if (field === 'priority') {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            valueA = priorityOrder[valueA] || 0;
            valueB = priorityOrder[valueB] || 0;
        }
        // Handle string fields (case insensitive)
        else {
            valueA = String(valueA || '').toLowerCase();
            valueB = String(valueB || '').toLowerCase();
        }

        if (valueA < valueB) {
            return direction === 'asc' ? -1 : 1;
        }
        if (valueA > valueB) {
            return direction === 'asc' ? 1 : -1;
        }
        return 0;
    });
}

function timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
}

function searchActivities(activities, query) {
    if (!Array.isArray(activities)) {
        throw new Error('Activities must be an array');
    }

    if (typeof query !== 'string' || query.trim() === '') {
        return activities;
    }

    const searchTerm = query.toLowerCase().trim();
    
    return activities.filter(activity => {
        const titleMatch = activity.title && activity.title.toLowerCase().includes(searchTerm);
        const descriptionMatch = activity.description && activity.description.toLowerCase().includes(searchTerm);
        const locationMatch = activity.location && activity.location.toLowerCase().includes(searchTerm);
        
        return titleMatch || descriptionMatch || locationMatch;
    });
}

// Get upcoming activities (within next N days)
function getUpcomingActivities(activities, days = 7) {
    if (!Array.isArray(activities)) {
        throw new Error('Activities must be an array');
    }

    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return activities.filter(activity => {
        if (activity.is_completed) return false;
        
        const activityDate = new Date(activity.activity_date);
        return activityDate >= today && activityDate <= futureDate;
    });
}

// Get overdue activities
function getOverdueActivities(activities) {
    if (!Array.isArray(activities)) {
        throw new Error('Activities must be an array');
    }

    const today = new Date().toISOString().split('T')[0];

    return activities.filter(activity => {
        if (activity.is_completed) return false;
        
        return activity.activity_date < today;
    });
}

// Pagination utilities (reuse from study groups)
function paginateItems(items, page = 1, limit = 10) {
    if (!Array.isArray(items)) {
        throw new Error('Items must be an array');
    }

    page = Math.max(1, parseInt(page));
    limit = Math.max(1, parseInt(limit));

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const totalPages = Math.ceil(items.length / limit);

    return {
        data: items.slice(startIndex, endIndex),
        pagination: {
            currentPage: page,
            totalPages: totalPages,
            totalItems: items.length,
            hasNext: page < totalPages,
            hasPrev: page > 1,
            limit: limit
        }
    };
}

// Statistics calculation
function calculateActivityStats(activities) {
    if (!Array.isArray(activities)) {
        throw new Error('Activities must be an array');
    }

    const stats = {
        total: activities.length,
        completed: 0,
        pending: 0,
        overdue: 0,
        upcoming: 0,
        by_type: {},
        by_priority: {
            low: 0,
            medium: 0,
            high: 0
        },
        total_study_hours: 0,
        average_duration: 0
    };

    let totalDuration = 0;
    let completedDuration = 0;

    activities.forEach(activity => {
        // Count by completion status
        if (activity.is_completed) {
            stats.completed++;
            completedDuration += activity.duration_hours || 0;
        } else {
            stats.pending++;
            
            // Check if overdue
            const activityDate = new Date(activity.activity_date);
            const today = new Date();
            if (activityDate < today) {
                stats.overdue++;
            } else if (activityDate >= today) {
                stats.upcoming++;
            }
        }

        // Count by type
        if (activity.activity_type) {
            if (!stats.by_type[activity.activity_type]) {
                stats.by_type[activity.activity_type] = 0;
            }
            stats.by_type[activity.activity_type]++;
        }

        // Count by priority
        if (activity.priority && stats.by_priority[activity.priority] !== undefined) {
            stats.by_priority[activity.priority]++;
        }

        // Calculate total duration
        totalDuration += activity.duration_hours || 0;
    });

    // Calculate averages
    stats.total_study_hours = totalDuration;
    stats.average_duration = activities.length > 0 ? totalDuration / activities.length : 0;
    stats.completion_rate = activities.length > 0 ? (stats.completed / activities.length) * 100 : 0;

    return stats;
}

// Formatting utilities
function formatActivityResponse(activity) {
    const {
        id,
        user_id,
        title,
        activity_type,
        description,
        activity_date,
        activity_time,
        duration_hours,
        location,
        priority,
        group_id,
        is_completed,
        completed_at,
        is_recurring,
        recurrence_pattern,
        recurrence_end_date,
        created_at,
        updated_at,
        // Joined fields
        profiles,
        study_groups
    } = activity;

    const response = {
        id,
        user_id,
        title,
        activity_type: activity_type || ACTIVITY_TYPES.OTHER,
        description: description || null,
        activity_date,
        activity_time,
        duration_hours: duration_hours || 1,
        location: location || null,
        priority: priority || PRIORITY_LEVELS.MEDIUM,
        group_id: group_id || null,
        is_completed: is_completed || false,
        completed_at: completed_at ? new Date(completed_at).toISOString() : null,
        is_recurring: is_recurring || false,
        recurrence_pattern: recurrence_pattern || null,
        recurrence_end_date: recurrence_end_date || null,
        created_at: new Date(created_at).toISOString(),
        updated_at: updated_at ? new Date(updated_at).toISOString() : null
    };

    // Add user details if available
    if (profiles) {
        response.user_details = {
            name: profiles.name || null,
            email: profiles.email || null,
            faculty: profiles.faculty || null,
            course: profiles.course || null
        };
    }

    // Add group details if available
    if (study_groups) {
        response.group_details = {
            name: study_groups.name || null,
            subject: study_groups.subject || null,
            description: study_groups.description || null
        };
    }

    return response;
}

// Mock data generation
function generateMockActivity(overrides = {}) {
    const timestamp = new Date().toISOString();
    const activityDate = new Date();
    activityDate.setDate(activityDate.getDate() + Math.floor(Math.random() * 30));
    
    return {
        id: overrides.id || `activity_${Math.random().toString(36).substr(2, 9)}`,
        user_id: overrides.user_id || '123e4567-e89b-12d3-a456-426614174000',
        title: overrides.title || `Study Session ${Math.floor(Math.random() * 1000)}`,
        activity_type: overrides.activity_type || ACTIVITY_TYPES.STUDY,
        description: overrides.description || 'Regular study session',
        activity_date: overrides.activity_date || activityDate.toISOString().split('T')[0],
        activity_time: overrides.activity_time || '14:00:00',
        duration_hours: overrides.duration_hours || 2,
        location: overrides.location || 'Library',
        priority: overrides.priority || PRIORITY_LEVELS.MEDIUM,
        group_id: overrides.group_id || null,
        is_completed: overrides.is_completed || false,
        completed_at: overrides.completed_at || null,
        is_recurring: overrides.is_recurring || false,
        recurrence_pattern: overrides.recurrence_pattern || null,
        recurrence_end_date: overrides.recurrence_end_date || null,
        created_at: overrides.created_at || timestamp,
        updated_at: overrides.updated_at || timestamp,
        ...overrides
    };
}

// Permission checking
function canUpdateActivity(activityUserId, requestingUserId) {
    return activityUserId === requestingUserId;
}

function canDeleteActivity(activityUserId, requestingUserId) {
    return activityUserId === requestingUserId;
}

// Validation for Supabase responses (reuse from study groups)
function validateSupabaseResponse(response) {
    if (!response || typeof response !== 'object') {
        return { isValid: false, error: 'Invalid response object' };
    }

    if (response.error) {
        return { isValid: false, error: response.error.message || 'Supabase error occurred' };
    }

    if (response.data === undefined) {
        return { isValid: false, error: 'No data in response' };
    }

    return { isValid: true, error: null, data: response.data };
}

module.exports = {
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
};