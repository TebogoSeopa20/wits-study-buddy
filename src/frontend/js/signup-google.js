// Updated signup-google.js with proper role handling and redirection
document.addEventListener('DOMContentLoaded', async function() {
    // Elements
    const form = document.getElementById('googleSignupForm');
    const roleInputs = document.querySelectorAll('input[name="role"]');
    const formStatus = document.getElementById('formStatus');
    const googleProfileInfo = document.getElementById('googleProfileInfo');
    const errorMessage = document.getElementById('error-message');
    
    // Step navigation buttons
    const nextBtn = document.querySelector('.next-btn');
    const prevBtn = document.querySelector('.prev-btn');
    const steps = document.querySelectorAll('.form-step');
    
    let currentStep = 0;
    let googleProfile = null;
    
    // Store token for reuse in API calls
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    /**
     * Get dashboard URL based on user role
     * @param {string} role - User role (student, tutor)
     * @returns {string} - URL path to appropriate dashboard
     */
    function getDashboardUrlByRole(role) {
        // Normalize role to lowercase for case-insensitive comparison
        const normalizedRole = role ? role.toLowerCase() : 'student';
        
        switch (normalizedRole) {
        case 'tutor':
        return '../html/tutor-dash.html';
        case 'student':
        default:
        return '../html/student-dash.html';
    }
    }
    
    /**
     * Fetch Google profile data from server
     */
    async function fetchGoogleProfile() {
        try {
            let url = '/api/auth/google-profile';
            if (token) {
                url += `?token=${token}`;
            }
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch Google profile: ${response.status}`);
            }
            
            const data = await response.json();
            googleProfile = data.profile;
            
            if (googleProfile) {
                displayGoogleProfile(googleProfile);
                return googleProfile;
            } else {
                throw new Error('No profile data returned from server');
            }
        } catch (error) {
            console.error('Error fetching Google profile:', error);
            if (errorMessage) {
                errorMessage.textContent = 'Error loading your Google profile. Please try logging in again.';
                errorMessage.style.display = 'block';
            }
            return null;
        }
    }
    
    /**
     * Display Google profile information
     */
    function displayGoogleProfile(profile) {
        if (!googleProfileInfo || !profile) return;
        
        const profileHTML = `
            <section class="google-profile">
                <section class="profile-image">
                    <img src="${profile.picture}" alt="${profile.name}" class="profile-pic">
                </section>
                <section class="profile-info">
                    <h3>${profile.name}</h3>
                    <p>${profile.email}</p>
                </section>
            </section>
        `;
        
        googleProfileInfo.innerHTML = profileHTML;
        
        // Pre-fill email field
        const emailField = document.getElementById('email');
        if (emailField && profile.email) {
            emailField.value = profile.email;
            if (emailField.readOnly !== true) {
                emailField.readOnly = true;
            }
        }
        
        // Pre-fill name field
        const nameField = document.getElementById('name');
        if (nameField && profile.name) {
            nameField.value = profile.name;
        }
    }
    
    // Handle step navigation
    function showStep(stepIndex) {
        steps.forEach((step, index) => {
            step.classList.toggle('active', index === stepIndex);
        });
        currentStep = stepIndex;
        
        if (prevBtn) prevBtn.style.display = currentStep === 0 ? 'none' : 'inline-block';
        if (nextBtn) nextBtn.style.display = currentStep === steps.length - 1 ? 'none' : 'inline-block';
    }
    
    // Next button click
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            const selectedRole = document.querySelector('input[name="role"]:checked')?.value || 'student';
            showStep(currentStep + 1);
        });
    }
    
    // Previous button click
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            showStep(currentStep - 1);
        });
    }
    
    // Form submission
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Clear previous errors
            document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
            
            // Basic validation
            let isValid = true;
            const selectedRole = document.querySelector('input[name="role"]:checked')?.value || 'student';
            const requiredFields = form.querySelectorAll('input[required], select[required], textarea[required]');
            
            requiredFields.forEach(field => {
                const fieldGroup = field.closest('.form-group');
                if (!fieldGroup || getComputedStyle(fieldGroup).display !== 'none') {
                    if (!field.value.trim()) {
                        const errorOutput = form.querySelector(`output[for="${field.id}"]`);
                        if (errorOutput) {
                            errorOutput.textContent = `${field.name || field.id} is required`;
                        }
                        isValid = false;
                    }
                }
            });
            
            // Check terms agreement
            const termsCheck = document.getElementById('termsAgree');
            if (termsCheck && !termsCheck.checked) {
                const errorOutput = form.querySelector('output[for="termsAgree"]');
                if (errorOutput) {
                    errorOutput.textContent = 'You must agree to the terms and conditions';
                }
                isValid = false;
            }
            
            if (!isValid) {
                formStatus.innerHTML = `<section class="error">Please correct the errors before submitting.</section>`;
                return;
            }
            
            // Show loading status
            formStatus.innerHTML = `<section class="info">Processing your information...</section>`;
            
            // Gather form data
            const formData = new FormData(form);
            const userData = {
                role: formData.get('role'),
                faculty: formData.get('faculty'),
                course: formData.get('course'),
                year_of_study: formData.get('yearOfStudy'),
                phone: formData.get('phone'),
                terms_agreed: formData.get('termsAgree') === 'on'
            };
            
            try {
                // Construct URL with token if available
                let url = '/api/signup-google';
                if (token) {
                    url += `?token=${token}`;
                }
                
                // Send form data to server
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });
                
                if (!response.ok) {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const result = await response.json();
                        
                        if (result.errors) {
                            Object.entries(result.errors).forEach(([field, message]) => {
                                const errorOutput = form.querySelector(`output[for="${field}"]`);
                                if (errorOutput) {
                                    errorOutput.textContent = message;
                                }
                            });
                        }
                        
                        formStatus.innerHTML = `<section class="error">${result.message || 'An error occurred'}</section>`;
                    } else {
                        const errorText = await response.text();
                        formStatus.innerHTML = `<section class="error">Server error: ${response.status} ${response.statusText}</section>`;
                        console.error('Server error response:', errorText);
                    }
                    return;
                }
                
                // Parse JSON response
                const result = await response.json();
                
                // Success - show success message and redirect
                formStatus.innerHTML = `<section class="success">${result.message || 'Account created successfully!'}</section>`;
                
                // Store user data in sessionStorage
                if (result.user) {
                    sessionStorage.setItem('user', JSON.stringify({
                        id: result.user.id,
                        email: result.user.email,
                        role: result.user.user_metadata?.role || selectedRole,
                        name: result.user.user_metadata?.name || googleProfile?.name || '',
                        faculty: userData.faculty,
                        course: userData.course,
                        year_of_study: userData.year_of_study
                    }));
                    
                    if (result.user.session) {
                        sessionStorage.setItem('access_token', result.user.session.access_token);
                        sessionStorage.setItem('refresh_token', result.user.session.refresh_token);
                    }
                }
                
                // Get the user's role to redirect to the appropriate dashboard
                const userRole = result.user?.user_metadata?.role || selectedRole || 'student';
                const dashboardUrl = getDashboardUrlByRole(userRole);
                
                // Redirect to dashboard after successful signup
                setTimeout(() => {
                    window.location.href = dashboardUrl;
                }, 1500);
                
            } catch (error) {
                console.error('Error submitting form:', error);
                formStatus.innerHTML = `<section class="error">An unexpected error occurred. Please try again.</section>`;
            }
        });
    }
    
    // Initialize page - fetch Google profile first thing
    try {
        await fetchGoogleProfile();
        
        if (!googleProfile) {
            formStatus.innerHTML = `
                <section class="error">
                    Unable to retrieve your Google profile information. 
                    <a href="/auth/google">Try logging in with Google again</a>
                </section>
            `;
        }
    } catch (error) {
        console.error('Error during initialization:', error);
    }
    
    // Initialize step visibility
    showStep(0);
});