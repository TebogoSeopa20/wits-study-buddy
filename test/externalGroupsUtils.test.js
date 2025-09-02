// externalGroupsUtils.test.js - Tests for external study group utility functions
const {
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
} = require('../src/backend/test_utils/externalGroupsUtils');

describe('External Groups Utility Functions', () => {
    describe('Constants', () => {
        test('GROUP_STATUS contains valid statuses', () => {
            expect(GROUP_STATUS).toEqual({
                ACTIVE: 'active',
                SCHEDULED: 'scheduled',
                INACTIVE: 'inactive',
                ARCHIVED: 'archived'
            });
        });

        test('PRIVACY_STATUS contains valid privacy settings', () => {
            expect(PRIVACY_STATUS).toEqual({
                PUBLIC: false,
                PRIVATE: true
            });
        });

        test('SCHEDULED_STATUS contains valid scheduled settings', () => {
            expect(SCHEDULED_STATUS).toEqual({
                SCHEDULED: true,
                NOT_SCHEDULED: false
            });
        });
    });

    describe('Validation Functions', () => {
        describe('validatePaginationParams', () => {
            test('validates correct pagination parameters', () => {
                const result = validatePaginationParams('2', '15');
                expect(result.isValid).toBe(true);
                expect(result.page).toBe(2);
                expect(result.limit).toBe(15);
                expect(result.offset).toBe(15);
            });

            test('handles default values', () => {
                const result = validatePaginationParams(null, null);
                expect(result.isValid).toBe(true);
                expect(result.page).toBe(1);
                expect(result.limit).toBe(20);
                expect(result.offset).toBe(0);
            });
        });

        describe('validateGroupStatus', () => {
            test('validates correct status values', () => {
                const result = validateGroupStatus('active');
                expect(result.isValid).toBe(true);
                expect(result.status).toBe('active');
            });

            test('handles "all" status', () => {
                const result = validateGroupStatus('all');
                expect(result.isValid).toBe(true);
                expect(result.status).toBe(null);
            });

            test('rejects invalid status values', () => {
                const result = validateGroupStatus('invalid-status');
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Invalid status');
            });
        });

        describe('validateBooleanParam', () => {
            test('validates boolean parameters', () => {
                expect(validateBooleanParam('true', 'test').value).toBe(true);
                expect(validateBooleanParam('false', 'test').value).toBe(false);
            });

            test('handles undefined parameters', () => {
                const result = validateBooleanParam(undefined, 'test');
                expect(result.isValid).toBe(true);
                expect(result.value).toBe(null);
            });

            test('rejects invalid boolean values', () => {
                const result = validateBooleanParam('invalid', 'test');
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('must be');
            });
        });

        describe('validateSearchFilters', () => {
            test('validates correct search filters', () => {
                const filters = {
                    subject: 'Math',
                    faculty: 'Science',
                    course: 'BSc',
                    year_of_study: '2',
                    is_scheduled: 'true'
                };
                
                const result = validateSearchFilters(filters);
                expect(result.isValid).toBe(true);
                expect(result.filters.year_of_study).toBe(2);
                expect(result.filters.is_scheduled).toBe(true);
            });

            test('rejects long string fields', () => {
                const longString = 'a'.repeat(101);
                const filters = { subject: longString };
                const result = validateSearchFilters(filters);
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('subject must be 100 characters or less');
            });
        });
    });

    describe('Filtering Functions', () => {
        const groups = [
            { id: 1, is_private: false, status: 'active', is_scheduled: true },
            { id: 2, is_private: true, status: 'active', is_scheduled: false },
            { id: 3, is_private: false, status: 'inactive', is_scheduled: true },
            { id: 4, is_private: false, status: 'active', is_scheduled: false }
        ];

        describe('filterPublicGroups', () => {
            test('filters public groups correctly', () => {
                const publicGroups = filterPublicGroups(groups);
                expect(publicGroups.length).toBe(3);
                expect(publicGroups.every(group => !group.is_private)).toBe(true);
            });

            test('handles empty array', () => {
                expect(filterPublicGroups([])).toEqual([]);
            });
        });

        describe('filterGroupsByStatus', () => {
            test('filters groups by status', () => {
                const activeGroups = filterGroupsByStatus(groups, 'active');
                expect(activeGroups.length).toBe(3);
            });

            test('returns all groups when no status provided', () => {
                const allGroups = filterGroupsByStatus(groups);
                expect(allGroups.length).toBe(groups.length);
            });
        });

        describe('filterGroupsByScheduled', () => {
            test('filters scheduled groups', () => {
                const scheduledGroups = filterGroupsByScheduled(groups, true);
                expect(scheduledGroups.length).toBe(2);
            });

            test('filters non-scheduled groups', () => {
                const nonScheduledGroups = filterGroupsByScheduled(groups, false);
                expect(nonScheduledGroups.length).toBe(2);
            });
        });
    });

    describe('Pagination and Processing', () => {
        const testData = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));

        describe('paginateResults', () => {
            test('paginates results correctly', () => {
                const result = paginateResults(testData, 2, 10, 25);
                expect(result.data.length).toBe(10);
                expect(result.pagination.page).toBe(2);
                expect(result.pagination.total_pages).toBe(3);
            });

            test('handles empty data', () => {
                const result = paginateResults([], 1, 10, 0);
                expect(result.data.length).toBe(0);
                expect(result.pagination.total).toBe(0);
            });
        });

        describe('processGroupsWithMemberCount', () => {
            test('adds member count to groups', () => {
                const groups = [{ id: 1 }, { id: 2 }];
                const getMemberCount = (id) => id * 5;
                
                const processed = processGroupsWithMemberCount(groups, getMemberCount);
                expect(processed[0].member_count).toBe(5);
                expect(processed[1].member_count).toBe(10);
            });
        });
    });

    describe('Response Formatting', () => {
        test('formatGroupResponse formats group correctly', () => {
            const group = {
                id: 'test-id',
                name: 'Test Group',
                description: 'Test description',
                is_private: false,
                profiles: { name: 'John Doe', email: 'john@example.com' },
                member_count: 5
            };
            
            const formatted = formatGroupResponse(group);
            expect(formatted.id).toBe('test-id');
            expect(formatted.name).toBe('Test Group');
            expect(formatted.creator.name).toBe('John Doe');
            expect(formatted.member_count).toBe(5);
        });

        test('formatGroupsResponse handles array of groups', () => {
            const groups = [
                { id: 1, name: 'Group 1' },
                { id: 2, name: 'Group 2' }
            ];
            
            const formatted = formatGroupsResponse(groups);
            expect(formatted.length).toBe(2);
            expect(formatted[0].id).toBe(1);
            expect(formatted[1].id).toBe(2);
        });
    });

    describe('Error Handling', () => {
        test('handleSupabaseError handles not found error', () => {
            const error = { code: 'PGRST116' };
            const result = handleSupabaseError(error);
            expect(result.error).toBe('Not found');
            expect(result.isNotFound).toBe(true);
        });

        test('createErrorResponse creates error response', () => {
            const response = createErrorResponse(new Error('Test error'), 400);
            expect(response.success).toBe(false);
            expect(response.error).toBe('Test error');
            expect(response.statusCode).toBe(400);
        });

        test('createSuccessResponse creates success response', () => {
            const data = { id: 1 };
            const response = createSuccessResponse(data, 'Success', { page: 1 });
            expect(response.success).toBe(true);
            expect(response.data).toEqual(data);
            expect(response.pagination).toBeDefined();
        });
    });

    describe('Mock Data Generation', () => {
        test('generateMockExternalGroup creates mock group', () => {
            const group = generateMockExternalGroup();
            expect(group).toHaveProperty('id');
            expect(group).toHaveProperty('name');
            expect(group.is_private).toBe(false);
        });

        test('generateInviteCode creates valid invite code', () => {
            const code = generateInviteCode();
            expect(code).toHaveLength(8);
            expect(code).toMatch(/^[A-Z0-9]{8}$/);
        });
    });

    describe('Date Utilities', () => {
        test('isValidScheduledDate validates dates', () => {
            const futureDate = new Date(Date.now() + 86400000).toISOString();
            expect(isValidScheduledDate(futureDate)).toBe(true);
            expect(isValidScheduledDate('invalid-date')).toBe(false);
        });

        test('getDateRange creates date range', () => {
            const range = getDateRange(7);
            expect(range.start).toBeDefined();
            expect(range.end).toBeDefined();
            expect(new Date(range.end) > new Date(range.start)).toBe(true);
        });
    });
});