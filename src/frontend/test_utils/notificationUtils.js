// notificationUtils.js - Testable utility functions extracted from notifications.js

// API configuration (moved from notifications.js)
export function getApiBaseUrl() {
    const isLocal = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    return isLocal 
        ? 'http://localhost:3000/api' 
        : 'https://wits-buddy-g9esajarfqe3dmh6.southafricanorth-01.azurewebsites.net/api';
}

// Notification utilities
export function getNotificationCategory(type) {
    const categories = {
        // Social/Connection notifications
        'connection_request': 'social',
        'connection_accepted': 'social',
        'connection_rejected': 'social',
        'connection_blocked': 'social',
        'connection_removed': 'social',
        
        // Academic/Group notifications
        'group_invitation': 'academic',
        'group_join_request': 'academic',
        'group_join_accepted': 'academic',
        'group_join_rejected': 'academic',
        'group_member_joined': 'academic',
        'group_member_left': 'academic',
        'group_member_removed': 'academic',
        'group_role_changed': 'academic',
        'group_updated': 'academic',
        'group_deleted': 'academic',
        'study_session_created': 'academic',
        'study_session_updated': 'academic',
        'study_session_cancelled': 'academic',
        
        // Message notifications
        'message_received': 'message',
        'message_read': 'message',
        
        // System notifications
        'system_announcement': 'system',
        'profile_updated': 'system',
        'achievement_unlocked': 'system',
        'resource_shared': 'system'
    };
    
    return categories[type] || 'system';
}

export function getNotificationIcon(type) {
    const icons = {
        'connection_request': 'fas fa-user-plus',
        'connection_accepted': 'fas fa-handshake',
        'connection_rejected': 'fas fa-user-times',
        'connection_blocked': 'fas fa-ban',
        'connection_removed': 'fas fa-user-minus',
        
        'group_invitation': 'fas fa-users',
        'group_join_request': 'fas fa-user-clock',
        'group_join_accepted': 'fas fa-user-check',
        'group_join_rejected': 'fas fa-user-slash',
        'group_member_joined': 'fas fa-user-plus',
        'group_member_left': 'fas fa-user-minus',
        'group_member_removed': 'fas fa-user-times',
        'group_role_changed': 'fas fa-star',
        'group_updated': 'fas fa-edit',
        'group_deleted': 'fas fa-trash',
        
        'study_session_created': 'fas fa-calendar-plus',
        'study_session_updated': 'fas fa-calendar-check',
        'study_session_cancelled': 'fas fa-calendar-times',
        
        'message_received': 'fas fa-comment',
        'message_read': 'fas fa-comment-check',
        
        'system_announcement': 'fas fa-bullhorn',
        'profile_updated': 'fas fa-user-edit',
        'achievement_unlocked': 'fas fa-trophy',
        'resource_shared': 'fas fa-share'
    };
    
    return icons[type] || 'fas fa-bell';
}

export function getTimeAgo(timestamp) {
    if (!timestamp) return 'Just now';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
}

export function getActionButtons(notification) {
    const { type, related_entity_type, related_entity_id, metadata } = notification;
    
    switch(type) {
        case 'connection_request':
            return `
                <button class="notification-action-btn primary accept-request-btn" data-id="${notification.id}" data-user-id="${metadata?.sender_id || notification.sender_id}">
                    <i class="fas fa-check"></i> Accept
                </button>
                <button class="notification-action-btn outline reject-request-btn" data-id="${notification.id}" data-user-id="${metadata?.sender_id || notification.sender_id}">
                    <i class="fas fa-times"></i> Reject
                </button>
            `;
            
        case 'group_invitation':
            return `
                <button class="notification-action-btn primary accept-invite-btn" data-id="${notification.id}" data-group-id="${related_entity_id}" data-invite-code="${metadata?.invite_code}">
                    <i class="fas fa-check"></i> Join
                </button>
                <button class="notification-action-btn outline decline-invite-btn" data-id="${notification.id}" data-group-id="${related_entity_id}">
                    <i class="fas fa-times"></i> Decline
                </button>
            `;
            
        case 'group_join_request':
            return `
                <button class="notification-action-btn primary approve-join-btn" data-id="${notification.id}" data-user-id="${metadata?.requester_id}" data-group-id="${related_entity_id}">
                    <i class="fas fa-check"></i> Approve
                </button>
                <button class="notification-action-btn outline reject-join-btn" data-id="${notification.id}" data-user-id="${metadata?.requester_id}" data-group-id="${related_entity_id}">
                    <i class="fas fa-times"></i> Reject
                </button>
            `;
            
        case 'message_received':
            return `
                <button class="notification-action-btn primary view-message-btn" data-id="${notification.id}" data-chat-id="${related_entity_id}">
                    <i class="fas fa-comment"></i> View Message
                </button>
            `;
            
        default:
            if (related_entity_type && related_entity_id) {
                return `
                    <button class="notification-action-btn outline view-details-btn" data-id="${notification.id}" data-entity-type="${related_entity_type}" data-entity-id="${related_entity_id}">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                `;
            }
            return '';
    }
}

