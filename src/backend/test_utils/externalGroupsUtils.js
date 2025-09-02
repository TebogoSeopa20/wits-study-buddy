// externalGroupsUtils.js - Utility functions for external study group management

// External API constants
const GROUP_STATUS = {
    ACTIVE: 'active',
    SCHEDULED: 'scheduled',
    INACTIVE: 'inactive',
    ARCHIVED: 'archived'
};

const PRIVACY_STATUS = {
    PUBLIC: false,
    PRIVATE: true
};

const SCHEDULED_STATUS = {
    SCHEDULED: true,
    NOT_SCHEDULED: false
};

// Validation functions
function validatePaginationParams(page, limit) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
        return { isValid: false, error: 'Page must be at least 1' };
    }
    
    if (limitNum < 1 || limitNum > 100) {
        return { isValid: false, error: 'Limit must be between 1 and 100' };
    }
    
    return { 
        isValid: true, 
        page: pageNum, 
        limit: limitNum,
        offset: (pageNum - 1) * limitNum
    };
}

function validateGroupStatus(status) {
    if (!status || status === 'all') {
        return { isValid: true, status: null };
    }
    
    if (!Object.values(GROUP_STATUS).includes(status)) {
        return { 
            isValid: false, 
            error: `Invalid status. Must be one of: ${Object.values(GROUP_STATUS).join(', ')} or 'all'` 
        };
    }
    
    return { isValid: true, status };
}

function validateBooleanParam(param, paramName) {
    if (param === undefined || param === null) {
        return { isValid: true, value: null };
    }
    
    if (param === 'true') return { isValid: true, value: true };
    if (param === 'false') return { isValid: true, value: false };
    
    return { 
        isValid: false, 
        error: `${paramName} must be 'true' or 'false'` 
    };
}

function validateSearchFilters(filters) {
    const {
        subject,
        faculty,
        course,
        year_of_study,
        is_scheduled
    } = filters;
    
    const errors = [];
    
    // Validate year_of_study if provided
    if (year_of_study) {
        const year = parseInt(year_of_study);
        if (isNaN(year) || year < 1 || year > 7) {
            errors.push('year_of_study must be a number between 1 and 7');
        }
    }
    
    // Validate is_scheduled if provided
    if (is_scheduled !== undefined) {
        const scheduledValidation = validateBooleanParam(is_scheduled, 'is_scheduled');
        if (!scheduledValidation.isValid) {
            errors.push(scheduledValidation.error);
        }
    }
    
    // Validate string lengths
    const stringFields = { subject, faculty, course };
    Object.entries(stringFields).forEach(([field, value]) => {
        if (value && value.length > 100) {
            errors.push(`${field} must be 100 characters or less`);
        }
    });
    
    if (errors.length > 0) {
        return { isValid: false, errors };
    }
    
    return { 
        isValid: true, 
        filters: {
            subject: subject || null,
            faculty: faculty || null,
            course: course || null,
            year_of_study: year_of_study ? parseInt(year_of_study) : null,
            is_scheduled: is_scheduled !== undefined ? is_scheduled === 'true' : null
        }
    };
}

// Group filtering and processing
function filterPublicGroups(groups) {
    if (!Array.isArray(groups)) {
        return [];
    }
    
    return groups.filter(group => group.is_private === false);
}

function filterGroupsByStatus(groups, status) {
    if (!Array.isArray(groups)) {
        return [];
    }
    
    if (!status) {
        return groups;
    }
    
    return groups.filter(group => group.status === status);
}

function filterGroupsByScheduled(groups, isScheduled) {
    if (!Array.isArray(groups) || isScheduled === null) {
        return groups || [];
    }
    
    return groups.filter(group => group.is_scheduled === isScheduled);
}

function processGroupsWithMemberCount(groups, getMemberCount) {
    if (!Array.isArray(groups)) {
        return [];
    }
    
    return groups.map(group => ({
        ...group,
        member_count: getMemberCount ? getMemberCount(group.id) : 0
    }));
}

// Pagination utilities
function paginateResults(data, page, limit, totalCount) {
    if (!Array.isArray(data)) {
        return {
            data: [],
            pagination: {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 20,
                total: 0,
                total_pages: 0
            }
        };
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const total = totalCount || data.length;
    const totalPages = Math.ceil(total / limitNum);
    
    // If we have the full dataset, slice it for pagination
    const paginatedData = totalCount === data.length 
        ? data.slice((pageNum - 1) * limitNum, pageNum * limitNum)
        : data;
    
    return {
        data: paginatedData,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total: total,
            total_pages: totalPages
        }
    };
}

// Search utilities
function buildSearchQuery(baseQuery, filters) {
    let query = baseQuery;
    
    if (filters.subject) {
        query = query.ilike('subject', `%${filters.subject}%`);
    }
    
    if (filters.faculty) {
        query = query.ilike('faculty', `%${filters.faculty}%`);
    }
    
    if (filters.course) {
        query = query.ilike('course', `%${filters.course}%`);
    }
    
    if (filters.year_of_study) {
        query = query.eq('year_of_study', filters.year_of_study);
    }
    
    if (filters.is_scheduled !== null) {
        query = query.eq('is_scheduled', filters.is_scheduled);
    }
    
    return query;
}

