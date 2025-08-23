// participants.js - Enhanced with Connection Management
document.addEventListener('DOMContentLoaded', function() {
    // API configuration
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_BASE_URL = isLocal 
        ? 'http://localhost:3000/api' 
        : 'https://wits-buddy-g9esajarfqe3dmh6.southafricanorth-01.azurewebsites.net/api';
    
    const PROFILES_URL = `${API_BASE_URL}/profiles`;
    const CONNECTIONS_URL = `${API_BASE_URL}/connections`;
    
    // Faculty and courses data
    const facultyCourses = {
        'Faculty of Commerce, Law & Management': [
            'Bachelor of Commerce (BCom) - Accounting',
            'Bachelor of Commerce (BCom) - Economics',
            'Bachelor of Commerce (BCom) - Information Systems',
            'Bachelor of Commerce (BCom) - PPE (Politics, Philosophy & Economics)',
            'Bachelor of Commerce (BCom) - Finance & Management',
            'Bachelor of Commerce (BCom) - Insurance & Risk Management',
            'Bachelor of Commerce (BCom) - Human Resource Management & Management',
            'Bachelor of Commerce (BCom) - Marketing & Management',
            'Bachelor of Accounting Science (BAccSc)',
            'Bachelor of Economic Science (BEconSc)',
            'Bachelor of Laws (LLB)'
        ],
        'Faculty of Engineering & the Built Environment': [
            'Bachelor of Science in Engineering (BSc Eng) - Civil Engineering',
            'Bachelor of Science in Engineering (BSc Eng) - Electrical Engineering',
            'Bachelor of Science in Engineering (BSc Eng) - Mechanical Engineering',
            'Bachelor of Science in Engineering (BSc Eng) - Industrial Engineering',
            'Bachelor of Science in Engineering (BSc Eng) - Aeronautical Engineering',
            'Bachelor of Science in Engineering (BSc Eng) - Chemical Engineering',
            'Bachelor of Science in Engineering (BSc Eng) - Metallurgical Engineering',
            'Bachelor of Science in Engineering (BSc Eng) - Mining Engineering',
            'Bachelor of Engineering Science in Digital Arts (BEngSc)',
            'Bachelor of Engineering Science in Biomedical Engineering (BEngSc (BME))',
            'Bachelor of Architectural Studies (BAS)',
            'Bachelor of Science in Construction Studies (BSc (CS))',
            'Bachelor of Science in Property Studies (BSc (PS))',
            'Bachelor of Science in Urban & Regional Planning (BSc (URP))'
        ],
        'Faculty of Health Sciences': [
            'Bachelor of Health Sciences (BHSc) - Biomedical Sciences',
            'Bachelor of Health Sciences (BHSc) - Biokinetics',
            'Bachelor of Health Sciences (BHSc) - Health Systems Sciences',
            'Bachelor of Clinical Medical Practice (BCMP)',
            'Bachelor of Dental Science (BDS)',
            'Bachelor of Oral Health Sciences (BOHSc)',
            'Bachelor of Medicine & Surgery (MBBCh)',
            'Bachelor of Nursing (BNurs)',
            'Bachelor of Science in Occupational Therapy (BSc (OT))',
            'Bachelor of Pharmacy (BPharm)',
            'Bachelor of Science in Physiotherapy (BSc (Physiotherapy))'
        ],
        'Faculty of Humanities': [
            'Bachelor of Arts (BA) - African Literature',
            'Bachelor of Arts (BA) - Anthropology',
            'Bachelor of Arts (BA) - Archaeology',
            'Bachelor of Arts (BA) - History',
            'Bachelor of Arts (BA) - English',
            'Bachelor of Arts (BA) - Geography',
            'Bachelor of Arts (BA) - International Relations',
            'Bachelor of Arts (BA) - Media Studies',
            'Bachelor of Arts (BA) - Modern Languages (French)',
            'Bachelor of Arts (BA) - Modern Languages (German)',
            'Bachelor of Arts (BA) - Modern Languages (Spanish)',
            'Bachelor of Arts (BA) - Philosophy',
            'Bachelor of Arts (BA) - Political Studies',
            'Bachelor of Arts (BA) - Psychology',
            'Bachelor of Arts (BA) - Sociology',
            'BA in Digital Arts (4-year specialized degree)',
            'BA Film & Television (BAFT)',
            'Bachelor of Social Work (B Social Work)',
            'Bachelor of Education: Intermediate Phase',
            'Bachelor of Education: Senior Phase & FET Teaching',
            'Bachelor of Speech-Language Pathology',
            'Bachelor of Audiology'
        ],
        'Faculty of Science': [
            'Bachelor of Science (BSc) - Actuarial Science',
            'Bachelor of Science (BSc) - Applied & Computational Mathematics',
            'Bachelor of Science (BSc) - Astronomy & Astrophysics',
            'Bachelor of Science (BSc) - Biochemistry & Cell Biology',
            'Bachelor of Science (BSc) - Biological/Biodiversity & Conservation Biology',
            'Bachelor of Science (BSc) - Chemistry',
            'Bachelor of Science (BSc) - Computer Science',
            'Bachelor of Science (BSc) - Ecology & Conservation',
            'Bachelor of Science (BSc) - Genetics',
            'Bachelor of Science (BSc) - Geology',
            'Bachelor of Science (BSc) - Geography & Archaeological Sciences',
            'Bachelor of Science (BSc) - Geospatial Science',
            'Bachelor of Science (BSc) - Mathematical Sciences & Mathematics of Finance',
            'Bachelor of Science (BSc) - Microbiology',
            'Bachelor of Science (BSc) - Molecular and Cell Biology',
            'Bachelor of Science (BSc) - Physics',
            'Bachelor of Science (BSc) - Physiology',
            'Bachelor of Science (BSc) - Statistics',
            'Bachelor of Science (BSc) - Zoology'
        ]
    };
    
    // Year options
    const yearOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', '6th Year'];
    
    // DOM elements with correct IDs from your HTML
    const participantsGrid = document.getElementById('participantsGrid');
    const searchInput = document.getElementById('searchInput');
    const roleFilter = document.getElementById('roleFilter');
    const facultyFilter = document.getElementById('facultyFilter');
    
    let allProfiles = [];
    let filteredProfiles = [];
    let currentUser = null;
    let userConnections = {};
    
    // Check if essential elements exist before initializing
    if (!participantsGrid) {
        console.error('Participants grid element not found');
        return;
    }
    
    // Initialize the page
    init();
    
    function init() {
        // Get current user from session storage
        currentUser = getCurrentUser();
        if (!currentUser || !currentUser.id) {
            showErrorState('Please log in to view participants');
            return;
        }
        
        loadUserConnections().then(() => {
            loadParticipants();
            setupEventListeners();
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
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            userConnections = data;
        } catch (error) {
            console.error('Error fetching user connections:', error);
            userConnections = { connected_users: [] };
        }
    }
    
    function getConnectionStatus(targetUserId) {
        if (!userConnections.connected_users) return 'none';
        
        const connection = userConnections.connected_users.find(
            conn => conn.user_id === targetUserId
        );
        
        return connection ? connection.status : 'none';
    }
    
    function setupEventListeners() {
        // Search functionality
        if (searchInput) {
            searchInput.addEventListener('input', debounce(handleSearch, 300));
        }
        
        // Filter functionality - only add listeners if elements exist
        if (roleFilter) roleFilter.addEventListener('change', applyFilters);
        if (facultyFilter) {
            facultyFilter.addEventListener('change', function() {
                updateCourseFilter();
                applyFilters();
            });
        }
    }
    
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
    
    async function loadParticipants() {
        showLoadingState();
        
        try {
            const response = await fetch(PROFILES_URL);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            allProfiles = data;
            
            // Filter out the current user from the list
            allProfiles = allProfiles.filter(profile => {
                // Compare by user_id (from profiles table) or id (from auth)
                return profile.user_id !== currentUser.id && profile.id !== currentUser.id;
            });
            
            filteredProfiles = [...allProfiles];
            
            populateFilterOptions();
            displayParticipants();
        } catch (error) {
            console.error('Error fetching participants:', error);
            showErrorState('Failed to load participants. Please try again later.');
        }
    }
    
    function populateFilterOptions() {
        // Add year filter if it doesn't exist
        addYearFilter();
        
        // Add course filter if it doesn't exist
        addCourseFilter();
        
        // Add connection status filter
        addConnectionStatusFilter();
    }
    
    function addYearFilter() {
        const filterControls = document.querySelector('.filter-controls');
        if (!filterControls) return;
        
        // Add year filter if it doesn't exist
        if (!document.getElementById('yearFilter')) {
            const yearFilter = document.createElement('select');
            yearFilter.id = 'yearFilter';
            yearFilter.className = 'filter-select';
            yearFilter.innerHTML = '<option value="">All Years</option>';
            
            yearOptions.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearFilter.appendChild(option);
            });
            
            filterControls.appendChild(yearFilter);
            yearFilter.addEventListener('change', applyFilters);
        }
    }
    
    function addCourseFilter() {
        const filterControls = document.querySelector('.filter-controls');
        if (!filterControls) return;
        
        // Add course filter if it doesn't exist
        if (!document.getElementById('courseFilter')) {
            const courseFilter = document.createElement('select');
            courseFilter.id = 'courseFilter';
            courseFilter.className = 'filter-select';
            courseFilter.innerHTML = '<option value="">All Courses</option>';
            courseFilter.disabled = true;
            
            filterControls.appendChild(courseFilter);
            courseFilter.addEventListener('change', applyFilters);
        }
    }
    
    function addConnectionStatusFilter() {
        const filterControls = document.querySelector('.filter-controls');
        if (!filterControls) return;
        
        // Add connection status filter if it doesn't exist
        if (!document.getElementById('connectionFilter')) {
            const connectionFilter = document.createElement('select');
            connectionFilter.id = 'connectionFilter';
            connectionFilter.className = 'filter-select';
            connectionFilter.innerHTML = `
                <option value="">All Connections</option>
                <option value="none">Not Connected</option>
                <option value="pending">Pending Requests</option>
                <option value="accepted">Connected</option>
                <option value="blocked">Blocked</option>
            `;
            
            filterControls.appendChild(connectionFilter);
            connectionFilter.addEventListener('change', applyFilters);
        }
    }
    
    function updateCourseFilter() {
        const courseFilter = document.getElementById('courseFilter');
        if (!courseFilter) return;
        
        const selectedFaculty = facultyFilter.value;
        
        // Clear existing options
        courseFilter.innerHTML = '<option value="">All Courses</option>';
        
        // Enable/disable based on faculty selection
        if (selectedFaculty) {
            courseFilter.disabled = false;
            
            // Add courses for the selected faculty
            if (facultyCourses[selectedFaculty]) {
                facultyCourses[selectedFaculty].forEach(course => {
                    const option = document.createElement('option');
                    option.value = course;
                    option.textContent = course.length > 40 ? course.substring(0, 40) + '...' : course;
                    courseFilter.appendChild(option);
                });
            }
        } else {
            courseFilter.disabled = true;
        }
    }
    
    function handleSearch() {
        applyFilters();
    }
    
    function applyFilters() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const selectedRole = roleFilter ? roleFilter.value : '';
        const selectedFaculty = facultyFilter ? facultyFilter.value : '';
        
        // Get dynamic filters if they exist
        const courseFilter = document.getElementById('courseFilter');
        const yearFilter = document.getElementById('yearFilter');
        const connectionFilter = document.getElementById('connectionFilter');
        const selectedCourse = courseFilter ? courseFilter.value : '';
        const selectedYear = yearFilter ? yearFilter.value : '';
        const selectedConnection = connectionFilter ? connectionFilter.value : '';
        
        filteredProfiles = allProfiles.filter(profile => {
            // Search filter
            const matchesSearch = 
                !searchTerm || 
                (profile.name && profile.name.toLowerCase().includes(searchTerm)) ||
                (profile.email && profile.email.toLowerCase().includes(searchTerm)) ||
                (profile.course && profile.course.toLowerCase().includes(searchTerm)) ||
                (profile.faculty && profile.faculty.toLowerCase().includes(searchTerm));
            
            // Role filter
            const matchesRole = !selectedRole || profile.role === selectedRole;
            
            // Faculty filter
            const matchesFaculty = !selectedFaculty || profile.faculty === selectedFaculty;
            
            // Course filter
            const matchesCourse = !selectedCourse || profile.course === selectedCourse;
            
            // Year filter
            const matchesYear = !selectedYear || profile.year_of_study === selectedYear;
            
            // Connection status filter
            const connectionStatus = getConnectionStatus(profile.user_id || profile.id);
            const matchesConnection = !selectedConnection || connectionStatus === selectedConnection;
            
            return matchesSearch && matchesRole && matchesFaculty && matchesCourse && matchesYear && matchesConnection;
        });
        
        displayParticipants();
    }
    
    function displayParticipants() {
        participantsGrid.innerHTML = '';
        
        if (filteredProfiles.length === 0) {
            showEmptyState();
            return;
        }
        
        filteredProfiles.forEach(profile => {
            const participantCard = createParticipantCard(profile);
            participantsGrid.appendChild(participantCard);
        });
    }
    
    function createParticipantCard(profile) {
        const card = document.createElement('article');
        card.className = 'participant-card';
        
        // Get initials for avatar
        const initials = getInitials(profile.name || '');
        const profileId = profile.user_id || profile.id;
        const connectionStatus = getConnectionStatus(profileId);
        
        card.innerHTML = `
            <div class="participant-header">
                <div class="participant-avatar">${initials}</div>
                <h3 class="participant-name">${profile.name || 'No Name'}</h3>
                <span class="participant-role ${profile.role || 'student'}">${profile.role || 'student'}</span>
                ${connectionStatus === 'accepted' ? '<div class="online-status" title="Connected"></div>' : ''}
            </div>
            <div class="participant-details">
                <div class="detail-item">
                    <div class="detail-icon"><i class="fas fa-envelope"></i></div>
                    <div class="detail-content">
                        <div class="detail-label">Email</div>
                        <div class="detail-value">${profile.email || 'No email'}</div>
                    </div>
                </div>
                <div class="detail-item">
                    <div class="detail-icon"><i class="fas fa-graduation-cap"></i></div>
                    <div class="detail-content">
                        <div class="detail-label">Faculty</div>
                        <div class="detail-value">${profile.faculty || 'Not specified'}</div>
                    </div>
                </div>
                <div class="detail-item">
                    <div class="detail-icon"><i class="fas fa-book"></i></div>
                    <div class="detail-content">
                        <div class="detail-label">Course</div>
                        <div class="detail-value">${profile.course || 'Not specified'}</div>
                    </div>
                </div>
                <div class="detail-item">
                    <div class="detail-icon"><i class="fas fa-calendar-alt"></i></div>
                    <div class="detail-content">
                        <div class="detail-label">Year of Study</div>
                        <div class="detail-value">${profile.year_of_study || 'Not specified'}</div>
                    </div>
                </div>
                <div class="participant-actions">
                    ${renderConnectionButton(connectionStatus, profileId)}
                </div>
            </div>
        `;
        
        return card;
    }
    
    function renderConnectionButton(status, profileId) {
        switch(status) {
            case 'pending':
                return `
                    <button class="action-btn outline" onclick="cancelRequest('${profileId}')">
                        <i class="fas fa-clock"></i> Request Sent
                    </button>
                `;
            case 'pending_approval':
                return `
                    <button class="action-btn primary" onclick="acceptRequest('${profileId}')">
                        <i class="fas fa-check"></i> Accept
                    </button>
                    <button class="action-btn outline" onclick="rejectRequest('${profileId}')">
                        <i class="fas fa-times"></i> Reject
                    </button>
                `;
            case 'accepted':
                return `
                    <button class="action-btn primary" onclick="messageUser('${profileId}')">
                        <i class="fas fa-comment"></i> Message
                    </button>
                    <button class="action-btn outline" onclick="disconnect('${profileId}')">
                        <i class="fas fa-user-times"></i> Disconnect
                    </button>
                `;
            case 'blocked':
                return `
                    <button class="action-btn outline" onclick="unblockUser('${profileId}')">
                        <i class="fas fa-ban"></i> Unblock
                    </button>
                `;
            default:
                return `
                    <button class="action-btn primary" onclick="connectWith('${profileId}')">
                        <i class="fas fa-user-plus"></i> Connect
                    </button>
                `;
        }
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
        participantsGrid.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading participants...</p>
            </div>
        `;
    }
    
    function showErrorState(message) {
        participantsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Something went wrong</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">Try Again</button>
            </div>
        `;
    }
    
    function showEmptyState() {
        participantsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>No participants found</h3>
                <p>Try adjusting your search or filters to find more results.</p>
            </div>
        `;
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
            applyFilters();
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
            applyFilters();
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
            applyFilters();
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
            applyFilters();
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
            applyFilters();
        } catch (error) {
            console.error('Error disconnecting:', error);
            showNotification('Failed to disconnect', 'error');
        }
    };
    
    window.messageUser = function(profileId) {
        // Redirect to chat with this user
        window.location.href = `chatroom.html?user=${profileId}`;
    };
    
    window.blockUser = async function(profileId) {
        if (!confirm('Are you sure you want to block this user?')) return;
        
        try {
            const response = await fetch(`${CONNECTIONS_URL}/${currentUser.id}/block`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    blocked_user_id: profileId
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            showNotification(`User blocked successfully`, 'success');
            
            // Reload connections and refresh UI
            await loadUserConnections();
            applyFilters();
        } catch (error) {
            console.error('Error blocking user:', error);
            showNotification('Failed to block user', 'error');
        }
    };
    
    window.unblockUser = async function(profileId) {
        try {
            // For unblocking, we need to remove the blocked connection
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
            
            showNotification(`User unblocked successfully`, 'success');
            
            // Reload connections and refresh UI
            await loadUserConnections();
            applyFilters();
        } catch (error) {
            console.error('Error unblocking user:', error);
            showNotification('Failed to unblock user', 'error');
        }
    };
    
    function getProfileName(profileId) {
        const profile = allProfiles.find(p => (p.user_id || p.id) === profileId);
        return profile ? profile.name : 'this user';
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

// Add notification styles to the page
const notificationStyles = `
.notification {
    position: fixed;
    top: 100px;
    right: 20px;
    background: white;
    border-radius: 8px;
    padding: 16px 20px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-width: 300px;
    max-width: 400px;
    z-index: 10000;
    animation: slideInRight 0.3s ease-out;
    border-left: 4px solid #3b82f6;
}

.notification.success {
    border-left-color: #10b981;
}

.notification.error {
    border-left-color: #ef4444;
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 10px;
}

.notification-content i {
    font-size: 18px;
}

.notification.success .notification-content i {
    color: #10b981;
}

.notification.error .notification-content i {
    color: #ef4444;
}

.notification-close {
    background: none;
    border: none;
    cursor: pointer;
    color: #64748b;
    padding: 4px;
    margin-left: 10px;
}

@keyframes slideInRight {
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

// Add styles to the document
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);