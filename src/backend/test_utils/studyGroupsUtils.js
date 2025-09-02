// studyGroupsUtils.js - Utility functions for study group management

// Study group constants
const GROUP_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    ARCHIVED: 'archived',
    DELETED: 'deleted'
};

const MEMBER_ROLES = {
    CREATOR: 'creator',
    ADMIN: 'admin',
    MEMBER: 'member'
};

const MEMBER_STATUS = {
    ACTIVE: 'active',
    LEFT: 'left',
    REMOVED: 'removed',
    PENDING: 'pending'
};

// Validation functions
function validateStudyGroupData(groupData) {
    if (!groupData || typeof groupData !== 'object') {
        return { isValid: false, error: 'Group data must be an object' };
    }

    const { name, subject, creator_id, max_members, is_private } = groupData;

    // Validate required fields
    if (!name || !subject || !creator_id) {
        return { isValid: false, error: 'name, subject, and creator_id are required' };
    }

    // Validate name length
    if (name.length < 3 || name.length > 100) {
        return { isValid: false, error: 'Group name must be between 3 and 100 characters' };
    }

    // Validate subject length
    if (subject.length < 2 || subject.length > 50) {
        return { isValid: false, error: 'Subject must be between 2 and 50 characters' };
    }

    // Validate max_members
    if (max_members && (max_members < 1 || max_members > 50)) {
        return { isValid: false, error: 'max_members must be between 1 and 50' };
    }

    // Validate UUID format for creator_id
    if (!isValidUUID(creator_id)) {
        return { isValid: false, error: 'Invalid UUID format for creator_id' };
    }

    return { isValid: true, error: null };
}

function validateGroupUpdateData(updateData) {
    if (!updateData || typeof updateData !== 'object') {
        return { isValid: false, error: 'Update data must be an object' };
    }

    const allowedFields = ['name', 'description', 'subject', 'max_members', 'is_private', 'status'];
    const providedFields = Object.keys(updateData);
    
    const invalidFields = providedFields.filter(field => !allowedFields.includes(field));
    if (invalidFields.length > 0) {
        return { isValid: false, error: `Invalid fields: ${invalidFields.join(', ')}` };
    }

    // Validate name if provided
    if (updateData.name && (updateData.name.length < 3 || updateData.name.length > 100)) {
        return { isValid: false, error: 'Group name must be between 3 and 100 characters' };
    }

    // Validate subject if provided
    if (updateData.subject && (updateData.subject.length < 2 || updateData.subject.length > 50)) {
        return { isValid: false, error: 'Subject must be between 2 and 50 characters' };
    }

    // Validate max_members if provided
    if (updateData.max_members && (updateData.max_members < 1 || updateData.max_members > 50)) {
        return { isValid: false, error: 'max_members must be between 1 and 50' };
    }

    // Validate status if provided
    if (updateData.status && !Object.values(GROUP_STATUS).includes(updateData.status)) {
        return { isValid: false, error: 'Invalid group status' };
    }

    return { isValid: true, error: null };
}

function validateMemberRole(role) {
    return Object.values(MEMBER_ROLES).includes(role);
}

function validateMemberStatus(status) {
    return Object.values(MEMBER_STATUS).includes(status);
}

function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

