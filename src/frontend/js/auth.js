// src/auth.js
const auth = {
    isLoggedIn: function() {
        return sessionStorage.getItem('user') !== null;
    },

    getCurrentUser: function() {
        const userData = sessionStorage.getItem('user');
        return userData ? JSON.parse(userData) : null;
    },

    getUserRole: function() {
        const user = this.getCurrentUser();
        return user?.role || null;
    },

    getAccessToken: function() {
        return sessionStorage.getItem('access_token');
    },

    getRefreshToken: function() {
        return sessionStorage.getItem('refresh_token');
    },

    handleLogin: function(userData) {
        try {
            // Extract user metadata from either user_metadata or raw user data
            const userMetadata = userData.user_metadata || {};
            const appMetadata = userData.app_metadata || {};
            
            // Create user object with all profile fields
            const user = {
                id: userData.id,
                email: userData.email,
                role: userMetadata.role || 'student', // Default to student if no role specified
                name: userMetadata.name || '',
                phone: userMetadata.phone || '',
                faculty: userMetadata.faculty || '',
                course: userMetadata.course || '',
                year_of_study: userMetadata.year_of_study || '',
                studentNumber: userMetadata.studentNumber || (userData.email ? userData.email.split('@')[0] : ''),
                authProvider: userMetadata.authProvider || 'email',
                created_at: userData.created_at || new Date().toISOString()
            };

            // Store user data in sessionStorage
            sessionStorage.setItem('user', JSON.stringify(user));

            // Store tokens if available
            if (userData.session) {
                sessionStorage.setItem('access_token', userData.session.access_token);
                sessionStorage.setItem('refresh_token', userData.session.refresh_token);
            }

            return true;
        } catch (error) {
            console.error('Login handling error:', error);
            return false;
        }
    },

    handleLogout: function() {
        try {
            // Clear all auth-related data from sessionStorage
            sessionStorage.removeItem('user');
            sessionStorage.removeItem('access_token');
            sessionStorage.removeItem('refresh_token');
            return true;
        } catch (error) {
            console.error('Logout handling error:', error);
            return false;
        }
    },

    parseJwt: function(token) {
        try {
            if (!token) return null;
            
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Failed to parse JWT:', error);
            return null;
        }
    },

    // Additional helper methods for profile data
    getUserProfile: function() {
        const user = this.getCurrentUser();
        if (!user) return null;

        return {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
            phone: user.phone,
            faculty: user.faculty,
            course: user.course,
            year_of_study: user.year_of_study,
            studentNumber: user.studentNumber,
            authProvider: user.authProvider
        };
    },

    // Check if user has specific role
    hasRole: function(role) {
        const userRole = this.getUserRole();
        return userRole === role;
    },

    // Check if user is a student
    isStudent: function() {
        return this.hasRole('student');
    },

    // Check if user is a tutor
    isTutor: function() {
        return this.hasRole('tutor');
    }
};

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = auth;
}

// Make available in browser global scope if not using modules
if (typeof window !== 'undefined') {
    window.auth = auth;
}