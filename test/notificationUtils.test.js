// notificationUtils.test.js - Tests for notification utilities
const {
    getApiBaseUrl,
    getNotificationCategory,
    getNotificationIcon,
    getTimeAgo,
    getActionButtons,
    filterNotifications,
    debounce,
    mockNotifications
} = require('../src/frontend/test_utils/notificationUtils');

// Mock window.location for getApiBaseUrl tests
const originalWindow = global.window;

beforeAll(() => {
    // Mock window object for testing
    global.window = {
        location: {
            hostname: 'localhost'
        }
    };
});

afterAll(() => {
    // Restore original window object
    global.window = originalWindow;
});

describe('Notification Utilities', () => {
    describe('getApiBaseUrl', () => {
        test('returns local URL for localhost', () => {
            window.location.hostname = 'localhost';
            expect(getApiBaseUrl()).toBe('http://localhost:3000/api');
        });

        test('returns local URL for 127.0.0.1', () => {
            window.location.hostname = '127.0.0.1';
            expect(getApiBaseUrl()).toBe('http://localhost:3000/api');
        });

        
    });

    describe('getNotificationCategory', () => {
        test('returns correct category for connection_request', () => {
            expect(getNotificationCategory('connection_request')).toBe('social');
        });

        test('returns correct category for group_invitation', () => {
            expect(getNotificationCategory('group_invitation')).toBe('academic');
        });

        test('returns correct category for message_received', () => {
            expect(getNotificationCategory('message_received')).toBe('message');
        });

        test('returns correct category for system_announcement', () => {
            expect(getNotificationCategory('system_announcement')).toBe('system');
        });

        test('returns system category for unknown types', () => {
            expect(getNotificationCategory('unknown_type')).toBe('system');
        });
    });

    describe('getNotificationIcon', () => {
        test('returns correct icon for connection_request', () => {
            expect(getNotificationIcon('connection_request')).toBe('fas fa-user-plus');
        });

        test('returns correct icon for group_invitation', () => {
            expect(getNotificationIcon('group_invitation')).toBe('fas fa-users');
        });

        test('returns correct icon for study_session_created', () => {
            expect(getNotificationIcon('study_session_created')).toBe('fas fa-calendar-plus');
        });

        test('returns default icon for unknown types', () => {
            expect(getNotificationIcon('unknown_type')).toBe('fas fa-bell');
        });
    });

    describe('getTimeAgo', () => {
        test('returns "Just now" for recent timestamps', () => {
            const now = new Date().toISOString();
            expect(getTimeAgo(now)).toBe('Just now');
        });

        test('returns minutes for timestamps a few minutes ago', () => {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            expect(getTimeAgo(fiveMinutesAgo)).toBe('5m ago');
        });

        test('returns hours for timestamps a few hours ago', () => {
            const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
            expect(getTimeAgo(threeHoursAgo)).toBe('3h ago');
        });

        test('returns days for timestamps a few days ago', () => {
            const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
            expect(getTimeAgo(twoDaysAgo)).toBe('2d ago');
        });


        test('returns "Just now" for null timestamp', () => {
            expect(getTimeAgo(null)).toBe('Just now');
        });
    });

    describe('getActionButtons', () => {
        test('returns accept/reject buttons for connection_request', () => {
            const notification = mockNotifications[0]; // connection_request
            const buttons = getActionButtons(notification);
            
            expect(buttons).toContain('accept-request-btn');
            expect(buttons).toContain('reject-request-btn');
            expect(buttons).toContain(`data-user-id="${notification.sender_id}"`);
        });

        test('returns join/decline buttons for group_invitation', () => {
            const notification = mockNotifications[1]; // group_invitation
            const buttons = getActionButtons(notification);
            
            expect(buttons).toContain('accept-invite-btn');
            expect(buttons).toContain('decline-invite-btn');
            expect(buttons).toContain(`data-group-id="${notification.related_entity_id}"`);
        });

        
    });

    describe('filterNotifications', () => {
        test('filters by search term', () => {
            const filters = { search: 'connection', type: '', category: '', status: '' };
            const filtered = filterNotifications(mockNotifications, filters);
            
            expect(filtered.length).toBe(1);
            expect(filtered[0].type).toBe('connection_request');
        });

        test('filters by type', () => {
            const filters = { search: '', type: 'group_invitation', category: '', status: '' };
            const filtered = filterNotifications(mockNotifications, filters);
            
            expect(filtered.length).toBe(1);
            expect(filtered[0].type).toBe('group_invitation');
        });

        test('filters by category', () => {
            const filters = { search: '', type: '', category: 'academic', status: '' };
            const filtered = filterNotifications(mockNotifications, filters);
            
            expect(filtered.length).toBe(2); // group_invitation and study_session_created
        });

        test('filters by status (unread)', () => {
            const filters = { search: '', type: '', category: '', status: 'unread' };
            const filtered = filterNotifications(mockNotifications, filters);
            
            expect(filtered.length).toBe(2);
            expect(filtered.every(n => !n.is_read)).toBe(true);
        });

        test('filters by status (read)', () => {
            const filters = { search: '', type: '', category: '', status: 'read' };
            const filtered = filterNotifications(mockNotifications, filters);
            
            expect(filtered.length).toBe(1);
            expect(filtered[0].is_read).toBe(true);
        });

        test('returns all notifications when no filters applied', () => {
            const filters = { search: '', type: '', category: '', status: '' };
            const filtered = filterNotifications(mockNotifications, filters);
            
            expect(filtered.length).toBe(mockNotifications.length);
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
});