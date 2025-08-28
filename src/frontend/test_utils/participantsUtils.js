// participantsUtils.js - Utility functions for participants management
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

const yearOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', '6th Year'];

// Get connection status for a target user
function getConnectionStatus(userConnections, currentUserId, targetUserId) {
    if (!userConnections.connected_users) return 'none';
    
    const connection = userConnections.connected_users.find(
        conn => conn.user_id === targetUserId || conn.requester_id === targetUserId
    );
    
    return connection ? connection.status : 'none';
}

// Get initials from a name
function getInitials(name) {
    if (!name) return 'NN';
    
    return name
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

// Debounce function for search input
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

// Filter profiles based on criteria
function filterProfiles(profiles, filters, userConnections, currentUserId) {
    const {
        searchTerm,
        selectedRole,
        selectedFaculty,
        selectedCourse,
        selectedYear,
        selectedConnection,
        currentTab
    } = filters;

    return profiles.filter(profile => {
        const profileId = profile.user_id || profile.id;
        const connectionStatus = getConnectionStatus(userConnections, currentUserId, profileId);
        
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
        const matchesConnection = !selectedConnection || connectionStatus === selectedConnection;
        
        // Tab filter
        let matchesTab = true;
        if (currentTab !== 'all') {
            if (currentTab === 'connections') {
                matchesTab = connectionStatus === 'accepted';
            } else if (currentTab === 'pending') {
                matchesTab = connectionStatus === 'pending_approval';
            } else if (currentTab === 'sent') {
                matchesTab = connectionStatus === 'pending';
            }
        }
        
        return matchesSearch && matchesRole && matchesFaculty && matchesCourse && 
               matchesYear && matchesConnection && matchesTab;
    });
}

// Update connection statistics
function updateConnectionStats(userConnections, currentUserId, totalProfiles) {
    let connected = 0;
    let pending = 0;
    let sent = 0;
    
    if (userConnections.connected_users) {
        userConnections.connected_users.forEach(conn => {
            if (conn.status === 'accepted') {
                connected++;
            } else if (conn.status === 'pending' && conn.requester_id === currentUserId) {
                sent++;
            } else if (conn.status === 'pending' && conn.requester_id !== currentUserId) {
                pending++;
            }
        });
    }
    
    return { connected, pending, sent, total: totalProfiles };
}

// Get profile name by ID
function getProfileName(profiles, profileId) {
    const profile = profiles.find(p => (p.user_id || p.id) === profileId);
    return profile ? profile.name : 'this user';
}

module.exports = {
    facultyCourses,
    yearOptions,
    getConnectionStatus,
    getInitials,
    debounce,
    filterProfiles,
    updateConnectionStats,
    getProfileName
};