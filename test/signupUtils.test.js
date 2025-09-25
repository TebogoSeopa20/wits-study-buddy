// signupUtils.test.js - Tests for signup utility functions
const {
    VALIDATION_RULES,
    FACULTY_COURSES,
    validateName,
    validateWitsEmail,
    validateSouthAfricanPhone,
    validatePassword,
    validatePasswordMatch,
    validateRequiredField,
    validateTermsAgreement,
    validateFormData,
    sanitizeFormData,
    getCoursesForFaculty,
    populateCourseSelect
} = require('../src/frontend/test_utils/signupUtils');

// Mock DOM elements for testing
const mockInput = {
    value: '',
    id: 'test-input',
    classList: {
        add: jest.fn(),
        remove: jest.fn()
    },
    closest: jest.fn().mockReturnValue({
        classList: {
            add: jest.fn(),
            remove: jest.fn()
        }
    })
};

const mockErrorElement = {
    textContent: '',
    style: { display: 'none' },
    classList: { contains: jest.fn().mockReturnValue(true) }
};

// Mock document methods
global.document = {
    querySelector: jest.fn().mockImplementation((selector) => {
        if (selector === 'output[for="test-input"]' || selector === '#test-input + *') {
            return mockErrorElement;
        }
        return null;
    }),
    createElement: jest.fn().mockReturnValue({
        innerHTML: '',
        appendChild: jest.fn(),
        disabled: false
    })
};

