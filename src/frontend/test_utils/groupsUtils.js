// groupsUtils.js - Utility functions for groups management

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

// Get initials from a name
function getInitials(name) {
    if (!name) return 'G';
    
    return name.split(' ')
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

// Filter groups based on criteria
function filterGroups(groups, filters) {
    const {
        searchTerm,
        subjectValue,
        facultyValue,
        yearValue
    } = filters;

    return groups.filter(group => {
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
}

// Sort groups by member count (descending)
function sortGroupsByMembers(groups) {
    return [...groups].sort((a, b) => b.member_count - a.member_count);
}

// Get user's role in a group
function getUserRoleInGroup(userGroups, groupId) {
    const userGroup = userGroups.find(g => g.group_id === groupId);
    return userGroup ? userGroup.user_role : null;
}

// Check if user is a member of a group
function isUserMember(userGroups, groupId) {
    return userGroups.some(g => g.group_id === groupId);
}

// Check if user is the creator of a group
function isUserCreator(userGroups, groupId) {
    const userGroup = userGroups.find(g => g.group_id === groupId);
    return userGroup && userGroup.user_role === 'creator';
}

// Check if user is an admin of a group
function isUserAdmin(userGroups, groupId) {
    const userGroup = userGroups.find(g => g.group_id === groupId);
    return userGroup && userGroup.user_role === 'admin';
}

// Calculate progress percentage for member count
function calculateMemberProgress(memberCount, maxMembers) {
    return (memberCount / maxMembers) * 100;
}

// Update filtered groups based on current tab
function updateFilteredGroupsByTab(userGroups, publicGroups, currentTab) {
    switch(currentTab) {
        case 'my-groups':
            return [...userGroups];
        case 'discover':
            // Filter out groups user is already in
            const userGroupIds = userGroups.map(g => g.group_id);
            return publicGroups.filter(g => !userGroupIds.includes(g.group_id));
        case 'public':
            return [...publicGroups];
        default:
            return [];
    }
}

// Validate group creation form
function validateGroupForm(formData) {
    const errors = [];
    
    if (!formData.name || formData.name.trim().length === 0) {
        errors.push('Group name is required');
    }
    
    if (!formData.subject || formData.subject.trim().length === 0) {
        errors.push('Subject is required');
    }
    
    if (formData.faculty && !formData.course) {
        errors.push('Please select a course for the selected faculty');
    }
    
    if (formData.max_members && (formData.max_members < 2 || formData.max_members > 50)) {
        errors.push('Maximum members must be between 2 and 50');
    }
    
    return errors;
}

// Format group data for API request
function formatGroupData(formData, creatorId) {
    return {
        name: formData.name.trim(),
        description: formData.description ? formData.description.trim() : '',
        subject: formData.subject.trim(),
        creator_id: creatorId,
        max_members: parseInt(formData.max_members) || 10,
        is_private: Boolean(formData.is_private),
        faculty: formData.faculty || '',
        course: formData.course || '',
        year_of_study: formData.year_of_study || ''
    };
}

// Calculate group statistics
function calculateGroupStats(userGroups, publicGroups) {
    const totalGroups = publicGroups.length;
    const myGroups = userGroups.length;
    const ownedGroups = userGroups.filter(g => g.user_role === 'creator').length;
    const totalMembers = userGroups.reduce((sum, group) => sum + group.member_count, 0);
    
    return { totalGroups, myGroups, ownedGroups, totalMembers };
}

module.exports = {
    facultyCourses,
    yearOptions,
    getInitials,
    debounce,
    filterGroups,
    sortGroupsByMembers,
    getUserRoleInGroup,
    isUserMember,
    isUserCreator,
    isUserAdmin,
    calculateMemberProgress,
    updateFilteredGroupsByTab,
    validateGroupForm,
    formatGroupData,
    calculateGroupStats
};