// Response formatting
function formatGroupResponse(group) {
    if (!group || typeof group !== 'object') {
        return null;
    }
    
    const {
        id,
        name,
        description,
        subject,
        creator_id,
        max_members,
        is_private,
        is_scheduled,
        faculty,
        course,
        year_of_study,
        status,
        scheduled_start,
        scheduled_end,
        created_at,
        updated_at,
        invite_code,
        profiles, // Joined creator profile
        members, // Joined members array
        member_count // Computed member count
    } = group;
    
    const response = {
        id: id || null,
        name: name || null,
        description: description || null,
        subject: subject || null,
        creator_id: creator_id || null,
        max_members: max_members || 0,
        is_private: is_private || false,
        is_scheduled: is_scheduled || false,
        faculty: faculty || null,
        course: course || null,
        year_of_study: year_of_study || null,
        status: status || GROUP_STATUS.ACTIVE,
        scheduled_start: scheduled_start || null,
        scheduled_end: scheduled_end || null,
        created_at: created_at ? new Date(created_at).toISOString() : null,
        updated_at: updated_at ? new Date(updated_at).toISOString() : null,
        invite_code: invite_code || null,
        member_count: member_count || 0
    };
    
    // Add creator details if available
    if (profiles && typeof profiles === 'object') {
        response.creator = {
            name: profiles.name || null,
            email: profiles.email || null,
            faculty: profiles.faculty || null,
            course: profiles.course || null,
            year_of_study: profiles.year_of_study || null
        };
    }
    
    // Add members if available
    if (Array.isArray(members)) {
        response.members = members.map(member => ({
            user_id: member.user_id || null,
            name: member.name || null,
            email: member.email || null,
            faculty: member.faculty || null,
            course: member.course || null,
            year_of_study: member.year_of_study || null,
            role: member.role || 'member',
            status: member.status || 'active',
            joined_at: member.joined_at ? new Date(member.joined_at).toISOString() : null
        }));
    }
    
    return response;
}

function formatGroupsResponse(groups) {
    if (!Array.isArray(groups)) {
        return [];
    }
    
    return groups.map(group => formatGroupResponse(group)).filter(Boolean);
}

// Error handling utilities
function handleSupabaseError(error, defaultMessage = 'Database error occurred') {
    if (!error) {
        return { error: defaultMessage };
    }
    
    if (error.code === 'PGRST116') {
        return { error: 'Not found', isNotFound: true };
    }
    
    return { error: error.message || defaultMessage };
}

function createErrorResponse(error, statusCode = 500) {
    return {
        success: false,
        error: error.message || error.toString(),
        statusCode: statusCode
    };
}

function createSuccessResponse(data, message = 'Success', pagination = null) {
    const response = {
        success: true,
        message: message,
        data: data
    };
    
    if (pagination) {
        response.pagination = pagination;
    }
    
    return response;
}

// Mock data generation for testing
function generateMockExternalGroup(overrides = {}) {
    const timestamp = new Date().toISOString();
    const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science'];
    const faculties = ['Science', 'Engineering', 'Arts', 'Commerce', 'Medicine'];
    
    return {
        id: overrides.id || `ext_group_${Math.random().toString(36).substr(2, 9)}`,
        name: overrides.name || `${subjects[Math.floor(Math.random() * subjects.length)]} Study Group`,
        description: overrides.description || 'A public study group for collaborative learning',
        subject: overrides.subject || subjects[Math.floor(Math.random() * subjects.length)],
        creator_id: overrides.creator_id || '123e4567-e89b-12d3-a456-426614174000',
        max_members: overrides.max_members || 15,
        is_private: overrides.is_private !== undefined ? overrides.is_private : false,
        is_scheduled: overrides.is_scheduled || false,
        faculty: overrides.faculty || faculties[Math.floor(Math.random() * faculties.length)],
        course: overrides.course || 'BSc Program',
        year_of_study: overrides.year_of_study || Math.floor(Math.random() * 4) + 1,
        status: overrides.status || GROUP_STATUS.ACTIVE,
        scheduled_start: overrides.scheduled_start || null,
        scheduled_end: overrides.scheduled_end || null,
        created_at: overrides.created_at || timestamp,
        updated_at: overrides.updated_at || timestamp,
        invite_code: overrides.invite_code || generateInviteCode(),
        member_count: overrides.member_count || Math.floor(Math.random() * 20),
        ...overrides
    };
}

function generateInviteCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Date utilities for scheduled groups
function isValidScheduledDate(dateString) {
    if (!dateString) return false;
    
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && date > new Date();
}

function getDateRange(daysAhead) {
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    
    return {
        start: now.toISOString(),
        end: futureDate.toISOString()
    };
}

module.exports = {
    GROUP_STATUS,
    PRIVACY_STATUS,
    SCHEDULED_STATUS,
    validatePaginationParams,
    validateGroupStatus,
    validateBooleanParam,
    validateSearchFilters,
    filterPublicGroups,
    filterGroupsByStatus,
    filterGroupsByScheduled,
    processGroupsWithMemberCount,
    paginateResults,
    buildSearchQuery,
    formatGroupResponse,
    formatGroupsResponse,
    handleSupabaseError,
    createErrorResponse,
    createSuccessResponse,
    generateMockExternalGroup,
    generateInviteCode,
    isValidScheduledDate,
    getDateRange
};