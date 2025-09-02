// connectionsUtils.js - Utility functions for connection management

// Connection status constants
const CONNECTION_STATUS = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    BLOCKED: 'blocked',
    PENDING_APPROVAL: 'pending_approval',
    NONE: 'none'
};

// Connection types
const CONNECTION_TYPES = {
    FRIEND: 'friend',
    STUDY_PARTNER: 'study_partner',
    CLASSMATE: 'classmate',
    MENTOR: 'mentor',
    MENTEE: 'mentee'
};

// Validate connection data
function validateConnectionData(connectionData) {
    if (!connectionData || typeof connectionData !== 'object') {
        return { isValid: false, error: 'Connection data must be an object' };
    }

    const { user_id, connected_user_id, status, connection_type } = connectionData;

    // Validate required fields
    if (!user_id || !connected_user_id) {
        return { isValid: false, error: 'user_id and connected_user_id are required' };
    }

    // Validate UUID format
    if (!isValidUUID(user_id) || !isValidUUID(connected_user_id)) {
        return { isValid: false, error: 'Invalid UUID format for user IDs' };
    }

    // Users cannot connect to themselves
    if (user_id === connected_user_id) {
        return { isValid: false, error: 'Cannot create connection with yourself' };
    }

    // Validate status if provided
    if (status && !Object.values(CONNECTION_STATUS).includes(status)) {
        return { 
            isValid: false, 
            error: `Invalid status. Must be one of: ${Object.values(CONNECTION_STATUS).join(', ')}` 
        };
    }

    // Validate connection type if provided
    if (connection_type && !Object.values(CONNECTION_TYPES).includes(connection_type)) {
        return { 
            isValid: false, 
            error: `Invalid connection type. Must be one of: ${Object.values(CONNECTION_TYPES).join(', ')}` 
        };
    }

    return { isValid: true, error: null };
}

// Validate UUID format
function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

// Validate connection status
function isValidConnectionStatus(status) {
    return Object.values(CONNECTION_STATUS).includes(status);
}

// Validate connection type
function isValidConnectionType(type) {
    return Object.values(CONNECTION_TYPES).includes(type);
}

// Filter connections by status
function filterConnectionsByStatus(connections, status) {
    if (!Array.isArray(connections)) {
        throw new Error('Connections must be an array');
    }

    if (!isValidConnectionStatus(status)) {
        throw new Error(`Invalid status. Must be one of: ${Object.values(CONNECTION_STATUS).join(', ')}`);
    }

    return connections.filter(conn => conn.status === status);
}

// Filter connections by type
function filterConnectionsByType(connections, type) {
    if (!Array.isArray(connections)) {
        throw new Error('Connections must be an array');
    }

    if (!isValidConnectionType(type)) {
        throw new Error(`Invalid connection type. Must be one of: ${Object.values(CONNECTION_TYPES).join(', ')}`);
    }

    return connections.filter(conn => conn.connection_type === type);
}

