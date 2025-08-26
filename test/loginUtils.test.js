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

describe('Login Utility Functions', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        mockSessionStorage.clear();
        fetch.mockClear();
        
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

        test('Session keys are defined correctly', () => {
            expect(SESSION_KEYS.USER).toBe('user');
            expect(SESSION_KEYS.ACCESS_TOKEN).toBe('access_token');
            expect(SESSION_KEYS.REFRESH_TOKEN).toBe('refresh_token');
        });
    });

    describe('Validation functions', () => {
        test('validateEmail validates email correctly', () => {
            expect(validateEmail('test@example.com')).toBe(true);
            expect(validateEmail('user.name@domain.co.uk')).toBe(true);
            expect(validateEmail('invalid-email')).toBe(false);
            expect(validateEmail('@domain.com')).toBe(false);
            expect(validateEmail('')).toBe(false);
            expect(validateEmail(null)).toBe(false);
        });

        test('validateLoginForm validates form data correctly', () => {
            // Valid case
            expect(validateLoginForm('test@example.com', 'password123')).toEqual([]);
            
            // Invalid cases
            expect(validateLoginForm('', 'password123')).toContain('Email is required');
            expect(validateLoginForm('invalid-email', 'password123')).toContain('Please enter a valid email address');
            expect(validateLoginForm('test@example.com', '')).toContain('Password is required');
            expect(validateLoginForm('test@example.com', 'short')).toContain('Password must be at least 6 characters long');
            
            // Multiple errors
            const errors = validateLoginForm('', 'short');
            expect(errors).toContain('Email is required');
            expect(errors).toContain('Password must be at least 6 characters long');
        });
    });

    describe('Session management functions', () => {
        const mockUser = {
            id: '123',
            email: 'test@example.com',
            user_metadata: {
                role: 'student',
                name: 'Test User',
                faculty: 'Science',
                course: 'Computer Science',
                year_of_study: '2nd Year'
            },
            session: {
                access_token: 'access123',
                refresh_token: 'refresh123'
            }
        };
    });

    describe('Dashboard URL functions', () => {
        test('getDashboardUrlByRole returns correct URLs', () => {
            expect(getDashboardUrlByRole('student')).toBe('../html/student-dash.html');
            expect(getDashboardUrlByRole('tutor')).toBe('../html/tutor-dash.html');
            expect(getDashboardUrlByRole('STUDENT')).toBe('../html/student-dash.html'); // case insensitive
            expect(getDashboardUrlByRole('invalid')).toBe('../html/student-dash.html'); // default
            expect(getDashboardUrlByRole(null)).toBe('../html/student-dash.html'); // default
            expect(getDashboardUrlByRole(undefined)).toBe('../html/student-dash.html'); // default
        });
    });

    describe('API functions', () => {
        beforeEach(() => {
            fetch.mockClear();
        });

        test('loginUser makes correct API call', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: jest.fn().mockResolvedValue({ user: { id: '123' } })
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
        });

        test('loginUser handles network errors', async () => {
            fetch.mockRejectedValue(new Error('Network error'));
            
            const result = await loginUser('test@example.com', 'password123');
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Network error. Please check your connection and try again.');
        });

        test('resendVerificationEmail makes correct API call', async () => {
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
        });
    });

    describe('URL parameter functions', () => {
        beforeEach(() => {
            URLSearchParams.mockClear();
        });

        test('getUrlParams creates URLSearchParams instance', () => {
            getUrlParams();
            expect(URLSearchParams).toHaveBeenCalledWith(window.location.search);
        });

        test('getParamFromUrl gets parameter value', () => {
            const mockGet = jest.fn().mockReturnValue('test-value');
            URLSearchParams.mockReturnValue({ get: mockGet });
            
            const value = getParamFromUrl('test');
            
            expect(mockGet).toHaveBeenCalledWith('test');
            expect(value).toBe('test-value');
        });

        test('hasUrlParam checks parameter existence', () => {
            const mockHas = jest.fn().mockReturnValue(true);
            URLSearchParams.mockReturnValue({ has: mockHas });
            
            const exists = hasUrlParam('test');
            
            expect(mockHas).toHaveBeenCalledWith('test');
            expect(exists).toBe(true);
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

        test('setFormStatus sets message and class', () => {
            setFormStatus(mockElement, 'Test message', 'success');
            
            expect(mockElement.textContent).toBe('Test message');
            expect(mockElement.className).toBe('form-status-message success');
        });

        test('setFormStatus works without type', () => {
            setFormStatus(mockElement, 'Test message');
            
            expect(mockElement.textContent).toBe('Test message');
            expect(mockElement.className).toBe('form-status-message ');
        });

        test('clearFormStatus clears element', () => {
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

        beforeEach(() => {
            passwordInput = {
                type: 'password'
            };
            
            toggleButton = {
                querySelector: jest.fn().mockReturnValue({
                    classList: {
                        replace: jest.fn()
                    }
                })
            };
        });

        test('togglePasswordVisibility toggles from password to text', () => {
            togglePasswordVisibility(passwordInput, toggleButton);
            
            expect(passwordInput.type).toBe('text');
            expect(toggleButton.querySelector).toHaveBeenCalledWith('i');
        });

        test('togglePasswordVisibility toggles from text to password', () => {
            passwordInput.type = 'text';
            
            togglePasswordVisibility(passwordInput, toggleButton);
            
            expect(passwordInput.type).toBe('password');
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

        test('setButtonLoading sets loading state', () => {
            setButtonLoading(button, true, 'Loading...');
            
            expect(button.disabled).toBe(true);
            expect(button.dataset.originalText).toBe('Submit');
            expect(button.textContent).toBe('Loading...');
        });

        test('setButtonLoading restores normal state', () => {
            button.dataset.originalText = 'Submit';
            
            setButtonLoading(button, false);
            
            expect(button.disabled).toBe(false);
            expect(button.textContent).toBe('Submit');
        });
    });

    describe('Error handling functions', () => {
        test('handleLoginError returns correct error for status 400', () => {
            const result = handleLoginError(null, 400, 'test@example.com');
            
            expect(result.message).toBe('Account not found. Please check your email or sign up for a new account.');
            expect(result.showResendLink).toBe(false);
        });

        test('handleLoginError returns correct error for status 401', () => {
            const result = handleLoginError(null, 401, 'test@example.com');
            
            expect(result.message).toBe('Invalid login credentials. Please check your email and password.');
            expect(result.showResendLink).toBe(false);
        });

        test('handleLoginError returns correct error for status 403', () => {
            const result = handleLoginError(null, 403, 'test@example.com');
            
            expect(result.message).toBe('Your email has not been verified. Please verify your email before logging in.');
            expect(result.showResendLink).toBe(true);
            expect(result.email).toBe('test@example.com');
        });

        test('handleLoginError returns correct error for status 404', () => {
            const result = handleLoginError(null, 404, 'test@example.com');
            
            expect(result.message).toBe('Account not found. Please check your email or sign up for a new account.');
            expect(result.showResendLink).toBe(false);
        });

        test('handleLoginError returns correct error for status 500', () => {
            const result = handleLoginError(null, 500, 'test@example.com');
            
            expect(result.message).toBe('Server error. Please try again later.');
            expect(result.showResendLink).toBe(false);
        });

        test('handleLoginError returns default message for unknown status', () => {
            const result = handleLoginError(null, 999, 'test@example.com');
            
            expect(result.message).toBe('An unexpected error occurred during login');
        });
    });
});