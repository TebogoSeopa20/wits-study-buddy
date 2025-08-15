document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('signupForm');
    const steps = document.querySelectorAll('.form-step');
    const nextButtons = document.querySelectorAll('.next-btn');
    const prevButtons = document.querySelectorAll('.prev-btn');
    const roleRadios = document.querySelectorAll('input[name="role"]');
    const formStatus = document.getElementById('formStatus');
    const passwordToggles = document.querySelectorAll('.toggle-password-visibility');
    
    // Name validation (text only)
    const nameInputs = document.querySelectorAll('input[type="text"][id*="name"]');
    nameInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            const value = this.value;
            const sanitizedValue = value.replace(/[^a-zA-Z\s\-']/g, '');
            
            if (value !== sanitizedValue) {
                this.value = sanitizedValue;
                showError(this, 'Only letters, spaces, hyphens and apostrophes are allowed');
            } else {
                clearError(this);
            }
        });
    });
    
    // South African phone number validation
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = this.value.replace(/\s+/g, '');
            const sanitizedValue = value.replace(/[^\d+]/g, '');
            this.value = sanitizedValue;
            
            const isValid = validateSouthAfricanPhone(sanitizedValue);
            if (!isValid.valid) {
                showError(this, isValid.message);
            } else {
                clearError(this);
            }
        });
        
        phoneInput.addEventListener('blur', function() {
            const value = this.value.trim();
            const isValid = validateSouthAfricanPhone(value);
            
            if (!isValid.valid) {
                showError(this, isValid.message);
            } else {
                clearError(this);
            }
        });
    }
    
    function validateSouthAfricanPhone(phone) {
        if (!phone) return { valid: true, message: '' };
        
        if (phone.startsWith('+27')) {
            if (phone.length !== 12) {
                return { valid: false, message: 'Phone number must be +27 followed by 9 digits' };
            }
            
            const thirdDigit = phone.charAt(3);
            if (!['6', '7', '8'].includes(thirdDigit)) {
                return { valid: false, message: 'After +27, number must start with 6, 7, or 8' };
            }
            
            return { valid: true, message: '' };
        } 
        else if (phone.startsWith('0')) {
            if (phone.length !== 10) {
                return { valid: false, message: 'Phone number must be 10 digits' };
            }
            
            const secondDigit = phone.charAt(1);
            if (!['6', '7', '8'].includes(secondDigit)) {
                return { valid: false, message: 'Number must start with 06, 07, or 08' };
            }
            
            return { valid: true, message: '' };
        } 
        else {
            return { valid: false, message: 'Must start with +27 or 0' };
        }
    }
    
    // Wits University student email validation
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            const value = this.value.trim();
            validateWitsEmail(this, value);
        });
        
        emailInput.addEventListener('blur', function() {
            const value = this.value.trim();
            validateWitsEmail(this, value);
        });
    }
    
    function validateWitsEmail(input, email) {
        if (!email) return;
        
        const witsEmailRegex = /^(\d+)@students\.wits\.ac\.za$/;
        
        if (!witsEmailRegex.test(email)) {
            showError(input, 'Email must be in format: studentnumber@students.wits.ac.za');
            return false;
        } else {
            clearError(input);
            return true;
        }
    }
    
    // Password visibility toggle
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    });
    
    // Password validation
    const password = document.getElementById('password');
    const lengthReq = document.getElementById('length');
    const uppercaseReq = document.getElementById('uppercase');
    const lowercaseReq = document.getElementById('lowercase');
    const numberReq = document.getElementById('number');
    const specialReq = document.getElementById('special');
    
    if (password) {
        password.addEventListener('input', function() {
            const value = this.value;
            
            // Length check
            if (value.length >= 8) {
                lengthReq.classList.add('valid');
            } else {
                lengthReq.classList.remove('valid');
            }
            
            // Uppercase check
            if (/[A-Z]/.test(value)) {
                uppercaseReq.classList.add('valid');
            } else {
                uppercaseReq.classList.remove('valid');
            }
            
            // Lowercase check
            if (/[a-z]/.test(value)) {
                lowercaseReq.classList.add('valid');
            } else {
                lowercaseReq.classList.remove('valid');
            }
            
            // Number check
            if (/\d/.test(value)) {
                numberReq.classList.add('valid');
            } else {
                numberReq.classList.remove('valid');
            }
            
            // Special character check
            if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
                specialReq.classList.add('valid');
            } else {
                specialReq.classList.remove('valid');
            }
        });
    }
    
    // Email duplicate check
    let emailCheckTimeout;
    let emailCheckInProgress = false;
    let lastCheckedEmail = '';
    
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            const email = this.value.trim();
            if (email && validateWitsEmail(emailInput, email) && email !== lastCheckedEmail) {
                checkEmailExists(email);
            }
        });
        
        emailInput.addEventListener('input', function() {
            clearTimeout(emailCheckTimeout);
            const email = this.value.trim();
            
            if (email && validateWitsEmail(emailInput, email)) {
                emailCheckTimeout = setTimeout(() => {
                    if (email !== lastCheckedEmail && !emailCheckInProgress) {
                        checkEmailExists(email);
                    }
                }, 500);
            }
        });
    }
    
    function checkEmailExists(email) {
        emailCheckInProgress = true;
        lastCheckedEmail = email;
        
        fetch(`/api/check-email?email=${encodeURIComponent(email)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.exists) {
                showError(emailInput, 'This email is already registered. Please use a different email or login with your existing account.');
            } else {
                clearError(emailInput);
            }
        })
        .catch(error => {
            console.error('Email check error:', error);
        })
        .finally(() => {
            emailCheckInProgress = false;
        });
    }
    
    // Form step navigation
    nextButtons.forEach(button => {
        button.addEventListener('click', function() {
            const currentStep = this.closest('.form-step');
            const currentStepIndex = Array.from(steps).indexOf(currentStep);
            
            // Validate current step
            const inputs = currentStep.querySelectorAll('input[required], select[required], textarea[required]');
            let isValid = true;
            
            inputs.forEach(input => {
                if (!input.value.trim()) {
                    isValid = false;
                    showError(input, 'This field is required');
                } else {
                    if (input.id === 'email') {
                        if (!validateWitsEmail(input, input.value.trim())) {
                            isValid = false;
                        }
                    } else if (input.type === 'tel' || input.id.includes('phone')) {
                        const phoneValid = validateSouthAfricanPhone(input.value.trim());
                        if (!phoneValid.valid) {
                            showError(input, phoneValid.message);
                            isValid = false;
                        }
                    } else {
                        clearError(input);
                    }
                }
            });
            
            // Check password match if on password step
            const passwordInput = currentStep.querySelector('#password');
            const confirmPasswordInput = currentStep.querySelector('#confirmPassword');
            if (passwordInput && confirmPasswordInput && passwordInput.value && confirmPasswordInput.value) {
                if (passwordInput.value !== confirmPasswordInput.value) {
                    isValid = false;
                    showError(confirmPasswordInput, 'Passwords do not match');
                }
            }
            
            if (!isValid) return;
            
            // Proceed to next step
            currentStep.classList.remove('active');
            const nextStep = steps[currentStepIndex + 1];
            nextStep.classList.add('active');
            window.scrollTo(0, 0);
        });
    });
    
    prevButtons.forEach(button => {
        button.addEventListener('click', function() {
            const currentStep = this.closest('.form-step');
            const currentStepIndex = Array.from(steps).indexOf(currentStep);
            
            currentStep.classList.remove('active');
            const prevStep = steps[currentStepIndex - 1];
            prevStep.classList.add('active');
            window.scrollTo(0, 0);
        });
    });
    
    // Faculty and courses data
    const facultyCourses = {
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

    // Faculty selection handler
    const facultySelect = document.getElementById('faculty');
    const courseSelect = document.getElementById('course');

    if (facultySelect && courseSelect) {
        facultySelect.addEventListener('change', function() {
            const selectedFaculty = this.value;
            
            // Clear course selection
            courseSelect.innerHTML = '<option value="">Select a Course</option>';
            
            if (selectedFaculty && facultyCourses[selectedFaculty]) {
                courseSelect.disabled = false;
                
                facultyCourses[selectedFaculty].forEach(course => {
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
            clearError(courseSelect);
        });
    }

    // Form submission
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Final validation
            const activeStep = document.querySelector('.form-step.active');
            const inputs = activeStep.querySelectorAll('input[required], select[required], textarea[required]');
            let isValid = true;
            
            inputs.forEach(input => {
                if (!input.value.trim()) {
                    isValid = false;
                    showError(input, 'This field is required');
                } else {
                    if (input.id === 'email') {
                        if (!validateWitsEmail(input, input.value.trim())) {
                            isValid = false;
                        }
                    } else if (input.type === 'tel' || input.id.includes('phone')) {
                        const phoneValid = validateSouthAfricanPhone(input.value.trim());
                        if (!phoneValid.valid) {
                            showError(input, phoneValid.message);
                            isValid = false;
                        }
                    } else {
                        clearError(input);
                    }
                }
            });
            
            // Check terms agreement
            const termsAgree = document.getElementById('termsAgree');
            if (termsAgree && !termsAgree.checked) {
                isValid = false;
                showError(termsAgree, 'You must agree to the terms and conditions');
            } else if (termsAgree) {
                clearError(termsAgree);
            }
            
            // Final email validation
            if (emailInput) {
                if (!validateWitsEmail(emailInput, emailInput.value.trim())) {
                    isValid = false;
                }
                
                const emailError = document.querySelector(`output[for="email"]`) || emailInput.nextElementSibling;
                if (emailError && 
                    emailError.classList.contains('error-message') && 
                    emailError.style.display !== 'none' &&
                    emailError.textContent.includes('already registered')) {
                    isValid = false;
                }
                
                if (emailInput.value.trim() !== lastCheckedEmail && isValid) {
                    checkEmailBeforeSubmit();
                    return;
                }
            }
            
            if (!isValid) {
                const firstError = document.querySelector('.error');
                if (firstError) {
                    const errorStep = firstError.closest('.form-step');
                    if (errorStep && !errorStep.classList.contains('active')) {
                        const activeStep = document.querySelector('.form-step.active');
                        activeStep.classList.remove('active');
                        errorStep.classList.add('active');
                    }
                    
                    if (firstError.tagName !== 'INPUT' && firstError.tagName !== 'SELECT' && firstError.tagName !== 'TEXTAREA') {
                        const inputInError = firstError.querySelector('input, select, textarea');
                        if (inputInError) {
                            inputInError.focus();
                        }
                    } else {
                        firstError.focus();
                    }
                }
                return;
            }
            
            submitForm();
        });
    }
    
    function checkEmailBeforeSubmit() {
        const emailInput = document.getElementById('email');
        if (!emailInput) return;
        
        const email = emailInput.value.trim();
        
        const submitButton = document.querySelector('.submit-btn');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.classList.add('loading');
            submitButton.textContent = 'Checking...'; 
        }
        
        fetch(`/api/check-email?email=${encodeURIComponent(email)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.exists) {
                showError(emailInput, 'This email is already registered. Please use a different email or login with your existing account.');
                
                const emailStep = emailInput.closest('.form-step');
                if (emailStep && !emailStep.classList.contains('active')) {
                    const activeStep = document.querySelector('.form-step.active');
                    activeStep.classList.remove('active');
                    emailStep.classList.add('active');
                }
                
                emailInput.focus();
            } else {
                clearError(emailInput);
                lastCheckedEmail = email;
                submitForm();
            }
        })
        .catch(error => {
            console.error('Email check error:', error);
            showError(emailInput, 'Could not verify email. Please try again.');
            
            const emailStep = emailInput.closest('.form-step');
            if (emailStep && !emailStep.classList.contains('active')) {
                const activeStep = document.querySelector('.form-step.active');
                activeStep.classList.remove('active');
                emailStep.classList.add('active');
            }
        })
        .finally(() => {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.classList.remove('loading');
                submitButton.textContent = 'Submit';
            }
        });
    }
    
    function submitForm() {
        const submitButton = document.querySelector('.submit-btn');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.classList.add('loading');
        }
        
        if (formStatus) {
            formStatus.textContent = '';
            formStatus.className = 'form-status-message';
            formStatus.style.display = 'none';
        }
        
        // Collect form data
        const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        confirmPassword: document.getElementById('confirmPassword').value,
        phone: document.getElementById('phone').value,
        role: document.querySelector('input[name="role"]:checked').value,
        faculty: document.getElementById('faculty').value,
        course: document.getElementById('course').value,
        year_of_study: document.getElementById('yearOfStudy').value, // Match server expectation
        terms_agreed: document.getElementById('termsAgree').checked
        };
        
        if (!formData.terms_agreed) {
        showError(document.getElementById('termsAgree'), 'You must agree to the terms and conditions');
        return;
        }

        if (formData.password !== formData.confirmPassword) {
        showError(document.getElementById('confirmPassword'), 'Passwords do not match');
        return;
        }
        
        fetch('/api/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        })
        .then(response => response.json())
        .then(data => {
            if (data.message && data.user) {
                if (formStatus) {
                    formStatus.textContent = data.message;
                    formStatus.className = 'form-status-message success';
                    formStatus.style.display = 'block';
                }
                
                form.reset();
                
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else if (data.errors) {
                Object.keys(data.errors).forEach(key => {
                    const input = document.getElementById(key);
                    if (input) {
                        showError(input, data.errors[key]);
                        
                        if (key === 'email' && data.errors[key].includes('already registered')) {
                            lastCheckedEmail = input.value.trim();
                        }
                    }
                });
                
                if (formStatus) {
                    formStatus.textContent = data.message || 'Please correct the errors above.';
                    formStatus.className = 'form-status-message error';
                    formStatus.style.display = 'block';
                }
                
                if (data.errors.email) {
                    const emailInput = document.getElementById('email');
                    if (emailInput) {
                        const emailStep = emailInput.closest('.form-step');
                        if (emailStep && !emailStep.classList.contains('active')) {
                            const activeStep = document.querySelector('.form-step.active');
                            activeStep.classList.remove('active');
                            emailStep.classList.add('active');
                        }
                    }
                }
            } else if (data.message) {
                if (formStatus) {
                    formStatus.textContent = data.message;
                    formStatus.className = 'form-status-message error';
                    formStatus.style.display = 'block';
                }
                
                if (data.message.toLowerCase().includes('email') && 
                    (data.message.toLowerCase().includes('already registered') || 
                     data.message.toLowerCase().includes('already exists'))) {
                    const emailInput = document.getElementById('email');
                    if (emailInput) {
                        showError(emailInput, data.message);
                        lastCheckedEmail = emailInput.value.trim();
                        
                        const emailStep = emailInput.closest('.form-step');
                        if (emailStep && !emailStep.classList.contains('active')) {
                            const activeStep = document.querySelector('.form-step.active');
                            activeStep.classList.remove('active');
                            emailStep.classList.add('active');
                        }
                    }
                }
            }
        })
        .catch(error => {
        console.error('Signup error:', error);
        if (formStatus) {
            formStatus.textContent = error.message || 'An error occurred during signup. Please try again later.';
            formStatus.className = 'form-status-message error';
            formStatus.style.display = 'block';
        }
        
        // Scroll to the status message
        formStatus.scrollIntoView({ behavior: 'smooth', block: 'center' });
        })
        .finally(() => {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.classList.remove('loading');
            }
        });
    }
    
    // Helper functions
    function showError(input, message) {
        const errorElement = document.querySelector(`output[for="${input.id}"]`) || input.nextElementSibling;
        if (errorElement && errorElement.classList.contains('error-message')) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        input.classList.add('error');
        
        const formGroup = input.closest('.form-group');
        if (formGroup) {
            formGroup.classList.add('validated', 'error');
            formGroup.classList.remove('valid');
        }
    }
    
    function clearError(input) {
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

    // Modal functionality
    const termsModal = document.getElementById('termsModal');
    const privacyModal = document.getElementById('privacyModal');
    const termsCheckbox = document.getElementById('termsAgree');
    
    const openTerms = document.getElementById('openTerms');
    const closeTerms = document.getElementById('closeTerms');
    const closeTermsBtn = document.getElementById('closeTermsBtn');
    const acceptTermsBtn = document.getElementById('acceptTermsBtn');
    
    const openPrivacy = document.getElementById('openPrivacy');
    const closePrivacy = document.getElementById('closePrivacy');
    const closePrivacyBtn = document.getElementById('closePrivacyBtn');
    const acceptPrivacyBtn = document.getElementById('acceptPrivacyBtn');
    
    let termsViewed = false;
    let privacyViewed = false;
    
    if (openTerms) {
        openTerms.addEventListener('click', function(e) {
            e.preventDefault();
            termsModal.style.display = 'block';
            termsModal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            termsViewed = true;
            
            setTimeout(() => {
                closeTerms.focus();
            }, 100);
        });
    }
    
    if (openPrivacy) {
        openPrivacy.addEventListener('click', function(e) {
            e.preventDefault();
            privacyModal.style.display = 'block';
            privacyModal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            privacyViewed = true;
            
            setTimeout(() => {
                closePrivacy.focus();
            }, 100);
        });
    }
    
    function closeTermsModal() {
        termsModal.style.display = 'none';
        termsModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = 'auto';
        openTerms.focus();
    }
    
    function closePrivacyModal() {
        privacyModal.style.display = 'none';
        privacyModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = 'auto';
        openPrivacy.focus();
    }
    
    if (closeTerms) closeTerms.addEventListener('click', closeTermsModal);
    if (closeTermsBtn) closeTermsBtn.addEventListener('click', closeTermsModal);
    if (acceptTermsBtn) {
        acceptTermsBtn.addEventListener('click', function() {
            closeTermsModal();
            if (termsViewed && privacyViewed && !termsCheckbox.checked) {
                termsCheckbox.checked = true;
                termsCheckbox.dispatchEvent(new Event('change'));
            }
        });
    }
    
    if (closePrivacy) closePrivacy.addEventListener('click', closePrivacyModal);
    if (closePrivacyBtn) closePrivacyBtn.addEventListener('click', closePrivacyModal);
    if (acceptPrivacyBtn) {
        acceptPrivacyBtn.addEventListener('click', function() {
            closePrivacyModal();
            if (termsViewed && privacyViewed && !termsCheckbox.checked) {
                termsCheckbox.checked = true;
                termsCheckbox.dispatchEvent(new Event('change'));
            }
        });
    }
    
    window.addEventListener('click', function(event) {
        if (event.target === termsModal) {
            closeTermsModal();
        }
        if (event.target === privacyModal) {
            closePrivacyModal();
        }
    });
    
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            if (termsModal.style.display === 'block') {
                closeTermsModal();
            }
            if (privacyModal.style.display === 'block') {
                closePrivacyModal();
            }
        }
    });
});