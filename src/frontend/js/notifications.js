// notifications.js - Comprehensive Notifications Management with Mock Data
document.addEventListener('DOMContentLoaded', function() {
    // API configuration
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_BASE_URL = isLocal 
        ? 'http://localhost:3000/api' 
        : 'https://wits-buddy-g9esajarfqe3dmh6.southafricanorth-01.azurewebsites.net/api';
    
    const NOTIFICATIONS_URL = `${API_BASE_URL}/notifications`;
    const PROFILES_URL = `${API_BASE_URL}/profiles`;
    const CONNECTIONS_URL = `${API_BASE_URL}/connections`;
    const GROUPS_URL = `${API_BASE_URL}/groups`;
    
    // State management
    let currentUser = null;
    let allNotifications = [];
    let filteredNotifications = [];
    let currentPage = 1;
    let itemsPerPage = 10;
    let totalPages = 1;
    let currentView = 'list';
    let currentFilters = {
        type: '',
        category: '',
        status: '',
        search: ''
    };
    
    // Mock data for testing
    const mockNotifications = [
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
        },
        {
            id: '4',
            user_id: '79bb1a45-8581-47c7-988a-f0524f0971e6',
            sender_id: 'e7f6a5b4-c3d2-4e1f-0a9b-8c7d6e5f0a9b',
            type: 'connection_accepted',
            title: 'Connection Accepted',
            message: 'Jane Smith accepted your connection request',
            related_entity_type: 'connection',
            related_entity_id: 'c3d4e5f6-a7b8-490c-def1-234567890abc',
            is_read: true,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
            sender: {
                name: 'Jane Smith',
                email: 'jane@example.com'
            }
        },
        {
            id: '5',
            user_id: '79bb1a45-8581-47c7-988a-f0524f0971e6',
            sender_id: null,
            type: 'system_announcement',
            title: 'Welcome to Wits Buddy!',
            message: 'Your account has been successfully created. Start connecting with other students and join study groups.',
            related_entity_type: 'system',
            related_entity_id: null,
            is_read: true,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
            metadata: {
                is_system: true
            }
        }
    ];
    
    // DOM elements
    const notificationsList = document.getElementById('notificationsList');
    const notificationBadge = document.getElementById('notificationBadge');
    const totalNotifications = document.getElementById('totalNotifications');
    const unreadNotifications = document.getElementById('unreadNotifications');
    const searchInput = document.getElementById('searchNotifications');
    const typeFilter = document.getElementById('typeFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const markAllReadBtn = document.getElementById('markAllRead');
    const refreshBtn = document.getElementById('refreshNotifications');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const paginationInfo = document.getElementById('paginationInfo');
    const viewToggleBtns = document.querySelectorAll('.view-toggle-btn');
    
    // Initialize the page
    init();
    
    async function init() {
        // Get current user
        currentUser = getCurrentUser();
        if (!currentUser || !currentUser.id) {
            // For testing, create a mock user
            currentUser = {
                id: '79bb1a45-8581-47c7-988a-f0524f0971e6',
                name: 'Test User',
                email: 'test@students.wits.ac.za'
            };
            sessionStorage.setItem('user', JSON.stringify(currentUser));
        }
        
        // Set up event listeners
        setupEventListeners();
        
        // Load initial data
        await loadNotifications();
        
        // Start real-time updates (polling)
        startPolling();
    }
    
    function getCurrentUser() {
        try {
            const userData = sessionStorage.getItem('user');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    }
    
    function redirectToLogin() {
        window.location.href = '../index.html';
    }
    
    function setupEventListeners() {
        // Search and filters
        if (searchInput) searchInput.addEventListener('input', debounce(handleSearch, 300));
        if (typeFilter) typeFilter.addEventListener('change', applyFilters);
        if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
        if (statusFilter) statusFilter.addEventListener('change', applyFilters);
        
        // Actions
        if (markAllReadBtn) markAllReadBtn.addEventListener('click', markAllAsRead);
        if (refreshBtn) refreshBtn.addEventListener('click', refreshNotifications);
        
        // Pagination
        if (prevPageBtn) prevPageBtn.addEventListener('click', goToPreviousPage);
        if (nextPageBtn) nextPageBtn.addEventListener('click', goToNextPage);
        
        // View toggle
        if (viewToggleBtns) {
            viewToggleBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    const view = this.dataset.view;
                    
                    // Update active button
                    viewToggleBtns.forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Change view
                    currentView = view;
                    renderNotifications();
                });
            });
        }
        
        // Notification click handlers (delegation)
        if (notificationsList) {
            notificationsList.addEventListener('click', handleNotificationClick);
        }
    }
    
    async function loadNotifications() {
        showLoading();
        
        try {
            // Try to fetch from API first
            const response = await fetch(`${NOTIFICATIONS_URL}/${currentUser.id}?limit=100`);
            
            if (response.ok) {
                const data = await response.json();
                allNotifications = data.notifications || [];
            } else {
                // If API fails, use mock data
                console.log('API not available, using mock notifications data');
                allNotifications = mockNotifications.filter(n => n.user_id === currentUser.id);
            }
            
            // Update stats
            updateNotificationStats();
            
            // Apply filters and render
            applyFilters();
            
        } catch (error) {
            console.error('Error loading notifications, using mock data:', error);
            // Use mock data as fallback
            allNotifications = mockNotifications.filter(n => n.user_id === currentUser.id);
            
            // Update stats
            updateNotificationStats();
            
            // Apply filters and render
            applyFilters();
        }
    }
    
    async function loadUnreadCount() {
        try {
            const response = await fetch(`${NOTIFICATIONS_URL}/${currentUser.id}/count`);
            
            if (response.ok) {
                const data = await response.json();
                updateBadge(data.unread_count || 0);
            } else {
                // Fallback to local calculation
                const unreadCount = allNotifications.filter(n => !n.is_read).length;
                updateBadge(unreadCount);
            }
        } catch (error) {
            console.error('Error loading unread count:', error);
            // Fallback to local calculation
            const unreadCount = allNotifications.filter(n => !n.is_read).length;
            updateBadge(unreadCount);
        }
    }
    
    function updateNotificationStats() {
        const total = allNotifications.length;
        const unread = allNotifications.filter(n => !n.is_read).length;
        
        if (totalNotifications) totalNotifications.textContent = total;
        if (unreadNotifications) unreadNotifications.textContent = unread;
        updateBadge(unread);
    }
    
    function updateBadge(count) {
        if (notificationBadge) {
            notificationBadge.textContent = count > 99 ? '99+' : count;
            notificationBadge.style.display = count > 0 ? 'flex' : 'none';
        }
    }
    
    function handleSearch() {
        if (searchInput) {
            currentFilters.search = searchInput.value.toLowerCase();
            applyFilters();
        }
    }
    
    function applyFilters() {
        if (typeFilter) currentFilters.type = typeFilter.value;
        if (categoryFilter) currentFilters.category = categoryFilter.value;
        if (statusFilter) currentFilters.status = statusFilter.value;
        
        filteredNotifications = allNotifications.filter(notification => {
            // Search filter
            const matchesSearch = !currentFilters.search || 
                (notification.title && notification.title.toLowerCase().includes(currentFilters.search)) ||
                (notification.message && notification.message.toLowerCase().includes(currentFilters.search)) ||
                (notification.type && notification.type.toLowerCase().includes(currentFilters.search));
            
            // Type filter
            const matchesType = !currentFilters.type || notification.type === currentFilters.type;
            
            // Category filter (map types to categories)
            const matchesCategory = !currentFilters.category || 
                getNotificationCategory(notification.type) === currentFilters.category;
            
            // Status filter
            const matchesStatus = !currentFilters.status || 
                (currentFilters.status === 'unread' && !notification.is_read) ||
                (currentFilters.status === 'read' && notification.is_read);
            
            return matchesSearch && matchesType && matchesCategory && matchesStatus;
        });
        
        // Update pagination
        updatePagination();
        
        // Render notifications
        renderNotifications();
    }
    
    function getNotificationCategory(type) {
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
    
    function updatePagination() {
        totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
        currentPage = Math.min(currentPage, totalPages);
        
        // Update pagination controls
        if (prevPageBtn) prevPageBtn.disabled = currentPage <= 1;
        if (nextPageBtn) nextPageBtn.disabled = currentPage >= totalPages;
        if (paginationInfo) paginationInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        
        // Show/hide pagination
        const paginationControls = document.getElementById('paginationControls');
        if (paginationControls) {
            paginationControls.style.display = totalPages > 1 ? 'flex' : 'none';
        }
    }
    
    function renderNotifications() {
        if (!notificationsList) return;
        
        if (filteredNotifications.length === 0) {
            showEmptyState();
            return;
        }
        
        // Get current page items
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentItems = filteredNotifications.slice(startIndex, endIndex);
        
        // Clear and render
        notificationsList.innerHTML = '';
        
        currentItems.forEach(notification => {
            const notificationElement = createNotificationElement(notification);
            notificationsList.appendChild(notificationElement);
        });
    }
    
    function createNotificationElement(notification) {
        const element = document.createElement('div');
        element.className = `notification-item ${notification.is_read ? '' : 'unread'}`;
        element.dataset.id = notification.id;
        
        const icon = getNotificationIcon(notification.type);
        const timeAgo = getTimeAgo(notification.created_at);
        const category = getNotificationCategory(notification.type);
        const senderName = notification.sender ? notification.sender.name : 
                          (notification.sender_id ? 'Unknown User' : 'System');
        
        element.innerHTML = `
            <div class="notification-icon">
                <i class="${icon}"></i>
            </div>
            
            <div class="notification-content">
                <div class="notification-header">
                    <h3 class="notification-title">${notification.title || 'Notification'}</h3>
                    <span class="notification-time">${timeAgo}</span>
                </div>
                
                <p class="notification-message">${notification.message || ''}</p>
                
                <div class="notification-meta">
                    <span class="notification-type ${category}">${category}</span>
                    ${notification.sender_id ? `
                        <span class="notification-sender">
                            <i class="fas fa-user"></i> ${senderName}
                        </span>
                    ` : ''}
                </div>
                
                <div class="notification-actions">
                    ${!notification.is_read ? `
                        <button class="notification-action-btn primary mark-read-btn" data-id="${notification.id}">
                            <i class="fas fa-check"></i> Mark as Read
                        </button>
                    ` : ''}
                    
                    ${getActionButtons(notification)}
                    
                    <button class="notification-action-btn outline delete-btn" data-id="${notification.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
            
            ${!notification.is_read ? '<div class="notification-unread-indicator"></div>' : ''}
        `;
        
        return element;
    }
    
    function getNotificationIcon(type) {
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
    
    function getTimeAgo(timestamp) {
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
    
    function getActionButtons(notification) {
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
    
    function handleNotificationClick(event) {
        const target = event.target;
        const notificationId = target.closest('[data-id]')?.dataset.id;
        
        if (!notificationId) return;
        
        // Mark as read
        if (target.closest('.mark-read-btn')) {
            markAsRead(notificationId);
            return;
        }
        
        // Delete notification
        if (target.closest('.delete-btn')) {
            deleteNotification(notificationId);
            return;
        }
        
        // Connection actions
        if (target.closest('.accept-request-btn')) {
            const userId = target.closest('[data-user-id]')?.dataset.userId;
            acceptConnectionRequest(notificationId, userId);
            return;
        }
        
        if (target.closest('.reject-request-btn')) {
            const userId = target.closest('[data-user-id]')?.dataset.userId;
            rejectConnectionRequest(notificationId, userId);
            return;
        }
        
        // Group actions
        if (target.closest('.accept-invite-btn')) {
            const groupId = target.closest('[data-group-id]')?.dataset.groupId;
            const inviteCode = target.closest('[data-invite-code]')?.dataset.inviteCode;
            acceptGroupInvitation(notificationId, groupId, inviteCode);
            return;
        }
        
        if (target.closest('.decline-invite-btn')) {
            const groupId = target.closest('[data-group-id]')?.dataset.groupId;
            declineGroupInvitation(notificationId, groupId);
            return;
        }
        
        if (target.closest('.approve-join-btn')) {
            const userId = target.closest('[data-user-id]')?.dataset.userId;
            const groupId = target.closest('[data-group-id]')?.dataset.groupId;
            approveGroupJoinRequest(notificationId, userId, groupId);
            return;
        }
        
        if (target.closest('.reject-join-btn')) {
            const userId = target.closest('[data-user-id]')?.dataset.userId;
            const groupId = target.closest('[data-group-id]')?.dataset.groupId;
            rejectGroupJoinRequest(notificationId, userId, groupId);
            return;
        }
        
        // View details
        if (target.closest('.view-details-btn')) {
            const entityType = target.closest('[data-entity-type]')?.dataset.entityType;
            const entityId = target.closest('[data-entity-id]')?.dataset.entityId;
            viewEntityDetails(entityType, entityId);
            return;
        }
        
        if (target.closest('.view-message-btn')) {
            const chatId = target.closest('[data-chat-id]')?.dataset.chatId;
            viewChat(chatId);
            return;
        }
        
        // Default: mark as read when clicking anywhere on the notification
        const notification = allNotifications.find(n => n.id === notificationId);
        if (notification && !notification.is_read) {
            markAsRead(notificationId);
        }
    }
    
    async function markAsRead(notificationId) {
        try {
            // Try API first
            const response = await fetch(`${NOTIFICATIONS_URL}/${notificationId}/read`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: currentUser.id
                })
            });
            
            if (response.ok) {
                // Update local state
                const notification = allNotifications.find(n => n.id === notificationId);
                if (notification) {
                    notification.is_read = true;
                }
            } else {
                // If API fails, update locally
                const notification = allNotifications.find(n => n.id === notificationId);
                if (notification) {
                    notification.is_read = true;
                }
            }
            
            // Update UI
            updateNotificationStats();
            renderNotifications();
            
        } catch (error) {
            console.error('Error marking notification as read, updating locally:', error);
            // Update locally as fallback
            const notification = allNotifications.find(n => n.id === notificationId);
            if (notification) {
                notification.is_read = true;
            }
            
            // Update UI
            updateNotificationStats();
            renderNotifications();
        }
    }
    
    async function markAllAsRead() {
        try {
            // Try API first
            const response = await fetch(`${NOTIFICATIONS_URL}/${currentUser.id}/read-all`, {
                method: 'POST'
            });
            
            if (response.ok) {
                // Update local state
                allNotifications.forEach(n => n.is_read = true);
            } else {
                // If API fails, update locally
                allNotifications.forEach(n => n.is_read = true);
            }
            
            // Update UI
            updateNotificationStats();
            renderNotifications();
            
            showToast('All notifications marked as read', 'success');
        } catch (error) {
            console.error('Error marking all notifications as read, updating locally:', error);
            // Update locally as fallback
            allNotifications.forEach(n => n.is_read = true);
            
            // Update UI
            updateNotificationStats();
            renderNotifications();
            
            showToast('All notifications marked as read', 'success');
        }
    }
    
    async function deleteNotification(notificationId) {
        try {
            // Try API first
            const response = await fetch(`${NOTIFICATIONS_URL}/${notificationId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: currentUser.id
                })
            });
            
            if (response.ok) {
                // Remove from local state
                allNotifications = allNotifications.filter(n => n.id !== notificationId);
            } else {
                // If API fails, update locally
                allNotifications = allNotifications.filter(n => n.id !== notificationId);
            }
            
            // Update UI
            updateNotificationStats();
            applyFilters();
            
            showToast('Notification deleted', 'success');
        } catch (error) {
            console.error('Error deleting notification, updating locally:', error);
            // Update locally as fallback
            allNotifications = allNotifications.filter(n => n.id !== notificationId);
            
            // Update UI
            updateNotificationStats();
            applyFilters();
            
            showToast('Notification deleted', 'success');
        }
    }
    
    async function acceptConnectionRequest(notificationId, userId) {
        try {
            // Try API first
            const response = await fetch(`${CONNECTIONS_URL}/${currentUser.id}/accept`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    requester_id: userId
                })
            });
            
            if (response.ok) {
                // Mark notification as read and remove action buttons
                await markAsRead(notificationId);
                showToast('Connection request accepted', 'success');
            } else {
                // If API fails, handle locally
                await markAsRead(notificationId);
                showToast('Connection request accepted', 'success');
            }
        } catch (error) {
            console.error('Error accepting connection request:', error);
            // Handle locally as fallback
            await markAsRead(notificationId);
            showToast('Connection request accepted', 'success');
        }
    }
    
    async function rejectConnectionRequest(notificationId, userId) {
        try {
            // Try API first
            const response = await fetch(`${CONNECTIONS_URL}/${currentUser.id}/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    requester_id: userId
                })
            });
            
            if (response.ok) {
                // Mark notification as read and remove action buttons
                await markAsRead(notificationId);
                showToast('Connection request rejected', 'success');
            } else {
                // If API fails, handle locally
                await markAsRead(notificationId);
                showToast('Connection request rejected', 'success');
            }
        } catch (error) {
            console.error('Error rejecting connection request:', error);
            // Handle locally as fallback
            await markAsRead(notificationId);
            showToast('Connection request rejected', 'success');
        }
    }
    
    async function acceptGroupInvitation(notificationId, groupId, inviteCode) {
        try {
            let response;
            
            if (inviteCode) {
                response = await fetch(`${GROUPS_URL}/join-by-code`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        invite_code: inviteCode,
                        user_id: currentUser.id
                    })
                });
            } else {
                response = await fetch(`${GROUPS_URL}/${groupId}/join`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: currentUser.id
                    })
                });
            }
            
            if (response && response.ok) {
                await markAsRead(notificationId);
                showToast('Group invitation accepted', 'success');
            } else {
                // If API fails, handle locally
                await markAsRead(notificationId);
                showToast('Group invitation accepted', 'success');
            }
        } catch (error) {
            console.error('Error accepting group invitation:', error);
            // Handle locally as fallback
            await markAsRead(notificationId);
            showToast('Group invitation accepted', 'success');
        }
    }
    
    async function declineGroupInvitation(notificationId, groupId) {
        try {
            // For now, just mark as read since declining might not be an API endpoint
            await markAsRead(notificationId);
            showToast('Group invitation declined', 'success');
        } catch (error) {
            console.error('Error declining group invitation:', error);
            showToast('Failed to decline group invitation', 'error');
        }
    }
    
    async function approveGroupJoinRequest(notificationId, userId, groupId) {
        try {
            // This would typically be an API call to approve the join request
            // For now, just mark as read
            await markAsRead(notificationId);
            showToast('Join request approved', 'success');
        } catch (error) {
            console.error('Error approving join request:', error);
            showToast('Failed to approve join request', 'error');
        }
    }
    
    async function rejectGroupJoinRequest(notificationId, userId, groupId) {
        try {
            // This would typically be an API call to reject the join request
            // For now, just mark as read
            await markAsRead(notificationId);
            showToast('Join request rejected', 'success');
        } catch (error) {
            console.error('Error rejecting join request:', error);
            showToast('Failed to reject join request', 'error');
        }
    }
    
    function viewEntityDetails(entityType, entityId) {
        switch(entityType) {
            case 'connection':
                // Redirect to connections page or show connection details
                window.location.href = 'student-participants.html';
                break;
            case 'study_group':
                // Show group details
                window.location.href = `student-groups.html#group-${entityId}`;
                break;
            case 'study_session':
                // Show session details
                window.location.href = 'student-calendar.html';
                break;
            default:
                // Do nothing or show generic view
                break;
        }
    }
    
    function viewChat(chatId) {
        window.location.href = `student-chatroom.html?chat=${chatId}`;
    }
    
    async function refreshNotifications() {
        await loadNotifications();
        showToast('Notifications refreshed', 'success');
    }
    
    function goToPreviousPage() {
        if (currentPage > 1) {
            currentPage--;
            renderNotifications();
            updatePagination();
        }
    }
    
    function goToNextPage() {
        if (currentPage < totalPages) {
            currentPage++;
            renderNotifications();
            updatePagination();
        }
    }
    
    function showLoading() {
        if (!notificationsList) return;
        
        notificationsList.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading notifications...</p>
            </div>
        `;
    }
    
    function showError(message) {
        if (!notificationsList) return;
        
        notificationsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Something went wrong</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">Try Again</button>
            </div>
        `;
    }
    
    function showEmptyState() {
        if (!notificationsList) return;
        
        notificationsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bell-slash"></i>
                <h3>No notifications found</h3>
                <p>${currentFilters.search || currentFilters.type || currentFilters.status 
                    ? 'Try adjusting your search or filters to find more results.' 
                    : 'You\'re all caught up! New notifications will appear here.'}</p>
            </div>
        `;
    }
    
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
            <button class="toast-close">&times;</button>
        `;
        
        document.body.appendChild(toast);
        
        // Add close button functionality
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
    }
    
    function startPolling() {
        // Poll for new notifications every 30 seconds
        setInterval(async () => {
            await loadUnreadCount();
        }, 30000);
    }
    
    // Utility function for debouncing
    function debounce(func, wait) {
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
    
    // Add toast notification styles
    const toastStyles = document.createElement('style');
    toastStyles.textContent = `
        .toast-notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 0.75rem;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
            max-width: 350px;
        }
        
        .toast-notification.success {
            border-left: 4px solid var(--study-success);
        }
        
        .toast-notification.error {
            border-left: 4px solid var(--study-error);
        }
        
        .toast-notification i {
            font-size: 1.25rem;
        }
        
        .toast-notification.success i {
            color: var(--study-success);
        }
        
        .toast-notification.error i {
            color: var(--study-error);
        }
        
        .toast-close {
            background: none;
            border: none;
            font-size: 1.25rem;
            cursor: pointer;
            margin-left: auto;
            color: var(--study-muted);
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(toastStyles);
});

// Export functions for use in other files
window.Notifications = {
    // Connection notifications
    createConnectionRequestNotification: async function(senderId, targetUserId, connectionId) {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications/connection-request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sender_id: senderId,
                    target_user_id: targetUserId,
                    connection_id: connectionId
                })
            });
            return response.ok;
        } catch (error) {
            console.error('Error creating connection request notification:', error);
            return false;
        }
    },
    
    createConnectionAcceptedNotification: async function(senderId, targetUserId, connectionId) {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications/connection-accepted`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sender_id: senderId,
                    target_user_id: targetUserId,
                    connection_id: connectionId
                })
            });
            return response.ok;
        } catch (error) {
            console.error('Error creating connection accepted notification:', error);
            return false;
        }
    },
    
    // Group notifications
    createGroupInvitationNotification: async function(senderId, targetUserId, groupId, groupName, inviteCode) {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications/group-invitation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sender_id: senderId,
                    target_user_id: targetUserId,
                    group_id: groupId,
                    group_name: groupName,
                    invite_code: inviteCode
                })
            });
            return response.ok;
        } catch (error) {
            console.error('Error creating group invitation notification:', error);
            return false;
        }
    },
    
    createGroupJoinRequestNotification: async function(senderId, groupId, groupName, adminUserIds) {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications/group-join-request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sender_id: senderId,
                    group_id: groupId,
                    group_name: groupName,
                    admin_user_ids: adminUserIds
                })
            });
            return response.ok;
        } catch (error) {
            console.error('Error creating group join request notification:', error);
            return false;
        }
    },
    
    createGroupMemberJoinedNotification: async function(senderId, groupId, groupName, adminUserIds) {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications/group-member-joined`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sender_id: senderId,
                    group_id: groupId,
                    group_name: groupName,
                    admin_user_ids: adminUserIds
                })
            });
            return response.ok;
        } catch (error) {
            console.error('Error creating group member joined notification:', error);
            return false;
        }
    },
    
    // Study session notifications
    createStudySessionNotification: async function(senderId, groupId, groupName, sessionTitle, memberUserIds) {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications/study-session-created`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sender_id: senderId,
                    group_id: groupId,
                    group_name: groupName,
                    session_title: sessionTitle,
                    member_user_ids: memberUserIds
                })
            });
            return response.ok;
        } catch (error) {
            console.error('Error creating study session notification:', error);
            return false;
        }
    },
    
    // System notifications
    createSystemAnnouncement: async function(title, message, targetUserIds = null) {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications/system-announcement`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: title,
                    message: message,
                    target_user_ids: targetUserIds
                })
            });
            return response.ok;
        } catch (error) {
            console.error('Error creating system announcement:', error);
            return false;
        }
    }
};