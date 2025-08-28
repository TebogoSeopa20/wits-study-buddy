// profile-view.js - Fixed for correct API structure
document.addEventListener('DOMContentLoaded', function() {
    // API configuration
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_BASE_URL = isLocal 
        ? 'http://localhost:3000/api' 
        : 'https://wits-buddy-g9esajarfqe3dmh6.southafricanorth-01.azurewebsites.net/api';
    
    const PROFILES_URL = `${API_BASE_URL}/profiles`;
    const CONNECTIONS_URL = `${API_BASE_URL}/connections`;
    const GROUPS_URL = `${API_BASE_URL}/groups`;
    
    let currentUser = null;
    let userConnections = {};
    let userGroups = [];
    let profileToView = null;
    
    // Initialize the page
    init();
    
    function init() {
        // Get current user from session storage
        currentUser = getCurrentUser();
        if (!currentUser || !currentUser.id) {
            showErrorState('Please log in to view profiles');
            return;
        }
        
        // Get profile ID to view from session storage
        const profileId = sessionStorage.getItem('viewProfileId');
        if (!profileId) {
            showErrorState('No profile selected to view');
            return;
        }
        
        loadUserConnections().then(() => {
            loadUserGroups().then(() => {
                loadProfile(profileId);
            });
        });
    }
    
    function getCurrentUser() {
        try {
            const userData = sessionStorage.getItem('user');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error parsing user data from session storage:', error);
            return null;
        }
    }
    
    async function loadUserConnections() {
        try {
            const response = await fetch(`${CONNECTIONS_URL}/${currentUser.id}`);
            
            if (!response.ok) {
                // If no connections exist yet, return empty array
                if (response.status === 404) {
                    userConnections = { connected_users: [] };
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            userConnections = data;
        } catch (error) {
            console.error('Error fetching user connections:', error);
            userConnections = { connected_users: [] };
        }
    }
    
    async function loadUserGroups() {
        try {
            const response = await fetch(`${GROUPS_URL}/user/${currentUser.id}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    userGroups = [];
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            userGroups = data.groups || [];
        } catch (error) {
            console.error('Error fetching user groups:', error);
            userGroups = [];
        }
    }
    
    function getConnectionStatus(targetUserId) {
        if (!userConnections.connected_users) return 'none';
        
        const connection = userConnections.connected_users.find(
            conn => conn.user_id === targetUserId
        );
        
        if (!connection) return 'none';
        
        if (connection.status === 'accepted') return 'accepted';
        if (connection.status === 'pending') {
            // Check if this is a sent or received request
            // For simplicity, we'll assume pending means sent request
            return 'pending_sent';
        }
        if (connection.status === 'pending_approval') {
            return 'pending_received';
        }
        
        return 'none';
    }
    
    async function loadProfile(profileId) {
        showLoadingState();
        
        try {
            console.log(`Loading profile with ID: ${profileId}`);
            const response = await fetch(`${PROFILES_URL}/${profileId}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    showErrorState('Profile not found');
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            profileToView = data;
            
            console.log('Profile loaded:', profileToView);
            
            // Update the header with the user's real name
            const profileUserName = document.getElementById('profileUserName');
            if (profileUserName && profileToView.name) {
                profileUserName.textContent = profileToView.name + "'s Profile";
            }
            
            displayProfile();
        } catch (error) {
            console.error('Error fetching profile:', error);
            showErrorState('Failed to load profile. Please try again later.');
        }
    }
    
    function displayProfile() {
        const profileViewContent = document.getElementById('profileViewContent');
        if (!profileViewContent || !profileToView) return;
        
        const connectionStatus = getConnectionStatus(profileToView.user_id || profileToView.id);
        const initials = getInitials(profileToView.name || '');
        
        profileViewContent.innerHTML = `
            <div class="profile-detail-view">
                <div class="profile-sidebar">
                    <div class="profile-avatar-large">${initials}</div>
                    <h2 class="profile-name-large">${profileToView.name || 'No Name'}</h2>
                    <span class="profile-role-large ${profileToView.role || 'student'}">${profileToView.role || 'student'}</span>
                    
                    <div class="connection-status">
                        ${renderConnectionStatus(connectionStatus)}
                    </div>
                    
                    <div class="profile-actions">
                        ${renderConnectionActions(connectionStatus, profileToView.user_id || profileToView.id)}
                    </div>
                </div>
                
                <div class="profile-main">
                    <div class="profile-section">
                        <h3><i class="fas fa-info-circle"></i> Basic Information</h3>
                        <div class="detail-grid">
                            <div class="detail-item-full">
                                <div class="detail-label-full">Email</div>
                                <div class="detail-value-full">${profileToView.email || 'Not specified'}</div>
                            </div>
                            ${profileToView.phone ? `
                            <div class="detail-item-full">
                                <div class="detail-label-full">Phone</div>
                                <div class="detail-value-full">${profileToView.phone}</div>
                            </div>
                            ` : ''}
                            <div class="detail-item-full">
                                <div class="detail-label-full">Faculty</div>
                                <div class="detail-value-full">${profileToView.faculty || 'Not specified'}</div>
                            </div>
                            <div class="detail-item-full">
                                <div class="detail-label-full">Course</div>
                                <div class="detail-value-full">${profileToView.course || 'Not specified'}</div>
                            </div>
                            <div class="detail-item-full">
                                <div class="detail-label-full">Year of Study</div>
                                <div class="detail-value-full">${profileToView.year_of_study || 'Not specified'}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="profile-section">
                        <h3><i class="fas fa-link"></i> Connections</h3>
                        <div class="connections-list">
                            ${renderConnectionsSection()}
                        </div>
                    </div>
                    
                    <div class="profile-section">
                        <h3><i class="fas fa-users"></i> Study Groups</h3>
                        <div class="groups-list">
                            ${renderGroupsSection()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    function renderConnectionsSection() {
        if (!userConnections.connected_users || userConnections.connected_users.length === 0) {
            return '<p class="no-data">No connections found.</p>';
        }
        
        // Count accepted connections
        const acceptedConnections = userConnections.connected_users.filter(
            conn => conn.status === 'accepted'
        ).length;
        
        return `
            <div class="connections-stats">
                <div class="stat-item">
                    <span class="stat-number">${acceptedConnections}</span>
                    <span class="stat-label">Connections</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${userConnections.connected_users.filter(conn => conn.status === 'pending' || conn.status === 'pending_approval').length}</span>
                    <span class="stat-label">Pending</span>
                </div>
            </div>
        `;
    }
    
    function renderGroupsSection() {
        if (userGroups.length === 0) {
            return '<p class="no-data">Not a member of any study groups.</p>';
        }
        
        return `
            <div class="groups-stats">
                <div class="stat-item">
                    <span class="stat-number">${userGroups.length}</span>
                    <span class="stat-label">Study Groups</span>
                </div>
            </div>
            <div class="groups-grid">
                ${userGroups.slice(0, 3).map(group => `
                    <div class="group-card">
                        <h4 class="group-name">${group.group_name || 'Unnamed Group'}</h4>
                        <p class="group-subject">${group.subject || 'No subject'}</p>
                        <p class="group-members">${group.member_count || 0} members</p>
                    </div>
                `).join('')}
            </div>
            ${userGroups.length > 3 ? `<p class="view-more">+ ${userGroups.length - 3} more groups</p>` : ''}
        `;
    }
    
    function renderConnectionStatus(status) {
        switch(status) {
            case 'accepted':
                return '<span class="connection-status-badge connected"><i class="fas fa-check-circle"></i> Connected</span>';
            case 'pending_sent':
                return '<span class="connection-status-badge pending"><i class="fas fa-clock"></i> Request Sent</span>';
            case 'pending_received':
                return '<span class="connection-status-badge pending"><i class="fas fa-clock"></i> Request Pending</span>';
            default:
                return '<span class="connection-status-badge not-connected"><i class="fas fa-user-plus"></i> Not Connected</span>';
        }
    }
    
    function renderConnectionActions(status, profileId) {
        let buttons = '';
        
        switch(status) {
            case 'accepted':
                buttons = `
                    <button class="action-btn primary" onclick="messageUser('${profileId}')">
                        <i class="fas fa-comment"></i> Message
                    </button>
                    <button class="action-btn outline" onclick="disconnect('${profileId}')">
                        <i class="fas fa-user-times"></i> Disconnect
                    </button>
                `;
                break;
            case 'pending_sent':
                buttons = `
                    <button class="action-btn outline" onclick="cancelRequest('${profileId}')">
                        <i class="fas fa-ban"></i> Cancel Request
                    </button>
                `;
                break;
            case 'pending_received':
                buttons = `
                    <button class="action-btn primary" onclick="acceptRequest('${profileId}')">
                        <i class="fas fa-check"></i> Accept Request
                    </button>
                    <button class="action-btn outline" onclick="rejectRequest('${profileId}')">
                        <i class="fas fa-times"></i> Reject Request
                    </button>
                `;
                break;
            default:
                buttons = `
                    <button class="action-btn primary" onclick="connectWith('${profileId}')">
                        <i class="fas fa-user-plus"></i> Connect
                    </button>
                `;
        }
        
        return buttons;
    }
    
    function getInitials(name) {
        if (!name) return 'NN';
        
        return name
            .split(' ')
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }
    
    function showLoadingState() {
        const profileViewContent = document.getElementById('profileViewContent');
        if (profileViewContent) {
            profileViewContent.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>Loading profile...</p>
                </div>
            `;
        }
    }
    
    function showErrorState(message) {
        const profileViewContent = document.getElementById('profileViewContent');
        if (profileViewContent) {
            profileViewContent.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Something went wrong</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="goBack()">Go Back</button>
                </div>
            `;
        }
    }
    
    // Global functions for connection actions
    window.connectWith = async function(profileId) {
        try {
            const response = await fetch(`${CONNECTIONS_URL}/${currentUser.id}/send-request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    target_user_id: profileId
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            showNotification(`Connection request sent to ${getProfileName(profileId)}`, 'success');
            
            // Reload connections and refresh UI
            await loadUserConnections();
            displayProfile();
        } catch (error) {
            console.error('Error sending connection request:', error);
            showNotification('Failed to send connection request', 'error');
        }
    };
    
    window.cancelRequest = async function(profileId) {
        try {
            const response = await fetch(`${CONNECTIONS_URL}/${currentUser.id}/remove`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    connection_id: profileId
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            showNotification(`Connection request cancelled`, 'success');
            
            // Reload connections and refresh UI
            await loadUserConnections();
            displayProfile();
        } catch (error) {
            console.error('Error cancelling connection request:', error);
            showNotification('Failed to cancel connection request', 'error');
        }
    };
    
    window.acceptRequest = async function(profileId) {
        try {
            const response = await fetch(`${CONNECTIONS_URL}/${currentUser.id}/accept`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    requester_id: profileId
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            showNotification(`Connection request accepted`, 'success');
            
            // Reload connections and refresh UI
            await loadUserConnections();
            displayProfile();
        } catch (error) {
            console.error('Error accepting connection request:', error);
            showNotification('Failed to accept connection request', 'error');
        }
    };
    
    window.rejectRequest = async function(profileId) {
        try {
            const response = await fetch(`${CONNECTIONS_URL}/${currentUser.id}/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    requester_id: profileId
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            showNotification(`Connection request rejected`, 'success');
            
            // Reload connections and refresh UI
            await loadUserConnections();
            displayProfile();
        } catch (error) {
            console.error('Error rejecting connection request:', error);
            showNotification('Failed to reject connection request', 'error');
        }
    };
    
    window.disconnect = async function(profileId) {
        if (!confirm('Are you sure you want to disconnect from this user?')) return;
        
        try {
            const response = await fetch(`${CONNECTIONS_URL}/${currentUser.id}/remove`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    connection_id: profileId
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            showNotification(`Disconnected successfully`, 'success');
            
            // Reload connections and refresh UI
            await loadUserConnections();
            displayProfile();
        } catch (error) {
            console.error('Error disconnecting:', error);
            showNotification('Failed to disconnect', 'error');
        }
    };
    
    window.messageUser = function(profileId) {
        // Redirect to chat with this user
        window.location.href = `student-chatroom.html?user=${profileId}`;
    };
    
    window.goBack = function() {
        window.history.back();
    };
    
    function getProfileName(profileId) {
        return profileToView && profileToView.name ? profileToView.name : 'this user';
    }
    
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
});

    // Debug function to check API responses
    async function debugApiCall(url) {
        try {
            console.log(`Making API call to: ${url}`);
            const response = await fetch(url);
            console.log(`Response status: ${response.status}`);
            
            if (!response.ok) {
                console.error(`API error: ${response.status} ${response.statusText}`);
                return null;
            }
            
            const data = await response.json();
            console.log('API response:', data);
            return data;
        } catch (error) {
            console.error('API call failed:', error);
            return null;
        }
    }