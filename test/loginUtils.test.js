// loginUtils.test.js - Tests for login utility functions
const {
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
} = require('../src/frontend/test_utils/loginUtils');

// Mock sessionStorage
const mockSessionStorage = (() => {
    let store = {};
    return {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => {
            store[key] = value.toString();
        }),
        removeItem: jest.fn((key) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            store = {};
        })
    };
})();

// Mock fetch
global.fetch = jest.fn();

// Mock window and document
global.window = {
    location: {
        href: '',
        search: ''
    },
    sessionStorage: mockSessionStorage
};

global.URLSearchParams = jest.fn(() => ({
    get: jest.fn(),
    has: jest.fn()
}));

// Mock console.error to avoid test noise
console.error = jest.fn();

describe('Login Utility Functions', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        mockSessionStorage.clear();
        fetch.mockClear();
        console.error.mockClear();
        
        // Reset window location
        window.location.href = '';
        window.location.search = '';
    });

    describe('Constants', () => {
        test('API endpoints are defined correctly', () => {
            expect(API_ENDPOINTS.LOGIN).toBe('/api/login');
            expect(API_ENDPOINTS.RESEND_VERIFICATION).toBe('/api/resend-verification');
        });

        test('User roles are defined correctly', () => {
            expect(USER_ROLES.STUDENT).toBe('student');
            expect(USER_ROLES.TUTOR).toBe('tutor');
        });

        test('Dashboard URLs are defined correctly', () => {
            expect(DASHBOARD_URLS[USER_ROLES.STUDENT]).toBe('../html/student-dash.html');
            expect(DASHBOARD_URLS[USER_ROLES.TUTOR]).toBe('../html/tutor-dash.html');
        });

        test('Default dashboard URL is defined correctly', () => {
            const DEFAULT_DASHBOARD_URL = DASHBOARD_URLS[USER_ROLES.STUDENT];
            expect(DEFAULT_DASHBOARD_URL).toBe('../html/student-dash.html');
        });

        test('Session keys are defined correctly', () => {
            expect(SESSION_KEYS.USER).toBe('user');
            expect(SESSION_KEYS.ACCESS_TOKEN).toBe('access_token');
            expect(SESSION_KEYS.REFRESH_TOKEN).toBe('refresh_token');
        });
    });

    describe('Validation functions', () => {
        describe('validateEmail', () => {
            test('validates correct email formats', () => {
                expect(validateEmail('test@example.com')).toBe(true);
                expect(validateEmail('user.name@domain.co.uk')).toBe(true);
                expect(validateEmail('user+tag@example.org')).toBe(true);
                expect(validateEmail('user_name@domain.com')).toBe(true);
                expect(validateEmail('123@numbers.com')).toBe(true);
                expect(validateEmail('u@short.domain')).toBe(true);
            });

            test('handles edge cases', () => {
                expect(validateEmail('')).toBe(false);
                expect(validateEmail(null)).toBe(false);
                expect(validateEmail(undefined)).toBe(false);
                expect(validateEmail('   ')).toBe(false);
            });
        });

        describe('validatePassword', () => {

            test('accepts various password formats', () => {
                expect(validatePassword('password123')).toBe(true);
                expect(validatePassword('P@ssw0rd!')).toBe(true);
                expect(validatePassword('1234567890')).toBe(true);
                expect(validatePassword('a'.repeat(100))).toBe(true); // long password
            });
        });

        describe('validateLoginForm', () => {
            test('validates correct form data', () => {
                expect(validateLoginForm('test@example.com', 'password123')).toEqual([]);
                expect(validateLoginForm('user@domain.com', 'securepass')).toEqual([]);
            });

            test('validates empty email', () => {
                const errors = validateLoginForm('', 'password123');
                expect(errors).toContain('Email is required');
                expect(errors).not.toContain('Password is required');
            });

            test('validates invalid email format', () => {
                const errors = validateLoginForm('invalid-email', 'password123');
                expect(errors).toContain('Please enter a valid email address');
                expect(errors).not.toContain('Email is required');
            });

            test('validates empty password', () => {
                const errors = validateLoginForm('test@example.com', '');
                expect(errors).toContain('Password is required');
                expect(errors).not.toContain('Email is required');
            });

            test('validates short password', () => {
                const errors = validateLoginForm('test@example.com', 'short');
                expect(errors).toContain('Password must be at least 6 characters long');
                expect(errors).not.toContain('Password is required');
            });

            test('returns multiple errors for multiple invalid fields', () => {
                const errors = validateLoginForm('', 'short');
                expect(errors).toContain('Email is required');
                expect(errors).toContain('Password must be at least 6 characters long');
                expect(errors).toHaveLength(2);
            });

            test('handles null and undefined values', () => {
                expect(validateLoginForm(null, null)).toContain('Email is required');
                expect(validateLoginForm(null, null)).toContain('Password is required');
                expect(validateLoginForm(undefined, undefined)).toContain('Email is required');
                expect(validateLoginForm(undefined, undefined)).toContain('Password is required');
            });
        });
    });

    describe('Session management functions', () => {
        beforeEach(() => {
            mockSessionStorage.clear();
        });

        describe('getUserFromSession', () => {

            test('returns null when no user data exists', () => {
                mockSessionStorage.getItem.mockReturnValue(null);
                
                const result = getUserFromSession();
                
                expect(result).toBeNull();
            });

        });

        describe('isUserLoggedIn', () => {

            test('returns false when no user exists in session', () => {
                mockSessionStorage.getItem.mockReturnValue(null);
                
                const result = isUserLoggedIn();
                
                expect(result).toBe(false);
            });
        });
    });

    describe('Dashboard URL functions', () => {
        test('getDashboardUrlByRole returns correct URLs for all roles', () => {
            expect(getDashboardUrlByRole('student')).toBe('../html/student-dash.html');
            expect(getDashboardUrlByRole('tutor')).toBe('../html/tutor-dash.html');
            expect(getDashboardUrlByRole('STUDENT')).toBe('../html/student-dash.html');
            expect(getDashboardUrlByRole('TUTOR')).toBe('../html/tutor-dash.html');
            expect(getDashboardUrlByRole('Student')).toBe('../html/student-dash.html');
            expect(getDashboardUrlByRole('Tutor')).toBe('../html/tutor-dash.html');
        });
    });

    describe('API functions', () => {
        beforeEach(() => {
            fetch.mockClear();
        });

        describe('loginUser', () => {
            test('makes successful login API call', async () => {
                const mockResponse = {
                    ok: true,
                    status: 200,
                    json: jest.fn().mockResolvedValue({ 
                        user: { id: '123' },
                        session: { access_token: 'token123' }
                    })
                };
                fetch.mockResolvedValue(mockResponse);
                
                const result = await loginUser('test@example.com', 'password123');
                
                expect(fetch).toHaveBeenCalledWith('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: 'test@example.com',
                        password: 'password123'
                    })
                });
                
                expect(result.success).toBe(true);
                expect(result.status).toBe(200);
                expect(result.data.user.id).toBe('123');
                expect(result.error).toBeNull();
            });

            test('handles API errors with status codes', async () => {
                const mockResponse = {
                    ok: false,
                    status: 401,
                    json: jest.fn().mockResolvedValue({ 
                        message: 'Invalid credentials'
                    })
                };
                fetch.mockResolvedValue(mockResponse);
                
                const result = await loginUser('test@example.com', 'wrongpassword');
                
                expect(result.success).toBe(false);
                expect(result.status).toBe(401);
                expect(result.error).toBe('Invalid credentials');
                expect(result.data).toEqual({ message: 'Invalid credentials' });
            });

            test('handles API errors without message', async () => {
                const mockResponse = {
                    ok: false,
                    status: 500,
                    json: jest.fn().mockResolvedValue({})
                };
                fetch.mockResolvedValue(mockResponse);
                
                const result = await loginUser('test@example.com', 'password123');
                
                expect(result.success).toBe(false);
                expect(result.status).toBe(500);
                expect(result.error).toBe('Login failed (500)');
            });

            test('handles network errors', async () => {
                fetch.mockRejectedValue(new Error('Network error'));
                
                const result = await loginUser('test@example.com', 'password123');
                
                expect(result.success).toBe(false);
                expect(result.status).toBe(0);
                expect(result.error).toBe('Network error. Please check your connection and try again.');
                expect(result.data).toBeNull();
            });
        });

        describe('resendVerificationEmail', () => {
            test('makes successful resend verification API call', async () => {
                const mockResponse = {
                    ok: true,
                    status: 200,
                    json: jest.fn().mockResolvedValue({ success: true })
                };
                fetch.mockResolvedValue(mockResponse);
                
                const result = await resendVerificationEmail('test@example.com');
                
                expect(fetch).toHaveBeenCalledWith('/api/resend-verification', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email: 'test@example.com' })
                });
                
                expect(result.success).toBe(true);
                expect(result.status).toBe(200);
                expect(result.data.success).toBe(true);
                expect(result.error).toBeNull();
            });

            test('handles API errors', async () => {
                const mockResponse = {
                    ok: false,
                    status: 400,
                    json: jest.fn().mockResolvedValue({ 
                        message: 'Email not found'
                    })
                };
                fetch.mockResolvedValue(mockResponse);
                
                const result = await resendVerificationEmail('nonexistent@example.com');
                
                expect(result.success).toBe(false);
                expect(result.status).toBe(400);
                expect(result.error).toBe('Email not found');
            });

            test('handles network errors', async () => {
                fetch.mockRejectedValue(new Error('Network error'));
                
                const result = await resendVerificationEmail('test@example.com');
                
                expect(result.success).toBe(false);
                expect(result.status).toBe(0);
                expect(result.error).toBe('Network error. Please check your connection and try again.');
            });
        });
    });

    describe('URL parameter functions', () => {
        let mockUrlParams;

        beforeEach(() => {
            mockUrlParams = {
                get: jest.fn(),
                has: jest.fn()
            };
            URLSearchParams.mockReturnValue(mockUrlParams);
        });

        test('getParamFromUrl retrieves parameter value', () => {
            mockUrlParams.get.mockReturnValue('test-value');
            
            const value = getParamFromUrl('test');
            
            expect(mockUrlParams.get).toHaveBeenCalledWith('test');
            expect(value).toBe('test-value');
        });

        test('getParamFromUrl handles missing parameters', () => {
            mockUrlParams.get.mockReturnValue(null);
            
            const value = getParamFromUrl('nonexistent');
            
            expect(value).toBeNull();
        });

        test('hasUrlParam checks parameter existence', () => {
            mockUrlParams.has.mockReturnValue(true);
            
            const exists = hasUrlParam('test');
            
            expect(mockUrlParams.has).toHaveBeenCalledWith('test');
            expect(exists).toBe(true);
        });

        test('hasUrlParam returns false for missing parameters', () => {
            mockUrlParams.has.mockReturnValue(false);
            
            const exists = hasUrlParam('nonexistent');
            
            expect(exists).toBe(false);
        });
    });

    describe('Form status functions', () => {
        let mockElement;

        beforeEach(() => {
            mockElement = {
                textContent: '',
                className: ''
            };
        });

        test('setFormStatus sets message and class for success', () => {
            setFormStatus(mockElement, 'Success message', 'success');
            
            expect(mockElement.textContent).toBe('Success message');
            expect(mockElement.className).toBe('form-status-message success');
        });

        test('setFormStatus sets message and class for error', () => {
            setFormStatus(mockElement, 'Error message', 'error');
            
            expect(mockElement.textContent).toBe('Error message');
            expect(mockElement.className).toBe('form-status-message error');
        });

        test('setFormStatus sets message without type', () => {
            setFormStatus(mockElement, 'Info message');
            
            expect(mockElement.textContent).toBe('Info message');
            expect(mockElement.className).toBe('form-status-message ');
        });

        test('setFormStatus handles empty message', () => {
            setFormStatus(mockElement, '', 'success');
            
            expect(mockElement.textContent).toBe('');
            expect(mockElement.className).toBe('form-status-message success');
        });

        test('clearFormStatus clears element content and resets class', () => {
            mockElement.textContent = 'Some message';
            mockElement.className = 'form-status-message error';
            
            clearFormStatus(mockElement);
            
            expect(mockElement.textContent).toBe('');
            expect(mockElement.className).toBe('form-status-message');
        });
    });

    describe('Password visibility functions', () => {
        let passwordInput;
        let toggleButton;
        let mockIcon;

        beforeEach(() => {
            mockIcon = {
                classList: {
                    replace: jest.fn()
                }
            };
            
            passwordInput = {
                type: 'password'
            };
            
            toggleButton = {
                querySelector: jest.fn().mockReturnValue(mockIcon)
            };
        });

        test('togglePasswordVisibility toggles from password to text', () => {
            togglePasswordVisibility(passwordInput, toggleButton);
            
            expect(passwordInput.type).toBe('text');
            expect(toggleButton.querySelector).toHaveBeenCalledWith('i');
            expect(mockIcon.classList.replace).toHaveBeenCalledWith('fa-eye', 'fa-eye-slash');
        });

        test('togglePasswordVisibility toggles from text to password', () => {
            passwordInput.type = 'text';
            
            togglePasswordVisibility(passwordInput, toggleButton);
            
            expect(passwordInput.type).toBe('password');
            expect(mockIcon.classList.replace).toHaveBeenCalledWith('fa-eye-slash', 'fa-eye');
        });
    });

    describe('Button state functions', () => {
        let button;

        beforeEach(() => {
            button = {
                disabled: false,
                textContent: 'Submit',
                dataset: {}
            };
        });

        test('setButtonLoading sets loading state with custom text', () => {
            setButtonLoading(button, true, 'Processing...');
            
            expect(button.disabled).toBe(true);
            expect(button.dataset.originalText).toBe('Submit');
            expect(button.textContent).toBe('Processing...');
        });

        test('setButtonLoading sets loading state with default text', () => {
            setButtonLoading(button, true);
            
            expect(button.disabled).toBe(true);
            expect(button.dataset.originalText).toBe('Submit');
            expect(button.textContent).toBe('Loading...');
        });

        test('setButtonLoading restores normal state', () => {
            button.dataset.originalText = 'Original Text';
            
            setButtonLoading(button, false);
            
            expect(button.disabled).toBe(false);
            expect(button.textContent).toBe('Original Text');
        });

        test('setButtonLoading handles button without original text', () => {
            button.dataset.originalText = undefined;
            
            setButtonLoading(button, false);
            
            expect(button.disabled).toBe(false);
            expect(button.textContent).toBe('Submit'); // Stays the same
        });

        test('setButtonLoading handles multiple state changes', () => {
            // Set loading
            setButtonLoading(button, true, 'Loading...');
            expect(button.disabled).toBe(true);
            expect(button.textContent).toBe('Loading...');
            
            // Restore
            setButtonLoading(button, false);
            expect(button.disabled).toBe(false);
            expect(button.textContent).toBe('Submit');
            
            // Set loading again with different text
            setButtonLoading(button, true, 'Saving...');
            expect(button.disabled).toBe(true);
            expect(button.textContent).toBe('Saving...');
            expect(button.dataset.originalText).toBe('Submit');
        });
    });

    describe('Error handling functions', () => {
        test('handleLoginError returns correct error for status 400', () => {
            const result = handleLoginError('Custom error', 400, 'test@example.com');
            
            expect(result.message).toBe('Account not found. Please check your email or sign up for a new account.');
            expect(result.showResendLink).toBe(false);
            expect(result.email).toBeNull();
        });

        test('handleLoginError returns correct error for status 401', () => {
            const result = handleLoginError(null, 401, 'test@example.com');
            
            expect(result.message).toBe('Invalid login credentials. Please check your email and password.');
            expect(result.showResendLink).toBe(false);
            expect(result.email).toBeNull();
        });

        test('handleLoginError returns correct error for status 403', () => {
            const result = handleLoginError(null, 403, 'test@example.com');
            
            expect(result.message).toBe('Your email has not been verified. Please verify your email before logging in.');
            expect(result.showResendLink).toBe(true);
            expect(result.email).toBe('test@example.com');
        });

        test('handleLoginError returns correct error for status 404', () => {
            const result = handleLoginError('Not found', 404, 'test@example.com');
            
            expect(result.message).toBe('Account not found. Please check your email or sign up for a new account.');
            expect(result.showResendLink).toBe(false);
            expect(result.email).toBeNull();
        });

        test('handleLoginError returns correct error for status 500', () => {
            const result = handleLoginError(null, 500, 'test@example.com');
            
            expect(result.message).toBe('Server error. Please try again later.');
            expect(result.showResendLink).toBe(false);
            expect(result.email).toBeNull();
        });

        test('handleLoginError returns custom error message when provided', () => {
            const result = handleLoginError('Custom error message', 999, 'test@example.com');
            
            expect(result.message).toBe('Custom error message');
            expect(result.showResendLink).toBe(false);
            expect(result.email).toBeNull();
        });

        test('handleLoginError returns default message for unknown status without custom error', () => {
            const result = handleLoginError(null, 999, 'test@example.com');
            
            expect(result.message).toBe('An unexpected error occurred during login');
            expect(result.showResendLink).toBe(false);
            expect(result.email).toBeNull();
        });

        test('handleLoginError returns default message for status 0', () => {
            const result = handleLoginError(null, 0, 'test@example.com');
            
            expect(result.message).toBe('An unexpected error occurred during login');
            expect(result.showResendLink).toBe(false);
            expect(result.email).toBeNull();
        });

        test('handleLoginError handles various status codes', () => {
            const statusCodes = [402, 405, 408, 429, 502, 503, 504];
            
            statusCodes.forEach(status => {
                const result = handleLoginError(null, status, 'test@example.com');
                expect(result.message).toBe('An unexpected error occurred during login');
                expect(result.showResendLink).toBe(false);
            });
        });
    });

    describe('Edge cases and integration tests', () => {
        test('error flow simulation', async () => {
            // Mock failed login response
            const mockResponse = {
                ok: false,
                status: 403,
                json: jest.fn().mockResolvedValue({ message: 'Email not verified' })
            };
            fetch.mockResolvedValue(mockResponse);
            
            // Perform login
            const loginResult = await loginUser('test@example.com', 'password123');
            expect(loginResult.success).toBe(false);
            
            // Handle error
            const errorInfo = handleLoginError(loginResult.error, loginResult.status, 'test@example.com');
            expect(errorInfo.message).toContain('email has not been verified');
            expect(errorInfo.showResendLink).toBe(true);
            
            // Attempt to resend verification
            const mockResendResponse = {
                ok: true,
                status: 200,
                json: jest.fn().mockResolvedValue({ success: true })
            };
            fetch.mockResolvedValue(mockResendResponse);
            
            const resendResult = await resendVerificationEmail('test@example.com');
            expect(resendResult.success).toBe(true);
        });
    });
});