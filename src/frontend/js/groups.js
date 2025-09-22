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
    let publicGroups = [];
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
            
            // Load user's groups
            await loadUserGroups();
            
            // Load all public groups for discovery
            await loadAllPublicGroups();
            
            // Set all groups based on current tab
            updateFilteredGroups();
            
        } catch (error) {
            console.error('Error loading groups data:', error);
            showError('Failed to load groups. Please try again later.');
        }
    }
    
    async function loadUserGroups() {
        try {
            const response = await fetch(`${API_BASE_URL}/groups/user/${currentUser.id}`);
            
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
    
    async function loadAllPublicGroups() {
        try {
            // Fetch all public groups without filters
            const response = await fetch(`${API_BASE_URL}/groups/search/public`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            publicGroups = data.groups || [];
            
        } catch (error) {
            console.error('Error loading public groups:', error);
            publicGroups = [];
        }
    }
    
    function updateFilteredGroups() {
        switch(currentTab) {
            case 'my-groups':
                filteredGroups = [...userGroups];
                break;
            case 'discover':
                // Filter out groups user is already in
                const userGroupIds = userGroups.map(g => g.group_id);
                filteredGroups = publicGroups.filter(g => !userGroupIds.includes(g.group_id));
                break;
            case 'public':
                filteredGroups = [...publicGroups];
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
                (group.group_name && group.group_name.toLowerCase().includes(searchTerm)) ||
                (group.subject && group.subject.toLowerCase().includes(searchTerm)) ||
                (group.faculty && group.faculty.toLowerCase().includes(searchTerm));
            
            // Subject filter
            const matchesSubject = !subjectValue || group.subject === subjectValue;
            
            // Faculty filter
            const matchesFaculty = !facultyValue || group.faculty === facultyValue;
            
            // Year filter
            const matchesYear = !yearValue || group.year_of_study === yearValue;
            
            return matchesSearch && matchesSubject && matchesFaculty && matchesYear;
        });
        
        // Sort by member count (descending)
        results.sort((a, b) => b.member_count - a.member_count);
        
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
                (group.group_name && group.group_name.toLowerCase().includes(searchTerm)) ||
                (group.subject && group.subject.toLowerCase().includes(searchTerm)) ||
                (group.faculty && group.faculty.toLowerCase().includes(searchTerm));
            
            // Subject filter
            const matchesSubject = !subjectValue || group.subject === subjectValue;
            
            // Faculty filter
            const matchesFaculty = !facultyValue || group.faculty === facultyValue;
            
            // Year filter
            const matchesYear = !yearValue || group.year_of_study === yearValue;
            
            return matchesSearch && matchesSubject && matchesFaculty && matchesYear;
        });
        
        // Sort by member count (descending)
        results.sort((a, b) => b.member_count - a.member_count);
        
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
        const isMember = userGroups.some(g => g.group_id === group.group_id);
        const isCreator = isMember && group.user_role === 'creator';
        const isAdmin = isMember && group.user_role === 'admin';
        const progressPercentage = (group.member_count / group.max_members) * 100;
        
        return `
            <div class="group-card" data-group-id="${group.group_id}">
                <div class="group-header">
                    <h3 class="group-name">${group.group_name || 'Unnamed Group'}</h3>
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
                    
                    <div class="members-info">
                        <div class="members-count">${group.member_count} / ${group.max_members} members</div>
                        <div class="members-progress">
                            <div class="members-progress-bar" style="width: ${progressPercentage}%"></div>
                        </div>
                    </div>
                </div>
                
                <div class="group-actions">
                    ${isMember ? `
                        <button class="action-btn primary view-group-btn" data-group-id="${group.group_id}">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="action-btn error leave-group-btn" data-group-id="${group.group_id}">
                            <i class="fas fa-sign-out-alt"></i> Leave
                        </button>
                    ` : `
                        <button class="action-btn primary join-group-btn" data-group-id="${group.group_id}">
                            <i class="fas fa-user-plus"></i> Join
                        </button>
                        <button class="action-btn outline view-group-btn" data-group-id="${group.group_id}">
                            <i class="fas fa-eye"></i> View
                        </button>
                    `}
                </div>
            </div>
        `;
    }
    
    function createGroupListItem(group) {
        const isMember = userGroups.some(g => g.group_id === group.group_id);
        const isCreator = isMember && group.user_role === 'creator';
        const isAdmin = isMember && group.user_role === 'admin';
        
        return `
            <div class="group-list-item" data-group-id="${group.group_id}">
                <div class="list-avatar">
                    ${getInitials(group.group_name || 'G')}
                </div>
                
                <div class="list-details">
                    <h3 class="list-name">${group.group_name || 'Unnamed Group'}</h3>
                    <div class="list-meta">
                        <span><i class="fas fa-book"></i> ${group.subject || 'General'}</span>
                        <span><i class="fas fa-university"></i> ${group.faculty || 'Not specified'}</span>
                        <span><i class="fas fa-users"></i> ${group.member_count} members</span>
                        <span><i class="fas fa-calendar-alt"></i> ${group.year_of_study || 'Not specified'}</span>
                    </div>
                </div>
                
                <div class="list-actions">
                    ${isMember ? `
                        <button class="action-btn primary view-group-btn" data-group-id="${group.group_id}">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="action-btn error leave-group-btn" data-group-id="${group.group_id}">
                            <i class="fas fa-sign-out-alt"></i> Leave
                        </button>
                    ` : `
                        <button class="action-btn primary join-group-btn" data-group-id="${group.group_id}">
                            <i class="fas fa-user-plus"></i> Join
                        </button>
                        <button class="action-btn outline view-group-btn" data-group-id="${group.group_id}">
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
        
        // Populate modal with group details
        document.getElementById('modalGroupName').textContent = group.name || 'Unnamed Group';
        document.getElementById('modalGroupDescription').textContent = group.description || 'No description provided.';
        document.getElementById('modalGroupSubject').textContent = group.subject || 'Not specified';
        document.getElementById('modalGroupFaculty').textContent = group.faculty || 'Not specified';
        document.getElementById('modalGroupCourse').textContent = group.course || 'Not specified';
        document.getElementById('modalGroupYear').textContent = group.year_of_study || 'Not specified';
        document.getElementById('modalGroupMembers').textContent = `${group.member_count || 0} / ${group.max_members || 10}`;
        document.getElementById('modalGroupPrivacy').textContent = group.is_private ? 'Private' : 'Public';
        
        // Show invite code if user is member
        const isMember = userGroups.some(g => g.group_id === groupId);
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
        
        const userGroup = userGroups.find(g => g.group_id === groupId);
        const isCreator = userGroup && userGroup.user_role === 'creator';
        const isAdmin = userGroup && userGroup.user_role === 'admin';
        const isMemberOfGroup = userGroup !== undefined;
        
        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'action-buttons-container';
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '0.75rem';
        buttonContainer.style.flexWrap = 'wrap';
        
        // Add Join Conversation button for group members only
        if (isMemberOfGroup) {
            const joinConversationBtn = document.createElement('button');
            joinConversationBtn.className = 'btn btn-primary';
            joinConversationBtn.id = 'joinConversationBtn';
            joinConversationBtn.innerHTML = '<i class="fas fa-comments"></i> Join Conversation';
            joinConversationBtn.addEventListener('click', function() {
                // Redirect to chatroom with group context
                window.location.href = `student-chatroom.html?group=${encodeURIComponent(groupId)}`;
            });
            buttonContainer.appendChild(joinConversationBtn);
        }
        
        // Add Schedule Group button for creator only
        if (isCreator) {
            const scheduleGroupBtn = document.createElement('button');
            scheduleGroupBtn.className = 'btn btn-warning';
            scheduleGroupBtn.id = 'scheduleGroupBtn';
            scheduleGroupBtn.innerHTML = '<i class="fas fa-calendar-alt"></i> Schedule Group';
            scheduleGroupBtn.addEventListener('click', function() {
                // Open scheduling functionality
                scheduleGroup(groupId);
            });
            buttonContainer.appendChild(scheduleGroupBtn);
        }
        
        // Add existing action buttons (Join/Leave/Edit/Delete)
        if (isMemberOfGroup) {
            if (isCreator) {
                const editBtn = document.createElement('button');
                editBtn.className = 'btn btn-warning edit-group-btn';
                editBtn.dataset.groupId = groupId;
                editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
                buttonContainer.appendChild(editBtn);
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn btn-error delete-group-btn';
                deleteBtn.dataset.groupId = groupId;
                deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete';
                buttonContainer.appendChild(deleteBtn);
            } else {
                const leaveBtn = document.createElement('button');
                leaveBtn.className = 'btn btn-error leave-group-btn';
                leaveBtn.dataset.groupId = groupId;
                leaveBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Leave Group';
                buttonContainer.appendChild(leaveBtn);
            }
        } else {
            const joinBtn = document.createElement('button');
            joinBtn.className = 'btn btn-primary join-group-btn';
            joinBtn.dataset.groupId = groupId;
            joinBtn.innerHTML = '<i class="fas fa-user-plus"></i> Join Group';
            buttonContainer.appendChild(joinBtn);
        }
        
        actionButtons.appendChild(buttonContainer);
        
        // Open the modal
        openModal(groupDetailsModal);
        
    } catch (error) {
        console.error('Error loading group details:', error);
        showError('Failed to load group details. Please try again.');
    }
}

