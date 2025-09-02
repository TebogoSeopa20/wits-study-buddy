// studyGroupsUtils.test.js - Tests for study group utility functions
const {
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
} = require('../src/backend/test_utils/studyGroupsUtils');

describe('Study Group Utility Functions', () => {
    describe('Constants', () => {
        test('GROUP_STATUS contains valid statuses', () => {
            expect(GROUP_STATUS).toEqual({
                ACTIVE: 'active',
                INACTIVE: 'inactive',
                ARCHIVED: 'archived',
                DELETED: 'deleted'
            });
        });

        test('MEMBER_ROLES contains valid roles', () => {
            expect(MEMBER_ROLES).toEqual({
                CREATOR: 'creator',
                ADMIN: 'admin',
                MEMBER: 'member'
            });
        });

        test('MEMBER_STATUS contains valid statuses', () => {
            expect(MEMBER_STATUS).toEqual({
                ACTIVE: 'active',
                LEFT: 'left',
                REMOVED: 'removed',
                PENDING: 'pending'
            });
        });
    });

    describe('Validation Functions', () => {
        describe('validateStudyGroupData', () => {
            const validGroup = {
                name: 'Math Study Group',
                subject: 'Mathematics',
                creator_id: '123e4567-e89b-12d3-a456-426614174000',
                max_members: 10,
                is_private: false
            };

            test('validates correct group data successfully', () => {
                const result = validateStudyGroupData(validGroup);
                expect(result.isValid).toBe(true);
                expect(result.error).toBeNull();
            });

            test('rejects missing required fields', () => {
                const incompleteGroup = { ...validGroup };
                delete incompleteGroup.name;
                
                const result = validateStudyGroupData(incompleteGroup);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('name, subject, and creator_id are required');
            });

            test('rejects invalid name length', () => {
                const invalidNameGroup = { 
                    ...validGroup, 
                    name: 'ab' // Too short
                };
                
                const result = validateStudyGroupData(invalidNameGroup);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Group name must be between 3 and 100 characters');
            });

            test('rejects invalid subject length', () => {
                const invalidSubjectGroup = { 
                    ...validGroup, 
                    subject: 'a' // Too short
                };
                
                const result = validateStudyGroupData(invalidSubjectGroup);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Subject must be between 2 and 50 characters');
            });

            test('rejects invalid UUID format', () => {
                const invalidUUIDGroup = { 
                    ...validGroup, 
                    creator_id: 'invalid-uuid' 
                };
                
                const result = validateStudyGroupData(invalidUUIDGroup);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Invalid UUID format');
            });
        });

        describe('validateGroupUpdateData', () => {
            test('validates correct update data successfully', () => {
                const updateData = {
                    name: 'Updated Group Name',
                    description: 'Updated description',
                    max_members: 15
                };
                
                const result = validateGroupUpdateData(updateData);
                expect(result.isValid).toBe(true);
                expect(result.error).toBeNull();
            });

            test('rejects invalid fields', () => {
                const invalidUpdateData = {
                    invalid_field: 'value',
                    another_invalid: 'value'
                };
                
                const result = validateGroupUpdateData(invalidUpdateData);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Invalid fields');
            });

            test('rejects invalid name length', () => {
                const invalidUpdateData = {
                    name: 'ab' // Too short
                };
                
                const result = validateGroupUpdateData(invalidUpdateData);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Group name must be between 3 and 100 characters');
            });

            test('rejects invalid status', () => {
                const invalidUpdateData = {
                    status: 'invalid-status'
                };
                
                const result = validateGroupUpdateData(invalidUpdateData);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Invalid group status');
            });
        });

        describe('validateMemberRole', () => {
            test('validates correct roles', () => {
                expect(validateMemberRole('creator')).toBe(true);
                expect(validateMemberRole('admin')).toBe(true);
                expect(validateMemberRole('member')).toBe(true);
            });

            test('rejects invalid roles', () => {
                expect(validateMemberRole('invalid-role')).toBe(false);
                expect(validateMemberRole('')).toBe(false);
                expect(validateMemberRole(null)).toBe(false);
            });
        });

        describe('validateMemberStatus', () => {
            test('validates correct statuses', () => {
                expect(validateMemberStatus('active')).toBe(true);
                expect(validateMemberStatus('left')).toBe(true);
                expect(validateMemberStatus('removed')).toBe(true);
                expect(validateMemberStatus('pending')).toBe(true);
            });

            test('rejects invalid statuses', () => {
                expect(validateMemberStatus('invalid-status')).toBe(false);
                expect(validateMemberStatus('')).toBe(false);
                expect(validateMemberStatus(null)).toBe(false);
            });
        });
    });

    describe('Group Management Utilities', () => {
        const groups = [
            { name: 'Math Group', subject: 'Mathematics', status: 'active', is_private: false, created_at: '2024-01-03', member_count: 5 },
            { name: 'Physics Group', subject: 'Physics', status: 'active', is_private: true, created_at: '2024-01-01', member_count: 3 },
            { name: 'Chemistry Group', subject: 'Chemistry', status: 'inactive', is_private: false, created_at: '2024-01-02', member_count: 8 }
        ];

        describe('filterGroupsByStatus', () => {
            test('filters groups by status correctly', () => {
                const activeGroups = filterGroupsByStatus(groups, 'active');
                expect(activeGroups.length).toBe(2);
                expect(activeGroups.every(group => group.status === 'active')).toBe(true);
            });

            test('throws error for invalid status', () => {
                expect(() => filterGroupsByStatus(groups, 'invalid-status')).toThrow('Invalid status');
            });
        });

        describe('filterGroupsByPrivacy', () => {
            test('filters groups by privacy correctly', () => {
                const privateGroups = filterGroupsByPrivacy(groups, true);
                expect(privateGroups.length).toBe(1);
                expect(privateGroups[0].is_private).toBe(true);
            });
        });

        describe('sortGroups', () => {
            test('sorts groups by name ascending', () => {
                const sorted = sortGroups(groups, 'name', 'asc');
                expect(sorted[0].name).toBe('Chemistry Group');
                expect(sorted[2].name).toBe('Physics Group');
            });

            test('sorts groups by member_count descending', () => {
                const sorted = sortGroups(groups, 'member_count', 'desc');
                expect(sorted[0].member_count).toBe(8);
                expect(sorted[2].member_count).toBe(3);
            });
        });

        describe('searchGroups', () => {
            test('searches groups by name', () => {
                const results = searchGroups(groups, 'math');
                expect(results.length).toBe(1);
                expect(results[0].name).toBe('Math Group');
            });

            test('searches groups by subject', () => {
                const results = searchGroups(groups, 'physics');
                expect(results.length).toBe(1);
                expect(results[0].subject).toBe('Physics');
            });
        });
    });

    describe('Member Management Utilities', () => {
        const members = [
            { name: 'John Doe', role: 'creator', status: 'active', joined_at: '2024-01-03' },
            { name: 'Jane Smith', role: 'admin', status: 'active', joined_at: '2024-01-01' },
            { name: 'Bob Johnson', role: 'member', status: 'active', joined_at: '2024-01-02' },
            { name: 'Alice Brown', role: 'member', status: 'left', joined_at: '2024-01-04' }
        ];

        describe('filterMembersByRole', () => {
            test('filters members by role correctly', () => {
                const memberRoles = filterMembersByRole(members, 'member');
                expect(memberRoles.length).toBe(2);
                expect(memberRoles.every(member => member.role === 'member')).toBe(true);
            });
        });

        describe('filterMembersByStatus', () => {
            test('filters members by status correctly', () => {
                const activeMembers = filterMembersByStatus(members, 'active');
                expect(activeMembers.length).toBe(3);
                expect(activeMembers.every(member => member.status === 'active')).toBe(true);
            });
        });

        describe('sortMembers', () => {
            test('sorts members by joined_at descending', () => {
                const sorted = sortMembers(members, 'joined_at', 'desc');
                expect(sorted[0].joined_at).toBe('2024-01-04');
                expect(sorted[3].joined_at).toBe('2024-01-01');
            });
        });
    });

    describe('Pagination Utilities', () => {
        const items = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));

        test('paginates items correctly', () => {
            const page1 = paginateItems(items, 1, 10);
            expect(page1.data.length).toBe(10);
            expect(page1.pagination.currentPage).toBe(1);
            expect(page1.pagination.totalPages).toBe(3);
        });

        test('handles last page correctly', () => {
            const lastPage = paginateItems(items, 3, 10);
            expect(lastPage.data.length).toBe(5);
            expect(lastPage.pagination.hasNext).toBe(false);
        });
    });

    describe('Statistics Calculation', () => {
        const groups = [
            { status: 'active', is_private: false, subject: 'Math' },
            { status: 'active', is_private: true, subject: 'Physics' },
            { status: 'inactive', is_private: false, subject: 'Math' },
            { status: 'archived', is_private: true, subject: 'Chemistry' }
        ];

        test('calculates group statistics correctly', () => {
            const stats = calculateGroupStats(groups);
            
            expect(stats.total).toBe(4);
            expect(stats.active).toBe(2);
            expect(stats.inactive).toBe(1);
            expect(stats.archived).toBe(1);
            expect(stats.private).toBe(2);
            expect(stats.public).toBe(2);
            expect(stats.by_subject.Math).toBe(2);
            expect(stats.by_subject.Physics).toBe(1);
        });
    });

    describe('Formatting Utilities', () => {
        test('formats group response correctly', () => {
            const group = {
                id: 'group-123',
                name: 'Test Group',
                description: 'Test description',
                subject: 'Math',
                creator_id: 'user-123',
                max_members: 10,
                is_private: false,
                status: 'active',
                created_at: '2024-01-01T00:00:00.000Z',
                updated_at: '2024-01-02T00:00:00.000Z',
                member_count: 5,
                creator_details: { name: 'John Doe' }
            };

            const formatted = formatGroupResponse(group);
            
            expect(formatted.id).toBe('group-123');
            expect(formatted.name).toBe('Test Group');
            expect(formatted.member_count).toBe(5);
            expect(formatted.creator.name).toBe('John Doe');
            expect(formatted.created_at).toBe('2024-01-01T00:00:00.000Z');
        });

        test('formats member response correctly', () => {
            const member = {
                id: 'member-123',
                group_id: 'group-123',
                user_id: 'user-123',
                role: 'admin',
                status: 'active',
                joined_at: '2024-01-01T00:00:00.000Z',
                name: 'John Doe',
                email: 'john@example.com'
            };

            const formatted = formatMemberResponse(member);
            
            expect(formatted.id).toBe('member-123');
            expect(formatted.role).toBe('admin');
            expect(formatted.user_details.name).toBe('John Doe');
            expect(formatted.user_details.email).toBe('john@example.com');
        });
    });

    describe('Mock Data Generation', () => {
        test('generates mock group with default values', () => {
            const mockGroup = generateMockGroup();
            
            expect(mockGroup).toHaveProperty('id');
            expect(mockGroup).toHaveProperty('name');
            expect(mockGroup).toHaveProperty('subject');
            expect(mockGroup).toHaveProperty('creator_id');
            expect(mockGroup.status).toBe('active');
            expect(mockGroup.is_private).toBe(false);
        });

        test('generates mock member with default values', () => {
            const mockMember = generateMockMember();
            
            expect(mockMember).toHaveProperty('id');
            expect(mockMember).toHaveProperty('group_id');
            expect(mockMember).toHaveProperty('user_id');
            expect(mockMember.role).toBe('member');
            expect(mockMember.status).toBe('active');
        });

        test('generates valid invite code', () => {
            const code = generateInviteCode();
            expect(code).toHaveLength(8);
            expect(code).toMatch(/^[A-Z0-9]{8}$/);
        });
    });

    describe('Permission Checking', () => {
        test('canUpdateGroup returns correct permissions', () => {
            expect(canUpdateGroup('creator')).toBe(true);
            expect(canUpdateGroup('admin')).toBe(true);
            expect(canUpdateGroup('member')).toBe(false);
        });

        test('canDeleteGroup returns correct permissions', () => {
            expect(canDeleteGroup('creator')).toBe(true);
            expect(canDeleteGroup('admin')).toBe(false);
            expect(canDeleteGroup('member')).toBe(false);
        });

        test('canRemoveMember returns correct permissions', () => {
            expect(canRemoveMember('creator', 'admin')).toBe(true);
            expect(canRemoveMember('creator', 'member')).toBe(true);
            expect(canRemoveMember('creator', 'creator')).toBe(false);
            expect(canRemoveMember('admin', 'member')).toBe(true);
            expect(canRemoveMember('admin', 'admin')).toBe(false);
            expect(canRemoveMember('member', 'member')).toBe(false);
        });

        test('canChangeRole returns correct permissions', () => {
            expect(canChangeRole('creator', 'admin', 'member')).toBe(true);
            expect(canChangeRole('creator', 'member', 'admin')).toBe(true);
            expect(canChangeRole('creator', 'creator', 'admin')).toBe(false);
            expect(canChangeRole('admin', 'member', 'admin')).toBe(false);
        });
    });

    describe('Supabase Response Validation', () => {
        test('validates successful response', () => {
            const response = { data: [{ id: 1 }], error: null };
            const result = validateSupabaseResponse(response);
            
            expect(result.isValid).toBe(true);
            expect(result.error).toBeNull();
        });

        test('handles error response', () => {
            const response = { data: null, error: { message: 'Database error' } };
            const result = validateSupabaseResponse(response);
            
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Database error');
        });
    });
});