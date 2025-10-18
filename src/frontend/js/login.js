// Updated login.js with proper dashboard redirection for students and tutors and Google login handling
// DOM Elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const togglePasswordButton = document.querySelector('.toggle-password-visibility');
const formStatus = document.getElementById('formStatus');
const googleLoginButton = document.getElementById('googleLoginButton');
let resendVerificationLink = null;

// Check if redirected from signup
document.addEventListener('DOMContentLoaded', () => {
    // Display message if coming from successful signup
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('from') === 'signup') {
        if (formStatus) {
            formStatus.textContent = 'You have successfully registered. Please check your email for verification link.';
            formStatus.className = 'form-status-message success';
        }
    }
    
    // Check if email verification was successful
    if (urlParams.has('verified') && urlParams.get('verified') === 'true') {
        if (formStatus) {
            formStatus.textContent = 'Email verified successfully! You can now sign in.';
            formStatus.className = 'form-status-message success';
        }
        
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
});

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
        const currentUrl = window.location.href;
        window.location.href = `/auth/google?redirect=${encodeURIComponent(currentUrl)}`;
    });
}

// Handle Google login callback
function handleGoogleLoginCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const success = urlParams.get('success');
    const userData = urlParams.get('userData');
    
    if (error) {
        if (formStatus) {
            formStatus.textContent = `Google login failed: ${decodeURIComponent(error)}`;
            formStatus.className = 'form-status-message error';
        }
    }
    
    // Handle successful Google login with user data
    if (success === 'true' && userData) {
        try {
            const parsedUserData = JSON.parse(decodeURIComponent(userData));
            
            // Store user data using auth.js
            if (auth && auth.handleGoogleLogin) {
                auth.handleGoogleLogin(parsedUserData);
            } else {
                // Fallback if auth.js is not available
                storeUserInSession(parsedUserData);
            }
            
            if (formStatus) {
                formStatus.textContent = 'Google login successful! Redirecting...';
                formStatus.className = 'form-status-message success';
            }
            
            // Get the user's role
            const userRole = parsedUserData.user_metadata?.role || 'student';
            
            // Get the appropriate dashboard URL based on role
            const dashboardUrl = getDashboardUrlByRole(userRole);
            
            // Redirect to the appropriate dashboard
            setTimeout(() => {
                window.location.href = dashboardUrl;
            }, 1500);
        } catch (parseError) {
            console.error('Error parsing Google user data:', parseError);
            if (formStatus) {
                formStatus.textContent = 'Error processing Google login. Please try again.';
                formStatus.className = 'form-status-message error';
            }
        }
    }
}

// Create a resend verification email function
function createResendLink(email) {
    // First remove any existing link
    if (resendVerificationLink) {
        resendVerificationLink.remove();
    }
    
    // Create new link
    resendVerificationLink = document.createElement('section');
    resendVerificationLink.className = 'resend-verification';
    resendVerificationLink.innerHTML = `
        <p>Didn't receive verification email? <a href="#" id="resendLink">Resend it</a></p>
    `;
    
    // Insert after form status
    if (formStatus) {
        formStatus.parentNode.insertBefore(resendVerificationLink, formStatus.nextSibling);
    }
    
    // Add event listener to resend link
    document.getElementById('resendLink').addEventListener('click', async (e) => {
        e.preventDefault();
        
        try {
            // Show loading state
            document.getElementById('resendLink').textContent = 'Sending...';
            
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
            
            if (formStatus) {
                formStatus.textContent = 'Verification email resent. Please check your inbox.';
                formStatus.className = 'form-status-message success';
            }
            
            // Reset link text
            document.getElementById('resendLink').textContent = 'Resend it';
        } catch (error) {
            console.error('Resend verification error:', error);
            if (formStatus) {
                formStatus.textContent = error.message;
                formStatus.className = 'form-status-message error';
            }
            
            // Reset link text
            document.getElementById('resendLink').textContent = 'Resend it';
        }
    });
}

/**
 * FIXED: Get dashboard URL based on user role for both production and development
 * @param {string} role - User role (student, tutor)
 * @returns {string} - URL path to appropriate dashboard
 */
function getDashboardUrlByRole(role) {
  const normalizedRole = role ? role.toLowerCase() : 'student';
  const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
  
  if (isProduction) {
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
        return '../html/tutor-dash.html';
      case 'student':
      default:
        return '../html/Student-dash.html';
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
        sessionStorage.setItem('user', JSON.stringify({
            id: user.id,
            email: user.email,
            role: user.user_metadata?.role || 'student', // Default to student
            name: user.user_metadata?.name || '',
            faculty: user.user_metadata?.faculty || '',
            course: user.user_metadata?.course || '',
            year_of_study: user.user_metadata?.year_of_study || '',
            authProvider: user.user_metadata?.authProvider || 'email'
        }));
        
        // Store tokens in sessionStorage
        if (user.session) {
            sessionStorage.setItem('access_token', user.session.access_token);
            sessionStorage.setItem('refresh_token', user.session.refresh_token);
        }
    } catch (error) {
        console.error('Error storing user in sessionStorage:', error);
    }
}

// Form submission
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validate fields
        if (!emailInput.value || !passwordInput.value) {
            if (formStatus) {
                formStatus.textContent = 'Please enter both email and password';
                formStatus.className = 'form-status-message error';
            }
            return;
        }
        
        // Show loading state
        const submitButton = loginForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Signing In...';
        if (formStatus) {
            formStatus.textContent = '';
            formStatus.className = 'form-status-message';
        }
        
        // Remove resend link if it exists
        if (resendVerificationLink) {
            resendVerificationLink.remove();
            resendVerificationLink = null;
        }
        
        try {
            // Send login request to server
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: emailInput.value,
                    password: passwordInput.value
                })
            });
            
            // Handle response data with proper error handling
            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                console.error('Response parsing error:', parseError);
                
                if (response.status === 400) {
                    throw new Error('Account not found. Please check your email or sign up for a new account.');
                } else if (response.status === 401) {
                    throw new Error('Invalid login credentials. Please check your email and password.');
                } else if (response.status === 403) {
                    createResendLink(emailInput.value);
                    throw new Error('Your email has not been verified. Please check your inbox for verification email.');
                } else {
                    throw new Error(`Login failed (${response.status}). Please try again later.`);
                }
            }
            
            if (!response.ok) {
                if (response.status === 403 && data.emailVerified === false) {
                    createResendLink(emailInput.value);
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
            
            // Store user data in session storage
            storeUserInSession(data.user);
            
            // Show success message
            if (formStatus) {
                formStatus.textContent = 'Login successful! Redirecting...';
                formStatus.className = 'form-status-message success';
            }
            
            // Get the user's role from the user metadata
            const userRole = data.user?.user_metadata?.role || 'student';
            
            // Get the appropriate dashboard URL based on role
            const dashboardUrl = getDashboardUrlByRole(userRole);
            
            // Redirect to the appropriate dashboard
            setTimeout(() => {
                window.location.href = dashboardUrl;
            }, 1500);
            
        } catch (error) {
            console.error('Login error:', error);
            if (formStatus) {
                formStatus.textContent = error.message || 'An error occurred during login';
                formStatus.className = 'form-status-message error';
            }
            
            // Reset submit button
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });
}