// Update the scheduleGroup function in groups.js
async function scheduleGroup(groupId) {
    try {
        // Fetch current group details
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const groupData = await response.json();
        const group = groupData.group;
        
        // Show scheduling modal with current data
        showScheduleGroupModal(groupId, group);
        
    } catch (error) {
        console.error('Error scheduling group:', error);
        showError('Failed to load group details for scheduling.');
    }
}

// Add function to create scheduled group
async function createScheduledGroup() {
    const scheduleForm = document.getElementById('scheduleGroupForm');
    const startInput = document.getElementById('scheduleStart');
    const endInput = document.getElementById('scheduleEnd');
    const meetingTimes = document.getElementById('meetingTimes');
    
    if (!startInput.value || !endInput.value) {
        showError('Please provide both start and end dates.');
        return;
    }
    
    // Validate dates
    const startDate = new Date(startInput.value);
    const endDate = new Date(endInput.value);
    
    if (startDate >= endDate) {
        showError('Schedule start must be before end time.');
        return;
    }
    
    // Get group creation form data
    const name = document.getElementById('groupName').value.trim();
    const subject = document.getElementById('groupSubject').value.trim();
    const faculty = document.getElementById('groupFaculty').value;
    const course = document.getElementById('groupCourse').value;
    
    if (!name || !subject) {
        showError('Group name and subject are required.');
        return;
    }
    
    try {
        const groupData = {
            name: name,
            description: document.getElementById('groupDescription').value.trim(),
            subject: subject,
            creator_id: currentUser.id,
            schedule_start: startInput.value,
            schedule_end: endInput.value,
            meeting_times: meetingTimes.value.split('\n').filter(time => time.trim()),
            max_members: parseInt(document.getElementById('groupMaxMembers').value) || 10,
            is_private: document.getElementById('groupIsPrivate').checked,
            faculty: faculty,
            course: course,
            year_of_study: document.getElementById('groupYear').value
        };
        
        const response = await fetch(`${API_BASE_URL}/groups/create-scheduled`, {
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
        
        showSuccess(`Scheduled group "${result.group.name}" created successfully!`);
        
        // Close all modals
        closeScheduleModal();
        closeModal(createGroupModal);
        createGroupForm.reset();
        
        // Reset faculty and course dropdowns
        facultySelect.value = '';
        courseSelect.innerHTML = '<option value="">Select Faculty first</option>';
        courseSelect.disabled = true;
        
        // Reload data
        await loadAllData();
        
    } catch (error) {
        console.error('Error creating scheduled group:', error);
        showError('Failed to create scheduled group. Please try again.');
    }
}

// Update the updateGroupSchedule function in groups.js
async function updateGroupSchedule(groupId) {
    // Get elements from the dynamically created modal
    const modal = document.getElementById('scheduleGroupModal');
    if (!modal) {
        showError('Schedule modal not found. Please try again.');
        return;
    }
    
    const startInput = modal.querySelector('#scheduleStart');
    const endInput = modal.querySelector('#scheduleEnd');
    const meetingTimes = modal.querySelector('#meetingTimes');
    
    if (!startInput || !endInput) {
        showError('Schedule form elements not found. Please try again.');
        return;
    }
    
    if (!startInput.value || !endInput.value) {
        showError('Please provide both start and end dates.');
        return;
    }
    
    // Validate dates
    const startDate = new Date(startInput.value);
    const endDate = new Date(endInput.value);
    
    if (startDate >= endDate) {
        showError('Schedule start must be before end time.');
        return;
    }
    
    try {
        const scheduleData = {
            user_id: currentUser.id,
            schedule_start: startInput.value,
            schedule_end: endInput.value,
            meeting_times: meetingTimes.value.split('\n').filter(time => time.trim())
        };
        
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}/schedule`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(scheduleData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        showSuccess('Group schedule updated successfully!');
        
        // Close modal and reload group details
        closeScheduleModal();
        closeModal(groupDetailsModal);
        
        // Reload data to reflect changes
        await loadAllData();
        
    } catch (error) {
        console.error('Error updating group schedule:', error);
        showError('Failed to update group schedule. Please try again.');
    }
}

function showCreateSchedulingModal(group) {
    // Create a scheduling modal or redirect to calendar
    showToast('Opening scheduling interface...', 'info');
    
    // Redirect to calendar with group pre-selected for scheduling
    setTimeout(() => {
        window.location.href = `student-calendar.html?scheduleGroup=${encodeURIComponent(group.group_id)}&groupName=${encodeURIComponent(group.name)}`;
    }, 1000);
}

function showSchedulingModal(group) {
    // Show existing schedule and allow editing
    const scheduleInfo = `
        <div class="schedule-info">
            <h4>Current Schedule</h4>
            <p><strong>Start:</strong> ${new Date(group.scheduled_start).toLocaleString()}</p>
            <p><strong>End:</strong> ${new Date(group.scheduled_end).toLocaleString()}</p>
            ${group.meeting_times ? `<p><strong>Meeting Times:</strong> ${group.meeting_times}</p>` : ''}
        </div>
    `;
    
    // You can create a more sophisticated modal here for editing the schedule
    showToast('Group is already scheduled. Redirecting to calendar for editing...', 'info');
    
    setTimeout(() => {
        window.location.href = `student-calendar.html?editSchedule=${encodeURIComponent(group.group_id)}`;
    }, 1500);
}


// Add this function to handle the scheduling modal
function showScheduleGroupModal(groupId, groupData = null) {
    // Create scheduling modal HTML
    const modalHTML = `
        <div class="modal active" id="scheduleGroupModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${groupData ? 'Update Group Schedule' : 'Schedule Study Group'}</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="scheduleGroupForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="scheduleStart">Start Date & Time *</label>
                                <input type="datetime-local" id="scheduleStart" required 
                                    value="${groupData?.scheduled_start ? formatDateTimeForInput(groupData.scheduled_start) : ''}">
                            </div>
                            
                            <div class="form-group">
                                <label for="scheduleEnd">End Date & Time *</label>
                                <input type="datetime-local" id="scheduleEnd" required
                                    value="${groupData?.scheduled_end ? formatDateTimeForInput(groupData.scheduled_end) : ''}">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="meetingTimes">Regular Meeting Times</label>
                            <textarea id="meetingTimes" placeholder="e.g., Monday 2pm-4pm, Wednesday 3pm-5pm&#10;Friday 10am-12pm" 
                                rows="3">${groupData?.meeting_times || ''}</textarea>
                            <small>Enter each meeting time on a new line. Include day, time, and duration.</small>
                        </div>
                        
                        <div class="schedule-preview" id="schedulePreview" style="display: none;">
                            <h4>Schedule Preview</h4>
                            <div id="previewContent"></div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" id="cancelScheduleBtn">Cancel</button>
                    <button class="btn btn-primary" id="confirmScheduleBtn">
                        ${groupData ? 'Update Schedule' : 'Create Scheduled Group'}
                    </button>
                </div>
            </div>
        </div>
    `;

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Set up event listeners
    setupScheduleModalEvents(groupId, groupData);
}

// Helper function to format datetime for input field
function formatDateTimeForInput(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toISOString().slice(0, 16);
}

function setupScheduleModalEvents(groupId, groupData) {
    const modal = document.getElementById('scheduleGroupModal');
    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = modal.querySelector('#cancelScheduleBtn');
    const confirmBtn = modal.querySelector('#confirmScheduleBtn');
    const scheduleForm = modal.querySelector('#scheduleGroupForm');
    
    // Close modal events
    closeBtn.addEventListener('click', closeScheduleModal);
    cancelBtn.addEventListener('click', closeScheduleModal);
    
    // Confirm schedule event
    confirmBtn.addEventListener('click', () => {
        if (groupData) {
            updateGroupSchedule(groupId);
        } else {
            createScheduledGroup();
        }
    });
    
    // Real-time validation and preview
    const startInput = modal.querySelector('#scheduleStart');
    const endInput = modal.querySelector('#scheduleEnd');
    
    [startInput, endInput].forEach(input => {
        input.addEventListener('change', validateSchedule);
        input.addEventListener('input', validateSchedule); // Add input event for real-time validation
    });
    
    // Also validate meeting times changes
    const meetingTimes = modal.querySelector('#meetingTimes');
    if (meetingTimes) {
        meetingTimes.addEventListener('input', updateSchedulePreview);
    }
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeScheduleModal();
        }
    });
    
    // Initial validation
    setTimeout(validateSchedule, 100);
}
function validateSchedule() {
    const modal = document.getElementById('scheduleGroupModal');
    if (!modal) return;
    
    const startInput = modal.querySelector('#scheduleStart');
    const endInput = modal.querySelector('#scheduleEnd');
    const confirmBtn = modal.querySelector('#confirmScheduleBtn');
    
    if (!startInput || !endInput || !confirmBtn) return;
    
    if (startInput.value && endInput.value) {
        const startDate = new Date(startInput.value);
        const endDate = new Date(endInput.value);
        
        if (startDate >= endDate) {
            confirmBtn.disabled = true;
            showToast('Schedule start must be before end time', 'error');
        } else {
            confirmBtn.disabled = false;
            updateSchedulePreview();
        }
    }
}

function updateSchedulePreview() {
    const modal = document.getElementById('scheduleGroupModal');
    if (!modal) return;
    
    const startInput = modal.querySelector('#scheduleStart');
    const endInput = modal.querySelector('#scheduleEnd');
    const meetingTimes = modal.querySelector('#meetingTimes');
    const preview = modal.querySelector('#schedulePreview');
    const previewContent = modal.querySelector('#previewContent');
    
    if (!startInput || !endInput || !preview || !previewContent) return;
    
    if (startInput.value && endInput.value) {
        const startDate = new Date(startInput.value);
        const endDate = new Date(endInput.value);
        
        const duration = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
        
        previewContent.innerHTML = `
            <p><strong>Duration:</strong> ${duration} days</p>
            <p><strong>Starts:</strong> ${startDate.toLocaleString()}</p>
            <p><strong>Ends:</strong> ${endDate.toLocaleString()}</p>
            ${meetingTimes.value ? `<p><strong>Regular Meetings:</strong> ${meetingTimes.value.replace(/\n/g, ', ')}</p>` : ''}
        `;
        
        preview.style.display = 'block';
    }
}

function updateSchedulePreview() {
    const startInput = document.getElementById('scheduleStart');
    const endInput = document.getElementById('scheduleEnd');
    const meetingTimes = document.getElementById('meetingTimes');
    const preview = document.getElementById('schedulePreview');
    const previewContent = document.getElementById('previewContent');
    
    if (startInput.value && endInput.value) {
        const startDate = new Date(startInput.value);
        const endDate = new Date(endInput.value);
        
        const duration = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
        
        previewContent.innerHTML = `
            <p><strong>Duration:</strong> ${duration} days</p>
            <p><strong>Starts:</strong> ${startDate.toLocaleString()}</p>
            <p><strong>Ends:</strong> ${endDate.toLocaleString()}</p>
            ${meetingTimes.value ? `<p><strong>Regular Meetings:</strong> ${meetingTimes.value.replace(/\n/g, ', ')}</p>` : ''}
        `;
        
        preview.style.display = 'block';
    }
}

function closeScheduleModal() {
    const modal = document.getElementById('scheduleGroupModal');
    if (modal) {
        modal.remove();
    }
}
    
// Add this function to groups.js
async function createNotification(notificationData) {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(notificationData)
        });
        return response.ok;
    } catch (error) {
        console.error('Error creating notification:', error);
        return false;
    }
}

// Update the joinGroup function to create a notification for group admins
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
        
        // Get group details to notify admins
        const groupResponse = await fetch(`${API_BASE_URL}/groups/${groupId}`);
        if (groupResponse.ok) {
            const groupData = await groupResponse.json();
            const group = groupData.group;
            
            // Get group admins
            const membersResponse = await fetch(`${API_BASE_URL}/groups/${groupId}/members`);
            if (membersResponse.ok) {
                const membersData = await membersResponse.json();
                const admins = membersData.members.filter(m => m.role === 'admin' || m.role === 'creator');
                const adminIds = admins.map(a => a.user_id).filter(id => id !== currentUser.id);
                
                // Notify admins about new member
                if (adminIds.length > 0) {
                    await fetch(`${API_BASE_URL}/notifications/group-member-joined`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            sender_id: currentUser.id,
                            group_id: groupId,
                            group_name: group.name,
                            admin_user_ids: adminIds
                        })
                    });
                }
            }
        }
        
        showSuccess(`Successfully joined the group!`);
        
        // Reload data
        await loadAllData();
        
    } catch (error) {
        console.error('Error joining group:', error);
        showError('Failed to join group. Please try again.');
    }
}

// Update the createGroup function to notify invited members
async function createGroup() {
    const formData = new FormData(createGroupForm);
    const name = document.getElementById('groupName').value.trim();
    const subject = document.getElementById('groupSubject').value.trim();
    const faculty = document.getElementById('groupFaculty').value;
    const course = document.getElementById('groupCourse').value;
    
    if (!name || !subject) {
        showError('Group name and subject are required.');
        return;
    }
    
    if (faculty && !course) {
        showError('Please select a course for the selected faculty.');
        return;
    }
    
    try {
        const groupData = {
            name: name,
            description: document.getElementById('groupDescription').value.trim(),
            subject: subject,
            creator_id: currentUser.id,
            max_members: parseInt(document.getElementById('groupMaxMembers').value) || 10,
            is_private: document.getElementById('groupIsPrivate').checked,
            faculty: faculty,
            course: course,
            year_of_study: document.getElementById('groupYear').value
        };
        
        const response = await fetch(`${API_BASE_URL}/groups/create`, {
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
        
        // If there are invited members, send them notifications
        const invitedMembersInput = document.getElementById('invitedMembers');
        if (invitedMembersInput && invitedMembersInput.value) {
            try {
                const invitedEmails = invitedMembersInput.value.split(',').map(email => email.trim());
                
                // For each invited email, find the user and send notification
                for (const email of invitedEmails) {
                    const userResponse = await fetch(`${API_BASE_URL}/profiles/email/${encodeURIComponent(email)}`);
                    if (userResponse.ok) {
                        const userData = await userResponse.json();
                        
                        await fetch(`${API_BASE_URL}/notifications/group-invitation`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                sender_id: currentUser.id,
                                target_user_id: userData.user_id,
                                group_id: result.group.id,
                                group_name: result.group.name,
                                invite_code: result.group.invite_code
                            })
                        });
                    }
                }
            } catch (error) {
                console.error('Error sending invitations:', error);
                // Continue even if invitations fail
            }
        }
        
        showSuccess(`Group "${result.group.name}" created successfully!`);
        
        // Close modal and reset form
        closeModal(createGroupModal);
        createGroupForm.reset();
        
        // Reset faculty and course dropdowns
        facultySelect.value = '';
        courseSelect.innerHTML = '<option value="">Select Faculty first</option>';
        courseSelect.disabled = true;
        
        // Reload data
        await loadAllData();
        
    } catch (error) {
        console.error('Error creating group:', error);
        showError('Failed to create group. Please try again.');
    }
}

// Add this function to handle group invitations
async function inviteToGroup(groupId, userIds) {
    try {
        const groupResponse = await fetch(`${API_BASE_URL}/groups/${groupId}`);
        if (!groupResponse.ok) {
            throw new Error(`HTTP error! status: ${groupResponse.status}`);
        }
        
        const groupData = await groupResponse.json();
        const group = groupData.group;
        
        for (const userId of userIds) {
            await fetch(`${API_BASE_URL}/notifications/group-invitation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sender_id: currentUser.id,
                    target_user_id: userId,
                    group_id: groupId,
                    group_name: group.name,
                    invite_code: group.invite_code
                })
            });
        }
        
        return true;
    } catch (error) {
        console.error('Error sending group invitations:', error);
        return false;
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
            showSuccess('You have left the group.');
            
            // Reload data
            await loadAllData();
            
            // Close details modal if open
            closeModal(groupDetailsModal);
            
        } catch (error) {
            console.error('Error leaving group:', error);
            showError('Failed to leave group. Please try again.');
        }
    }
    


    
    async function editGroup(groupId) {
        // Implementation for editing a group
        showError('Edit group functionality is not yet implemented.');
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
            
            // Reload data
            await loadAllData();
            
            // Close details modal
            closeModal(groupDetailsModal);
            
        } catch (error) {
            console.error('Error deleting group:', error);
            showError('Failed to delete group. Please try again.');
        }
    }
    
    function updateStats() {
        // Calculate stats
        const totalGroups = publicGroups.length;
        const myGroups = userGroups.length;
        const ownedGroups = userGroups.filter(g => g.user_role === 'creator').length;
        const totalMembers = userGroups.reduce((sum, group) => sum + group.member_count, 0);
        
        // Update DOM
        totalGroupsEl.textContent = totalGroups;
        myGroupsEl.textContent = myGroups;
        ownedGroupsEl.textContent = ownedGroups;
        totalMembersEl.textContent = totalMembers;
        
        // Animate the stats update
        animateValue(totalGroupsEl, 0, totalGroups, 1000);
        animateValue(myGroupsEl, 0, myGroups, 1000);
        animateValue(ownedGroupsEl, 0, ownedGroups, 1000);
        animateValue(totalMembersEl, 0, totalMembers, 1000);
    }
    
    function showLoading() {
        groupsGrid.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading groups...</p>
            </div>
        `;
    }
    
    function showError(message) {
        // Create a toast notification
        const toast = document.createElement('div');
        toast.className = 'toast-notification error';
        toast.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
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
    
    function showSuccess(message) {
        // Create a toast notification
        const toast = document.createElement('div');
        toast.className = 'toast-notification success';
        toast.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
            <button class="toast-close">&times;</button>
        `;
        
        document.body.appendChild(toast);
        
        // Add close button functionality
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 3000);
    }
    
    function showEmptyState() {
        groupsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>No groups found</h3>
                <p>${currentTab === 'my-groups' 
                    ? 'You haven\'t joined any groups yet. Join a group or create your own to get started!' 
                    : 'No groups match your search criteria. Try adjusting your filters.'}</p>
                ${currentTab !== 'my-groups' ? `
                    <button class="btn btn-primary" id="createFirstGroupBtn">
                        <i class="fas fa-plus"></i> Create Your First Group
                    </button>
                ` : ''}
            </div>
        `;
        
        // Add event listener to create button if it exists
        const createBtn = document.getElementById('createFirstGroupBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                openModal(createGroupModal);
            });
        }
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
            closeModal(modal);
        });
    }
    
    function getInitials(name) {
        if (!name) return 'G';
        
        return name.split(' ')
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }
    
    function animateValue(element, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = Math.floor(progress * (end - start) + start);
            element.textContent = value;
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
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