// Sort connections by field
function sortConnections(connections, field = 'created_at', direction = 'desc') {
    if (!Array.isArray(connections)) {
        throw new Error('Connections must be an array');
    }

    const validFields = ['created_at', 'updated_at', 'status', 'connection_type'];
    if (!validFields.includes(field)) {
        throw new Error(`Invalid sort field. Must be one of: ${validFields.join(', ')}`);
    }

    const validDirections = ['asc', 'desc'];
    if (!validDirections.includes(direction)) {
        throw new Error('Sort direction must be "asc" or "desc"');
    }

    return [...connections].sort((a, b) => {
        let valueA = a[field];
        let valueB = b[field];

        // Handle timestamp comparison
        if (field.includes('_at')) {
            valueA = new Date(valueA).getTime();
            valueB = new Date(valueB).getTime();
        }

        // Handle string comparison for status and type
        if (typeof valueA === 'string') {
            valueA = valueA.toLowerCase();
            valueB = valueB.toLowerCase();
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

// Search connections by user details
function searchConnections(connections, query) {
    if (!Array.isArray(connections)) {
        throw new Error('Connections must be an array');
    }

    if (typeof query !== 'string' || query.trim() === '') {
        return connections;
    }

    const searchTerm = query.toLowerCase().trim();
    
    return connections.filter(connection => {
        const emailMatch = connection.email && connection.email.toLowerCase().includes(searchTerm);
        const nameMatch = connection.full_name && connection.full_name.toLowerCase().includes(searchTerm);
        const usernameMatch = connection.username && connection.username.toLowerCase().includes(searchTerm);
        
        return emailMatch || nameMatch || usernameMatch;
    });
}

// Paginate connections array
function paginateConnections(connections, page = 1, limit = 10) {
    if (!Array.isArray(connections)) {
        throw new Error('Connections must be an array');
    }

    page = Math.max(1, parseInt(page));
    limit = Math.max(1, parseInt(limit));

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const totalPages = Math.ceil(connections.length / limit);

    return {
        data: connections.slice(startIndex, endIndex),
        pagination: {
            currentPage: page,
            totalPages: totalPages,
            totalItems: connections.length,
            hasNext: page < totalPages,
            hasPrev: page > 1,
            limit: limit
        }
    };
}

// Calculate connection statistics
function calculateConnectionStats(connections) {
    if (!Array.isArray(connections)) {
        throw new Error('Connections must be an array');
    }

    const stats = {
        total: connections.length,
        accepted: 0,
        pending: 0,
        pending_approval: 0,
        blocked: 0,
        by_type: {}
    };

    connections.forEach(connection => {
        // Count by status
        if (stats[connection.status] !== undefined) {
            stats[connection.status]++;
        }

        // Count by type
        if (connection.connection_type) {
            if (!stats.by_type[connection.connection_type]) {
                stats.by_type[connection.connection_type] = 0;
            }
            stats.by_type[connection.connection_type]++;
        }
    });

    return stats;
}

// Format connection response
function formatConnectionResponse(connection) {
    const { 
        id, 
        user_id, 
        connected_user_id, 
        status, 
        connection_type, 
        created_at, 
        updated_at,
        // Profile fields if joined
        email,
        full_name,
        username,
        avatar_url
    } = connection;

    const response = {
        id,
        user_id,
        connected_user_id,
        status,
        connection_type: connection_type || null,
        created_at: new Date(created_at).toISOString(),
        updated_at: updated_at ? new Date(updated_at).toISOString() : null
    };

    // Add profile details if available
    if (email || full_name || username) {
        response.user_details = {
            email: email || null,
            full_name: full_name || null,
            username: username || null,
            avatar_url: avatar_url || null
        };
    }

    return response;
}

// Generate mock connection data for testing
function generateMockConnection(overrides = {}) {
    const timestamp = new Date().toISOString();
    
    return {
        id: overrides.id || `conn_${Math.random().toString(36).substr(2, 9)}`,
        user_id: overrides.user_id || '123e4567-e89b-12d3-a456-426614174000',
        connected_user_id: overrides.connected_user_id || '123e4567-e89b-12d3-a456-426614174001',
        status: overrides.status || CONNECTION_STATUS.PENDING,
        connection_type: overrides.connection_type || CONNECTION_TYPES.FRIEND,
        created_at: overrides.created_at || timestamp,
        updated_at: overrides.updated_at || timestamp,
        ...overrides
    };
}

// Validate Supabase response for connections
function validateSupabaseConnectionResponse(response) {
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

// Check if connection action is valid
function isValidConnectionAction(action, currentStatus) {
    const validTransitions = {
        [CONNECTION_STATUS.NONE]: ['send_request'],
        [CONNECTION_STATUS.PENDING]: ['accept', 'reject', 'block'],
        [CONNECTION_STATUS.PENDING_APPROVAL]: ['accept', 'reject', 'block'],
        [CONNECTION_STATUS.ACCEPTED]: ['block', 'remove'],
        [CONNECTION_STATUS.BLOCKED]: ['unblock', 'remove']
    };

    return validTransitions[currentStatus]?.includes(action) || false;
}

// Get connection status between two users from connections array
function getConnectionStatusBetweenUsers(connections, user1Id, user2Id) {
    if (!Array.isArray(connections)) {
        return CONNECTION_STATUS.NONE;
    }

    const connection = connections.find(conn => 
        (conn.user_id === user1Id && conn.connected_user_id === user2Id) ||
        (conn.user_id === user2Id && conn.connected_user_id === user1Id)
    );

    return connection ? connection.status : CONNECTION_STATUS.NONE;
}

module.exports = {
    CONNECTION_STATUS,
    CONNECTION_TYPES,
    validateConnectionData,
    isValidUUID,
    isValidConnectionStatus,
    isValidConnectionType,
    filterConnectionsByStatus,
    filterConnectionsByType,
    sortConnections,
    searchConnections,
    paginateConnections,
    calculateConnectionStats,
    formatConnectionResponse,
    generateMockConnection,
    validateSupabaseConnectionResponse,
    isValidConnectionAction,
    getConnectionStatusBetweenUsers
};