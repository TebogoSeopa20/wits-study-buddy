// profile.js
document.addEventListener('DOMContentLoaded', function() {
    // API configuration
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_BASE_URL = isLocal 
        ? 'http://localhost:3000/api' 
        : 'https://wits-buddy-g9esajarfqe3dmh6.southafricanorth-01.azurewebsites.net/api';
    
    const PROFILES_URL = `${API_BASE_URL}/profiles`;
    
    // Get user data from session storage
    const user = auth.getCurrentUser();
    
    if (!user) {
        // If no user is logged in, redirect to login page
        window.location.href = 'login.html';
        return;
    }
    
    // Display basic user information with proper fallbacks
    document.getElementById('profile-name').textContent = user.name || 'Tebogo Seopa';
    document.getElementById('profile-email').textContent = user.email || '2563912@students.wits.ac.za';
    
    // For student number: use the one from email if not provided
    const studentNumber = user.studentNumber || (user.email ? user.email.split('@')[0] : '2563912');
    document.getElementById('profile-studentNumber').textContent = studentNumber;
    
    // Fetch academic information from Profiles API
    fetchProfileData(user.id || user.email);
    
    // Logout button functionality
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
    
    // Mobile logout button functionality
    const mobileLogoutButton = document.getElementById('mobileLogoutButton');
    if (mobileLogoutButton) {
        mobileLogoutButton.addEventListener('click', handleLogout);
    }
    
    // Edit profile button functionality
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            window.location.href = 'edit-profile.html';
        });
    }
    
    // Change password button functionality
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            window.location.href = 'change-password.html';
        });
    }

    // Add visual feedback for empty fields
    const emptyFields = document.querySelectorAll('[data-empty="true"]');
    emptyFields.forEach(field => {
        if (!field.textContent || field.textContent === 'Not provided') {
            field.classList.add('text-muted');
            field.classList.add('font-italic');
        }
    });
    
    // Set welcome message with user's name
    const welcomeName = document.getElementById('welcomeName');
    if (welcomeName && user.name) {
        welcomeName.textContent = user.name.split(' ')[0]; // First name only
    }

    // Function to handle logout
    function handleLogout() {
        if (auth.handleLogout()) {
            // Clear any cached data
            sessionStorage.clear();
            localStorage.clear();
            
            // Redirect to landing page with cache-busting
            window.location.href = 'landing.html?t=' + new Date().getTime();
            
            // Prevent back navigation
            window.history.pushState(null, null, window.location.href);
            window.onpopstate = function() {
                window.history.go(1);
            };
        } else {
            alert('Logout failed. Please try again.');
        }
    }
    
    // Function to fetch profile data from API
    async function fetchProfileData(userIdentifier) {
        try {
            // First try to get all profiles and find the matching one
            const response = await fetch(PROFILES_URL);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const profiles = await response.json();
            
            // Find the profile that matches the current user
            // We'll try to match by email first, then by user ID if available
            const userProfile = profiles.find(profile => 
                profile.email === userIdentifier || 
                (userIdentifier.includes('@') && profile.email === userIdentifier) ||
                profile.user_id === userIdentifier
            );
            
            if (userProfile) {
                // Update academic information with data from API
                document.getElementById('faculty').textContent = userProfile.faculty || 'Not provided';
                document.getElementById('course').textContent = userProfile.course || 'Not provided';
                document.getElementById('yos').textContent = userProfile.year_of_study || 'Not provided';
                
                // Also update name and email if they're different from session storage
                if (userProfile.name && !document.getElementById('profile-name').textContent) {
                    document.getElementById('profile-name').textContent = userProfile.name;
                }
                
                if (userProfile.email && !document.getElementById('profile-email').textContent) {
                    document.getElementById('profile-email').textContent = userProfile.email;
                }
            } else {
                // If no profile found, set defaults
                setDefaultAcademicInfo();
            }
        } catch (error) {
            console.error('Error fetching profile data:', error);
            setDefaultAcademicInfo();
        }
    }

    // Function to set default academic information
    function setDefaultAcademicInfo() {
        document.getElementById('faculty').textContent = 'Not provided';
        document.getElementById('course').textContent = 'Not provided';
        document.getElementById('yos').textContent = 'Not provided';
        
        // Add visual styling to indicate missing data
        const academicFields = document.querySelectorAll('#faculty, #course, #yos');
        academicFields.forEach(field => {
            if (field.textContent === 'Not provided') {
                field.classList.add('text-muted');
                field.classList.add('font-italic');
            }
        });
    }
});