export function filterNotifications(notifications, filters) {
    return notifications.filter(notification => {
        // Search filter
        const matchesSearch = !filters.search || 
            (notification.title && notification.title.toLowerCase().includes(filters.search)) ||
            (notification.message && notification.message.toLowerCase().includes(filters.search)) ||
            (notification.type && notification.type.toLowerCase().includes(filters.search));
        
        // Type filter
        const matchesType = !filters.type || notification.type === filters.type;
        
        // Category filter (map types to categories)
        const matchesCategory = !filters.category || 
            getNotificationCategory(notification.type) === filters.category;
        
        // Status filter
        const matchesStatus = !filters.status || 
            (filters.status === 'unread' && !notification.is_read) ||
            (filters.status === 'read' && notification.is_read);
        
        return matchesSearch && matchesType && matchesCategory && matchesStatus;
    });
}

export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Mock data for testing
export const mockNotifications = [
    {
        id: '1',
        user_id: '79bb1a45-8581-47c7-988a-f0524f0971e6',
        sender_id: 'c9d8e7f6-a5b4-4c3d-2e1f-0a9b8c7d6e5f',
        type: 'connection_request',
        title: 'New Connection Request',
        message: 'John Doe has sent you a connection request',
        related_entity_type: 'profile',
        related_entity_id: 'c9d8e7f6-a5b4-4c3d-2e1f-0a9b8c7d6e5f',
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
        sender: {
            name: 'John Doe',
            email: 'john@example.com'
        },
        metadata: {
            sender_id: 'c9d8e7f6-a5b4-4c3d-2e1f-0a9b8c7d6e5f'
        }
    },
    {
        id: '2',
        user_id: '79bb1a45-8581-47c7-988a-f0524f0971e6',
        sender_id: 'd8e7f6a5-b4c3-4d2e-1f0a-9b8c7d6e5f0a',
        type: 'group_invitation',
        title: 'Group Invitation',
        message: 'You have been invited to join "Study Group Alpha"',
        related_entity_type: 'group',
        related_entity_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        sender: {
            name: 'Sarah Wilson',
            email: 'sarah@example.com'
        },
        metadata: {
            group_name: 'Study Group Alpha',
            invite_code: 'INVITE123'
        }
    },
    {
        id: '3',
        user_id: '79bb1a45-8581-47c7-988a-f0524f0971e6',
        sender_id: null,
        type: 'study_session_created',
        title: 'New Study Session',
        message: 'A new study session "Math Review" has been scheduled for tomorrow at 2 PM',
        related_entity_type: 'study_session',
        related_entity_id: 'b2c3d4e5-f6a7-890b-cdef-234567890123',
        is_read: true,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
        metadata: {
            session_date: "2024-01-15T14:00:00Z",
            duration: 120,
            subject: "Mathematics"
        }
    }
];

export default {
    getApiBaseUrl,
    getNotificationCategory,
    getNotificationIcon,
    getTimeAgo,
    getActionButtons,
    filterNotifications,
    debounce,
    mockNotifications
};