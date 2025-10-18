// login.js - Enhanced with proper error handling and production/development support
console.log('✅ login.js loaded - Enhanced version');

// DOM Elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const togglePasswordButton = document.querySelector('.toggle-password-visibility');
const formStatus = document.getElementById('formStatus');
const googleLoginButton = document.getElementById('googleLoginButton');
let resendVerificationLink = null;

// Configuration
const IS_PRODUCTION = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const BASE_URL = IS_PRODUCTION 
    ? 'https://wits-buddy-g9esajarfqe3dmh6.southafricanorth-01.azurewebsites.net'
    : 'http://localhost:3000';

console.log('🌐 Environment:', IS_PRODUCTION ? 'PRODUCTION' : 'DEVELOPMENT');
console.log('🔗 Base URL:', BASE_URL);

// Check if redirected from signup or other pages
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Login page loaded successfully');
    
    const urlParams = new URLSearchParams(window.location.search);
    
    // Handle redirect messages
    if (urlParams.get('error')) {
        const errorMessage = decodeURIComponent(urlParams.get('error'));
        showStatus(errorMessage, 'error');
        console.log('❌ Redirect error:', errorMessage);
    }
    
    if (urlParams.get('message')) {
        const successMessage = decodeURIComponent(urlParams.get('message'));
        showStatus(successMessage, 'success');
        console.log('✅ Redirect message:', successMessage);
    }

    // Handle from signup parameter
    if (urlParams.get('from') === 'signup') {
        showStatus('You have successfully registered. Please check your email for verification link.', 'success');
    }
    
    // Check if email verification was successful
    if (urlParams.has('verified') && urlParams.get('verified') === 'true') {
        showStatus('Email verified successfully! You can now sign in.', 'success');
        
        // Highlight the login form
        if (loginForm) {
            loginForm.classList.add('verified');
            setTimeout(() => {
                loginForm.classList.remove('verified');
            }, 2000);
        }
    }
    
    // Handle Google login callback
    handleGoogleLoginCallback();
    
    // Check if user is already logged in
    checkExistingSession();
});

// Check if user already has a valid session
function checkExistingSession() {
    try {
        const userData = sessionStorage.getItem('user');
        const accessToken = sessionStorage.getItem('access_token');
        
        if (userData && accessToken) {
            console.log('🔍 Found existing user session');
            const user = JSON.parse(userData);
            
            // Check if token is still valid (basic check)
            if (user.id && user.email) {
                console.log('🔄 User already logged in, redirecting to dashboard...');
                showStatus('Welcome back! Redirecting...', 'success');
                
                setTimeout(() => {
                    const dashboardUrl = getDashboardUrlByRole(user.role);
                    window.location.href = dashboardUrl;
                }, 1000);
            }
        }
    } catch (error) {
        console.error('❌ Error checking existing session:', error);
    }
}

// Toggle password visibility
if (togglePasswordButton) {
    togglePasswordButton.addEventListener('click', () => {
        const icon = togglePasswordButton.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
    });
}

// Google login button handler
if (googleLoginButton) {
    googleLoginButton.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('🔐 Google login clicked');
        
        // Get current URL for redirect back after login
        const currentUrl = window.location.href;
        
        // Show loading state
        const originalText = googleLoginButton.innerHTML;
        googleLoginButton.innerHTML = '<i class="fab fa-google"></i> Redirecting...';
        googleLoginButton.disabled = true;
        
        showStatus('Redirecting to Google...', 'info');
        
        // Redirect to Google OAuth
        setTimeout(() => {
            window.location.href = `/auth/google?redirect=${encodeURIComponent(currentUrl)}`;
        }, 500);
    });
}

// Handle Google login callback
function handleGoogleLoginCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const success = urlParams.get('success');
    const userData = urlParams.get('userData');

    if (error) {
        const errorMessage = decodeURIComponent(error);
        showStatus(`Google login failed: ${errorMessage}`, 'error');
        console.error('❌ Google login error:', errorMessage);
        return;
    }
    
    // Handle successful Google login with user data
    if (success === 'true' && userData) {
        try {
            console.log('✅ Google login successful, processing user data...');
            const parsedUserData = JSON.parse(decodeURIComponent(userData));
            
            // Store user data in session
            storeUserInSession(parsedUserData);
            
            showStatus('Google login successful! Redirecting...', 'success');
            
            // Get the user's role
            const userRole = parsedUserData.user_metadata?.role || 'student';
            console.log(`👤 User role: ${userRole}`);
            
            // Get the appropriate dashboard URL based on role
            const dashboardUrl = getDashboardUrlByRole(userRole);
            
            // Redirect to the appropriate dashboard
            setTimeout(() => {
                console.log('🔄 Redirecting to dashboard:', dashboardUrl);
                window.location.href = dashboardUrl;
            }, 1500);
            
        } catch (parseError) {
            console.error('❌ Error parsing Google user data:', parseError);
            showStatus('Error processing Google login. Please try again.', 'error');
        }
    }
}

