// signupUtils.js - Utility functions for signup form validation and processing

// Validation constants
const VALIDATION_RULES = {
    NAME: {
        MIN_LENGTH: 2,
        MAX_LENGTH: 50,
        PATTERN: /^[a-zA-Z\s\-']+$/,
        ERROR_MESSAGE: 'Only letters, spaces, hyphens and apostrophes are allowed'
    },
    EMAIL: {
        PATTERN: /^(\d+)@students\.wits\.ac\.za$/,
        ERROR_MESSAGE: 'Email must be in format: studentnumber@students.wits.ac.za'
    },
    PHONE: {
        SOUTH_AFRICA: {
            INTERNATIONAL_PREFIX: '+27',
            LOCAL_PREFIX: '0',
            LENGTHS: {
                INTERNATIONAL: 12, // +27 + 9 digits
                LOCAL: 10         // 0 + 9 digits
            },
            VALID_SECOND_DIGITS: ['6', '7', '8'],
            ERROR_MESSAGES: {
                FORMAT: 'Must start with +27 or 0',
                LENGTH: {
                    INTERNATIONAL: 'Phone number must be +27 followed by 9 digits',
                    LOCAL: 'Phone number must be 10 digits'
                },
                SECOND_DIGIT: 'Number must start with 06, 07, or 08 (or +276, +277, +278)'
            }
        }
    },
    PASSWORD: {
        MIN_LENGTH: 8,
        REQUIREMENTS: {
            UPPERCASE: /[A-Z]/,
            LOWERCASE: /[a-z]/,
            NUMBER: /\d/,
            SPECIAL: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/
        }
    }
};

// Faculty and courses data
const FACULTY_COURSES = {
    'Faculty of Commerce, Law & Management': [
        'Bachelor of Commerce (BCom) - Accounting',
        'Bachelor of Commerce (BCom) - Economics',
        'Bachelor of Commerce (BCom) - Information Systems',
        'Bachelor of Commerce (BCom) - PPE (Politics, Philosophy & Economics)',
        'Bachelor of Commerce (BCom) - Finance & Management',
        'Bachelor of Commerce (BCom) - Insurance & Risk Management',
        'Bachelor of Commerce (BCom) - Human Resource Management & Management',
        'Bachelor of Commerce (BCom) - Marketing & Management',
        'Bachelor of Accounting Science (BAccSc)',
        'Bachelor of Economic Science (BEconSc)',
        'Bachelor of Laws (LLB)'
    ],
    'Faculty of Engineering & the Built Environment': [
        'Bachelor of Science in Engineering (BSc Eng) - Civil Engineering',
        'Bachelor of Science in Engineering (BSc Eng) - Electrical Engineering',
        'Bachelor of Science in Engineering (BSc Eng) - Mechanical Engineering',
        'Bachelor of Science in Engineering (BSc Eng) - Industrial Engineering',
        'Bachelor of Science in Engineering (BSc Eng) - Aeronautical Engineering',
        'Bachelor of Science in Engineering (BSc Eng) - Chemical Engineering',
        'Bachelor of Science in Engineering (BSc Eng) - Metallurgical Engineering',
        'Bachelor of Science in Engineering (BSc Eng) - Mining Engineering',
        'Bachelor of Engineering Science in Digital Arts (BEngSc)',
        'Bachelor of Engineering Science in Biomedical Engineering (BEngSc (BME))',
        'Bachelor of Architectural Studies (BAS)',
        'Bachelor of Science in Construction Studies (BSc (CS))',
        'Bachelor of Science in Property Studies (BSc (PS))',
        'Bachelor of Science in Urban & Regional Planning (BSc (URP))'
    ],
    'Faculty of Health Sciences': [
        'Bachelor of Health Sciences (BHSc) - Biomedical Sciences',
        'Bachelor of Health Sciences (BHSc) - Biokinetics',
        'Bachelor of Health Sciences (BHSc) - Health Systems Sciences',
        'Bachelor of Clinical Medical Practice (BCMP)',
        'Bachelor of Dental Science (BDS)',
        'Bachelor of Oral Health Sciences (BOHSc)',
        'Bachelor of Medicine & Surgery (MBBCh)',
        'Bachelor of Nursing (BNurs)',
        'Bachelor of Science in Occupational Therapy (BSc (OT))',
        'Bachelor of Pharmacy (BPharm)',
        'Bachelor of Science in Physiotherapy (BSc (Physiotherapy))'
    ],
    'Faculty of Humanities': [
        'Bachelor of Arts (BA) - African Literature',
        'Bachelor of Arts (BA) - Anthropology',
        'Bachelor of Arts (BA) - Archaeology',
        'Bachelor of Arts (BA) - History',
        'Bachelor of Arts (BA) - English',
        'Bachelor of Arts (BA) - Geography',
        'Bachelor of Arts (BA) - International Relations',
        'Bachelor of Arts (BA) - Media Studies',
        'Bachelor of Arts (BA) - Modern Languages (French)',
        'Bachelor of Arts (BA) - Modern Languages (German)',
        'Bachelor of Arts (BA) - Modern Languages (Spanish)',
        'Bachelor of Arts (BA) - Philosophy',
        'Bachelor of Arts (BA) - Political Studies',
        'Bachelor of Arts (BA) - Psychology',
        'Bachelor of Arts (BA) - Sociology',
        'BA in Digital Arts (4-year specialized degree)',
        'BA Film & Television (BAFT)',
        'Bachelor of Social Work (B Social Work)',
        'Bachelor of Education: Intermediate Phase',
        'Bachelor of Education: Senior Phase & FET Teaching',
        'Bachelor of Speech-Language Pathology',
        'Bachelor of Audiology'
    ],
    'Faculty of Science': [
        'Bachelor of Science (BSc) - Actuarial Science',
        'Bachelor of Science (BSc) - Applied & Computational Mathematics',
        'Bachelor of Science (BSc) - Astronomy & Astrophysics',
        'Bachelor of Science (BSc) - Biochemistry & Cell Biology',
        'Bachelor of Science (BSc) - Biological/Biodiversity & Conservation Biology',
        'Bachelor of Science (BSc) - Chemistry',
        'Bachelor of Science (BSc) - Computer Science',
        'Bachelor of Science (BSc) - Ecology & Conservation',
        'Bachelor of Science (BSc) - Genetics',
        'Bachelor of Science (BSc) - Geology',
        'Bachelor of Science (BSc) - Geography & Archaeological Sciences',
        'Bachelor of Science (BSc) - Geospatial Science',
        'Bachelor of Science (BSc) - Mathematical Sciences & Mathematics of Finance',
        'Bachelor of Science (BSc) - Microbiology',
        'Bachelor of Science (BSc) - Molecular and Cell Biology',
        'Bachelor of Science (BSc) - Physics',
        'Bachelor of Science (BSc) - Physiology',
        'Bachelor of Science (BSc) - Statistics',
        'Bachelor of Science (BSc) - Zoology'
    ]
};

// Validation functions
function validateName(name) {
    if (!name || typeof name !== 'string') {
        return { isValid: false, error: 'Name is required' };
    }

    const trimmedName = name.trim();
    
    if (trimmedName.length < VALIDATION_RULES.NAME.MIN_LENGTH) {
        return { 
            isValid: false, 
            error: `Name must be at least ${VALIDATION_RULES.NAME.MIN_LENGTH} characters long` 
        };
    }
    
    if (trimmedName.length > VALIDATION_RULES.NAME.MAX_LENGTH) {
        return { 
            isValid: false, 
            error: `Name must be less than ${VALIDATION_RULES.NAME.MAX_LENGTH} characters long` 
        };
    }
    
    if (!VALIDATION_RULES.NAME.PATTERN.test(trimmedName)) {
        return { 
            isValid: false, 
            error: VALIDATION_RULES.NAME.ERROR_MESSAGE 
        };
    }
    
    return { isValid: true, error: null };
}

function validateWitsEmail(email) {
    if (!email || typeof email !== 'string') {
        return { isValid: false, error: 'Email is required' };
    }

    const trimmedEmail = email.trim();
    
    if (!VALIDATION_RULES.EMAIL.PATTERN.test(trimmedEmail)) {
        return { 
            isValid: false, 
            error: VALIDATION_RULES.EMAIL.ERROR_MESSAGE 
        };
    }
    
    return { isValid: true, error: null };
}

function validateSouthAfricanPhone(phone) {
    if (!phone || typeof phone !== 'string') {
        return { isValid: false, error: 'Phone number is required' };
    }

    const cleanedPhone = phone.replace(/\s+/g, '');
    
    if (cleanedPhone.startsWith(VALIDATION_RULES.PHONE.SOUTH_AFRICA.INTERNATIONAL_PREFIX)) {
        // International format: +27XXXXXXXXX
        if (cleanedPhone.length !== VALIDATION_RULES.PHONE.SOUTH_AFRICA.LENGTHS.INTERNATIONAL) {
            return { 
                isValid: false, 
                error: VALIDATION_RULES.PHONE.SOUTH_AFRICA.ERROR_MESSAGES.LENGTH.INTERNATIONAL 
            };
        }
        
        const thirdDigit = cleanedPhone.charAt(3);
        if (!VALIDATION_RULES.PHONE.SOUTH_AFRICA.VALID_SECOND_DIGITS.includes(thirdDigit)) {
            return { 
                isValid: false, 
                error: VALIDATION_RULES.PHONE.SOUTH_AFRICA.ERROR_MESSAGES.SECOND_DIGIT 
            };
        }
        
        return { isValid: true, error: null };
    } 
    else if (cleanedPhone.startsWith(VALIDATION_RULES.PHONE.SOUTH_AFRICA.LOCAL_PREFIX)) {
        // Local format: 0XXXXXXXXX
        if (cleanedPhone.length !== VALIDATION_RULES.PHONE.SOUTH_AFRICA.LENGTHS.LOCAL) {
            return { 
                isValid: false, 
                error: VALIDATION_RULES.PHONE.SOUTH_AFRICA.ERROR_MESSAGES.LENGTH.LOCAL 
            };
        }
        
        const secondDigit = cleanedPhone.charAt(1);
        if (!VALIDATION_RULES.PHONE.SOUTH_AFRICA.VALID_SECOND_DIGITS.includes(secondDigit)) {
            return { 
                isValid: false, 
                error: VALIDATION_RULES.PHONE.SOUTH_AFRICA.ERROR_MESSAGES.SECOND_DIGIT 
            };
        }
        
        return { isValid: true, error: null };
    } 
    else {
        return { 
            isValid: false, 
            error: VALIDATION_RULES.PHONE.SOUTH_AFRICA.ERROR_MESSAGES.FORMAT 
        };
    }
}

function validatePassword(password) {
    if (!password || typeof password !== 'string') {
        return { isValid: false, error: 'Password is required' };
    }

    const requirements = {
        length: password.length >= VALIDATION_RULES.PASSWORD.MIN_LENGTH,
        uppercase: VALIDATION_RULES.PASSWORD.REQUIREMENTS.UPPERCASE.test(password),
        lowercase: VALIDATION_RULES.PASSWORD.REQUIREMENTS.LOWERCASE.test(password),
        number: VALIDATION_RULES.PASSWORD.REQUIREMENTS.NUMBER.test(password),
        special: VALIDATION_RULES.PASSWORD.REQUIREMENTS.SPECIAL.test(password)
    };

    const missingRequirements = Object.entries(requirements)
        .filter(([_, met]) => !met)
        .map(([req]) => req);

    if (missingRequirements.length > 0) {
        return { 
            isValid: false, 
            error: 'Password does not meet requirements',
            requirements: requirements,
            missing: missingRequirements
        };
    }

    return { isValid: true, error: null, requirements: requirements };
}

function validatePasswordMatch(password, confirmPassword) {
    if (!password || !confirmPassword) {
        return { isValid: false, error: 'Both password fields are required' };
    }

    if (password !== confirmPassword) {
        return { isValid: false, error: 'Passwords do not match' };
    }

    return { isValid: true, error: null };
}

function validateRequiredField(value, fieldName) {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
        return { isValid: false, error: `${fieldName} is required` };
    }

    return { isValid: true, error: null };
}

