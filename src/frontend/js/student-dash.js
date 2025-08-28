document.addEventListener('DOMContentLoaded', () => {
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
        } catch (error) {
            console.error('Error processing Google login data:', error);
        }
    }
    
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