describe('Signup Utility Functions', () => {
    describe('Constants', () => {
        test('VALIDATION_RULES contains correct rules', () => {
            expect(VALIDATION_RULES.NAME.PATTERN).toBeInstanceOf(RegExp);
            expect(VALIDATION_RULES.EMAIL.PATTERN).toBeInstanceOf(RegExp);
            expect(VALIDATION_RULES.PASSWORD.MIN_LENGTH).toBe(8);
        });

        test('FACULTY_COURSES contains faculty data', () => {
            expect(FACULTY_COURSES).toHaveProperty('Faculty of Commerce, Law & Management');
            expect(FACULTY_COURSES).toHaveProperty('Faculty of Engineering & the Built Environment');
            expect(FACULTY_COURSES).toHaveProperty('Faculty of Health Sciences');
            expect(FACULTY_COURSES).toHaveProperty('Faculty of Humanities');
            expect(FACULTY_COURSES).toHaveProperty('Faculty of Science');
        });
    });

    describe('Validation Functions', () => {
        describe('validateName', () => {
            test('validates correct names', () => {
                expect(validateName('John Doe')).toEqual({ isValid: true, error: null });
                expect(validateName('Mary-Jane Smith')).toEqual({ isValid: true, error: null });
                expect(validateName("O'Brian")).toEqual({ isValid: true, error: null });
            });

            test('rejects empty names', () => {
                const result = validateName('');
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('required');
            });

            test('rejects names with invalid characters', () => {
                const result = validateName('John123');
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Only letters');
            });

            test('rejects names that are too short', () => {
                const result = validateName('J');
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('at least');
            });

            test('rejects names that are too long', () => {
                const longName = 'A'.repeat(51);
                const result = validateName(longName);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('less than');
            });
        });

        describe('validateWitsEmail', () => {
            test('validates correct Wits emails', () => {
                expect(validateWitsEmail('1234567@students.wits.ac.za')).toEqual({ isValid: true, error: null });
                expect(validateWitsEmail('9876543@students.wits.ac.za')).toEqual({ isValid: true, error: null });
            });

            test('rejects invalid Wits emails', () => {
                expect(validateWitsEmail('john@example.com')).toEqual({ isValid: false, error: expect.any(String) });
                expect(validateWitsEmail('1234567@wits.ac.za')).toEqual({ isValid: false, error: expect.any(String) });
                expect(validateWitsEmail('@students.wits.ac.za')).toEqual({ isValid: false, error: expect.any(String) });
            });

            test('rejects empty emails', () => {
                const result = validateWitsEmail('');
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('required');
            });
        });

        describe('validateSouthAfricanPhone', () => {
            test('validates correct international format', () => {
                expect(validateSouthAfricanPhone('+27612345678')).toEqual({ isValid: true, error: null });
                expect(validateSouthAfricanPhone('+27712345678')).toEqual({ isValid: true, error: null });
                expect(validateSouthAfricanPhone('+27812345678')).toEqual({ isValid: true, error: null });
            });

            test('validates correct local format', () => {
                expect(validateSouthAfricanPhone('0612345678')).toEqual({ isValid: true, error: null });
                expect(validateSouthAfricanPhone('0712345678')).toEqual({ isValid: true, error: null });
                expect(validateSouthAfricanPhone('0812345678')).toEqual({ isValid: true, error: null });
            });

            test('rejects invalid formats', () => {
                expect(validateSouthAfricanPhone('1234567890')).toEqual({ isValid: false, error: expect.any(String) });
                expect(validateSouthAfricanPhone('+27123456789')).toEqual({ isValid: false, error: expect.any(String) });
                expect(validateSouthAfricanPhone('0512345678')).toEqual({ isValid: false, error: expect.any(String) });
            });

            test('rejects wrong lengths', () => {
                expect(validateSouthAfricanPhone('+2761234567')).toEqual({ isValid: false, error: expect.any(String) });
                expect(validateSouthAfricanPhone('061234567')).toEqual({ isValid: false, error: expect.any(String) });
            });
        });

        describe('validatePassword', () => {
            test('validates strong passwords', () => {
                const result = validatePassword('StrongPass123!');
                expect(result.isValid).toBe(true);
                expect(result.requirements.length).toBe(true);
                expect(result.requirements.uppercase).toBe(true);
                expect(result.requirements.lowercase).toBe(true);
                expect(result.requirements.number).toBe(true);
                expect(result.requirements.special).toBe(true);
            });

            test('rejects weak passwords', () => {
                const weakResults = [
                    validatePassword('short'),      // Too short
                    validatePassword('nouppercase123!'), // No uppercase
                    validatePassword('NOLOWERCASE123!'), // No lowercase
                    validatePassword('NoNumbers!'),      // No numbers
                    validatePassword('NoSpecial123')     // No special chars
                ];

                weakResults.forEach(result => {
                    expect(result.isValid).toBe(false);
                    expect(result.missing.length).toBeGreaterThan(0);
                });
            });
        });

        describe('validatePasswordMatch', () => {
            test('validates matching passwords', () => {
                expect(validatePasswordMatch('password123', 'password123')).toEqual({ isValid: true, error: null });
            });

            test('rejects mismatching passwords', () => {
                const result = validatePasswordMatch('password123', 'different');
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('do not match');
            });
        });

        describe('validateRequiredField', () => {
            test('validates non-empty fields', () => {
                expect(validateRequiredField('value', 'Field')).toEqual({ isValid: true, error: null });
                expect(validateRequiredField(123, 'Field')).toEqual({ isValid: true, error: null });
            });

            test('rejects empty fields', () => {
                const results = [
                    validateRequiredField('', 'Field'),
                    validateRequiredField(null, 'Field'),
                    validateRequiredField(undefined, 'Field')
                ];

                results.forEach(result => {
                    expect(result.isValid).toBe(false);
                    expect(result.error).toContain('required');
                });
            });
        });

        describe('validateTermsAgreement', () => {
            test('validates agreed terms', () => {
                expect(validateTermsAgreement(true)).toEqual({ isValid: true, error: null });
            });

            test('rejects disagreed terms', () => {
                const result = validateTermsAgreement(false);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('must agree');
            });
        });
    });

    describe('Form Data Processing', () => {
        describe('sanitizeFormData', () => {
            test('trims string values', () => {
                const formData = {
                    name: '  John Doe  ',
                    email: 'test@example.com  ',
                    number: 123
                };

                const sanitized = sanitizeFormData(formData);
                expect(sanitized.name).toBe('John Doe');
                expect(sanitized.email).toBe('test@example.com');
                expect(sanitized.number).toBe(123);
            });
        });

        describe('validateFormData', () => {
            test('validates complete form data', () => {
                const formData = {
                    name: 'John Doe',
                    email: '1234567@students.wits.ac.za',
                    phone: '+27612345678',
                    password: 'StrongPass123!',
                    confirmPassword: 'StrongPass123!',
                    role: 'student',
                    faculty: 'Faculty of Science',
                    course: 'Bachelor of Science (BSc) - Computer Science',
                    year_of_study: '2',
                    terms_agreed: true
                };

                const result = validateFormData(formData);
                expect(result.isValid).toBe(true);
                expect(result.errors).toEqual({});
            });

            test('returns errors for invalid form data', () => {
                const formData = {
                    name: '',
                    email: 'invalid-email',
                    phone: 'invalid-phone',
                    password: 'weak',
                    confirmPassword: 'different',
                    role: '',
                    faculty: '',
                    course: '',
                    year_of_study: '',
                    terms_agreed: false
                };

                const result = validateFormData(formData);
                expect(result.isValid).toBe(false);
                expect(Object.keys(result.errors).length).toBeGreaterThan(0);
            });
        });
    });

    describe('Faculty Utilities', () => {
        test('getCoursesForFaculty returns courses for valid faculty', () => {
            const courses = getCoursesForFaculty('Faculty of Science');
            expect(Array.isArray(courses)).toBe(true);
            expect(courses.length).toBeGreaterThan(0);
        });

        test('getCoursesForFaculty returns empty array for invalid faculty', () => {
            const courses = getCoursesForFaculty('Invalid Faculty');
            expect(courses).toEqual([]);
        });
    });

    describe('UI Helper Functions', () => {
        // Note: These are basic tests since we're mocking DOM elements


    });

    describe('Password Requirements', () => {
    });
});