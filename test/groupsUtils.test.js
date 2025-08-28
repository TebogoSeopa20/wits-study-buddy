// groupsUtils.test.js - Tests for groups utility functions
const {
    facultyCourses,
    yearOptions,
    getInitials,
    debounce,
    filterGroups,
    sortGroupsByMembers,
    getUserRoleInGroup,
    isUserMember,
    isUserCreator,
    isUserAdmin,
    calculateMemberProgress,
    updateFilteredGroupsByTab,
    validateGroupForm,
    formatGroupData,
    calculateGroupStats
} = require('../src/frontend/test_utils/groupsUtils');

describe('Groups Utility Functions', () => {
    describe('getInitials', () => {
        test('returns initials from full name', () => {
            expect(getInitials('Study Group')).toBe('SG');
        });

        test('returns initials from single word', () => {
            expect(getInitials('Mathematics')).toBe('M');
        });

        test('returns "G" for empty name', () => {
            expect(getInitials('')).toBe('G');
        });

        test('returns "G" for undefined name', () => {
            expect(getInitials()).toBe('G');
        });

        test('returns initials from name with multiple spaces', () => {
            expect(getInitials('Advanced Mathematics Study Group')).toBe('AM');
        });
    });

    describe('debounce', () => {
        jest.useFakeTimers();

        test('delays function execution', () => {
            const mockFn = jest.fn();
            const debouncedFn = debounce(mockFn, 1000);

            debouncedFn();
            expect(mockFn).not.toHaveBeenCalled();

            jest.advanceTimersByTime(1000);
            expect(mockFn).toHaveBeenCalled();
        });

        test('only executes once when called multiple times', () => {
            const mockFn = jest.fn();
            const debouncedFn = debounce(mockFn, 1000);

            debouncedFn();
            debouncedFn();
            debouncedFn();

            jest.advanceTimersByTime(1000);
            expect(mockFn).toHaveBeenCalledTimes(1);
        });
    });

    describe('filterGroups', () => {
        const groups = [
            {
                group_id: '1',
                group_name: 'Math Study Group',
                subject: 'Mathematics',
                faculty: 'Faculty of Science',
                year_of_study: '2nd Year',
                member_count: 5
            },
            {
                group_id: '2',
                group_name: 'Physics Discussion',
                subject: 'Physics',
                faculty: 'Faculty of Science',
                year_of_study: '3rd Year',
                member_count: 3
            },
            {
                group_id: '3',
                group_name: 'Literature Club',
                subject: 'English Literature',
                faculty: 'Faculty of Humanities',
                year_of_study: '1st Year',
                member_count: 8
            }
        ];

        test('filters by search term', () => {
            const filters = {
                searchTerm: 'math',
                subjectValue: '',
                facultyValue: '',
                yearValue: ''
            };

            const result = filterGroups(groups, filters);
            expect(result).toHaveLength(1);
            expect(result[0].group_name).toBe('Math Study Group');
        });

        test('filters by subject', () => {
            const filters = {
                searchTerm: '',
                subjectValue: 'Physics',
                facultyValue: '',
                yearValue: ''
            };

            const result = filterGroups(groups, filters);
            expect(result).toHaveLength(1);
            expect(result[0].subject).toBe('Physics');
        });

        test('filters by faculty', () => {
            const filters = {
                searchTerm: '',
                subjectValue: '',
                facultyValue: 'Faculty of Humanities',
                yearValue: ''
            };

            const result = filterGroups(groups, filters);
            expect(result).toHaveLength(1);
            expect(result[0].faculty).toBe('Faculty of Humanities');
        });

        test('filters by year', () => {
            const filters = {
                searchTerm: '',
                subjectValue: '',
                facultyValue: '',
                yearValue: '2nd Year'
            };

            const result = filterGroups(groups, filters);
            expect(result).toHaveLength(1);
            expect(result[0].year_of_study).toBe('2nd Year');
        });

        test('returns all groups when no filters applied', () => {
            const filters = {
                searchTerm: '',
                subjectValue: '',
                facultyValue: '',
                yearValue: ''
            };

            const result = filterGroups(groups, filters);
            expect(result).toHaveLength(3);
        });
    });

    describe('sortGroupsByMembers', () => {
        test('sorts groups by member count in descending order', () => {
            const groups = [
                { group_id: '1', member_count: 5 },
                { group_id: '2', member_count: 3 },
                { group_id: '3', member_count: 8 }
            ];

            const result = sortGroupsByMembers(groups);
            expect(result[0].member_count).toBe(8);
            expect(result[1].member_count).toBe(5);
            expect(result[2].member_count).toBe(3);
        });
    });

    describe('group membership functions', () => {
        const userGroups = [
            { group_id: '1', user_role: 'creator' },
            { group_id: '2', user_role: 'admin' },
            { group_id: '3', user_role: 'member' }
        ];

        test('getUserRoleInGroup returns correct role', () => {
            expect(getUserRoleInGroup(userGroups, '1')).toBe('creator');
            expect(getUserRoleInGroup(userGroups, '2')).toBe('admin');
            expect(getUserRoleInGroup(userGroups, '3')).toBe('member');
            expect(getUserRoleInGroup(userGroups, '4')).toBeNull();
        });

        test('isUserMember checks if user is member', () => {
            expect(isUserMember(userGroups, '1')).toBe(true);
            expect(isUserMember(userGroups, '2')).toBe(true);
            expect(isUserMember(userGroups, '4')).toBe(false);
        });

    });

    describe('calculateMemberProgress', () => {
        test('calculates correct progress percentage', () => {
            expect(calculateMemberProgress(5, 10)).toBe(50);
            expect(calculateMemberProgress(3, 10)).toBe(30);
            expect(calculateMemberProgress(0, 10)).toBe(0);
            expect(calculateMemberProgress(10, 10)).toBe(100);
        });

        test('handles zero max members', () => {
            expect(calculateMemberProgress(5, 0)).toBe(Infinity);
        });
    });

    describe('updateFilteredGroupsByTab', () => {
        const userGroups = [
            { group_id: '1', group_name: 'My Group 1' },
            { group_id: '2', group_name: 'My Group 2' }
        ];

        const publicGroups = [
            { group_id: '1', group_name: 'My Group 1' },
            { group_id: '3', group_name: 'Public Group 1' },
            { group_id: '4', group_name: 'Public Group 2' }
        ];

        test('returns user groups for my-groups tab', () => {
            const result = updateFilteredGroupsByTab(userGroups, publicGroups, 'my-groups');
            expect(result).toHaveLength(2);
            expect(result[0].group_id).toBe('1');
            expect(result[1].group_id).toBe('2');
        });

        test('returns non-member public groups for discover tab', () => {
            const result = updateFilteredGroupsByTab(userGroups, publicGroups, 'discover');
            expect(result).toHaveLength(2);
            expect(result[0].group_id).toBe('3');
            expect(result[1].group_id).toBe('4');
        });

        test('returns all public groups for public tab', () => {
            const result = updateFilteredGroupsByTab(userGroups, publicGroups, 'public');
            expect(result).toHaveLength(3);
        });
    });

    describe('validateGroupForm', () => {
        test('returns errors for missing required fields', () => {
            const formData = {
                name: '',
                subject: '',
                faculty: 'Faculty of Science'
            };

            const errors = validateGroupForm(formData);
            expect(errors).toContain('Group name is required');
            expect(errors).toContain('Subject is required');
            expect(errors).toContain('Please select a course for the selected faculty');
        });

        test('returns error for invalid member count', () => {
            const formData = {
                name: 'Test Group',
                subject: 'Test Subject',
                max_members: 1
            };

            const errors = validateGroupForm(formData);
            expect(errors).toContain('Maximum members must be between 2 and 50');
        });

        test('returns empty array for valid form', () => {
            const formData = {
                name: 'Test Group',
                subject: 'Test Subject',
                max_members: 10
            };

            const errors = validateGroupForm(formData);
            expect(errors).toHaveLength(0);
        });
    });

    describe('formatGroupData', () => {
        test('formats data correctly for API request', () => {
            const formData = {
                name: '  Test Group  ',
                description: '  Test Description  ',
                subject: 'Test Subject',
                max_members: '15',
                is_private: true,
                faculty: 'Faculty of Science',
                course: 'Computer Science',
                year_of_study: '2nd Year'
            };

            const result = formatGroupData(formData, 'user123');
            
            expect(result).toEqual({
                name: 'Test Group',
                description: 'Test Description',
                subject: 'Test Subject',
                creator_id: 'user123',
                max_members: 15,
                is_private: true,
                faculty: 'Faculty of Science',
                course: 'Computer Science',
                year_of_study: '2nd Year'
            });
        });

        test('handles missing optional fields', () => {
            const formData = {
                name: 'Test Group',
                subject: 'Test Subject',
                max_members: ''
            };

            const result = formatGroupData(formData, 'user123');
            
            expect(result.max_members).toBe(10);
            expect(result.is_private).toBe(false);
            expect(result.faculty).toBe('');
            expect(result.course).toBe('');
            expect(result.year_of_study).toBe('');
        });
    });

    describe('calculateGroupStats', () => {
        const userGroups = [
            { group_id: '1', user_role: 'creator', member_count: 5 },
            { group_id: '2', user_role: 'admin', member_count: 3 },
            { group_id: '3', user_role: 'member', member_count: 2 }
        ];

        const publicGroups = [
            { group_id: '1', member_count: 5 },
            { group_id: '2', member_count: 3 },
            { group_id: '3', member_count: 2 },
            { group_id: '4', member_count: 7 }
        ];

        test('calculates correct statistics', () => {
            const stats = calculateGroupStats(userGroups, publicGroups);
            
            expect(stats.totalGroups).toBe(4);
            expect(stats.myGroups).toBe(3);
            expect(stats.ownedGroups).toBe(1);
            expect(stats.totalMembers).toBe(10); // 5 + 3 + 2
        });

        test('handles empty arrays', () => {
            const stats = calculateGroupStats([], []);
            
            expect(stats.totalGroups).toBe(0);
            expect(stats.myGroups).toBe(0);
            expect(stats.ownedGroups).toBe(0);
            expect(stats.totalMembers).toBe(0);
        });
    });

    describe('Constants', () => {
        test('facultyCourses contains expected faculties', () => {
            expect(Object.keys(facultyCourses)).toContain('Faculty of Science');
            expect(Object.keys(facultyCourses)).toContain('Faculty of Engineering & the Built Environment');
        });

        test('yearOptions contains expected years', () => {
            expect(yearOptions).toContain('1st Year');
            expect(yearOptions).toContain('3rd Year');
            expect(yearOptions).toContain('6th Year');
        });
    });
});