// Create a resend verification email function
function createResendLink(email) {
    // First remove any existing link
    if (resendVerificationLink) {
        resendVerificationLink.remove();
        resendVerificationLink = null;
    }
    
    // Create new link
    resendVerificationLink = document.createElement('div');
    resendVerificationLink.className = 'resend-verification';
    resendVerificationLink.innerHTML = `
        <p style="margin: 10px 0; text-align: center;">
            Didn't receive verification email? 
            <a href="#" id="resendLink" style="color: #007bff; text-decoration: underline;">Resend it</a>
        </p>
    `;
    
    // Insert after form status
    if (formStatus && formStatus.parentNode) {
        formStatus.parentNode.insertBefore(resendVerificationLink, formStatus.nextSibling);
    }
    
    // Add event listener to resend link
    document.getElementById('resendLink').addEventListener('click', async (e) => {
        e.preventDefault();
        
        try {
            // Show loading state
            const resendLink = document.getElementById('resendLink');
            resendLink.textContent = 'Sending...';
            resendLink.style.pointerEvents = 'none';
            
            console.log('📧 Resending verification email to:', email);
            
            const response = await fetch('/api/resend-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            
            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                throw new Error('Unable to process server response. Please try again later.');
            }
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to resend verification email');
            }
            
            showStatus('Verification email resent. Please check your inbox.', 'success');
            
            // Reset link text after delay
            setTimeout(() => {
                resendLink.textContent = 'Resend it';
                resendLink.style.pointerEvents = 'auto';
            }, 3000);
            
        } catch (error) {
            console.error('❌ Resend verification error:', error);
            showStatus(error.message, 'error');
            
            // Reset link text
            const resendLink = document.getElementById('resendLink');
            resendLink.textContent = 'Resend it';
            resendLink.style.pointerEvents = 'auto';
        }
    });
}

/**
 * Get dashboard URL based on user role for both production and development
 * @param {string} role - User role (student, tutor)
 * @returns {string} - URL path to appropriate dashboard
 */
function getDashboardUrlByRole(role) {
    const normalizedRole = role ? role.toLowerCase() : 'student';
    
    if (IS_PRODUCTION) {
        // Production environment - serve from root
        switch (normalizedRole) {
            case 'tutor':
                return '/tutor-dash.html';
            case 'student':
            default:
                return '/Student-dash.html';
        }
    } else {
        // Local development - use /html subdirectory
        switch (normalizedRole) {
            case 'tutor':
                return '/html/tutor-dash.html';
            case 'student':
            default:
                return '/html/Student-dash.html';
        }
    }
}

/**
 * Store user data in session storage
 * @param {object} user - User data to store
 */
function storeUserInSession(user) {
    try {
        // Store essential user data in sessionStorage
        const userData = {
            id: user.id,
            email: user.email,
            role: user.user_metadata?.role || 'student',
            name: user.user_metadata?.name || '',
            faculty: user.user_metadata?.faculty || '',
            course: user.user_metadata?.course || '',
            year_of_study: user.user_metadata?.year_of_study || '',
            authProvider: user.user_metadata?.authProvider || 'email',
            lastLogin: new Date().toISOString()
        };
        
        sessionStorage.setItem('user', JSON.stringify(userData));
        
        // Store tokens in sessionStorage if available
        if (user.session) {
            sessionStorage.setItem('access_token', user.session.access_token);
            sessionStorage.setItem('refresh_token', user.session.refresh_token);
            sessionStorage.setItem('token_expiry', user.session.expires_at);
        }
        
        console.log('💾 User data stored in session:', userData);
        return true;
    } catch (error) {
        console.error('❌ Error storing user in sessionStorage:', error);
        return false;
    }
}

/**
 * Display status messages to user
 * @param {string} message - The message to display
 * @param {string} type - Message type: 'success', 'error', 'info', 'warning'
 */
function showStatus(message, type = 'info') {
    if (!formStatus) return;
    
    formStatus.textContent = message;
    formStatus.className = `form-status-message ${type}`;
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            if (formStatus.textContent === message) {
                formStatus.textContent = '';
                formStatus.className = 'form-status-message';
            }
        }, 5000);
    }
    
    console.log(`📝 Status (${type}):`, message);
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {boolean} - True if valid
 */
function isValidPassword(password) {
    return password && password.length >= 6;
}