// Group filtering and sorting
function filterGroupsByStatus(groups, status) {
    if (!Array.isArray(groups)) {
        throw new Error('Groups must be an array');
    }

    if (!Object.values(GROUP_STATUS).includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${Object.values(GROUP_STATUS).join(', ')}`);
    }

    return groups.filter(group => group.status === status);
}

function filterGroupsByPrivacy(groups, isPrivate) {
    if (!Array.isArray(groups)) {
        throw new Error('Groups must be an array');
    }

    return groups.filter(group => group.is_private === isPrivate);
}

function sortGroups(groups, field = 'created_at', direction = 'desc') {
    if (!Array.isArray(groups)) {
        throw new Error('Groups must be an array');
    }

    const validFields = ['name', 'subject', 'created_at', 'member_count', 'max_members'];
    if (!validFields.includes(field)) {
        throw new Error(`Invalid sort field. Must be one of: ${validFields.join(', ')}`);
    }

    const validDirections = ['asc', 'desc'];
    if (!validDirections.includes(direction)) {
        throw new Error('Sort direction must be "asc" or "desc"');
    }

    return [...groups].sort((a, b) => {
        let valueA = a[field];
        let valueB = b[field];

        // Handle numeric fields
        if (field === 'member_count' || field === 'max_members') {
            valueA = Number(valueA) || 0;
            valueB = Number(valueB) || 0;
        }
        // Handle timestamp fields
        else if (field === 'created_at') {
            valueA = new Date(valueA).getTime();
            valueB = new Date(valueB).getTime();
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

function searchGroups(groups, query) {
    if (!Array.isArray(groups)) {
        throw new Error('Groups must be an array');
    }

    if (typeof query !== 'string' || query.trim() === '') {
        return groups;
    }

    const searchTerm = query.toLowerCase().trim();
    
    return groups.filter(group => {
        const nameMatch = group.name && group.name.toLowerCase().includes(searchTerm);
        const subjectMatch = group.subject && group.subject.toLowerCase().includes(searchTerm);
        const descriptionMatch = group.description && group.description.toLowerCase().includes(searchTerm);
        
        return nameMatch || subjectMatch || descriptionMatch;
    });
}

// Member management utilities
function filterMembersByRole(members, role) {
    if (!Array.isArray(members)) {
        throw new Error('Members must be an array');
    }

    if (!validateMemberRole(role)) {
        throw new Error(`Invalid role. Must be one of: ${Object.values(MEMBER_ROLES).join(', ')}`);
    }

    return members.filter(member => member.role === role);
}

function filterMembersByStatus(members, status) {
    if (!Array.isArray(members)) {
        throw new Error('Members must be an array');
    }

    if (!validateMemberStatus(status)) {
        throw new Error(`Invalid status. Must be one of: ${Object.values(MEMBER_STATUS).join(', ')}`);
    }

    return members.filter(member => member.status === status);
}

function sortMembers(members, field = 'joined_at', direction = 'desc') {
    if (!Array.isArray(members)) {
        throw new Error('Members must be an array');
    }

    const validFields = ['name', 'email', 'role', 'joined_at', 'status'];
    if (!validFields.includes(field)) {
        throw new Error(`Invalid sort field. Must be one of: ${validFields.join(', ')}`);
    }

    const validDirections = ['asc', 'desc'];
    if (!validDirections.includes(direction)) {
        throw new Error('Sort direction must be "asc" or "desc"');
    }

    return [...members].sort((a, b) => {
        let valueA = a[field];
        let valueB = b[field];

        // Handle timestamp fields
        if (field === 'joined_at') {
            valueA = new Date(valueA).getTime();
            valueB = new Date(valueB).getTime();
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

// Pagination utilities
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
function calculateGroupStats(groups) {
    if (!Array.isArray(groups)) {
        throw new Error('Groups must be an array');
    }

    const stats = {
        total: groups.length,
        active: 0,
        inactive: 0,
        archived: 0,
        private: 0,
        public: 0,
        by_subject: {}
    };

    groups.forEach(group => {
        // Count by status
        if (stats[group.status] !== undefined) {
            stats[group.status]++;
        }

        // Count by privacy
        if (group.is_private) {
            stats.private++;
        } else {
            stats.public++;
        }

        // Count by subject
        if (group.subject) {
            if (!stats.by_subject[group.subject]) {
                stats.by_subject[group.subject] = 0;
            }
            stats.by_subject[group.subject]++;
        }
    });

    return stats;
}

function calculateMemberStats(members) {
    if (!Array.isArray(members)) {
        throw new Error('Members must be an array');
    }

    const stats = {
        total: members.length,
        creators: 0,
        admins: 0,
        members: 0,
        active: 0,
        left: 0,
        removed: 0,
        pending: 0
    };

    members.forEach(member => {
        // Count by role
        if (stats[member.role] !== undefined) {
            stats[member.role]++;
        }

        // Count by status
        if (stats[member.status] !== undefined) {
            stats[member.status]++;
        }
    });

    return stats;
}

// Formatting utilities
function formatGroupResponse(group) {
    const {
        id,
        name,
        description,
        subject,
        creator_id,
        max_members,
        is_private,
        faculty,
        course,
        year_of_study,
        status,
        created_at,
        updated_at,
        invite_code,
        // Joined fields
        member_count,
        creator_details
    } = group;

    const response = {
        id,
        name,
        description: description || null,
        subject,
        creator_id,
        max_members: max_members || 10,
        is_private: is_private || false,
        faculty: faculty || null,
        course: course || null,
        year_of_study: year_of_study || null,
        status: status || GROUP_STATUS.ACTIVE,
        created_at: new Date(created_at).toISOString(),
        updated_at: updated_at ? new Date(updated_at).toISOString() : null,
        invite_code: invite_code || null
    };

    // Add computed fields
    if (member_count !== undefined) {
        response.member_count = member_count;
    }

    // Add creator details if available
    if (creator_details) {
        response.creator = creator_details;
    }

    return response;
}

function formatMemberResponse(member) {
    const {
        id,
        group_id,
        user_id,
        role,
        status,
        joined_at,
        left_at,
        // Joined fields
        name,
        email,
        avatar_url,
        faculty,
        course
    } = member;

    const response = {
        id,
        group_id,
        user_id,
        role: role || MEMBER_ROLES.MEMBER,
        status: status || MEMBER_STATUS.ACTIVE,
        joined_at: new Date(joined_at).toISOString(),
        left_at: left_at ? new Date(left_at).toISOString() : null
    };

    // Add user details if available
    if (name || email) {
        response.user_details = {
            name: name || null,
            email: email || null,
            avatar_url: avatar_url || null,
            faculty: faculty || null,
            course: course || null
        };
    }

    return response;
}

// Mock data generation
function generateMockGroup(overrides = {}) {
    const timestamp = new Date().toISOString();
    
    return {
        id: overrides.id || `group_${Math.random().toString(36).substr(2, 9)}`,
        name: overrides.name || `Study Group ${Math.floor(Math.random() * 1000)}`,
        description: overrides.description || 'A study group for collaborative learning',
        subject: overrides.subject || 'Mathematics',
        creator_id: overrides.creator_id || '123e4567-e89b-12d3-a456-426614174000',
        max_members: overrides.max_members || 10,
        is_private: overrides.is_private || false,
        faculty: overrides.faculty || 'Science',
        course: overrides.course || 'BSc Mathematics',
        year_of_study: overrides.year_of_study || 2,
        status: overrides.status || GROUP_STATUS.ACTIVE,
        created_at: overrides.created_at || timestamp,
        updated_at: overrides.updated_at || timestamp,
        invite_code: overrides.invite_code || generateInviteCode(),
        ...overrides
    };
}

function generateMockMember(overrides = {}) {
    const timestamp = new Date().toISOString();
    
    return {
        id: overrides.id || `member_${Math.random().toString(36).substr(2, 9)}`,
        group_id: overrides.group_id || `group_${Math.random().toString(36).substr(2, 9)}`,
        user_id: overrides.user_id || '123e4567-e89b-12d3-a456-426614174000',
        role: overrides.role || MEMBER_ROLES.MEMBER,
        status: overrides.status || MEMBER_STATUS.ACTIVE,
        joined_at: overrides.joined_at || timestamp,
        left_at: overrides.left_at || null,
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

// Permission checking
function canUpdateGroup(userRole) {
    return ['creator', 'admin'].includes(userRole);
}

function canDeleteGroup(userRole) {
    return userRole === 'creator';
}

function canRemoveMember(userRole, targetRole) {
    if (userRole === 'creator') {
        return targetRole !== 'creator'; // Creator can remove anyone except themselves
    }
    if (userRole === 'admin') {
        return targetRole === 'member'; // Admins can only remove regular members
    }
    return false;
}

function canChangeRole(userRole, targetRole, newRole) {
    if (userRole !== 'creator') {
        return false; // Only creator can change roles
    }
    if (targetRole === 'creator') {
        return false; // Cannot change creator's role
    }
    return ['admin', 'member'].includes(newRole);
}

// Validation for Supabase responses
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
    GROUP_STATUS,
    MEMBER_ROLES,
    MEMBER_STATUS,
    validateStudyGroupData,
    validateGroupUpdateData,
    validateMemberRole,
    validateMemberStatus,
    isValidUUID,
    filterGroupsByStatus,
    filterGroupsByPrivacy,
    sortGroups,
    searchGroups,
    filterMembersByRole,
    filterMembersByStatus,
    sortMembers,
    paginateItems,
    calculateGroupStats,
    calculateMemberStats,
    formatGroupResponse,
    formatMemberResponse,
    generateMockGroup,
    generateMockMember,
    generateInviteCode,
    canUpdateGroup,
    canDeleteGroup,
    canRemoveMember,
    canChangeRole,
    validateSupabaseResponse
};