function validateTermsAgreement(agreed) {
    if (!agreed) {
        return { isValid: false, error: 'You must agree to the terms and conditions' };
    }

    return { isValid: true, error: null };
}

// Form data processing
function sanitizeFormData(formData) {
    const sanitized = {};
    
    Object.entries(formData).forEach(([key, value]) => {
        if (typeof value === 'string') {
            sanitized[key] = value.trim();
        } else {
            sanitized[key] = value;
        }
    });
    
    return sanitized;
}

function validateFormData(formData) {
    const errors = {};
    const sanitizedData = sanitizeFormData(formData);

    // Validate name
    const nameValidation = validateName(sanitizedData.name);
    if (!nameValidation.isValid) {
        errors.name = nameValidation.error;
    }

    // Validate email
    const emailValidation = validateWitsEmail(sanitizedData.email);
    if (!emailValidation.isValid) {
        errors.email = emailValidation.error;
    }

    // Validate phone
    const phoneValidation = validateSouthAfricanPhone(sanitizedData.phone);
    if (!phoneValidation.isValid) {
        errors.phone = phoneValidation.error;
    }

    // Validate password
    const passwordValidation = validatePassword(sanitizedData.password);
    if (!passwordValidation.isValid) {
        errors.password = passwordValidation.error;
    }

    // Validate password match
    const passwordMatchValidation = validatePasswordMatch(
        sanitizedData.password, 
        sanitizedData.confirmPassword
    );
    if (!passwordMatchValidation.isValid) {
        errors.confirmPassword = passwordMatchValidation.error;
    }

    // Validate role
    const roleValidation = validateRequiredField(sanitizedData.role, 'Role');
    if (!roleValidation.isValid) {
        errors.role = roleValidation.error;
    }

    // Validate faculty
    const facultyValidation = validateRequiredField(sanitizedData.faculty, 'Faculty');
    if (!facultyValidation.isValid) {
        errors.faculty = facultyValidation.error;
    }

    // Validate course
    const courseValidation = validateRequiredField(sanitizedData.course, 'Course');
    if (!courseValidation.isValid) {
        errors.course = courseValidation.error;
    }

    // Validate year of study
    const yearValidation = validateRequiredField(sanitizedData.year_of_study, 'Year of study');
    if (!yearValidation.isValid) {
        errors.year_of_study = yearValidation.error;
    }

    // Validate terms agreement
    const termsValidation = validateTermsAgreement(sanitizedData.terms_agreed);
    if (!termsValidation.isValid) {
        errors.terms_agreed = termsValidation.error;
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors: errors,
        sanitizedData: sanitizedData
    };
}

