// connectionsUtils.test.js - Tests for connection utility functions
const {
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
} = require('../src/backend/test_utils/connectionsUtils');

describe('Connection Utility Functions', () => {
    describe('Constants', () => {
        test('CONNECTION_STATUS contains valid statuses', () => {
            expect(CONNECTION_STATUS).toEqual({
                PENDING: 'pending',
                ACCEPTED: 'accepted',
                BLOCKED: 'blocked',
                PENDING_APPROVAL: 'pending_approval',
                NONE: 'none'
            });
        });

        test('CONNECTION_TYPES contains valid types', () => {
            expect(CONNECTION_TYPES).toEqual({
                FRIEND: 'friend',
                STUDY_PARTNER: 'study_partner',
                CLASSMATE: 'classmate',
                MENTOR: 'mentor',
                MENTEE: 'mentee'
            });
        });
    });

    describe('validateConnectionData', () => {
        const validConnection = {
            user_id: '123e4567-e89b-12d3-a456-426614174000',
            connected_user_id: '123e4567-e89b-12d3-a456-426614174001',
            status: 'pending',
            connection_type: 'friend'
        };

        test('validates correct connection data successfully', () => {
            const result = validateConnectionData(validConnection);
            expect(result.isValid).toBe(true);
            expect(result.error).toBeNull();
        });

        test('rejects missing required fields', () => {
            const incompleteConnection = { ...validConnection };
            delete incompleteConnection.user_id;
            
            const result = validateConnectionData(incompleteConnection);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('user_id and connected_user_id are required');
        });

        test('rejects self-connection', () => {
            const selfConnection = { 
                ...validConnection, 
                connected_user_id: validConnection.user_id 
            };
            
            const result = validateConnectionData(selfConnection);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('Cannot create connection with yourself');
        });

        test('rejects invalid UUID format', () => {
            const invalidUUIDConnection = { 
                ...validConnection, 
                user_id: 'invalid-uuid' 
            };
            
            const result = validateConnectionData(invalidUUIDConnection);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('Invalid UUID format');
        });

        test('rejects invalid status', () => {
            const invalidStatusConnection = { 
                ...validConnection, 
                status: 'invalid-status' 
            };
            
            const result = validateConnectionData(invalidStatusConnection);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('Invalid status');
        });

        test('rejects invalid connection type', () => {
            const invalidTypeConnection = { 
                ...validConnection, 
                connection_type: 'invalid-type' 
            };
            
            const result = validateConnectionData(invalidTypeConnection);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('Invalid connection type');
        });
    });

    describe('isValidUUID', () => {
        test('validates correct UUID formats', () => {
            expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
            expect(isValidUUID('00000000-0000-0000-0000-000000000000')).toBe(true);
        });

        test('rejects invalid UUID formats', () => {
            expect(isValidUUID('invalid-uuid')).toBe(false);
            expect(isValidUUID('123e4567-e89b-12d3-a456')).toBe(false);
            expect(isValidUUID('')).toBe(false);
        });
    });

    describe('isValidConnectionStatus', () => {
        test('validates correct statuses', () => {
            expect(isValidConnectionStatus('pending')).toBe(true);
            expect(isValidConnectionStatus('accepted')).toBe(true);
            expect(isValidConnectionStatus('blocked')).toBe(true);
        });

        test('rejects invalid statuses', () => {
            expect(isValidConnectionStatus('invalid-status')).toBe(false);
            expect(isValidConnectionStatus('')).toBe(false);
            expect(isValidConnectionStatus(null)).toBe(false);
        });
    });

    describe('isValidConnectionType', () => {
        test('validates correct types', () => {
            expect(isValidConnectionType('friend')).toBe(true);
            expect(isValidConnectionType('study_partner')).toBe(true);
            expect(isValidConnectionType('mentor')).toBe(true);
        });

        test('rejects invalid types', () => {
            expect(isValidConnectionType('invalid-type')).toBe(false);
            expect(isValidConnectionType('')).toBe(false);
            expect(isValidConnectionType(null)).toBe(false);
        });
    });

    describe('filterConnectionsByStatus', () => {
        const connections = [
            { id: '1', status: 'pending' },
            { id: '2', status: 'accepted' },
            { id: '3', status: 'pending' },
            { id: '4', status: 'blocked' }
        ];

        test('filters connections by status correctly', () => {
            const pendingConnections = filterConnectionsByStatus(connections, 'pending');
            expect(pendingConnections.length).toBe(2);
            expect(pendingConnections.every(conn => conn.status === 'pending')).toBe(true);

            const acceptedConnections = filterConnectionsByStatus(connections, 'accepted');
            expect(acceptedConnections.length).toBe(1);
            expect(acceptedConnections[0].status).toBe('accepted');
        });

        test('throws error for invalid status', () => {
            expect(() => filterConnectionsByStatus(connections, 'invalid-status')).toThrow('Invalid status');
        });

        test('throws error for non-array input', () => {
            expect(() => filterConnectionsByStatus(null, 'pending')).toThrow('Connections must be an array');
        });
    });

    describe('filterConnectionsByType', () => {
        const connections = [
            { id: '1', connection_type: 'friend' },
            { id: '2', connection_type: 'study_partner' },
            { id: '3', connection_type: 'friend' },
            { id: '4', connection_type: 'mentor' }
        ];

        test('filters connections by type correctly', () => {
            const friendConnections = filterConnectionsByType(connections, 'friend');
            expect(friendConnections.length).toBe(2);
            expect(friendConnections.every(conn => conn.connection_type === 'friend')).toBe(true);
        });

        test('throws error for invalid type', () => {
            expect(() => filterConnectionsByType(connections, 'invalid-type')).toThrow('Invalid connection type');
        });
    });

    describe('sortConnections', () => {
        const connections = [
            { created_at: '2024-01-03T00:00:00.000Z', status: 'pending' },
            { created_at: '2024-01-01T00:00:00.000Z', status: 'accepted' },
            { created_at: '2024-01-02T00:00:00.000Z', status: 'blocked' }
        ];

        test('sorts connections by created_at ascending', () => {
            const sorted = sortConnections(connections, 'created_at', 'asc');
            expect(sorted[0].created_at).toBe('2024-01-01T00:00:00.000Z');
            expect(sorted[2].created_at).toBe('2024-01-03T00:00:00.000Z');
        });

        test('sorts connections by status descending', () => {
            const sorted = sortConnections(connections, 'status', 'desc');
            // Should be sorted alphabetically: pending, blocked, accepted
            expect(sorted[0].status).toBe('pending');
            expect(sorted[2].status).toBe('accepted');
        });

        test('throws error for invalid sort field', () => {
            expect(() => sortConnections(connections, 'invalid-field')).toThrow('Invalid sort field');
        });
    });

    describe('searchConnections', () => {
        const connections = [
            { email: 'john.doe@example.com', full_name: 'John Doe', username: 'johndoe' },
            { email: 'jane.smith@example.com', full_name: 'Jane Smith', username: 'janesmith' },
            { email: 'bob.johnson@example.com', full_name: 'Bob Johnson', username: 'bobjohnson' }
        ];

        test('searches connections by email', () => {
            const results = searchConnections(connections, 'john');
            expect(results.length).toBe(2);
            expect(results.some(conn => conn.email.includes('john'))).toBe(true);
        });

        test('searches connections by name', () => {
            const results = searchConnections(connections, 'Jane');
            expect(results.length).toBe(1);
            expect(results[0].full_name).toBe('Jane Smith');
        });

        test('returns all connections for empty query', () => {
            const results = searchConnections(connections, '');
            expect(results.length).toBe(connections.length);
        });
    });

    describe('paginateConnections', () => {
        const connections = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));

        test('paginates connections correctly', () => {
            const page1 = paginateConnections(connections, 1, 10);
            expect(page1.data.length).toBe(10);
            expect(page1.pagination.currentPage).toBe(1);
            expect(page1.pagination.totalPages).toBe(3);
            expect(page1.pagination.totalItems).toBe(25);
        });

        test('handles last page correctly', () => {
            const lastPage = paginateConnections(connections, 3, 10);
            expect(lastPage.data.length).toBe(5);
            expect(lastPage.pagination.hasNext).toBe(false);
        });
    });

    describe('calculateConnectionStats', () => {
        const connections = [
            { status: 'pending', connection_type: 'friend' },
            { status: 'accepted', connection_type: 'friend' },
            { status: 'accepted', connection_type: 'study_partner' },
            { status: 'blocked', connection_type: 'mentor' },
            { status: 'pending' } // No connection type
        ];

        test('calculates connection statistics correctly', () => {
            const stats = calculateConnectionStats(connections);
            
            expect(stats.total).toBe(5);
            expect(stats.pending).toBe(2);
            expect(stats.accepted).toBe(2);
            expect(stats.blocked).toBe(1);
            expect(stats.by_type.friend).toBe(2);
            expect(stats.by_type.study_partner).toBe(1);
            expect(stats.by_type.mentor).toBe(1);
        });

        test('throws error for non-array input', () => {
            expect(() => calculateConnectionStats(null)).toThrow('Connections must be an array');
        });
    });

    describe('formatConnectionResponse', () => {
        test('formats connection response correctly', () => {
            const connection = {
                id: 'conn-123',
                user_id: 'user-1',
                connected_user_id: 'user-2',
                status: 'accepted',
                connection_type: 'friend',
                created_at: '2024-01-01T00:00:00.000Z',
                updated_at: '2024-01-02T00:00:00.000Z',
                email: 'test@example.com',
                full_name: 'Test User',
                username: 'testuser',
                avatar_url: 'https://example.com/avatar.jpg'
            };

            const formatted = formatConnectionResponse(connection);
            
            expect(formatted.id).toBe('conn-123');
            expect(formatted.status).toBe('accepted');
            expect(formatted.connection_type).toBe('friend');
            expect(formatted.created_at).toBe('2024-01-01T00:00:00.000Z');
            expect(formatted.updated_at).toBe('2024-01-02T00:00:00.000Z');
            expect(formatted.user_details.email).toBe('test@example.com');
            expect(formatted.user_details.full_name).toBe('Test User');
        });
    });

    describe('generateMockConnection', () => {
        test('generates mock connection with default values', () => {
            const mockConnection = generateMockConnection();
            
            expect(mockConnection).toHaveProperty('id');
            expect(mockConnection).toHaveProperty('user_id');
            expect(mockConnection).toHaveProperty('connected_user_id');
            expect(mockConnection).toHaveProperty('status');
            expect(mockConnection).toHaveProperty('connection_type');
            expect(mockConnection.status).toBe('pending');
            expect(mockConnection.connection_type).toBe('friend');
            expect(isValidUUID(mockConnection.user_id)).toBe(true);
        });

        test('applies overrides correctly', () => {
            const overrides = {
                status: 'accepted',
                connection_type: 'study_partner'
            };
            
            const mockConnection = generateMockConnection(overrides);
            
            expect(mockConnection.status).toBe('accepted');
            expect(mockConnection.connection_type).toBe('study_partner');
        });
    });

    describe('validateSupabaseConnectionResponse', () => {
        test('validates successful response', () => {
            const response = { data: [{ id: 1 }], error: null };
            const result = validateSupabaseConnectionResponse(response);
            
            expect(result.isValid).toBe(true);
            expect(result.error).toBeNull();
        });

        test('handles error response', () => {
            const response = { data: null, error: { message: 'Database error' } };
            const result = validateSupabaseConnectionResponse(response);
            
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Database error');
        });
    });

    describe('isValidConnectionAction', () => {
        test('validates connection actions correctly', () => {
            expect(isValidConnectionAction('send_request', 'none')).toBe(true);
            expect(isValidConnectionAction('accept', 'pending')).toBe(true);
            expect(isValidConnectionAction('reject', 'pending_approval')).toBe(true);
            expect(isValidConnectionAction('block', 'accepted')).toBe(true);
            expect(isValidConnectionAction('remove', 'accepted')).toBe(true);
        });

        test('rejects invalid connection actions', () => {
            expect(isValidConnectionAction('accept', 'none')).toBe(false);
            expect(isValidConnectionAction('send_request', 'accepted')).toBe(false);
            expect(isValidConnectionAction('invalid-action', 'pending')).toBe(false);
        });
    });

    describe('getConnectionStatusBetweenUsers', () => {
        const connections = [
            { user_id: 'user1', connected_user_id: 'user2', status: 'accepted' },
            { user_id: 'user1', connected_user_id: 'user3', status: 'pending' },
            { user_id: 'user2', connected_user_id: 'user3', status: 'blocked' }
        ];

        test('finds connection status between users', () => {
            expect(getConnectionStatusBetweenUsers(connections, 'user1', 'user2')).toBe('accepted');
            expect(getConnectionStatusBetweenUsers(connections, 'user1', 'user3')).toBe('pending');
            expect(getConnectionStatusBetweenUsers(connections, 'user2', 'user3')).toBe('blocked');
        });

        test('returns "none" for non-existent connection', () => {
            expect(getConnectionStatusBetweenUsers(connections, 'user1', 'user4')).toBe('none');
        });

        test('handles empty connections array', () => {
            expect(getConnectionStatusBetweenUsers([], 'user1', 'user2')).toBe('none');
        });
    });
});