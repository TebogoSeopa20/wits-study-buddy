// participantsUtils.test.js - Tests for participants utility functions
const {
    facultyCourses,
    yearOptions,
    getConnectionStatus,
    getInitials,
    debounce,
    filterProfiles,
    updateConnectionStats,
    getProfileName
} = require('../src/frontend/test_utils/participantsUtils');

describe('Participants Utility Functions', () => {
    describe('getConnectionStatus', () => {
        const userConnections = {
            connected_users: [
                { user_id: 'user1', requester_id: 'currentUser', status: 'accepted' },
                { user_id: 'currentUser', requester_id: 'user2', status: 'pending' },
                { user_id: 'user3', requester_id: 'currentUser', status: 'pending_approval' }
            ]
        };

        test('returns "accepted" for accepted connection', () => {
            expect(getConnectionStatus(userConnections, 'currentUser', 'user1')).toBe('accepted');
        });

        test('returns "pending" for pending connection where current user is requester', () => {
            expect(getConnectionStatus(userConnections, 'currentUser', 'user2')).toBe('pending');
        });

        test('returns "pending_approval" for pending connection where current user is recipient', () => {
            expect(getConnectionStatus(userConnections, 'currentUser', 'user3')).toBe('pending_approval');
        });

        test('returns "none" for no connection', () => {
            expect(getConnectionStatus(userConnections, 'currentUser', 'user4')).toBe('none');
        });

        test('returns "none" for empty connections', () => {
            expect(getConnectionStatus({ connected_users: [] }, 'currentUser', 'user1')).toBe('none');
        });
    });

    describe('getInitials', () => {
        test('returns initials from full name', () => {
            expect(getInitials('John Doe')).toBe('JD');
        });

        test('returns initials from single name', () => {
            expect(getInitials('John')).toBe('J');
        });

        test('returns "NN" for empty name', () => {
            expect(getInitials('')).toBe('NN');
        });

        test('returns "NN" for undefined name', () => {
            expect(getInitials()).toBe('NN');
        });

        test('returns initials from name with multiple spaces', () => {
            expect(getInitials('John Michael Doe')).toBe('JM');
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

    describe('filterProfiles', () => {
        const profiles = [
            {
                id: '1',
                user_id: 'user1',
                name: 'John Doe',
                email: 'john@example.com',
                role: 'student',
                faculty: 'Faculty of Science',
                course: 'Computer Science',
                year_of_study: '2nd Year'
            },
            {
                id: '2',
                user_id: 'user2',
                name: 'Jane Smith',
                email: 'jane@example.com',
                role: 'lecturer',
                faculty: 'Faculty of Engineering',
                course: 'Civil Engineering',
                year_of_study: '3rd Year'
            }
        ];

        const userConnections = {
            connected_users: [
                { user_id: 'user1', requester_id: 'currentUser', status: 'accepted' },
                { user_id: 'currentUser', requester_id: 'user2', status: 'pending' }
            ]
        };

        test('filters by search term', () => {
            const filters = {
                searchTerm: 'john',
                selectedRole: '',
                selectedFaculty: '',
                selectedCourse: '',
                selectedYear: '',
                selectedConnection: '',
                currentTab: 'all'
            };

            const result = filterProfiles(profiles, filters, userConnections, 'currentUser');
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('John Doe');
        });

        test('filters by role', () => {
            const filters = {
                searchTerm: '',
                selectedRole: 'lecturer',
                selectedFaculty: '',
                selectedCourse: '',
                selectedYear: '',
                selectedConnection: '',
                currentTab: 'all'
            };

            const result = filterProfiles(profiles, filters, userConnections, 'currentUser');
            expect(result).toHaveLength(1);
            expect(result[0].role).toBe('lecturer');
        });

        test('filters by connection status', () => {
            const filters = {
                searchTerm: '',
                selectedRole: '',
                selectedFaculty: '',
                selectedCourse: '',
                selectedYear: '',
                selectedConnection: 'accepted',
                currentTab: 'all'
            };

            const result = filterProfiles(profiles, filters, userConnections, 'currentUser');
            expect(result).toHaveLength(1);
            expect(result[0].user_id).toBe('user1');
        });

        test('filters by tab', () => {
            const filters = {
                searchTerm: '',
                selectedRole: '',
                selectedFaculty: '',
                selectedCourse: '',
                selectedYear: '',
                selectedConnection: '',
                currentTab: 'connections'
            };

            const result = filterProfiles(profiles, filters, userConnections, 'currentUser');
            expect(result).toHaveLength(1);
            expect(result[0].user_id).toBe('user1');
        });

        test('returns all profiles when no filters applied', () => {
            const filters = {
                searchTerm: '',
                selectedRole: '',
                selectedFaculty: '',
                selectedCourse: '',
                selectedYear: '',
                selectedConnection: '',
                currentTab: 'all'
            };

            const result = filterProfiles(profiles, filters, userConnections, 'currentUser');
            expect(result).toHaveLength(2);
        });
    });

    describe('updateConnectionStats', () => {
        const userConnections = {
            connected_users: [
                { user_id: 'user1', requester_id: 'currentUser', status: 'accepted' },
                { user_id: 'currentUser', requester_id: 'user2', status: 'pending' },
                { user_id: 'user3', requester_id: 'currentUser', status: 'pending_approval' },
                { user_id: 'user4', requester_id: 'otherUser', status: 'pending' }
            ]
        };


        test('handles empty connections', () => {
            const stats = updateConnectionStats({ connected_users: [] }, 'currentUser', 5);
            
            expect(stats.connected).toBe(0);
            expect(stats.pending).toBe(0);
            expect(stats.sent).toBe(0);
            expect(stats.total).toBe(5);
        });
    });

    describe('getProfileName', () => {
        const profiles = [
            { id: '1', user_id: 'user1', name: 'John Doe' },
            { id: '2', user_id: 'user2', name: 'Jane Smith' }
        ];

        test('returns profile name when found by user_id', () => {
            expect(getProfileName(profiles, 'user1')).toBe('John Doe');
        });

        test('returns default text when profile not found', () => {
            expect(getProfileName(profiles, 'user3')).toBe('this user');
        });

        test('returns default text for empty profiles array', () => {
            expect(getProfileName([], 'user1')).toBe('this user');
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