// UI helper functions
function showError(input, message) {
    if (!input || !message) return;

    const errorElement = document.querySelector(`output[for="${input.id}"]`) || input.nextElementSibling;
    if (errorElement && errorElement.classList.contains('error-message')) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    
    input.classList.add('error');
    input.classList.remove('valid');
    
    const formGroup = input.closest('.form-group');
    if (formGroup) {
        formGroup.classList.add('validated', 'error');
        formGroup.classList.remove('valid');
    }
}

function clearError(input) {
    if (!input) return;

    const errorElement = document.querySelector(`output[for="${input.id}"]`) || input.nextElementSibling;
    if (errorElement && errorElement.classList.contains('error-message')) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
    
    input.classList.remove('error');
    input.classList.add('valid');
    
    const formGroup = input.closest('.form-group');
    if (formGroup) {
        formGroup.classList.add('validated', 'valid');
        formGroup.classList.remove('error');
    }
}

function updatePasswordRequirements(password) {
    const requirements = {
        length: document.getElementById('length'),
        uppercase: document.getElementById('uppercase'),
        lowercase: document.getElementById('lowercase'),
        number: document.getElementById('number'),
        special: document.getElementById('special')
    };

    if (!password) {
        Object.values(requirements).forEach(req => req.classList.remove('valid'));
        return;
    }

    // Length check
    if (password.length >= VALIDATION_RULES.PASSWORD.MIN_LENGTH) {
        requirements.length.classList.add('valid');
    } else {
        requirements.length.classList.remove('valid');
    }

    // Uppercase check
    if (VALIDATION_RULES.PASSWORD.REQUIREMENTS.UPPERCASE.test(password)) {
        requirements.uppercase.classList.add('valid');
    } else {
        requirements.uppercase.classList.remove('valid');
    }

    // Lowercase check
    if (VALIDATION_RULES.PASSWORD.REQUIREMENTS.LOWERCASE.test(password)) {
        requirements.lowercase.classList.add('valid');
    } else {
        requirements.lowercase.classList.remove('valid');
    }

    // Number check
    if (VALIDATION_RULES.PASSWORD.REQUIREMENTS.NUMBER.test(password)) {
        requirements.number.classList.add('valid');
    } else {
        requirements.number.classList.remove('valid');
    }

    // Special character check
    if (VALIDATION_RULES.PASSWORD.REQUIREMENTS.SPECIAL.test(password)) {
        requirements.special.classList.add('valid');
    } else {
        requirements.special.classList.remove('valid');
    }
}

