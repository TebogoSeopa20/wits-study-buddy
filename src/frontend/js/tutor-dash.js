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