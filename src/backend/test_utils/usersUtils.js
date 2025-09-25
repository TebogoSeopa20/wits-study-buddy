// usersUtils.js - Utility functions for user management

// User validation and utility functions
const USER_ROLES = ['student', 'faculty', 'staff', 'admin', 'visitor'];
const USER_STATUSES = ['active', 'inactive', 'suspended', 'pending'];

// Validate user profile data structure
function validateUserProfile(profile) {
    if (!profile || typeof profile !== 'object') {
        return { isValid: false, error: 'Profile must be an object' };
    }

    const requiredFields = ['id', 'email', 'role', 'status', 'created_at'];
    const missingFields = requiredFields.filter(field => !profile.hasOwnProperty(field));
    
    if (missingFields.length > 0) {
        return { 
            isValid: false, 
            error: `Missing required fields: ${missingFields.join(', ')}` 
        };
    }

    // Validate email format
    if (!isValidEmail(profile.email)) {
        return { isValid: false, error: 'Invalid email format' };
    }

    // Validate role
    if (!USER_ROLES.includes(profile.role)) {
        return { 
            isValid: false, 
            error: `Invalid role. Must be one of: ${USER_ROLES.join(', ')}` 
        };
    }

    // Validate status
    if (!USER_STATUSES.includes(profile.status)) {
        return { 
            isValid: false, 
            error: `Invalid status. Must be one of: ${USER_STATUSES.join(', ')}` 
        };
    }

    // Validate UUID format for id
    if (!isValidUUID(profile.id)) {
        return { isValid: false, error: 'Invalid UUID format for id' };
    }

    // Validate timestamp format for created_at
    if (!isValidTimestamp(profile.created_at)) {
        return { isValid: false, error: 'Invalid timestamp format for created_at' };
    }

    return { isValid: true, error: null };
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate UUID format
function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

// Validate timestamp format (ISO 8601 or Unix timestamp)
function isValidTimestamp(timestamp) {
    if (typeof timestamp === 'string') {
        return !isNaN(Date.parse(timestamp));
    } else if (typeof timestamp === 'number') {
        return timestamp > 0 && timestamp < Date.now() + 365 * 24 * 60 * 60 * 1000; // Within next year
    }
    return false;
}

// Filter users by role
function filterUsersByRole(users, role) {
    if (!Array.isArray(users)) {
        throw new Error('Users must be an array');
    }
    
    if (!USER_ROLES.includes(role)) {
        throw new Error(`Invalid role. Must be one of: ${USER_ROLES.join(', ')}`);
    }

    return users.filter(user => user.role === role);
}

// Filter users by status
function filterUsersByStatus(users, status) {
    if (!Array.isArray(users)) {
        throw new Error('Users must be an array');
    }
    
    if (!USER_STATUSES.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${USER_STATUSES.join(', ')}`);
    }

    return users.filter(user => user.status === status);
}

// Sort users by field
function sortUsers(users, field = 'created_at', direction = 'desc') {
    if (!Array.isArray(users)) {
        throw new Error('Users must be an array');
    }

    const validFields = ['email', 'role', 'status', 'created_at', 'updated_at'];
    if (!validFields.includes(field)) {
        throw new Error(`Invalid sort field. Must be one of: ${validFields.join(', ')}`);
    }

    const validDirections = ['asc', 'desc'];
    if (!validDirections.includes(direction)) {
        throw new Error('Sort direction must be "asc" or "desc"');
    }

    return [...users].sort((a, b) => {
        let valueA = a[field];
        let valueB = b[field];

        // Handle timestamp comparison
        if (field.includes('_at')) {
            valueA = new Date(valueA).getTime();
            valueB = new Date(valueB).getTime();
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

// Search users by email or name
function searchUsers(users, query) {
    if (!Array.isArray(users)) {
        throw new Error('Users must be an array');
    }

    if (typeof query !== 'string' || query.trim() === '') {
        return users;
    }

    const searchTerm = query.toLowerCase().trim();
    
    return users.filter(user => {
        const emailMatch = user.email.toLowerCase().includes(searchTerm);
        const nameMatch = user.full_name && user.full_name.toLowerCase().includes(searchTerm);
        return emailMatch || nameMatch;
    });
}

// Paginate users array
function paginateUsers(users, page = 1, limit = 10) {
    if (!Array.isArray(users)) {
        throw new Error('Users must be an array');
    }

    page = Math.max(1, parseInt(page));
    limit = Math.max(1, parseInt(limit));

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const totalPages = Math.ceil(users.length / limit);

    return {
        data: users.slice(startIndex, endIndex),
        pagination: {
            currentPage: page,
            totalPages: totalPages,
            totalItems: users.length,
            hasNext: page < totalPages,
            hasPrev: page > 1,
            limit: limit
        }
    };
}

// Format user data for response
function formatUserResponse(user) {
    const { id, email, role, status, full_name, avatar_url, created_at, updated_at } = user;
    
    return {
        id,
        email,
        role,
        status,
        full_name: full_name || null,
        avatar_url: avatar_url || null,
        created_at: new Date(created_at).toISOString(),
        updated_at: updated_at ? new Date(updated_at).toISOString() : null
    };
}

// Generate mock user data for testing
function generateMockUser(overrides = {}) {
    const timestamp = new Date().toISOString();
    
    return {
        id: overrides.id || '123e4567-e89b-12d3-a456-426614174000',
        email: overrides.email || `test${Math.random().toString(36).substr(2, 8)}@example.com`,
        role: overrides.role || 'student',
        status: overrides.status || 'active',
        full_name: overrides.full_name || 'Test User',
        avatar_url: overrides.avatar_url || null,
        created_at: overrides.created_at || timestamp,
        updated_at: overrides.updated_at || timestamp,
        ...overrides
    };
}

// Validate Supabase response
function validateSupabaseResponse(response) {
    if (!response || typeof response !== 'object') {
        return { isValid: false, error: 'Invalid response object' };
    }

    if (response.error) {
        return { isValid: false, error: response.error.message || 'Supabase error occurred' };
    }

    if (!response.data) {
        return { isValid: false, error: 'No data in response' };
    }

    return { isValid: true, error: null, data: response.data };
}

module.exports = {
    USER_ROLES,
    USER_STATUSES,
    validateUserProfile,
    isValidEmail,
    isValidUUID,
    isValidTimestamp,
    filterUsersByRole,
    filterUsersByStatus,
    sortUsers,
    searchUsers,
    paginateUsers,
    formatUserResponse,
    generateMockUser,
    validateSupabaseResponse
};