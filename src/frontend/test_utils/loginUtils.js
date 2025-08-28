// loginUtils.js - Utility functions for login functionality

// API endpoints
const API_ENDPOINTS = {
    LOGIN: '/api/login',
    RESEND_VERIFICATION: '/api/resend-verification'
};

// User roles and their dashboard URLs
const USER_ROLES = {
    STUDENT: 'student',
    TUTOR: 'tutor'
};

const DASHBOARD_URLS = {
    [USER_ROLES.STUDENT]: '../html/student-dash.html',
    [USER_ROLES.TUTOR]: '../html/tutor-dash.html'
};

// Default dashboard URL
const DEFAULT_DASHBOARD_URL = DASHBOARD_URLS[USER_ROLES.STUDENT];

// Session storage keys
const SESSION_KEYS = {
    USER: 'user',
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token'
};

// Validation functions
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    return password && password.length >= 6;
}

function validateLoginForm(email, password) {
    const errors = [];
    
    if (!email) {
        errors.push('Email is required');
    } else if (!validateEmail(email)) {
        errors.push('Please enter a valid email address');
    }
    
    if (!password) {
        errors.push('Password is required');
    } else if (!validatePassword(password)) {
        errors.push('Password must be at least 6 characters long');
    }
    
    return errors;
}

// Session management functions
function storeUserInSession(user) {
    try {
        // Store essential user data in sessionStorage
        sessionStorage.setItem(SESSION_KEYS.USER, JSON.stringify({
            id: user.id,
            email: user.email,
            role: user.user_metadata?.role || USER_ROLES.STUDENT,
            name: user.user_metadata?.name || '',
            faculty: user.user_metadata?.faculty || '',
            course: user.user_metadata?.course || '',
            year_of_study: user.user_metadata?.year_of_study || ''
        }));
        
        // Store tokens in sessionStorage
        if (user.session) {
            sessionStorage.setItem(SESSION_KEYS.ACCESS_TOKEN, user.session.access_token);
            sessionStorage.setItem(SESSION_KEYS.REFRESH_TOKEN, user.session.refresh_token);
        }
        
        return true;
    } catch (error) {
        console.error('Error storing user in sessionStorage:', error);
        return false;
    }
}

function getUserFromSession() {
    try {
        const userData = sessionStorage.getItem(SESSION_KEYS.USER);
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        console.error('Error retrieving user from sessionStorage:', error);
        return null;
    }
}

function clearSession() {
    try {
        sessionStorage.removeItem(SESSION_KEYS.USER);
        sessionStorage.removeItem(SESSION_KEYS.ACCESS_TOKEN);
        sessionStorage.removeItem(SESSION_KEYS.REFRESH_TOKEN);
        return true;
    } catch (error) {
        console.error('Error clearing sessionStorage:', error);
        return false;
    }
}

function isUserLoggedIn() {
    return !!getUserFromSession();
}

// Dashboard URL functions
function getDashboardUrlByRole(role) {
    if (!role) return DEFAULT_DASHBOARD_URL;
    
    const normalizedRole = role.toLowerCase();
    return DASHBOARD_URLS[normalizedRole] || DEFAULT_DASHBOARD_URL;
}

function redirectToDashboard(role) {
    const dashboardUrl = getDashboardUrlByRole(role);
    window.location.href = dashboardUrl;
}

// API functions
async function loginUser(email, password) {
    try {
        const response = await fetch(API_ENDPOINTS.LOGIN, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        return {
            success: response.ok,
            status: response.status,
            data: data,
            error: !response.ok ? data.message || `Login failed (${response.status})` : null
        };
    } catch (error) {
        console.error('Login API error:', error);
        return {
            success: false,
            status: 0,
            data: null,
            error: 'Network error. Please check your connection and try again.'
        };
    }
}

async function resendVerificationEmail(email) {
    try {
        const response = await fetch(API_ENDPOINTS.RESEND_VERIFICATION, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        return {
            success: response.ok,
            status: response.status,
            data: data,
            error: !response.ok ? data.message || `Failed to resend verification email (${response.status})` : null
        };
    } catch (error) {
        console.error('Resend verification API error:', error);
        return {
            success: false,
            status: 0,
            data: null,
            error: 'Network error. Please check your connection and try again.'
        };
    }
}

// URL parameter functions
function getUrlParams() {
    return new URLSearchParams(window.location.search);
}

function getParamFromUrl(param) {
    return getUrlParams().get(param);
}

function hasUrlParam(param) {
    return getUrlParams().has(param);
}

// Form status functions
function setFormStatus(element, message, type = '') {
    if (!element) return;
    
    element.textContent = message;
    element.className = `form-status-message ${type}`;
}

function clearFormStatus(element) {
    if (!element) return;
    
    element.textContent = '';
    element.className = 'form-status-message';
}

// Password visibility functions
function togglePasswordVisibility(passwordInput, toggleButton) {
    if (!passwordInput || !toggleButton) return;
    
    const icon = toggleButton.querySelector('i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

// Button state functions
function setButtonLoading(button, isLoading, loadingText = 'Loading...') {
    if (!button) return;
    
    if (isLoading) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.textContent = loadingText;
    } else {
        button.disabled = false;
        if (button.dataset.originalText) {
            button.textContent = button.dataset.originalText;
        }
    }
}

// Error handling functions
function handleLoginError(error, status, email) {
    let errorMessage = 'An unexpected error occurred during login';
    let shouldShowResendLink = false;
    
    switch (status) {
        case 400:
            errorMessage = 'Account not found. Please check your email or sign up for a new account.';
            break;
        case 401:
            errorMessage = 'Invalid login credentials. Please check your email and password.';
            break;
        case 403:
            errorMessage = 'Your email has not been verified. Please verify your email before logging in.';
            shouldShowResendLink = true;
            break;
        case 404:
            errorMessage = 'Account not found. Please check your email or sign up for a new account.';
            break;
        case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
        default:
            if (error) {
                errorMessage = error;
            }
            break;
    }
    
    return {
        message: errorMessage,
        showResendLink: shouldShowResendLink,
        email: shouldShowResendLink ? email : null
    };
}

module.exports = {
    API_ENDPOINTS,
    USER_ROLES,
    DASHBOARD_URLS,
    SESSION_KEYS,
    validateEmail,
    validatePassword,
    validateLoginForm,
    storeUserInSession,
    getUserFromSession,
    clearSession,
    isUserLoggedIn,
    getDashboardUrlByRole,
    redirectToDashboard,
    loginUser,
    resendVerificationEmail,
    getUrlParams,
    getParamFromUrl,
    hasUrlParam,
    setFormStatus,
    clearFormStatus,
    togglePasswordVisibility,
    setButtonLoading,
    handleLoginError
};