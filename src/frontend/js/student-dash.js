// student-dash.js - Student Dashboard Functionality with Full API Integration
document.addEventListener('DOMContentLoaded', function() {
    // API configuration
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_BASE_URL = isLocal 
        ? 'http://localhost:3000/api' 
        : 'https://wits-buddy-g9esajarfqe3dmh6.southafricanorth-01.azurewebsites.net/api';
    
    // State management
    let currentUser = null;
    let dashboardData = {
        progress: {},
        events: [],
        groups: [],
        connections: [],
        modules: []
    };
    
    // DOM elements
    const welcomeName = document.getElementById('welcomeName');
    const currentDate = document.getElementById('currentDate');
    const modulesCount = document.getElementById('modulesCount');
    const connectionsCount = document.getElementById('connectionsCount');
    const upcomingEvents = document.getElementById('upcomingEvents');
    const overallProgress = document.getElementById('overallProgress');
    const completedTopics = document.getElementById('completedTopics');
    const rewardsEarned = document.getElementById('rewardsEarned');
    const eventsList = document.getElementById('eventsList');
    const groupsList = document.getElementById('groupsList');
    const connectionsList = document.getElementById('connectionsList');
    const modulesList = document.getElementById('modulesList');
    
    // Charts
    let progressChart = null;
    
    // Initialize dashboard
    initDashboard();
    
    function initDashboard() {
        // Set current date
        setCurrentDate();
        
        // Check authentication and handle Google login data
        checkAuthAndGoogleLogin();
        
        // Initialize mobile menu
        initMobileMenu();
        
        // Load dashboard data
        loadDashboardData();
        
        // Set up logout functionality
        setupLogout();
    }
    
    // Check authentication and handle Google login data
    function checkAuthAndGoogleLogin() {
        // Check if we're coming from a Google login with user data
        const urlParams = new URLSearchParams(window.location.search);
        const success = urlParams.get('success');
        const userData = urlParams.get('userData');
        
        // If we have user data from Google login, store it
        if (success === 'true' && userData) {
            try {
                const parsedUserData = JSON.parse(decodeURIComponent(userData));
                auth.handleGoogleLogin(parsedUserData);
                
                // Clean up the URL
                window.history.replaceState({}, document.title, window.location.pathname);
                
                console.log('Google login data processed successfully');
            } catch (error) {
                console.error('Error processing Google login data:', error);
            }
        }
        
        // Get current user from auth system
        currentUser = auth.getCurrentUser();
        
        if (!currentUser) {
            console.log('User not logged in, redirecting to login page');
            window.location.href = 'login.html';
            return;
        }
        
        // Check if user is a student
        if (!auth.isStudent()) {
            console.error('User is not a student, access denied');
            alert('Access denied. Student role required.');
            logout();
            return;
        }
        
        // Update welcome message with user's first name
        if (welcomeName && currentUser.name) {
            welcomeName.textContent = currentUser.name.split(' ')[0]; // First name only
        }
        
        // Log user info for debugging
        console.log('Logged in user:', currentUser);
        console.log('User role:', currentUser.role);
        console.log('Student number:', currentUser.studentNumber);
    }
    
    // Set current date
    function setCurrentDate() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        if (currentDate) {
            currentDate.textContent = now.toLocaleDateString('en-US', options);
        }
    }
    
    // Initialize mobile menu
    function initMobileMenu() {
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileNav = document.getElementById('mobile-nav');
        const mobileNavClose = document.getElementById('mobile-nav-close');
        const mobileLogoutButton = document.getElementById('mobileLogoutButton');
        
        if (mobileMenuButton) {
            mobileMenuButton.addEventListener('click', () => {
                mobileNav.classList.add('active');
            });
        }
        
        if (mobileNavClose) {
            mobileNavClose.addEventListener('click', () => {
                mobileNav.classList.remove('active');
            });
        }
        
        if (mobileLogoutButton) {
            mobileLogoutButton.addEventListener('click', logout);
        }
    }
    
    // Set up logout functionality
    function setupLogout() {
        const logoutButtons = document.querySelectorAll('#logoutButton, #mobileLogoutButton');
        logoutButtons.forEach(button => {
            if (button) {
                button.addEventListener('click', logout);
            }
        });
    }
    
    // Logout function
    function logout() {
        if (confirm('Are you sure you want to logout?')) {
            auth.handleLogout();
            window.location.href = 'login.html';
        }
    }
    
    // Load dashboard data from all APIs
    async function loadDashboardData() {
        try {
            // Verify user is still logged in
            currentUser = auth.getCurrentUser();
            if (!currentUser) {
                console.log('User not logged in, redirecting to login page');
                window.location.href = 'login.html';
                return;
            }
            
            // Show loading states
            showLoadingStates();
            
            // Update user-specific elements
            updateUserSpecificElements();
            
            // Load data from all APIs
            await Promise.all([
                loadProgressData(),
                loadCalendarData(),
                loadGroupsData(),
                loadConnectionsData()
            ]);
            
            // Update dashboard with loaded data
            updateDashboard();
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            showErrorStates();
        }
    }
    
    // Update user-specific elements with data from sessionStorage
    function updateUserSpecificElements() {
        // Update any user-specific elements on the page
        const userRoleElement = document.getElementById('userRole');
        const userEmailElement = document.getElementById('userEmail');
        const studentNumberElement = document.getElementById('studentNumber');
        const userFacultyElement = document.getElementById('userFaculty');
        const userCourseElement = document.getElementById('userCourse');
        
        if (userRoleElement) {
            userRoleElement.textContent = currentUser.role ? 
                currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : 
                'Student';
        }
        
        if (userEmailElement) {
            userEmailElement.textContent = currentUser.email || 'Not provided';
        }
        
        if (studentNumberElement) {
            studentNumberElement.textContent = currentUser.studentNumber || 'Not provided';
        }
        
        if (userFacultyElement) {
            userFacultyElement.textContent = currentUser.faculty || 'Not provided';
        }
        
        if (userCourseElement) {
            userCourseElement.textContent = currentUser.course || 'Not provided';
        }
        
        // Update profile picture if available
        if (currentUser.picture) {
            const profilePictures = document.querySelectorAll('.profile-picture, .user-avatar');
            profilePictures.forEach(img => {
                img.src = currentUser.picture;
                img.alt = `${currentUser.name}'s profile picture`;
            });
        }
    }
    
    // Show loading states
    function showLoadingStates() {
        const loadingHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading...</p>
            </div>
        `;
        
        if (eventsList) eventsList.innerHTML = loadingHTML;
        if (groupsList) groupsList.innerHTML = loadingHTML;
        if (connectionsList) connectionsList.innerHTML = loadingHTML;
        if (modulesList) modulesList.innerHTML = loadingHTML;
    }
    
    // Show error states
    function showErrorStates() {
        const errorHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load data. Please try again later.</p>
                <button class="btn btn-outline" onclick="loadDashboardData()">Retry</button>
            </div>
        `;
        
        if (eventsList) eventsList.innerHTML = errorHTML;
        if (groupsList) groupsList.innerHTML = errorHTML;
        if (connectionsList) connectionsList.innerHTML = errorHTML;
        if (modulesList) modulesList.innerHTML = errorHTML;
    }
    
    // Load progress data from API
    async function loadProgressData() {
        try {
            const response = await fetch(`${API_BASE_URL}/progress/modules`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-data': JSON.stringify(currentUser)
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            const modules = data.modules || [];
            
            // Calculate progress statistics
            const totalTopics = modules.reduce((sum, module) => sum + (module.topics?.length || 0), 0);
            const completedTopics = modules.reduce((sum, module) => 
                sum + (module.topics?.filter(topic => topic.completed).length || 0), 0);
            const completionPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
            const earnedRewards = modules.filter(module => 
                module.reward && module.reward.earned).length;
            
            dashboardData.progress = {
                overall: completionPercentage,
                completedTopics: completedTopics,
                rewardsEarned: earnedRewards,
                modules: modules.map(module => ({
                    name: module.name,
                    progress: module.topics && module.topics.length > 0 ? 
                        Math.round((module.topics.filter(topic => topic.completed).length / module.topics.length) * 100) : 0,
                    color: module.color || '#3b82f6',
                    topics: module.topics?.length || 0,
                    completed: module.topics?.filter(topic => topic.completed).length || 0
                }))
            };
            
        } catch (error) {
            console.error('Error loading progress data:', error);
            // Fallback to minimal data
            dashboardData.progress = {
                overall: 0,
                completedTopics: 0,
                rewardsEarned: 0,
                modules: []
            };
        }
    }
    
    // Load calendar data from API
    async function loadCalendarData() {
        try {
            // Load activities
            const activitiesResponse = await fetch(`${API_BASE_URL}/activities/user/${currentUser.id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            let activities = [];
            if (activitiesResponse.ok) {
                const activitiesData = await activitiesResponse.json();
                activities = activitiesData.activities || [];
            }
            
            // Load scheduled groups
            const groupsResponse = await fetch(`${API_BASE_URL}/groups/user/${currentUser.id}?status=active`);
            let scheduledGroups = [];
            
            if (groupsResponse.ok) {
                const groupsData = await groupsResponse.json();
                const userGroupIds = groupsData.groups?.map(group => group.group_id) || [];
                
                // Fetch scheduled group details
                for (const groupId of userGroupIds.slice(0, 3)) { // Limit to 3 groups for performance
                    try {
                        const groupDetailResponse = await fetch(`${API_BASE_URL}/groups/${groupId}`);
                        if (groupDetailResponse.ok) {
                            const groupData = await groupDetailResponse.json();
                            const group = groupData.group;
                            
                            if (group.is_scheduled && group.scheduled_start) {
                                const startDate = new Date(group.scheduled_start);
                                scheduledGroups.push({
                                    id: group.id,
                                    title: group.name,
                                    type: 'study-group',
                                    date: startDate,
                                    time: startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                                    location: 'Study Group Session',
                                    group: group.name,
                                    subject: group.subject
                                });
                            }
                        }
                    } catch (error) {
                        console.error(`Error fetching group ${groupId}:`, error);
                    }
                }
            }
            
            // Combine and filter upcoming events
            const now = new Date();
            const upcomingActivities = activities
                .filter(activity => {
                    if (activity.is_completed) return false;
                    const activityDate = new Date(activity.activity_date + 'T' + activity.activity_time);
                    return activityDate > now;
                })
                .map(activity => ({
                    id: activity.id,
                    title: activity.title,
                    type: activity.activity_type,
                    date: new Date(activity.activity_date + 'T' + activity.activity_time),
                    time: activity.activity_time,
                    location: activity.location,
                    group: 'Personal Activity'
                }));
            
            // Combine all events and sort by date - LIMIT TO 3 EVENTS
            const allEvents = [...upcomingActivities, ...scheduledGroups]
                .sort((a, b) => a.date - b.date)
                .slice(0, 3); // Limit to 3 events for dashboard
            
            dashboardData.events = allEvents;
            
        } catch (error) {
            console.error('Error loading calendar data:', error);
            dashboardData.events = [];
        }
    }
    
    // Load groups data from API
    async function loadGroupsData() {
        try {
            console.log('Loading groups data for user:', currentUser.id);
            
            const response = await fetch(`${API_BASE_URL}/groups/user/${currentUser.id}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            const userGroups = data.groups || [];
            
            console.log('User groups data:', userGroups);
            
            // Get detailed group information for user's groups
            const detailedGroups = [];
            
            // Process up to 3 groups for the dashboard
            const groupsToProcess = userGroups.slice(0, 3);
            
            for (const group of groupsToProcess) {
                try {
                    console.log(`Fetching details for group: ${group.group_id}`);
                    const groupResponse = await fetch(`${API_BASE_URL}/groups/${group.group_id}`);
                    
                    if (groupResponse.ok) {
                        const groupData = await groupResponse.json();
                        const groupDetails = groupData.group;
                        
                        if (groupDetails) {
                            detailedGroups.push({
                                id: group.group_id,
                                name: groupDetails.name || 'Unnamed Group',
                                memberCount: groupDetails.member_count || 0,
                                maxMembers: groupDetails.max_members || 10,
                                subject: groupDetails.subject || 'General',
                                faculty: groupDetails.faculty || 'Not specified',
                                description: groupDetails.description || 'No description',
                                lastActivity: getRelativeTime(new Date()), // Simplified for now
                                isPrivate: groupDetails.is_private || false
                            });
                        }
                    } else {
                        console.warn(`Failed to fetch details for group ${group.group_id}`);
                        // Create a basic group entry with available data
                        detailedGroups.push({
                            id: group.group_id,
                            name: group.group_name || 'Unnamed Group',
                            memberCount: group.member_count || 0,
                            maxMembers: group.max_members || 10,
                            subject: group.subject || 'General',
                            faculty: group.faculty || 'Not specified',
                            description: 'Group details unavailable',
                            lastActivity: getRelativeTime(new Date()),
                            isPrivate: group.is_private || false
                        });
                    }
                } catch (error) {
                    console.error(`Error fetching group details ${group.group_id}:`, error);
                    // Create a basic group entry even if details fail
                    detailedGroups.push({
                        id: group.group_id,
                        name: group.group_name || 'Unnamed Group',
                        memberCount: group.member_count || 0,
                        maxMembers: group.max_members || 10,
                        subject: group.subject || 'General',
                        faculty: group.faculty || 'Not specified',
                        description: 'Group details unavailable',
                        lastActivity: getRelativeTime(new Date()),
                        isPrivate: group.is_private || false
                    });
                }
            }
            
            dashboardData.groups = detailedGroups;
            console.log('Processed groups for dashboard:', dashboardData.groups);
            
        } catch (error) {
            console.error('Error loading groups data:', error);
            // Fallback to empty array
            dashboardData.groups = [];
        }
    }
    
    // Load connections data from API - COMPLETELY REWRITTEN VERSION
    async function loadConnectionsData() {
        try {
            console.log('Loading connections data for user:', currentUser.id);
            
            // Use the friends endpoint to get accepted connections with full profile details
            const connectionsResponse = await fetch(`${API_BASE_URL}/connections/${currentUser.id}/friends`);
            
            if (!connectionsResponse.ok) {
                throw new Error(`HTTP error! status: ${connectionsResponse.status}`);
            }
            
            const connectionsData = await connectionsResponse.json();
            const friends = connectionsData.friends || [];
            
            console.log('Friends data from API:', friends);
            
            // Process the connections for dashboard display - LIMIT TO 3 CONNECTIONS
            const processedConnections = [];
            
            // Limit to 3 connections for dashboard
            const connectionsToProcess = friends.slice(0, 3);
            
            for (const friend of connectionsToProcess) {
                try {
                    console.log('Processing friend:', friend);
                    
                    // Extract user details from the friend object
                    // The friend object should contain profile details from the SQL function
                    const userDetails = friend.user_details || {};
                    
                    // Create connection object with proper fallbacks
                    const connection = {
                        id: friend.user_id || friend.id,
                        name: userDetails.name || friend.name || 'Unknown User',
                        email: userDetails.email || friend.email || 'No email',
                        role: userDetails.role || friend.role || 'student',
                        faculty: userDetails.faculty || friend.faculty || 'Not specified',
                        course: userDetails.course || friend.course || 'Not specified',
                        yearOfStudy: userDetails.year_of_study || friend.year_of_study || 'Not specified',
                        lastSeen: getRelativeTime(new Date()), // Simplified for dashboard
                        avatar: getInitials(userDetails.name || friend.name || 'U')
                    };
                    
                    processedConnections.push(connection);
                    
                } catch (error) {
                    console.error('Error processing friend data:', error);
                    // Create a basic connection entry even if processing fails
                    processedConnections.push({
                        id: friend.user_id || friend.id,
                        name: 'User',
                        email: 'No email',
                        role: 'student',
                        faculty: 'Not specified',
                        course: 'Not specified',
                        yearOfStudy: 'Not specified',
                        lastSeen: 'Recently active',
                        avatar: 'U'
                    });
                }
            }
            
            // If no friends found via the friends endpoint, try the fallback method
            if (processedConnections.length === 0) {
                console.log('No friends found via friends endpoint, trying fallback method...');
                await loadConnectionsFallback();
            } else {
                dashboardData.connections = processedConnections;
                console.log('Processed connections for dashboard:', dashboardData.connections);
            }
            
        } catch (error) {
            console.error('Error loading connections data via friends endpoint:', error);
            // Try fallback method
            await loadConnectionsFallback();
        }
    }
    
    // Fallback method for loading connections
    async function loadConnectionsFallback() {
        try {
            console.log('Using fallback method to load connections...');
            
            // Get all connections for the user
            const connectionsResponse = await fetch(`${API_BASE_URL}/connections/${currentUser.id}`);
            
            if (!connectionsResponse.ok) {
                throw new Error(`HTTP error! status: ${connectionsResponse.status}`);
            }
            
            const connectionsData = await connectionsResponse.json();
            const connectedUsers = connectionsData.connected_users || [];
            
            console.log('Raw connections data:', connectedUsers);
            
            // Filter for accepted connections only
            const acceptedConnections = connectedUsers.filter(conn => conn.status === 'accepted');
            console.log('Accepted connections:', acceptedConnections);
            
            const processedConnections = [];
            // LIMIT TO 3 CONNECTIONS
            const connectionsToProcess = acceptedConnections.slice(0, 3);
            
            for (const connection of connectionsToProcess) {
                try {
                    // Determine the other user's ID
                    const otherUserId = connection.requester_id === currentUser.id ? 
                        connection.user_id : connection.requester_id;
                    
                    console.log(`Fetching profile for user: ${otherUserId}`);
                    
                    // Fetch profile details using the profiles API
                    const profileResponse = await fetch(`${API_BASE_URL}/profiles/${otherUserId}`);
                    
                    if (profileResponse.ok) {
                        const profileData = await profileResponse.json();
                        console.log('Profile data for user', otherUserId, ':', profileData);
                        
                        if (profileData) {
                            processedConnections.push({
                                id: otherUserId,
                                name: profileData.name || 'Unknown User',
                                email: profileData.email || 'No email',
                                role: profileData.role || 'student',
                                faculty: profileData.faculty || 'Not specified',
                                course: profileData.course || 'Not specified',
                                yearOfStudy: profileData.year_of_study || 'Not specified',
                                lastSeen: 'Recently active',
                                avatar: getInitials(profileData.name || 'U')
                            });
                        }
                    } else {
                        console.warn(`Failed to fetch profile for user ${otherUserId}`);
                        // Create basic connection entry with connection data
                        processedConnections.push({
                            id: otherUserId,
                            name: 'User',
                            email: 'No email',
                            role: 'student',
                            faculty: 'Not specified',
                            course: 'Not specified',
                            yearOfStudy: 'Not specified',
                            lastSeen: 'Recently active',
                            avatar: 'U'
                        });
                    }
                } catch (error) {
                    console.error(`Error fetching profile ${otherUserId}:`, error);
                    // Create basic connection entry even if profile fetch fails
                    processedConnections.push({
                        id: connection.user_id || connection.requester_id,
                        name: 'User',
                        email: 'No email',
                        role: 'student',
                        faculty: 'Not specified',
                        course: 'Not specified',
                        yearOfStudy: 'Not specified',
                        lastSeen: 'Recently active',
                        avatar: 'U'
                    });
                }
            }
            
            dashboardData.connections = processedConnections;
            console.log('Processed connections via fallback:', dashboardData.connections);
            
        } catch (error) {
            console.error('Error in connections fallback method:', error);
            // Final fallback - empty array
            dashboardData.connections = [];
        }
    }
    
    // Helper function to get relative time
    function getRelativeTime(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    }
    
    // Helper function to get initials
    function getInitials(name) {
        if (!name) return 'UU';
        return name.split(' ')
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }
    
    // Update dashboard with loaded data
    function updateDashboard() {
        updateQuickStats();
        updateProgressOverview();
        updateEventsList();
        updateGroupsList();
        updateConnectionsList();
        updateModulesList();
    }
    
    // Update quick stats
    function updateQuickStats() {
        if (modulesCount) modulesCount.textContent = dashboardData.progress.modules?.length || 0;
        if (connectionsCount) connectionsCount.textContent = dashboardData.connections.length;
        if (upcomingEvents) upcomingEvents.textContent = dashboardData.events.length;
    }
    
    // Update progress overview
    function updateProgressOverview() {
        if (overallProgress) overallProgress.textContent = `${dashboardData.progress.overall}%`;
        if (completedTopics) completedTopics.textContent = dashboardData.progress.completedTopics;
        if (rewardsEarned) rewardsEarned.textContent = dashboardData.progress.rewardsEarned;
        
        // Initialize progress chart
        initProgressChart();
    }
    
    // Initialize progress chart
    function initProgressChart() {
        const ctx = document.getElementById('progressChart');
        if (!ctx) return;
        
        if (progressChart) {
            progressChart.destroy();
        }
        
        progressChart = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Remaining'],
                datasets: [{
                    data: [dashboardData.progress.overall, 100 - dashboardData.progress.overall],
                    backgroundColor: [
                        '#3b82f6',
                        '#e2e8f0'
                    ],
                    borderWidth: 0,
                    borderRadius: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.raw}%`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Update events list - ONLY SHOW 3 EVENTS
    function updateEventsList() {
        if (!eventsList) return;
        
        if (dashboardData.events.length === 0) {
            eventsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <p>No upcoming events</p>
                    <a href="student-calendar.html" class="btn btn-outline">View All</a>
                </div>
            `;
            return;
        }
        
        // Only take first 3 events
        const eventsToShow = dashboardData.events.slice(0, 3);
        
        const eventsHTML = eventsToShow.map(event => {
            const eventDate = new Date(event.date);
            const formattedDate = eventDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });
            
            return `
                <div class="event-item">
                    <div class="event-icon ${event.type}">
                        <i class="fas fa-${getEventIcon(event.type)}"></i>
                    </div>
                    <div class="event-details">
                        <div class="event-title">${event.title}</div>
                        <div class="event-meta">
                            <span class="event-time">
                                <i class="far fa-clock"></i>
                                ${formattedDate}, ${event.time}
                            </span>
                            ${event.location ? `
                            <span class="event-location">
                                <i class="fas fa-map-marker-alt"></i>
                                ${event.location}
                            </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        eventsList.innerHTML = eventsHTML;
    }
    
    // Get event icon based on type
    function getEventIcon(type) {
        const icons = {
            'study-group': 'users',
            'study': 'book',
            'lab': 'flask',
            'workshop': 'chalkboard-teacher',
            'lecture': 'graduation-cap',
            'exam': 'file-alt'
        };
        
        return icons[type] || 'calendar-alt';
    }
    
    // Update groups list - ONLY SHOW 3 GROUPS
    function updateGroupsList() {
        if (!groupsList) return;
        
        console.log('Updating groups list with:', dashboardData.groups);
        
        if (dashboardData.groups.length === 0) {
            groupsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users-slash"></i>
                    <p>No study groups yet</p>
                    <a href="student-groups.html" class="btn btn-outline">Find Groups</a>
                </div>
            `;
            return;
        }
        
        // Only take first 3 groups
        const groupsToShow = dashboardData.groups.slice(0, 3);
        
        const groupsHTML = groupsToShow.map(group => {
            const progressPercentage = group.maxMembers > 0 ? 
                Math.round((group.memberCount / group.maxMembers) * 100) : 0;
            
            return `
                <div class="group-item">
                    <div class="group-avatar" style="background-color: ${getRandomColor(group.id)};">
                        ${getInitials(group.name)}
                    </div>
                    <div class="group-details">
                        <div class="group-name">${group.name}</div>
                        <div class="group-subject">${group.subject}</div>
                        <div class="group-meta">
                            <span class="group-members">
                                <i class="fas fa-users"></i>
                                ${group.memberCount} members
                            </span>
                            <span class="group-activity">
                                <i class="far fa-clock"></i>
                                ${group.lastActivity}
                            </span>
                        </div>
                        <div class="members-progress">
                            <div class="members-progress-bar">
                                <div class="members-progress-fill" style="width: ${progressPercentage}%"></div>
                            </div>
                            <div class="members-count">${group.memberCount}/${group.maxMembers}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        groupsList.innerHTML = groupsHTML;
    }
    
    // Update connections list - ONLY SHOW 3 CONNECTIONS
    function updateConnectionsList() {
        if (!connectionsList) return;
        
        console.log('Updating connections list with:', dashboardData.connections);
        
        if (dashboardData.connections.length === 0) {
            connectionsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-friends"></i>
                    <p>No connections yet</p>
                    <a href="student-participants.html" class="btn btn-outline">Find Participants</a>
                </div>
            `;
            return;
        }
        
        // Only take first 3 connections
        const connectionsToShow = dashboardData.connections.slice(0, 3);
        
        const connectionsHTML = connectionsToShow.map(connection => {
            // Ensure we have proper data for display
            const name = connection.name || 'User';
            const role = connection.role || 'student';
            const course = connection.course || 'Not specified';
            const faculty = connection.faculty || 'Not specified';
            const yearOfStudy = connection.yearOfStudy || 'Not specified';
            
            return `
                <div class="connection-item">
                    <div class="connection-avatar">
                        ${connection.avatar || getInitials(name)}
                    </div>
                    <div class="connection-details">
                        <div class="connection-name">${name}</div>
                        <div class="connection-role ${role}">
                            <i class="fas fa-${role === 'tutor' ? 'chalkboard-teacher' : 'user-graduate'}"></i>
                            ${role === 'tutor' ? 'Tutor' : 'Student'} • ${course}
                        </div>
                        <div class="connection-meta">
                            <span class="connection-faculty">
                                <i class="fas fa-university"></i>
                                ${faculty}
                            </span>
                            <span class="connection-year">
                                <i class="fas fa-calendar-alt"></i>
                                ${yearOfStudy}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        connectionsList.innerHTML = connectionsHTML;
    }
    
    // Update modules list - ONLY SHOW 3 MODULES
    function updateModulesList() {
        if (!modulesList) return;
        
        if (!dashboardData.progress.modules || dashboardData.progress.modules.length === 0) {
            modulesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book"></i>
                    <p>No modules added yet</p>
                    <a href="student-progress.html" class="btn btn-outline">Add Modules</a>
                </div>
            `;
            return;
        }
        
        // Only take first 3 modules
        const modulesToShow = dashboardData.progress.modules.slice(0, 3);
        
        const modulesHTML = modulesToShow.map(module => {
            return `
                <div class="module-item">
                    <div class="module-header">
                        <div class="module-name">
                            <span class="module-color" style="background-color: ${module.color};"></span>
                            ${module.name}
                        </div>
                        <div class="module-percentage">${module.progress}%</div>
                    </div>
                    <div class="module-progress-bar">
                        <div class="module-progress-fill" style="width: ${module.progress}%; background-color: ${module.color};"></div>
                    </div>
                    <div class="module-progress-text">
                        <span>Progress</span>
                        <span>${module.completed}/${module.topics} topics</span>
                    </div>
                </div>
            `;
        }).join('');
        
        modulesList.innerHTML = modulesHTML;
    }
    
    // Helper function to generate random colors
    function getRandomColor(seed) {
        const colors = [
            '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
            '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
        ];
        
        // Simple hash function for consistent colors
        let hash = 0;
        for (let i = 0; i < String(seed).length; i++) {
            hash = String(seed).charCodeAt(i) + ((hash << 5) - hash);
        }
        
        return colors[Math.abs(hash) % colors.length];
    }
    
    // Make functions available globally for retry functionality
    window.loadDashboardData = loadDashboardData;
    window.logout = logout;
});