// Faculty and course utilities
function getCoursesForFaculty(faculty) {
    return FACULTY_COURSES[faculty] || [];
}

function populateCourseSelect(facultySelect, courseSelect) {
    if (!facultySelect || !courseSelect) return;

    const selectedFaculty = facultySelect.value;
    
    // Clear course selection
    courseSelect.innerHTML = '<option value="">Select a Course</option>';
    
    if (selectedFaculty && FACULTY_COURSES[selectedFaculty]) {
        courseSelect.disabled = false;
        
        FACULTY_COURSES[selectedFaculty].forEach(course => {
            const option = document.createElement('option');
            option.value = course;
            option.textContent = course;
            courseSelect.appendChild(option);
        });
    } else {
        courseSelect.disabled = true;
        courseSelect.innerHTML = '<option value="">Select a Faculty first</option>';
    }
    
    courseSelect.value = '';
}

// API utilities
async function checkEmailExists(email) {
    if (!email) return { exists: false };

    try {
        const response = await fetch(`/api/check-email?email=${encodeURIComponent(email)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error('Email check failed');
        }

        return await response.json();
    } catch (error) {
        console.error('Email check error:', error);
        throw error;
    }
}

async function submitSignupForm(formData) {
    try {
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        return await response.json();
    } catch (error) {
        console.error('Signup submission error:', error);
        throw error;
    }
}

// Modal utilities
function openModal(modal) {
    if (!modal) return;

    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    
    // Focus on close button
    const closeButton = modal.querySelector('.close-btn');
    if (closeButton) {
        setTimeout(() => closeButton.focus(), 100);
    }
}

function closeModal(modal) {
    if (!modal) return;

    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = 'auto';
    
    // Focus back to the button that opened the modal
    const opener = document.activeElement;
    if (opener) {
        opener.focus();
    }
}

// Password visibility toggle
function togglePasswordVisibility(input, toggleButton) {
    if (!input || !toggleButton) return;

    const icon = toggleButton.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

// Form navigation utilities
function goToNextStep(currentStep, steps) {
    if (!currentStep || !Array.isArray(steps)) return;

    const currentStepIndex = Array.from(steps).indexOf(currentStep);
    if (currentStepIndex === -1 || currentStepIndex >= steps.length - 1) return;

    currentStep.classList.remove('active');
    const nextStep = steps[currentStepIndex + 1];
    nextStep.classList.add('active');
    window.scrollTo(0, 0);
}

function goToPrevStep(currentStep, steps) {
    if (!currentStep || !Array.isArray(steps)) return;

    const currentStepIndex = Array.from(steps).indexOf(currentStep);
    if (currentStepIndex === -1 || currentStepIndex <= 0) return;

    currentStep.classList.remove('active');
    const prevStep = steps[currentStepIndex - 1];
    prevStep.classList.add('active');
    window.scrollTo(0, 0);
}

module.exports = {
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
    showError,
    clearError,
    updatePasswordRequirements,
    getCoursesForFaculty,
    populateCourseSelect,
    checkEmailExists,
    submitSignupForm,
    openModal,
    closeModal,
    togglePasswordVisibility,
    goToNextStep,
    goToPrevStep
};