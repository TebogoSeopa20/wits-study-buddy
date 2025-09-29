// participantsUtils.test.js - Comprehensive tests for participants utility functions
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
    describe('Constants', () => {
        test('facultyCourses contains expected faculties', () => {
            expect(Object.keys(facultyCourses)).toEqual([
                'Faculty of Commerce, Law & Management',
                'Faculty of Engineering & the Built Environment',
                'Faculty of Health Sciences',
                'Faculty of Humanities',
                'Faculty of Science'
            ]);
        });

        test('facultyCourses has correct course structures', () => {
            const scienceCourses = facultyCourses['Faculty of Science'];
            expect(scienceCourses).toContain('Bachelor of Science (BSc) - Computer Science');
            expect(scienceCourses).toContain('Bachelor of Science (BSc) - Actuarial Science');
            expect(scienceCourses).toContain('Bachelor of Science (BSc) - Chemistry');
        });

        test('yearOptions contains all expected years', () => {
            expect(yearOptions).toEqual([
                '1st Year', '2nd Year', '3rd Year', 
                '4th Year', '5th Year', '6th Year'
            ]);
            expect(yearOptions).toHaveLength(6);
        });

        test('yearOptions has correct order', () => {
            expect(yearOptions[0]).toBe('1st Year');
            expect(yearOptions[5]).toBe('6th Year');
        });
    });

    describe('getConnectionStatus', () => {
        const userConnections = {
            connected_users: [
                { user_id: 'user1', requester_id: 'currentUser', status: 'accepted' },
                { user_id: 'currentUser', requester_id: 'user2', status: 'pending' },
                { user_id: 'user3', requester_id: 'currentUser', status: 'pending' },
                { user_id: 'user4', requester_id: 'otherUser', status: 'pending' },
                { user_id: 'user5', requester_id: 'currentUser', status: 'accepted' }
            ]
        };

        test('returns "accepted" for accepted connection where current user is requester', () => {
            expect(getConnectionStatus(userConnections, 'currentUser', 'user1')).toBe('accepted');
        });

        test('returns "accepted" for accepted connection where current user is recipient', () => {
            expect(getConnectionStatus(userConnections, 'currentUser', 'user5')).toBe('accepted');
        });

        test('returns "pending" for pending connection where current user is requester', () => {
            expect(getConnectionStatus(userConnections, 'currentUser', 'user2')).toBe('pending');
        });

        test('returns "pending" for pending connection where current user is recipient', () => {
            expect(getConnectionStatus(userConnections, 'currentUser', 'user3')).toBe('pending');
        });

        test('returns "none" for no connection', () => {
            expect(getConnectionStatus(userConnections, 'currentUser', 'nonexistent')).toBe('none');
        });

        test('returns "none" for empty connections object', () => {
            expect(getConnectionStatus({}, 'currentUser', 'user1')).toBe('none');
        });

        test('returns "none" for connections with empty array', () => {
            expect(getConnectionStatus({ connected_users: [] }, 'currentUser', 'user1')).toBe('none');
        });

        test('handles connection where target user is requester', () => {
            const connections = {
                connected_users: [
                    { user_id: 'currentUser', requester_id: 'user6', status: 'accepted' }
                ]
            };
            expect(getConnectionStatus(connections, 'currentUser', 'user6')).toBe('accepted');
        });

        test('handles multiple connection types correctly', () => {
            const complexConnections = {
                connected_users: [
                    { user_id: 'userA', requester_id: 'currentUser', status: 'accepted' },
                    { user_id: 'userB', requester_id: 'currentUser', status: 'pending' },
                    { user_id: 'currentUser', requester_id: 'userC', status: 'pending' },
                    { user_id: 'userD', requester_id: 'currentUser', status: 'rejected' }
                ]
            };
            
            expect(getConnectionStatus(complexConnections, 'currentUser', 'userA')).toBe('accepted');
            expect(getConnectionStatus(complexConnections, 'currentUser', 'userB')).toBe('pending');
            expect(getConnectionStatus(complexConnections, 'currentUser', 'userC')).toBe('pending');
            expect(getConnectionStatus(complexConnections, 'currentUser', 'userD')).toBe('rejected');
        });
    });

    describe('getInitials', () => {
        test('returns initials from full name with two words', () => {
            expect(getInitials('John Doe')).toBe('JD');
        });

        test('returns initials from full name with three words', () => {
            expect(getInitials('John Michael Doe')).toBe('JM');
        });

        test('returns initial from single name', () => {
            expect(getInitials('John')).toBe('J');
        });

        test('returns "NN" for empty string', () => {
            expect(getInitials('')).toBe('NN');
        });

        test('handles names with extra spaces', () => {
            expect(getInitials('  John   Doe  ')).toBe('JD');
        });

        test('handles names with mixed case', () => {
            expect(getInitials('jOHN dOE')).toBe('JD');
        });

        test('handles names with special characters', () => {
            expect(getInitials('John-Doe Smith')).toBe('JS');
        });

        test('handles very long names', () => {
            expect(getInitials('John Michael Christopher David Smith')).toBe('JM');
        });

        test('handles single character names', () => {
            expect(getInitials('J')).toBe('J');
        });

        test('handles names with numbers', () => {
            expect(getInitials('John Doe 123')).toBe('JD');
        });

        test('returns exactly 2 characters for two-word names', () => {
            const initials = getInitials('Jane Smith');
            expect(initials).toHaveLength(2);
            expect(initials).toBe('JS');
        });

        test('returns exactly 1 character for single-word names', () => {
            const initials = getInitials('Single');
            expect(initials).toHaveLength(1);
            expect(initials).toBe('S');
        });
    });

    describe('debounce', () => {
        jest.useFakeTimers();

        test('delays function execution by specified time', () => {
            const mockFn = jest.fn();
            const debouncedFn = debounce(mockFn, 1000);

            debouncedFn();
            expect(mockFn).not.toHaveBeenCalled();

            jest.advanceTimersByTime(500);
            expect(mockFn).not.toHaveBeenCalled();

            jest.advanceTimersByTime(500);
            expect(mockFn).toHaveBeenCalledTimes(1);
        });

        test('only executes once when called multiple times rapidly', () => {
            const mockFn = jest.fn();
            const debouncedFn = debounce(mockFn, 1000);

            debouncedFn('first');
            debouncedFn('second');
            debouncedFn('third');

            jest.advanceTimersByTime(1000);
            expect(mockFn).toHaveBeenCalledTimes(1);
            expect(mockFn).toHaveBeenCalledWith('third');
        });

        test('passes correct arguments to debounced function', () => {
            const mockFn = jest.fn();
            const debouncedFn = debounce(mockFn, 500);

            debouncedFn('arg1', 'arg2', 123);
            jest.advanceTimersByTime(500);

            expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 123);
        });

        test('handles multiple separate debounce calls', () => {
            const mockFn = jest.fn();
            const debouncedFn = debounce(mockFn, 1000);

            // First call
            debouncedFn();
            jest.advanceTimersByTime(1000);
            expect(mockFn).toHaveBeenCalledTimes(1);

            // Second call after delay
            debouncedFn();
            jest.advanceTimersByTime(1000);
            expect(mockFn).toHaveBeenCalledTimes(2);
        });

        test('resets timer on subsequent calls', () => {
            const mockFn = jest.fn();
            const debouncedFn = debounce(mockFn, 1000);

            debouncedFn();
            jest.advanceTimersByTime(500);

            // Call again, should reset timer
            debouncedFn();
            jest.advanceTimersByTime(500);
            expect(mockFn).not.toHaveBeenCalled(); // Should not have executed yet

            jest.advanceTimersByTime(500);
            expect(mockFn).toHaveBeenCalledTimes(1);
        });

        test('works with different wait times', () => {
            const mockFn = jest.fn();
            const debouncedFn = debounce(mockFn, 200);

            debouncedFn();
            jest.advanceTimersByTime(200);
            expect(mockFn).toHaveBeenCalledTimes(1);

            const mockFn2 = jest.fn();
            const debouncedFn2 = debounce(mockFn2, 500);
            
            debouncedFn2();
            jest.advanceTimersByTime(500);
            expect(mockFn2).toHaveBeenCalledTimes(1);
        });
    });

    describe('filterProfiles', () => {
        const profiles = [
            {
                id: '1',
                user_id: 'user1',
                name: 'John Doe',
                email: 'john.doe@example.com',
                role: 'student',
                faculty: 'Faculty of Science',
                course: 'Computer Science',
                year_of_study: '2nd Year'
            },
            {
                id: '2',
                user_id: 'user2',
                name: 'Jane Smith',
                email: 'jane.smith@example.com',
                role: 'lecturer',
                faculty: 'Faculty of Engineering & the Built Environment',
                course: 'Civil Engineering',
                year_of_study: '3rd Year'
            },
            {
                id: '3',
                user_id: 'user3',
                name: 'Bob Johnson',
                email: 'bob.johnson@example.com',
                role: 'student',
                faculty: 'Faculty of Humanities',
                course: 'Psychology',
                year_of_study: '1st Year'
            },
            {
                id: '4',
                user_id: 'user4',
                name: 'Alice Brown',
                email: 'alice.brown@example.com',
                role: 'student',
                faculty: 'Faculty of Science',
                course: 'Physics',
                year_of_study: '4th Year'
            }
        ];

        const userConnections = {
            connected_users: [
                { user_id: 'user1', requester_id: 'currentUser', status: 'accepted' },
                { user_id: 'currentUser', requester_id: 'user2', status: 'pending' },
                { user_id: 'user3', requester_id: 'currentUser', status: 'pending' }
            ]
        };

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
            expect(result).toHaveLength(4);
        });

        test('filters by search term in email', () => {
            const filters = {
                searchTerm: 'example.com',
                selectedRole: '',
                selectedFaculty: '',
                selectedCourse: '',
                selectedYear: '',
                selectedConnection: '',
                currentTab: 'all'
            };

            const result = filterProfiles(profiles, filters, userConnections, 'currentUser');
            expect(result).toHaveLength(4);
        });

        test('filters by search term in course', () => {
            const filters = {
                searchTerm: 'computer',
                selectedRole: '',
                selectedFaculty: '',
                selectedCourse: '',
                selectedYear: '',
                selectedConnection: '',
                currentTab: 'all'
            };

            const result = filterProfiles(profiles, filters, userConnections, 'currentUser');
            expect(result).toHaveLength(1);
            expect(result[0].course).toBe('Computer Science');
        });

        test('filters by search term in faculty', () => {
            const filters = {
                searchTerm: 'engineering',
                selectedRole: '',
                selectedFaculty: '',
                selectedCourse: '',
                selectedYear: '',
                selectedConnection: '',
                currentTab: 'all'
            };

            const result = filterProfiles(profiles, filters, userConnections, 'currentUser');
            expect(result).toHaveLength(1);
            expect(result[0].faculty).toBe('Faculty of Engineering & the Built Environment');
        });

        test('filters by role', () => {
            const filters = {
                searchTerm: '',
                selectedRole: 'student',
                selectedFaculty: '',
                selectedCourse: '',
                selectedYear: '',
                selectedConnection: '',
                currentTab: 'all'
            };

            const result = filterProfiles(profiles, filters, userConnections, 'currentUser');
            expect(result).toHaveLength(3);
            result.forEach(profile => {
                expect(profile.role).toBe('student');
            });
        });

        test('filters by faculty', () => {
            const filters = {
                searchTerm: '',
                selectedRole: '',
                selectedFaculty: 'Faculty of Science',
                selectedCourse: '',
                selectedYear: '',
                selectedConnection: '',
                currentTab: 'all'
            };

            const result = filterProfiles(profiles, filters, userConnections, 'currentUser');
            expect(result).toHaveLength(2);
            result.forEach(profile => {
                expect(profile.faculty).toBe('Faculty of Science');
            });
        });

        test('filters by course', () => {
            const filters = {
                searchTerm: '',
                selectedRole: '',
                selectedFaculty: '',
                selectedCourse: 'Psychology',
                selectedYear: '',
                selectedConnection: '',
                currentTab: 'all'
            };

            const result = filterProfiles(profiles, filters, userConnections, 'currentUser');
            expect(result).toHaveLength(1);
            expect(result[0].course).toBe('Psychology');
        });

        test('filters by year of study', () => {
            const filters = {
                searchTerm: '',
                selectedRole: '',
                selectedFaculty: '',
                selectedCourse: '',
                selectedYear: '2nd Year',
                selectedConnection: '',
                currentTab: 'all'
            };

            const result = filterProfiles(profiles, filters, userConnections, 'currentUser');
            expect(result).toHaveLength(1);
            expect(result[0].year_of_study).toBe('2nd Year');
        });

        test('filters by connection status - accepted', () => {
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

        test('filters by connection status - pending', () => {
            const filters = {
                searchTerm: '',
                selectedRole: '',
                selectedFaculty: '',
                selectedCourse: '',
                selectedYear: '',
                selectedConnection: 'pending',
                currentTab: 'all'
            };

            const result = filterProfiles(profiles, filters, userConnections, 'currentUser');
            expect(result).toHaveLength(2); // user2 and user3 have pending connections
        });

        test('filters by tab - connections', () => {
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


        test('combines multiple filters', () => {
            const filters = {
                searchTerm: 'science',
                selectedRole: 'student',
                selectedFaculty: 'Faculty of Science',
                selectedCourse: '',
                selectedYear: '',
                selectedConnection: '',
                currentTab: 'all'
            };

            const result = filterProfiles(profiles, filters, userConnections, 'currentUser');
            expect(result).toHaveLength(2);
            result.forEach(profile => {
                expect(profile.role).toBe('student');
                expect(profile.faculty).toBe('Faculty of Science');
            });
        });

        test('returns empty array when no profiles match filters', () => {
            const filters = {
                searchTerm: 'nonexistent',
                selectedRole: 'admin',
                selectedFaculty: 'Nonexistent Faculty',
                selectedCourse: '',
                selectedYear: '',
                selectedConnection: '',
                currentTab: 'all'
            };

            const result = filterProfiles(profiles, filters, userConnections, 'currentUser');
            expect(result).toHaveLength(0);
        });

        test('handles empty profiles array', () => {
            const filters = {
                searchTerm: '',
                selectedRole: '',
                selectedFaculty: '',
                selectedCourse: '',
                selectedYear: '',
                selectedConnection: '',
                currentTab: 'all'
            };

            const result = filterProfiles([], filters, userConnections, 'currentUser');
            expect(result).toHaveLength(0);
        });

        test('handles profiles missing some fields', () => {
            const incompleteProfiles = [
                {
                    id: '5',
                    user_id: 'user5',
                    name: 'Incomplete User'
                    // missing other fields
                }
            ];

            const filters = {
                searchTerm: 'incomplete',
                selectedRole: '',
                selectedFaculty: '',
                selectedCourse: '',
                selectedYear: '',
                selectedConnection: '',
                currentTab: 'all'
            };

            const result = filterProfiles(incompleteProfiles, filters, userConnections, 'currentUser');
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Incomplete User');
        });

        test('handles profiles with user_id or id field', () => {
            const mixedProfiles = [
                { user_id: 'userA', name: 'User A' },
                { id: 'userB', name: 'User B' }
            ];

            const mixedConnections = {
                connected_users: [
                    { user_id: 'userA', requester_id: 'currentUser', status: 'accepted' }
                ]
            };

            const filters = {
                searchTerm: '',
                selectedRole: '',
                selectedFaculty: '',
                selectedCourse: '',
                selectedYear: '',
                selectedConnection: 'accepted',
                currentTab: 'all'
            };

            const result = filterProfiles(mixedProfiles, filters, mixedConnections, 'currentUser');
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('User A');
        });
    });

    describe('updateConnectionStats', () => {

        test('handles empty connections', () => {
            const stats = updateConnectionStats({ connected_users: [] }, 'currentUser', 5);
            
            expect(stats.connected).toBe(0);
            expect(stats.pending).toBe(0);
            expect(stats.sent).toBe(0);
            expect(stats.total).toBe(5);
        });

        test('handles connections with only accepted status', () => {
            const connections = {
                connected_users: [
                    { user_id: 'user1', requester_id: 'currentUser', status: 'accepted' },
                    { user_id: 'user2', requester_id: 'currentUser', status: 'accepted' },
                    { user_id: 'currentUser', requester_id: 'user3', status: 'accepted' }
                ]
            };

            const stats = updateConnectionStats(connections, 'currentUser', 8);
            
            expect(stats.connected).toBe(3);
            expect(stats.pending).toBe(0);
            expect(stats.sent).toBe(0);
            expect(stats.total).toBe(8);
        });

        test('handles connections with only pending requests sent', () => {
            const connections = {
                connected_users: [
                    { user_id: 'currentUser', requester_id: 'user1', status: 'pending' },
                    { user_id: 'currentUser', requester_id: 'user2', status: 'pending' }
                ]
            };

            const stats = updateConnectionStats(connections, 'currentUser', 6);
            
            expect(stats.connected).toBe(0);
            expect(stats.pending).toBe(2);
            expect(stats.sent).toBe(0);
            expect(stats.total).toBe(6);
        });

        test('handles zero total profiles', () => {
            const connections = {
                connected_users: [
                    { user_id: 'user1', requester_id: 'currentUser', status: 'accepted' }
                ]
            };

            const stats = updateConnectionStats(connections, 'currentUser', 0);
            
            expect(stats.connected).toBe(1);
            expect(stats.pending).toBe(0);
            expect(stats.sent).toBe(0);
            expect(stats.total).toBe(0);
        });

        test('ignores connections with other statuses', () => {
            const connections = {
                connected_users: [
                    { user_id: 'user1', requester_id: 'currentUser', status: 'accepted' },
                    { user_id: 'user2', requester_id: 'currentUser', status: 'blocked' },
                    { user_id: 'user3', requester_id: 'currentUser', status: 'rejected' },
                    { user_id: 'user4', requester_id: 'currentUser', status: 'cancelled' }
                ]
            };

            const stats = updateConnectionStats(connections, 'currentUser', 10);
            
            expect(stats.connected).toBe(1);
            expect(stats.pending).toBe(0);
            expect(stats.sent).toBe(0);
            expect(stats.total).toBe(10);
        });
    });

    describe('getProfileName', () => {
        const profiles = [
            { id: '1', user_id: 'user1', name: 'John Doe' },
            { id: '2', user_id: 'user2', name: 'Jane Smith' },
            { id: '3', name: 'Bob Johnson' } // missing user_id
        ];

        test('returns profile name when found by user_id', () => {
            expect(getProfileName(profiles, 'user1')).toBe('John Doe');
        });

        test('returns profile name when found by id', () => {
            expect(getProfileName(profiles, '3')).toBe('Bob Johnson');
        });

        test('returns default text when profile not found by user_id', () => {
            expect(getProfileName(profiles, 'nonexistent')).toBe('this user');
        });

        test('returns default text when profile not found by id', () => {
            expect(getProfileName(profiles, '999')).toBe('this user');
        });

        test('returns default text for empty profiles array', () => {
            expect(getProfileName([], 'user1')).toBe('this user');
        });

        test('returns default text for undefined profileId', () => {
            expect(getProfileName(profiles, undefined)).toBe('this user');
        });

        test('returns default text for null profileId', () => {
            expect(getProfileName(profiles, null)).toBe('this user');
        });

        test('handles profiles with only id field', () => {
            const idOnlyProfiles = [
                { id: 'userA', name: 'User A' }
            ];
            expect(getProfileName(idOnlyProfiles, 'userA')).toBe('User A');
        });

        test('handles profiles with only user_id field', () => {
            const userIdOnlyProfiles = [
                { user_id: 'userB', name: 'User B' }
            ];
            expect(getProfileName(userIdOnlyProfiles, 'userB')).toBe('User B');
        });

        test('prioritizes user_id over id when both exist', () => {
            const mixedProfile = [
                { id: '1', user_id: 'user1', name: 'Correct Name' }
            ];
            expect(getProfileName(mixedProfile, 'user1')).toBe('Correct Name');
        });
    });

    describe('Edge Cases and Integration', () => {
        test('all functions work together correctly', () => {
            // Setup test data
            const profiles = [
                {
                    id: '1',
                    user_id: 'user1',
                    name: 'Test User',
                    role: 'student',
                    faculty: 'Faculty of Science',
                    course: 'Computer Science',
                    year_of_study: '2nd Year'
                }
            ];

            const connections = {
                connected_users: [
                    { user_id: 'user1', requester_id: 'currentUser', status: 'accepted' }
                ]
            };

            // Test getConnectionStatus
            const status = getConnectionStatus(connections, 'currentUser', 'user1');
            expect(status).toBe('accepted');

            // Test getInitials
            const initials = getInitials('Test User');
            expect(initials).toBe('TU');

            // Test filterProfiles
            const filters = {
                searchTerm: 'test',
                selectedRole: 'student',
                selectedFaculty: 'Faculty of Science',
                selectedCourse: '',
                selectedYear: '',
                selectedConnection: 'accepted',
                currentTab: 'all'
            };
            const filtered = filterProfiles(profiles, filters, connections, 'currentUser');
            expect(filtered).toHaveLength(1);

            // Test updateConnectionStats
            const stats = updateConnectionStats(connections, 'currentUser', 1);
            expect(stats.connected).toBe(1);

            // Test getProfileName
            const name = getProfileName(profiles, 'user1');
            expect(name).toBe('Test User');
        });

        test('performance with large datasets', () => {
            // Create large dataset
            const largeProfiles = Array.from({ length: 1000 }, (_, i) => ({
                id: `user${i}`,
                user_id: `user${i}`,
                name: `User ${i}`,
                role: i % 2 === 0 ? 'student' : 'lecturer',
                faculty: `Faculty ${i % 5}`,
                course: `Course ${i}`,
                year_of_study: `${(i % 6) + 1}st Year`
            }));

            const largeConnections = {
                connected_users: Array.from({ length: 500 }, (_, i) => ({
                    user_id: `user${i * 2}`,
                    requester_id: 'currentUser',
                    status: i % 3 === 0 ? 'accepted' : 'pending'
                }))
            };

            const filters = {
                searchTerm: 'user',
                selectedRole: 'student',
                selectedFaculty: 'Faculty 0',
                selectedCourse: '',
                selectedYear: '',
                selectedConnection: '',
                currentTab: 'all'
            };

            const startTime = Date.now();
            const result = filterProfiles(largeProfiles, filters, largeConnections, 'currentUser');
            const endTime = Date.now();

            // Should complete in reasonable time (less than 1 second)
            expect(endTime - startTime).toBeLessThan(1000);
            expect(result.length).toBeGreaterThan(0);
        });
    });
});