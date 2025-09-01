// groups.js - Study Groups Management
document.addEventListener('DOMContentLoaded', function() {
    // API configuration
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_BASE_URL = isLocal 
        ? 'http://localhost:3000/api' 
        : 'https://wits-buddy-g9esajarfqe3dmh6.southafricanorth-01.azurewebsites.net/api';
    
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
    
    // State management
    let currentUser = null;
    let allGroups = [];
    let filteredGroups = [];
    let userGroups = [];
    let currentTab = 'my-groups';
    let currentView = 'grid';
    
    // DOM elements
    const groupsGrid = document.getElementById('groupsGrid');
    const groupSearch = document.getElementById('groupSearch');
    const subjectFilter = document.getElementById('subjectFilter');
    const facultyFilter = document.getElementById('facultyFilter');
    const yearFilter = document.getElementById('yearFilter');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const viewToggleBtns = document.querySelectorAll('.view-toggle-btn');
    const createGroupBtn = document.getElementById('createGroupBtn');
    const joinByCodeModal = document.getElementById('joinByCodeModal');
    const createGroupModal = document.getElementById('createGroupModal');
    const groupDetailsModal = document.getElementById('groupDetailsModal');
    const modalCloseBtns = document.querySelectorAll('.modal-close');
    const cancelJoinBtn = document.getElementById('cancelJoinBtn');
    const confirmJoinBtn = document.getElementById('confirmJoinBtn');
    const cancelCreateBtn = document.getElementById('cancelCreateBtn');
    const confirmCreateBtn = document.getElementById('confirmCreateBtn');
    const closeDetailsBtn = document.getElementById('closeDetailsBtn');
    const createGroupForm = document.getElementById('createGroupForm');
    const inviteCodeInput = document.getElementById('inviteCode');
    
    // Group creation form elements
    const facultySelect = document.getElementById('groupFaculty');
    const courseSelect = document.getElementById('groupCourse');
    
    // Stats elements
    const totalGroupsEl = document.getElementById('totalGroups');
    const myGroupsEl = document.getElementById('myGroups');
    const ownedGroupsEl = document.getElementById('ownedGroups');
    const totalMembersEl = document.getElementById('totalMembers');
    
    // Initialize the page
    init();
    
    async function init() {
        // Get current user from sessionStorage
        if (typeof auth !== 'undefined' && auth.getCurrentUser) {
            currentUser = auth.getCurrentUser();
        } else {
            // Fallback to direct sessionStorage access
            const userData = sessionStorage.getItem('user');
            currentUser = userData ? JSON.parse(userData) : null;
        }
        
        if (!currentUser || !currentUser.id) {
            // Redirect to login if no user data
            window.location.href = '../index.html';
            return;
        }
        
        // Set up event listeners
        setupEventListeners();
        
        // Initialize faculty and course dropdowns
        initFacultyCourseDropdowns();
        
        // Load initial data
        await loadAllData();
        
        // Render initial view
        renderGroups();
        updateStats();
    }
    
    function initFacultyCourseDropdowns() {
        // Get references to the faculty and course dropdowns in the create group form
        const facultySelect = document.getElementById('groupFaculty');
        const courseSelect = document.getElementById('groupCourse');
        
        if (facultySelect && courseSelect) {
            // Clear existing options
            facultySelect.innerHTML = '<option value="">Select Faculty</option>';
            courseSelect.innerHTML = '<option value="">Select Faculty first</option>';
            courseSelect.disabled = true;
            
            // Add faculty options
            Object.keys(facultyCourses).forEach(faculty => {
                const option = document.createElement('option');
                option.value = faculty;
                option.textContent = faculty;
                facultySelect.appendChild(option);
            });
            
            // Add event listener for faculty change
            facultySelect.addEventListener('change', function() {
                const selectedFaculty = this.value;
                
                // Clear course selection
                courseSelect.innerHTML = '<option value="">Select a Course</option>';
                
                if (selectedFaculty && facultyCourses[selectedFaculty]) {
                    courseSelect.disabled = false;
                    
                    facultyCourses[selectedFaculty].forEach(course => {
                        const option = document.createElement('option');
                        option.value = course;
                        option.textContent = course;
                        courseSelect.appendChild(option);
                    });
                } else {
                    courseSelect.disabled = true;
                    courseSelect.innerHTML = '<option value="">Select a Faculty first</option>';
                }
                
                courseSelect.value = '';
            });
        }
    }
    
    function setupEventListeners() {
        // Search input
        groupSearch.addEventListener('input', debounce(() => {
            filterGroups();
        }, 300));
        
        // Filter dropdowns
        subjectFilter.addEventListener('change', filterGroups);
        facultyFilter.addEventListener('change', filterGroups);
        yearFilter.addEventListener('change', filterGroups);
        
        // Tab buttons
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                
                // Update active tab
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Change tab
                currentTab = tab;
                updateFilteredGroups();
                renderGroups();
            });
        });
        
        // View toggle buttons
        viewToggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                
                // Update active button
                viewToggleBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Change view
                currentView = view;
                groupsGrid.className = view === 'list' 
                    ? 'groups-list' 
                    : 'groups-grid';
                
                // Re-render groups
                renderGroups();
            });
        });
        
        // Create group button
        createGroupBtn.addEventListener('click', () => {
            openModal(createGroupModal);
        });
        
        // Join by code functionality
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('join-by-code-btn')) {
                openModal(joinByCodeModal);
            }
        });
        
        // Modal close buttons
        modalCloseBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                closeAllModals();
            });
        });
        
        // Cancel buttons
        cancelJoinBtn.addEventListener('click', () => {
            closeModal(joinByCodeModal);
            inviteCodeInput.value = '';
        });
        
        // Updated the cancelCreateBtn event listener to properly reset the course dropdown
        cancelCreateBtn.addEventListener('click', () => {
            closeModal(createGroupModal);
            createGroupForm.reset();
            
            // Reset faculty and course dropdowns
            const facultySelect = document.getElementById('groupFaculty');
            const courseSelect = document.getElementById('groupCourse');
            
            if (facultySelect && courseSelect) {
                facultySelect.value = '';
                courseSelect.innerHTML = '<option value="">Select Faculty first</option>';
                courseSelect.disabled = true;
            }
        });
        
        closeDetailsBtn.addEventListener('click', () => {
            closeModal(groupDetailsModal);
        });
        
        // Confirm buttons
        confirmJoinBtn.addEventListener('click', joinGroupByCode);
        confirmCreateBtn.addEventListener('click', createGroup);
        
        // Click outside modal to close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                closeAllModals();
            }
        });
        
        // Group action handlers
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-group-btn')) {
                const groupId = e.target.dataset.groupId;
                viewGroupDetails(groupId);
            }
            
            if (e.target.classList.contains('join-group-btn')) {
                const groupId = e.target.dataset.groupId;
                joinGroup(groupId);
            }
            
            if (e.target.classList.contains('leave-group-btn')) {
                const groupId = e.target.dataset.groupId;
                leaveGroup(groupId);
            }
            
            if (e.target.classList.contains('edit-group-btn')) {
                const groupId = e.target.dataset.groupId;
                editGroup(groupId);
            }
            
            if (e.target.classList.contains('delete-group-btn')) {
                const groupId = e.target.dataset.groupId;
                deleteGroup(groupId);
            }
        });
    }
    
    async function loadAllData() {
        try {
            showLoading();
            
            // Load all groups (including scheduled ones)
            await loadAllGroups();
            
            // Load user's groups
            await loadUserGroups();
            
            // Set all groups based on current tab
            updateFilteredGroups();
            
        } catch (error) {
            console.error('Error loading groups data:', error);
            showError('Failed to load groups. Please try again later.');
        }
    }
    
    async function loadAllGroups() {
        try {
            // Fetch all groups including scheduled ones
            const response = await fetch(`${API_BASE_URL}/groups?status=all`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            allGroups = data.groups || [];
            
        } catch (error) {
            console.error('Error loading all groups:', error);
            allGroups = [];
        }
    }
    
    async function loadUserGroups() {
        try {
            const response = await fetch(`${API_BASE_URL}/groups/user/${currentUser.id}?status=all`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            userGroups = data.groups || [];
            
        } catch (error) {
            console.error('Error loading user groups:', error);
            userGroups = [];
        }
    }
    
    function updateFilteredGroups() {
        switch(currentTab) {
            case 'my-groups':
                filteredGroups = [...userGroups];
                break;
            case 'discover':
                // Filter out groups user is already in
                const userGroupIds = userGroups.map(g => g.id || g.group_id);
                filteredGroups = allGroups.filter(g => 
                    !userGroupIds.includes(g.id || g.group_id) && 
                    g.status !== 'archived' && 
                    g.status !== 'inactive'
                );
                break;
            case 'public':
                filteredGroups = allGroups.filter(g => 
                    !g.is_private && 
                    g.status !== 'archived' && 
                    g.status !== 'inactive'
                );
                break;
        }
        
        // Apply search and filters
        filterGroups();
    }
    
    function filterGroups() {
        const searchTerm = groupSearch.value.toLowerCase();
        const subjectValue = subjectFilter.value;
        const facultyValue = facultyFilter.value;
        const yearValue = yearFilter.value;
        
        let results = filteredGroups.filter(group => {
            // Search term filter
            const matchesSearch = !searchTerm || 
                (group.name && group.name.toLowerCase().includes(searchTerm)) ||
                (group.group_name && group.group_name.toLowerCase().includes(searchTerm)) ||
                (group.subject && group.subject.toLowerCase().includes(searchTerm)) ||
                (group.faculty && group.faculty.toLowerCase().includes(searchTerm));
            
            // Subject filter
            const matchesSubject = !subjectValue || 
                (group.subject && group.subject === subjectValue);
            
            // Faculty filter
            const matchesFaculty = !facultyValue || 
                (group.faculty && group.faculty === facultyValue);
            
            // Year filter
            const matchesYear = !yearValue || 
                (group.year_of_study && group.year_of_study === yearValue);
            
            return matchesSearch && matchesSubject && matchesFaculty && matchesYear;
        });
        
        // Sort by member count (descending)
        results.sort((a, b) => (b.member_count || 0) - (a.member_count || 0));
        
        // Update display
        displayGroups(results);
    }
    
    function renderGroups() {
        const searchTerm = groupSearch.value.toLowerCase();
        const subjectValue = subjectFilter.value;
        const facultyValue = facultyFilter.value;
        const yearValue = yearFilter.value;
        
        let results = filteredGroups.filter(group => {
            // Search term filter
            const matchesSearch = !searchTerm || 
                (group.name && group.name.toLowerCase().includes(searchTerm)) ||
                (group.group_name && group.group_name.toLowerCase().includes(searchTerm)) ||
                (group.subject && group.subject.toLowerCase().includes(searchTerm)) ||
                (group.faculty && group.faculty.toLowerCase().includes(searchTerm));
            
            // Subject filter
            const matchesSubject = !subjectValue || 
                (group.subject && group.subject === subjectValue);
            
            // Faculty filter
            const matchesFaculty = !facultyValue || 
                (group.faculty && group.faculty === facultyValue);
            
            // Year filter
            const matchesYear = !yearValue || 
                (group.year_of_study && group.year_of_study === yearValue);
            
            return matchesSearch && matchesSubject && matchesFaculty && matchesYear;
        });
        
        // Sort by member count (descending)
        results.sort((a, b) => (b.member_count || 0) - (a.member_count || 0));
        
        // Update display
        displayGroups(results);
    }
    
    function displayGroups(groups) {
        if (groups.length === 0) {
            showEmptyState();
            return;
        }
        
        groupsGrid.innerHTML = groups.map(group => {
            return currentView === 'list' 
                ? createGroupListItem(group)
                : createGroupCard(group);
        }).join('');
    }
    
    function createGroupCard(group) {
        const groupId = group.id || group.group_id;
        const groupName = group.name || group.group_name || 'Unnamed Group';
        const isMember = userGroups.some(g => (g.id || g.group_id) === groupId);
        const userRole = isMember ? (group.user_role || group.role) : null;
        const isCreator = isMember && userRole === 'creator';
        const isAdmin = isMember && userRole === 'admin';
        const memberCount = group.member_count || 0;
        const maxMembers = group.max_members || 10;
        const progressPercentage = (memberCount / maxMembers) * 100;
        
        // Determine group status
        let groupStatus = group.status || 'Active';
        let statusClass = 'status-active';
        
        if (group.is_scheduled || group.status === 'scheduled') {
            const now = new Date();
            const startDate = new Date(group.scheduled_start);
            const endDate = new Date(group.scheduled_end);
            
            if (now < startDate) {
                groupStatus = 'Scheduled';
                statusClass = 'status-scheduled';
            } else if (now > endDate) {
                groupStatus = 'Completed';
                statusClass = 'status-completed';
            } else {
                groupStatus = 'Active';
                statusClass = 'status-active';
            }
        } else if (group.status === 'archived') {
            groupStatus = 'Archived';
            statusClass = 'status-completed';
        } else if (group.status === 'inactive') {
            groupStatus = 'Inactive';
            statusClass = 'status-completed';
        }
        
        return `
            <div class="group-card" data-group-id="${groupId}">
                <div class="group-header">
                    <div class="group-status ${statusClass}">${groupStatus}</div>
                    <h3 class="group-name">${groupName}</h3>
                    <span class="group-subject">${group.subject || 'General'}</span>
                </div>
                
                <div class="group-details">
                    <p class="group-description">${group.description || 'No description provided.'}</p>
                    
                    <div class="group-meta">
                        <div class="meta-item">
                            <i class="fas fa-university"></i>
                            <span>${group.faculty || 'Not specified'}</span>
                        </div>
                        
                        <div class="meta-item">
                            <i class="fas fa-graduation-cap"></i>
                            <span>${group.course || 'Not specified'}</span>
                        </div>
                        
                        <div class="meta-item">
                            <i class="fas fa-calendar-alt"></i>
                            <span>${group.year_of_study || 'Not specified'}</span>
                        </div>
                    </div>
                    
                    ${(group.is_scheduled || group.status === 'scheduled') ? `
                        <div class="schedule-info">
                            <div class="meta-item">
                                <i class="fas fa-clock"></i>
                                <span>Starts: ${formatDate(group.scheduled_start)}</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-hourglass-end"></i>
                                <span>Ends: ${formatDate(group.scheduled_end)}</span>
                            </div>
                            ${group.meeting_times && group.meeting_times.length > 0 ? `
                                <div class="meta-item">
                                    <i class="fas fa-calendar-check"></i>
                                    <span>Meets: ${Array.isArray(group.meeting_times) ? group.meeting_times.join(', ') : group.meeting_times}</span>
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                    
                    <div class="members-info">
                        <div class="members-count">${memberCount} / ${maxMembers} members</div>
                        <div class="members-progress">
                            <div class="members-progress-bar" style="width: ${progressPercentage}%"></div>
                        </div>
                    </div>
                </div>
                
                <div class="group-actions">
                    ${isMember ? `
                        <button class="action-btn primary view-group-btn" data-group-id="${groupId}">
                            <i class="fas fa-eye"></i> View
                        </button>
                        ${groupStatus !== 'Completed' && groupStatus !== 'Archived' ? `
                            <button class="action-btn error leave-group-btn" data-group-id="${groupId}">
                                <i class="fas fa-sign-out-alt"></i> Leave
                            </button>
                        ` : ''}
                    ` : groupStatus !== 'Completed' && groupStatus !== 'Archived' ? `
                        <button class="action-btn primary join-group-btn" data-group-id="${groupId}">
                            <i class="fas fa-user-plus"></i> Join
                        </button>
                        <button class="action-btn outline view-group-btn" data-group-id="${groupId}">
                            <i class="fas fa-eye"></i> View
                        </button>
                    ` : `
                        <button class="action-btn outline view-group-btn" data-group-id="${groupId}">
                            <i class="fas fa-eye"></i> View
                        </button>
                    `}
                </div>
            </div>
        `;
    }
    
    function createGroupListItem(group) {
        const groupId = group.id || group.group_id;
        const groupName = group.name || group.group_name || 'Unnamed Group';
        const isMember = userGroups.some(g => (g.id || g.group_id) === groupId);
        const userRole = isMember ? (group.user_role || group.role) : null;
        const isCreator = isMember && userRole === 'creator';
        const isAdmin = isMember && userRole === 'admin';
        const memberCount = group.member_count || 0;
        
        // Determine group status
        let groupStatus = group.status || 'Active';
        let statusClass = 'status-active';
        
        if (group.is_scheduled || group.status === 'scheduled') {
            const now = new Date();
            const startDate = new Date(group.scheduled_start);
            const endDate = new Date(group.scheduled_end);
            
            if (now < startDate) {
                groupStatus = 'Scheduled';
                statusClass = 'status-scheduled';
            } else if (now > endDate) {
                groupStatus = 'Completed';
                statusClass = 'status-completed';
            } else {
                groupStatus = 'Active';
                statusClass = 'status-active';
            }
        } else if (group.status === 'archived') {
            groupStatus = 'Archived';
            statusClass = 'status-completed';
        } else if (group.status === 'inactive') {
            groupStatus = 'Inactive';
            statusClass = 'status-completed';
        }
        
        return `
            <div class="group-list-item" data-group-id="${groupId}">
                <div class="list-avatar">
                    ${getInitials(groupName)}
                </div>
                
                <div class="list-details">
                    <div class="list-header">
                        <h3 class="list-name">${groupName}</h3>
                        <span class="list-status ${statusClass}">${groupStatus}</span>
                    </div>
                    <div class="list-meta">
                        <span><i class="fas fa-book"></i> ${group.subject || 'General'}</span>
                        <span><i class="fas fa-university"></i> ${group.faculty || 'Not specified'}</span>
                        <span><i class="fas fa-users"></i> ${memberCount} members</span>
                        <span><i class="fas fa-calendar-alt"></i> ${group.year_of_study || 'Not specified'}</span>
                    </div>
                    ${(group.is_scheduled || group.status === 'scheduled') ? `
                        <div class="list-schedule">
                            <span><i class="fas fa-clock"></i> ${formatDate(group.scheduled_start)} - ${formatDate(group.scheduled_end)}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="list-actions">
                    ${isMember ? `
                        <button class="action-btn primary view-group-btn" data-group-id="${groupId}">
                            <i class="fas fa-eye"></i> View
                        </button>
                        ${groupStatus !== 'Completed' && groupStatus !== 'Archived' ? `
                            <button class="action-btn error leave-group-btn" data-group-id="${groupId}">
                                <i class="fas fa-sign-out-alt"></i> Leave
                            </button>
                        ` : ''}
                    ` : groupStatus !== 'Completed' && groupStatus !== 'Archived' ? `
                        <button class="action-btn primary join-group-btn" data-group-id="${groupId}">
                            <i class="fas fa-user-plus"></i> Join
                        </button>
                        <button class="action-btn outline view-group-btn" data-group-id="${groupId}">
                            <i class="fas fa-eye"></i> View
                        </button>
                    ` : `
                        <button class="action-btn outline view-group-btn" data-group-id="${groupId}">
                            <i class="fas fa-eye"></i> View
                        </button>
                    `}
                </div>
            </div>
        `;
    }
    
    async function viewGroupDetails(groupId) {
        try {
            showLoading();
            
            // Fetch group details
            const groupResponse = await fetch(`${API_BASE_URL}/groups/${groupId}`);
            if (!groupResponse.ok) {
                throw new Error(`HTTP error! status: ${groupResponse.status}`);
            }
            
            const groupData = await groupResponse.json();
            const group = groupData.group;
            
            // Fetch group members
            const membersResponse = await fetch(`${API_BASE_URL}/groups/${groupId}/members`);
            let members = [];
            
            if (membersResponse.ok) {
                const membersData = await membersResponse.json();
                members = membersData.members || [];
            }
            
            // Determine group status
            let groupStatus = group.status || 'Active';
            let statusClass = 'status-active';
            
            if (group.is_scheduled || group.status === 'scheduled') {
                const now = new Date();
                const startDate = new Date(group.scheduled_start);
                const endDate = new Date(group.scheduled_end);
                
                if (now < startDate) {
                    groupStatus = 'Scheduled';
                    statusClass = 'status-scheduled';
                } else if (now > endDate) {
                    groupStatus = 'Completed';
                    statusClass = 'status-completed';
                } else {
                    groupStatus = 'Active';
                    statusClass = 'status-active';
                }
            } else if (group.status === 'archived') {
                groupStatus = 'Archived';
                statusClass = 'status-completed';
            } else if (group.status === 'inactive') {
                groupStatus = 'Inactive';
                statusClass = 'status-completed';
            }
            
            // Populate modal with group details
            document.getElementById('modalGroupName').textContent = group.name || 'Unnamed Group';
            document.getElementById('modalGroupDescription').textContent = group.description || 'No description provided.';
            document.getElementById('modalGroupSubject').textContent = group.subject || 'Not specified';
            document.getElementById('modalGroupFaculty').textContent = group.faculty || 'Not specified';
            document.getElementById('modalGroupCourse').textContent = group.course || 'Not specified';
            document.getElementById('modalGroupYear').textContent = group.year_of_study || 'Not specified';
            document.getElementById('modalGroupMembers').textContent = `${group.member_count || 0} / ${group.max_members || 10}`;
            document.getElementById('modalGroupPrivacy').textContent = group.is_private ? 'Private' : 'Public';
            
            // Add status to modal
            const modalHeader = document.querySelector('.modal-header');
            modalHeader.classList.add(statusClass);
            
            // Show schedule information if available
            const scheduleContainer = document.createElement('div');
            scheduleContainer.className = 'schedule-details';
            
            if (group.is_scheduled || group.status === 'scheduled') {
                scheduleContainer.innerHTML = `
                    <div class="detail-item">
                        <label>Status:</label>
                        <p class="group-status ${statusClass}">${groupStatus}</p>
                    </div>
                    <div class="detail-item">
                        <label>Schedule Start:</label>
                        <p>${formatDate(group.scheduled_start)}</p>
                    </div>
                    <div class="detail-item">
                        <label>Schedule End:</label>
                        <p>${formatDate(group.scheduled_end)}</p>
                    </div>
                    ${group.meeting_times && group.meeting_times.length > 0 ? `
                        <div class="detail-item">
                            <label>Meeting Times:</label>
                            <p>${Array.isArray(group.meeting_times) ? group.meeting_times.join(', ') : group.meeting_times}</p>
                        </div>
                    ` : ''}
                `;
                
                // Insert after privacy details
                const privacyItem = document.querySelector('.detail-item:last-child');
                privacyItem.parentNode.insertBefore(scheduleContainer, privacyItem.nextSibling);
            }
            
            // Show invite code if user is member
            const isMember = userGroups.some(g => (g.id || g.group_id) === groupId);
            const inviteCodeContainer = document.getElementById('modalInviteCodeContainer');
            if (isMember && group.invite_code) {
                inviteCodeContainer.style.display = 'flex';
                document.getElementById('modalGroupInviteCode').textContent = group.invite_code;
            } else {
                inviteCodeContainer.style.display = 'none';
            }
            
            // Populate members list
            const membersList = document.getElementById('modalMembersList');
            membersList.innerHTML = members.map(member => `
                <div class="member-item">
                    <div class="member-avatar">${getInitials(member.name || 'U')}</div>
                    <div class="member-info">
                        <div class="member-name">${member.name || 'Unknown User'}</div>
                        <div class="member-role">${member.role} • ${member.member_status}</div>
                    </div>
                </div>
            `).join('');
            
            // Set up action buttons
            const actionButtons = document.getElementById('modalActionButtons');
            actionButtons.innerHTML = '';
            
            const userGroup = userGroups.find(g => (g.id || g.group_id) === groupId);
            const isCreator = userGroup && (userGroup.user_role === 'creator' || userGroup.role === 'creator');
            const isAdmin = userGroup && (userGroup.user_role === 'admin' || userGroup.role === 'admin');
            const isMemberOfGroup = userGroup !== undefined;
            
            if (isMemberOfGroup) {
                if (isCreator) {
                    actionButtons.innerHTML = `
                        <button class="btn btn-warning edit-group-btn" data-group-id="${groupId}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-error delete-group-btn" data-group-id="${groupId}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    `;
                } else if (groupStatus !== 'Completed' && groupStatus !== 'Archived') {
                    actionButtons.innerHTML = `
                        <button class="btn btn-error leave-group-btn" data-group-id="${groupId}">
                            <i class="fas fa-sign-out-alt"></i> Leave Group
                        </button>
                    `;
                }
            } else if (groupStatus !== 'Completed' && groupStatus !== 'Archived') {
                actionButtons.innerHTML = `
                    <button class="btn btn-primary join-group-btn" data-group-id="${groupId}">
                        <i class="fas fa-user-plus"></i> Join Group
                    </button>
                `;
            }
            
            // Open the modal
            openModal(groupDetailsModal);
            
        } catch (error) {
            console.error('Error loading group details:', error);
            showError('Failed to load group details. Please try again.');
        }
    }
    
    async function joinGroup(groupId) {
        try {
            const response = await fetch(`${API_BASE_URL}/groups/${groupId}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: currentUser.id
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            showSuccess(`Successfully joined the group!`);
            
            // Reload data
            await loadAllData();
            
        } catch (error) {
            console.error('Error joining group:', error);
            showError('Failed to join group. Please try again.');
        }
    }
    
    async function joinGroupByCode() {
        const inviteCode = inviteCodeInput.value.trim();
        
        if (!inviteCode) {
            showError('Please enter an invite code.');
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/groups/join-by-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    invite_code: inviteCode,
                    user_id: currentUser.id
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            showSuccess(`Successfully joined ${result.group_name}!`);
            
            // Close modal and clear input
            closeModal(joinByCodeModal);
            inviteCodeInput.value = '';
            
            // Reload data
            await loadAllData();
            
        } catch (error) {
            console.error('Error joining group by code:', error);
            showError('Failed to join group. Please check the invite code and try again.');
        }
    }
    
    async function leaveGroup(groupId) {
        if (!confirm('Are you sure you want to leave this group?')) {
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/groups/${groupId}/leave`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: currentUser.id
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            showSuccess(`You have left the group.`);
            
            // Reload data
            await loadAllData();
            
        } catch (error) {
            console.error('Error leaving group:', error);
            showError('Failed to leave group. Please try again.');
        }
    }
    
    async function createGroup() {
        const formData = new FormData(createGroupForm);
        const groupData = {
            name: formData.get('groupName'),
            description: formData.get('groupDescription'),
            subject: formData.get('groupSubject'),
            creator_id: currentUser.id,
            max_members: parseInt(formData.get('groupMaxMembers')) || 10,
            is_private: formData.get('groupPrivacy') === 'private',
            faculty: formData.get('groupFaculty'),
            course: formData.get('groupCourse'),
            year_of_study: formData.get('groupYear')
        };
        
        // Check if it's a scheduled group
        const isScheduled = formData.get('groupType') === 'scheduled';
        
        if (isScheduled) {
            const scheduledStart = formData.get('groupStartDate');
            const scheduledEnd = formData.get('groupEndDate');
            const meetingTimes = formData.get('groupMeetingTimes');
            
            if (!scheduledStart || !scheduledEnd) {
                showError('Please provide both start and end dates for scheduled groups.');
                return;
            }
            
            groupData.scheduled_start = scheduledStart;
            groupData.scheduled_end = scheduledEnd;
            
            if (meetingTimes) {
                groupData.meeting_times = meetingTimes.split(',').map(time => time.trim());
            }
        }
        
        // Validate required fields
        if (!groupData.name || !groupData.subject) {
            showError('Please provide a group name and subject.');
            return;
        }
        
        try {
            const endpoint = isScheduled 
                ? `${API_BASE_URL}/groups/create-scheduled`
                : `${API_BASE_URL}/groups/create`;
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(groupData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            showSuccess(`Group "${result.group.name}" created successfully!`);
            
            // Close modal and reset form
            closeModal(createGroupModal);
            createGroupForm.reset();
            
            // Reset faculty and course dropdowns
            const facultySelect = document.getElementById('groupFaculty');
            const courseSelect = document.getElementById('groupCourse');
            
            if (facultySelect && courseSelect) {
                facultySelect.value = '';
                courseSelect.innerHTML = '<option value="">Select Faculty first</option>';
                courseSelect.disabled = true;
            }
            
            // Reload data
            await loadAllData();
            
        } catch (error) {
            console.error('Error creating group:', error);
            showError('Failed to create group. Please try again.');
        }
    }
    
    async function editGroup(groupId) {
        // This would open an edit form with pre-filled data
        // Implementation would be similar to createGroup but with a PATCH request
        alert('Edit group functionality would open here.');
    }
    
    async function deleteGroup(groupId) {
        if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/groups/${groupId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: currentUser.id
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            showSuccess('Group deleted successfully.');
            
            // Close modal
            closeModal(groupDetailsModal);
            
            // Reload data
            await loadAllData();
            
        } catch (error) {
            console.error('Error deleting group:', error);
            showError('Failed to delete group. Please try again.');
        }
    }
    
    function updateStats() {
        // Update stats in the UI
        totalGroupsEl.textContent = allGroups.length;
        myGroupsEl.textContent = userGroups.length;
        
        // Count owned groups
        const ownedGroups = userGroups.filter(group => 
            group.user_role === 'creator' || group.role === 'creator'
        ).length;
        ownedGroupsEl.textContent = ownedGroups;
        
        // Calculate total members across all user's groups
        const totalMembers = userGroups.reduce((sum, group) => 
            sum + (group.member_count || 0), 0
        );
        totalMembersEl.textContent = totalMembers;
    }
    
    function showEmptyState() {
        groupsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>No groups found</h3>
                <p>${currentTab === 'my-groups' 
                    ? 'You are not a member of any groups yet.' 
                    : 'No groups match your search criteria.'}</p>
                ${currentTab !== 'my-groups' ? 
                    '<button class="btn btn-primary create-group-btn">Create a Group</button>' : 
                    '<button class="btn btn-primary join-by-code-btn">Join by Code</button>'
                }
            </div>
        `;
        
        // Add event listeners to buttons in empty state
        const createBtn = document.querySelector('.create-group-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => openModal(createGroupModal));
        }
        
        const joinByCodeBtn = document.querySelector('.join-by-code-btn');
        if (joinByCodeBtn) {
            joinByCodeBtn.addEventListener('click', () => openModal(joinByCodeModal));
        }
    }
    
    function showLoading() {
        groupsGrid.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Loading groups...</p>
            </div>
        `;
    }
    
    function showError(message) {
        // Show error notification
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
        
        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }
    
    function showSuccess(message) {
        // Show success notification
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
        
        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }
    
    function openModal(modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeModal(modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
    
    function closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = 'auto';
    }
    
    function formatDate(dateString) {
        if (!dateString) return 'Not specified';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    function getInitials(name) {
        return name.split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
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
});