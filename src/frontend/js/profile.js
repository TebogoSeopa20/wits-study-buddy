// profile.js
document.addEventListener('DOMContentLoaded', () => {
    // Get user data from session storage
    const user = auth.getCurrentUser();
    
    if (!user) {
        // If no user is logged in, redirect to login page
        window.location.href = 'login.html';
        return;
    }
    
    // Display user information with proper fallbacks
    document.getElementById('profile-name').textContent = user.name || 'Tebogo Seopa';
    document.getElementById('profile-email').textContent = user.email || '2563912@students.wits.ac.za';
    
    // For student number: use the one from email if not provided
    const studentNumber = user.studentNumber || (user.email ? user.email.split('@')[0] : '2563912');
    document.getElementById('profile-studentNumber').textContent = studentNumber;
    
    // Set faculty to default if not provided
    document.getElementById('faculty').textContent = user.faculty || 'Not provided';
    
    // Set course to default if not provided
    document.getElementById('course').textContent = user.course || 'Not provided';
    
    // Set year of study to default if not provided
    document.getElementById('yos').textContent = user.year_of_study || 'Not provided';
    
    // Logout button functionality
    document.getElementById('logoutButton').addEventListener('click', () => {
        if (auth.handleLogout()) {
            window.location.href = 'login.html';
        } else {
            alert('Logout failed. Please try again.');
        }
    });
    
    // Edit profile button functionality
    document.getElementById('editProfileBtn').addEventListener('click', () => {
        window.location.href = 'edit-profile.html';
    });
    
    // Change password button functionality
    document.getElementById('changePasswordBtn').addEventListener('click', () => {
        window.location.href = 'change-password.html';
    });

    // Add visual feedback for empty fields
    const emptyFields = document.querySelectorAll('[data-empty="true"]');
    emptyFields.forEach(field => {
        if (!field.textContent || field.textContent === 'Not provided') {
            field.classList.add('text-muted');
            field.classList.add('font-italic');
        }
    });
});
        document.addEventListener('DOMContentLoaded', () => {
            const user = auth.getCurrentUser();
            
            if (!user) {
                window.location.href = 'login.html';
                return;
            }
            
            // Set welcome message with user's name
            const welcomeName = document.getElementById('welcomeName');
            if (welcomeName && user.name) {
                welcomeName.textContent = user.name.split(' ')[0]; // First name only
            }
            
            // Logout functionality
            const logoutButtons = document.querySelectorAll('#logoutButton, #mobileLogoutButton');
            logoutButtons.forEach(button => {
                button.addEventListener('click', () => {
                    auth.handleLogout();
                    window.location.href = 'login.html';
                });
            });
        });
            // Logout functionality
            const logoutButtons = document.querySelectorAll('#logoutButton, #mobileLogoutButton');
            logoutButtons.forEach(button => {
                button.addEventListener('click', () => {
                    auth.handleLogout();
                    window.location.href = 'login.html';
                });
            });