// Form submission
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form values
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        console.log('📤 Form submission started:', { email: email.substring(0, 5) + '...' });
        
        // Validate fields
        if (!email || !password) {
            showStatus('Please enter both email and password', 'error');
            return;
        }
        
        if (!isValidEmail(email)) {
            showStatus('Please enter a valid email address', 'error');
            emailInput.focus();
            return;
        }
        
        if (!isValidPassword(password)) {
            showStatus('Password must be at least 6 characters long', 'error');
            passwordInput.focus();
            return;
        }
        
        // Show loading state
        const submitButton = loginForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        const originalButtonHTML = submitButton.innerHTML;
        
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
        
        showStatus('Signing in...', 'info');
        
        // Remove resend link if it exists
        if (resendVerificationLink) {
            resendVerificationLink.remove();
            resendVerificationLink = null;
        }
        
        try {
            console.log('🔄 Sending login request to server...');
            
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            console.log('📥 Login response status:', response.status);
            
            // Handle response data with proper error handling
            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                console.error('❌ Response parsing error:', parseError);
                
                if (response.status === 400) {
                    throw new Error('Account not found. Please check your email or sign up for a new account.');
                } else if (response.status === 401) {
                    throw new Error('Invalid login credentials. Please check your email and password.');
                } else if (response.status === 403) {
                    createResendLink(email);
                    throw new Error('Your email has not been verified. Please check your inbox for verification email.');
                } else {
                    throw new Error(`Login failed (${response.status}). Please try again later.`);
                }
            }
            
            if (!response.ok) {
                console.error('❌ Server returned error:', data);
                
                if (response.status === 403 && data.emailVerified === false) {
                    createResendLink(email);
                    throw new Error('Your email has not been verified. Please verify your email before logging in.');
                }
                
                if (response.status === 404) {
                    throw new Error('Account not found. Please check your email or sign up for a new account.');
                } else if (response.status === 401) {
                    throw new Error('Incorrect password. Please try again.');
                } else {
                    throw new Error(data.message || `Login failed (${response.status}). Please try again.`);
                }
            }
            
            // Success response
            console.log('✅ Login successful:', data);
            
            // Store user data in session storage
            const storageSuccess = storeUserInSession(data.user);
            if (!storageSuccess) {
                console.warn('⚠️ User data storage had issues, but continuing...');
            }
            
            showStatus('Login successful! Redirecting...', 'success');
            
            // Get the user's role from the user metadata
            const userRole = data.user?.user_metadata?.role || 'student';
            console.log(`🎯 User role detected: ${userRole}`);
            
            // Get the appropriate dashboard URL based on role
            const dashboardUrl = getDashboardUrlByRole(userRole);
            console.log(`🔄 Redirecting to: ${dashboardUrl}`);
            
            // Redirect to the appropriate dashboard after a short delay
            setTimeout(() => {
                window.location.href = dashboardUrl;
            }, 1500);
            
        } catch (error) {
            console.error('❌ Login error:', error);
            showStatus(error.message || 'An unexpected error occurred during login', 'error');
            
            // Reset submit button
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
            submitButton.innerHTML = originalButtonHTML;
        }
    });
}

// Add input event listeners for real-time validation
if (emailInput) {
    emailInput.addEventListener('input', () => {
        if (emailInput.value.trim() && !isValidEmail(emailInput.value.trim())) {
            emailInput.style.borderColor = '#ff6b6b';
        } else {
            emailInput.style.borderColor = '';
        }
    });
}

if (passwordInput) {
    passwordInput.addEventListener('input', () => {
        if (passwordInput.value && !isValidPassword(passwordInput.value)) {
            passwordInput.style.borderColor = '#ff6b6b';
        } else {
            passwordInput.style.borderColor = '';
        }
    });
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+Enter to submit form
    if (e.ctrlKey && e.key === 'Enter') {
        if (loginForm && emailInput.value && passwordInput.value) {
            loginForm.dispatchEvent(new Event('submit'));
        }
    }
    
    // Escape to clear form
    if (e.key === 'Escape') {
        if (emailInput) emailInput.value = '';
        if (passwordInput) passwordInput.value = '';
        if (formStatus) {
            formStatus.textContent = '';
            formStatus.className = 'form-status-message';
        }
    }
});

// Add page visibility change handler
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // Page became visible again, check session
        checkExistingSession();
    }
});

// Utility function to clear stored session (for debugging)
window.clearLoginSession = function() {
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('token_expiry');
    console.log('🧹 Login session cleared');
    showStatus('Session cleared', 'info');
};

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getDashboardUrlByRole,
        storeUserInSession,
        isValidEmail,
        isValidPassword,
        showStatus
    };
}

console.log('✅ login.js initialization complete - Ready for authentication');