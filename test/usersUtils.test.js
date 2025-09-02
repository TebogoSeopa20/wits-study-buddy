// usersUtils.test.js - Tests for user utility functions
const {
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
} = require('../src/backend/test_utils/usersUtils');

describe('User Utility Functions', () => {
    describe('Constants', () => {
        test('USER_ROLES contains valid roles', () => {
            expect(Array.isArray(USER_ROLES)).toBe(true);
            expect(USER_ROLES).toEqual(['student', 'faculty', 'staff', 'admin', 'visitor']);
        });

        test('USER_STATUSES contains valid statuses', () => {
            expect(Array.isArray(USER_STATUSES)).toBe(true);
            expect(USER_STATUSES).toEqual(['active', 'inactive', 'suspended', 'pending']);
        });
    });

    describe('validateUserProfile', () => {
        const validProfile = {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'test@example.com',
            role: 'student',
            status: 'active',
            created_at: '2024-01-01T00:00:00.000Z'
        };

        test('validates correct profile successfully', () => {
            const result = validateUserProfile(validProfile);
            expect(result.isValid).toBe(true);
            expect(result.error).toBeNull();
        });

        test('rejects missing required fields', () => {
            const incompleteProfile = { ...validProfile };
            delete incompleteProfile.email;
            
            const result = validateUserProfile(incompleteProfile);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('Missing required fields');
        });

        test('rejects invalid email format', () => {
            const invalidEmailProfile = { ...validProfile, email: 'invalid-email' };
            
            const result = validateUserProfile(invalidEmailProfile);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('Invalid email format');
        });

        test('rejects invalid role', () => {
            const invalidRoleProfile = { ...validProfile, role: 'invalid-role' };
            
            const result = validateUserProfile(invalidRoleProfile);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('Invalid role');
        });

        test('rejects invalid status', () => {
            const invalidStatusProfile = { ...validProfile, status: 'invalid-status' };
            
            const result = validateUserProfile(invalidStatusProfile);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('Invalid status');
        });

        test('rejects invalid UUID format', () => {
            const invalidUUIDProfile = { ...validProfile, id: 'invalid-uuid' };
            
            const result = validateUserProfile(invalidUUIDProfile);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('Invalid UUID format');
        });

        test('rejects invalid timestamp format', () => {
            const invalidTimestampProfile = { ...validProfile, created_at: 'invalid-date' };
            
            const result = validateUserProfile(invalidTimestampProfile);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('Invalid timestamp format');
        });
    });

    describe('isValidEmail', () => {
        test('validates correct email formats', () => {
            expect(isValidEmail('test@example.com')).toBe(true);
            expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
            expect(isValidEmail('first.last@sub.domain.com')).toBe(true);
        });

        test('rejects invalid email formats', () => {
            expect(isValidEmail('invalid-email')).toBe(false);
            expect(isValidEmail('@example.com')).toBe(false);
            expect(isValidEmail('test@')).toBe(false);
            expect(isValidEmail('test@.com')).toBe(false);
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
            expect(isValidUUID(null)).toBe(false);
        });
    });

    describe('isValidTimestamp', () => {
        test('validates correct timestamp formats', () => {
            expect(isValidTimestamp('2024-01-01T00:00:00.000Z')).toBe(true);
            expect(isValidTimestamp(1704067200000)).toBe(true); // Unix timestamp
            expect(isValidTimestamp(new Date().toISOString())).toBe(true);
        });

        test('rejects invalid timestamp formats', () => {
            expect(isValidTimestamp('invalid-date')).toBe(false);
            expect(isValidTimestamp(-1)).toBe(false);
            expect(isValidTimestamp(9999999999999)).toBe(false); // Far future
            expect(isValidTimestamp(null)).toBe(false);
        });
    });

    describe('filterUsersByRole', () => {
        const users = [
            { id: '1', email: 'student@example.com', role: 'student', status: 'active' },
            { id: '2', email: 'faculty@example.com', role: 'faculty', status: 'active' },
            { id: '3', email: 'admin@example.com', role: 'admin', status: 'active' }
        ];

        test('filters users by role correctly', () => {
            const students = filterUsersByRole(users, 'student');
            expect(students.length).toBe(1);
            expect(students[0].role).toBe('student');

            const faculty = filterUsersByRole(users, 'faculty');
            expect(faculty.length).toBe(1);
            expect(faculty[0].role).toBe('faculty');
        });

        test('throws error for invalid role', () => {
            expect(() => filterUsersByRole(users, 'invalid-role')).toThrow('Invalid role');
        });

        test('throws error for non-array input', () => {
            expect(() => filterUsersByRole(null, 'student')).toThrow('Users must be an array');
        });
    });

    describe('filterUsersByStatus', () => {
        const users = [
            { id: '1', email: 'active@example.com', role: 'student', status: 'active' },
            { id: '2', email: 'inactive@example.com', role: 'student', status: 'inactive' },
            { id: '3', email: 'suspended@example.com', role: 'student', status: 'suspended' }
        ];

        test('filters users by status correctly', () => {
            const activeUsers = filterUsersByStatus(users, 'active');
            expect(activeUsers.length).toBe(1);
            expect(activeUsers[0].status).toBe('active');
        });

        test('throws error for invalid status', () => {
            expect(() => filterUsersByStatus(users, 'invalid-status')).toThrow('Invalid status');
        });
    });

    describe('sortUsers', () => {
        const users = [
            { email: 'c@example.com', created_at: '2024-01-03T00:00:00.000Z' },
            { email: 'a@example.com', created_at: '2024-01-01T00:00:00.000Z' },
            { email: 'b@example.com', created_at: '2024-01-02T00:00:00.000Z' }
        ];

        test('sorts users by email ascending', () => {
            const sorted = sortUsers(users, 'email', 'asc');
            expect(sorted[0].email).toBe('a@example.com');
            expect(sorted[1].email).toBe('b@example.com');
            expect(sorted[2].email).toBe('c@example.com');
        });

        test('sorts users by created_at descending', () => {
            const sorted = sortUsers(users, 'created_at', 'desc');
            expect(sorted[0].created_at).toBe('2024-01-03T00:00:00.000Z');
            expect(sorted[2].created_at).toBe('2024-01-01T00:00:00.000Z');
        });

        test('throws error for invalid sort field', () => {
            expect(() => sortUsers(users, 'invalid-field')).toThrow('Invalid sort field');
        });

        test('throws error for invalid sort direction', () => {
            expect(() => sortUsers(users, 'email', 'invalid')).toThrow('Sort direction must be "asc" or "desc"');
        });
    });

    describe('searchUsers', () => {
        const users = [
            { email: 'john.doe@example.com', full_name: 'John Doe' },
            { email: 'jane.smith@example.com', full_name: 'Jane Smith' },
            { email: 'bob.johnson@example.com', full_name: 'Bob Johnson' }
        ];

        test('searches users by email', () => {
            const results = searchUsers(users, 'john');
            expect(results.length).toBe(2);
            expect(results.some(u => u.email.includes('john'))).toBe(true);
        });

        test('searches users by name', () => {
            const results = searchUsers(users, 'Jane');
            expect(results.length).toBe(1);
            expect(results[0].full_name).toBe('Jane Smith');
        });

        test('returns all users for empty query', () => {
            const results = searchUsers(users, '');
            expect(results.length).toBe(users.length);
        });
    });

    describe('paginateUsers', () => {
        const users = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));

        test('paginates users correctly', () => {
            const page1 = paginateUsers(users, 1, 10);
            expect(page1.data.length).toBe(10);
            expect(page1.pagination.currentPage).toBe(1);
            expect(page1.pagination.totalPages).toBe(3);
            expect(page1.pagination.totalItems).toBe(25);
            expect(page1.pagination.hasNext).toBe(true);
            expect(page1.pagination.hasPrev).toBe(false);
        });

        test('handles last page correctly', () => {
            const lastPage = paginateUsers(users, 3, 10);
            expect(lastPage.data.length).toBe(5);
            expect(lastPage.pagination.hasNext).toBe(false);
            expect(lastPage.pagination.hasPrev).toBe(true);
        });
    });

    describe('formatUserResponse', () => {
        test('formats user response correctly', () => {
            const user = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                email: 'test@example.com',
                role: 'student',
                status: 'active',
                full_name: 'Test User',
                avatar_url: 'https://example.com/avatar.jpg',
                created_at: '2024-01-01T00:00:00.000Z',
                updated_at: '2024-01-02T00:00:00.000Z'
            };

            const formatted = formatUserResponse(user);
            
            expect(formatted.id).toBe(user.id);
            expect(formatted.email).toBe(user.email);
            expect(formatted.role).toBe(user.role);
            expect(formatted.status).toBe(user.status);
            expect(formatted.full_name).toBe(user.full_name);
            expect(formatted.avatar_url).toBe(user.avatar_url);
            expect(formatted.created_at).toBe('2024-01-01T00:00:00.000Z');
            expect(formatted.updated_at).toBe('2024-01-02T00:00:00.000Z');
        });
    });

    describe('generateMockUser', () => {
        test('generates mock user with default values', () => {
            const mockUser = generateMockUser();
            
            expect(mockUser).toHaveProperty('id');
            expect(mockUser).toHaveProperty('email');
            expect(mockUser).toHaveProperty('role');
            expect(mockUser).toHaveProperty('status');
            expect(mockUser.role).toBe('student');
            expect(mockUser.status).toBe('active');
            expect(isValidEmail(mockUser.email)).toBe(true);
            expect(isValidUUID(mockUser.id)).toBe(true);
        });

        test('applies overrides correctly', () => {
            const overrides = {
                role: 'admin',
                email: 'custom@example.com',
                full_name: 'Custom User'
            };
            
            const mockUser = generateMockUser(overrides);
            
            expect(mockUser.role).toBe('admin');
            expect(mockUser.email).toBe('custom@example.com');
            expect(mockUser.full_name).toBe('Custom User');
        });
    });

    describe('validateSupabaseResponse', () => {
        test('validates successful response', () => {
            const response = { data: [{ id: 1 }], error: null };
            const result = validateSupabaseResponse(response);
            
            expect(result.isValid).toBe(true);
            expect(result.error).toBeNull();
            expect(result.data).toEqual([{ id: 1 }]);
        });

        test('handles error response', () => {
            const response = { data: null, error: { message: 'Database error' } };
            const result = validateSupabaseResponse(response);
            
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Database error');
        });

        test('handles missing data', () => {
            const response = { error: null };
            const result = validateSupabaseResponse(response);
            
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('No data in response');
        });
    });
});