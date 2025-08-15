document.addEventListener('DOMContentLoaded', function() {
    // Get all modal elements
    const termsModal = document.getElementById('termsModal');
    const privacyModal = document.getElementById('privacyModal');
    const termsCheckbox = document.getElementById('termsAgree');
    
    // Modal trigger buttons
    const openTermsBtn = document.getElementById('openTerms');
    const openPrivacyBtn = document.getElementById('openPrivacy');
    
    // Modal close buttons
    const closeTermsBtn = document.getElementById('closeTerms');
    const closeTermsBtnFooter = document.getElementById('closeTermsBtn');
    const acceptTermsBtn = document.getElementById('acceptTermsBtn');
    
    const closePrivacyBtn = document.getElementById('closePrivacy');
    const closePrivacyBtnFooter = document.getElementById('closePrivacyBtn');
    const acceptPrivacyBtn = document.getElementById('acceptPrivacyBtn');
    
    // Store original body styles
    let originalBodyOverflow = '';
    let originalBodyPaddingRight = '';
    let scrollPosition = 0;
    
    
    // Function to fix modal scrolling dimensions
    function fixModalScrolling(modal) {
        if (!modal) return;
        
        const modalContent = modal.querySelector('.modal-content');
        const modalHeader = modal.querySelector('.modal-header');
        const modalFooter = modal.querySelector('.modal-footer');
        const modalBody = modal.querySelector('.modal-body');
        
        if (!modalContent || !modalHeader || !modalFooter || !modalBody) return;
        
        // Remove any existing height constraints
        modalContent.style.maxHeight = 'none';
        modalBody.style.maxHeight = 'none';
        modalBody.style.height = 'auto';
        
        // Force a reflow
        modalContent.offsetHeight;
        
        // Calculate viewport dimensions
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // Set modal container to full viewport on mobile, or with margins on desktop
        let modalMaxHeight;
        let modalMargin;
        
        if (viewportWidth <= 768) {
            modalMargin = 20; // 20px margin on mobile
            modalMaxHeight = viewportHeight - (modalMargin * 2);
        } else {
            modalMargin = 40; // 40px margin on desktop
            modalMaxHeight = viewportHeight - (modalMargin * 2);
        }
        
        // Set the modal content max height
        modalContent.style.maxHeight = `${modalMaxHeight}px`;
        modalContent.style.height = 'auto';
        modalContent.style.display = 'flex';
        modalContent.style.flexDirection = 'column';
        
        // Force layout calculation
        modalContent.offsetHeight;
        
        // Get actual header and footer heights after rendering
        const headerHeight = modalHeader.offsetHeight;
        const footerHeight = modalFooter.offsetHeight;
        
        // Calculate available height for modal body
        const availableHeight = modalMaxHeight - headerHeight - footerHeight - 2; // 2px buffer
        
        // Set modal body dimensions
        modalBody.style.height = `${availableHeight}px`;
        modalBody.style.maxHeight = `${availableHeight}px`;
        modalBody.style.minHeight = `${availableHeight}px`;
        modalBody.style.overflowY = 'auto';
        modalBody.style.overflowX = 'hidden';
        modalBody.style.flex = '1 1 auto';
        
        // Ensure smooth scrolling
        modalBody.style.scrollBehavior = 'smooth';
        modalBody.style.webkitOverflowScrolling = 'touch'; // iOS smooth scrolling
        
        // Reset scroll position
        modalBody.scrollTop = 0;
        
        // Debug info (remove in production)
        console.log('Modal dimensions calculated:', {
            viewportHeight,
            modalMaxHeight,
            headerHeight,
            footerHeight,
            availableHeight,
            modalBodyScrollHeight: modalBody.scrollHeight,
            modalBodyClientHeight: modalBody.clientHeight
        });
    }
    
    // Function to open modal
    function openModal(modal) {
        if (!modal) return;
        
        
        // Show modal
        modal.style.display = 'block';
        
        // Wait for display to take effect
        requestAnimationFrame(() => {
            modal.classList.add('active');
            
            // Fix scrolling after modal is visible
            setTimeout(() => {
                fixModalScrolling(modal);
            }, 50);
            
            // Focus management
            const closeBtn = modal.querySelector('.close-btn');
            if (closeBtn) {
                closeBtn.focus();
            }
        });
        
        // Add escape key listener
        document.addEventListener('keydown', handleEscapeKey);
    }
    
    // Function to close modal
    function closeModal(modal) {
        if (!modal) return;
        
        modal.classList.remove('active');
        
        // Wait for animation then hide
        setTimeout(() => {
            if (!modal.classList.contains('active')) {
                modal.style.display = 'none';
            
                
                // Clean up modal styles
                const modalContent = modal.querySelector('.modal-content');
                const modalBody = modal.querySelector('.modal-body');
                
                if (modalContent) {
                    modalContent.style.maxHeight = '';
                    modalContent.style.height = '';
                }
                
                if (modalBody) {
                    modalBody.style.height = '';
                    modalBody.style.maxHeight = '';
                    modalBody.style.minHeight = '';
                }
            }
        }, 300);
        
        document.removeEventListener('keydown', handleEscapeKey);
    }
    
    // Handle escape key
    function handleEscapeKey(e) {
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.modal.active');
            if (activeModal) {
                closeModal(activeModal);
            }
        }
    }
    
    // Terms Modal Event Listeners
    if (openTermsBtn) {
        openTermsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openModal(termsModal);
        });
    }
    
    if (closeTermsBtn) {
        closeTermsBtn.addEventListener('click', function() {
            closeModal(termsModal);
        });
    }
    
    if (closeTermsBtnFooter) {
        closeTermsBtnFooter.addEventListener('click', function() {
            closeModal(termsModal);
        });
    }
    
    if (acceptTermsBtn) {
        acceptTermsBtn.addEventListener('click', function() {
            if (termsCheckbox) {
                termsCheckbox.checked = true;
                termsCheckbox.dispatchEvent(new Event('change'));
                
                const formGroup = termsCheckbox.closest('.form-group');
                if (formGroup) {
                    formGroup.classList.add('valid');
                    formGroup.classList.remove('error');
                }
                
                showSuccessMessage('Terms accepted successfully!');
            }
            closeModal(termsModal);
        });
    }
    
    // Privacy Modal Event Listeners
    if (openPrivacyBtn) {
        openPrivacyBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openModal(privacyModal);
        });
    }
    
    if (closePrivacyBtn) {
        closePrivacyBtn.addEventListener('click', function() {
            closeModal(privacyModal);
        });
    }
    
    if (closePrivacyBtnFooter) {
        closePrivacyBtnFooter.addEventListener('click', function() {
            closeModal(privacyModal);
        });
    }
    
    if (acceptPrivacyBtn) {
        acceptPrivacyBtn.addEventListener('click', function() {
            showSuccessMessage('Privacy policy acknowledged!');
            closeModal(privacyModal);
        });
    }
    
    // Close modal when clicking overlay
    [termsModal, privacyModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === modal || e.target.classList.contains('modal-overlay')) {
                    closeModal(modal);
                }
            });
            
            // Prevent modal content clicks from closing modal
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.addEventListener('click', function(e) {
                    e.stopPropagation();
                });
            }
        }
    });
    
    // Enhanced checkbox interaction
    const termsLabel = document.querySelector('.terms-label');
    if (termsLabel) {
        termsLabel.addEventListener('click', function(e) {
            if (e.target.tagName.toLowerCase() === 'button' || 
                e.target.closest('button') || 
                e.target.classList.contains('terms-link') || 
                e.target.classList.contains('privacy-link')) {
                return;
            }
            
            if (termsCheckbox) {
                termsCheckbox.checked = !termsCheckbox.checked;
                termsCheckbox.dispatchEvent(new Event('change'));
            }
        });
    }
    
    // Checkbox change event
    if (termsCheckbox) {
        termsCheckbox.addEventListener('change', function() {
            const formGroup = this.closest('.form-group');
            const errorMessage = formGroup?.querySelector('.error-message');
            
            if (this.checked) {
                formGroup?.classList.add('valid');
                formGroup?.classList.remove('error');
                if (errorMessage) {
                    errorMessage.textContent = '';
                }
            } else {
                formGroup?.classList.remove('valid');
            }
        });
    }
    
    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const activeModal = document.querySelector('.modal.active');
            if (activeModal) {
                fixModalScrolling(activeModal);
            }
        }, 100);
    });
    
    // Add scroll event listeners for visual feedback
    function addScrollListeners() {
        const modalBodies = document.querySelectorAll('.modal-body');
        modalBodies.forEach(body => {
            body.addEventListener('scroll', function() {
                const scrollTop = this.scrollTop;
                const scrollHeight = this.scrollHeight;
                const clientHeight = this.clientHeight;
                
                const modal = this.closest('.modal');
                if (!modal) return;
                
                const modalContent = modal.querySelector('.modal-content');
                if (!modalContent) return;
                
                // Add shadow to header when scrolled
                if (scrollTop > 5) {
                    modalContent.classList.add('scrolled');
                } else {
                    modalContent.classList.remove('scrolled');
                }
                
                // Add shadow to footer when not at bottom
                const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 5;
                if (!isAtBottom) {
                    modalContent.classList.add('not-at-bottom');
                } else {
                    modalContent.classList.remove('not-at-bottom');
                }
                
                // Debug scroll info
                console.log('Scroll info:', {
                    scrollTop,
                    scrollHeight,
                    clientHeight,
                    isAtBottom,
                    remainingScroll: scrollHeight - clientHeight - scrollTop
                });
            });
        });
    }
    
    // Success message function
    function showSuccessMessage(message) {
        const existingMessage = document.querySelector('.temp-success-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        const successDiv = document.createElement('div');
        successDiv.className = 'temp-success-message';
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            z-index: 10001;
            font-weight: 500;
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
        `;
        successDiv.textContent = message;
        
        // Add styles if not present
        if (!document.querySelector('#success-animations')) {
            const style = document.createElement('style');
            style.id = 'success-animations';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .modal-content.scrolled .modal-header {
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                }
                .modal-content.not-at-bottom .modal-footer {
                    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => {
                if (successDiv.parentNode) {
                    successDiv.parentNode.removeChild(successDiv);
                }
            }, 300);
        }, 3000);
    }
    
    // Initialize modals
    function initializeModals() {
        [termsModal, privacyModal].forEach(modal => {
            if (modal) {
                modal.style.display = 'none';
                modal.classList.remove('active');
            }
        });
        
        addScrollListeners();
    }
    
    // Form validation
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            if (termsCheckbox && !termsCheckbox.checked) {
                e.preventDefault();
                const formGroup = termsCheckbox.closest('.form-group');
                const errorMessage = formGroup?.querySelector('.error-message');
                
                if (formGroup) {
                    formGroup.classList.add('error');
                    formGroup.classList.remove('valid');
                }
                
                if (errorMessage) {
                    errorMessage.textContent = 'You must agree to the Terms of Service and Privacy Policy to continue.';
                }
                
                const termsContainer = document.querySelector('.terms-container');
                if (termsContainer) {
                    termsContainer.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                }
                
                return false;
            }
        });
    }
    
    // Initialize everything
    initializeModals();
    
    // Additional CSS fix for modal scrolling
    const additionalStyles = document.createElement('style');
    additionalStyles.textContent = `
        .modal.active .modal-body {
            overflow-y: auto !important;
            overflow-x: hidden !important;
            -webkit-overflow-scrolling: touch;
        }
        
        .modal-content {
            display: flex !important;
            flex-direction: column !important;
        }
        
        .modal-body {
            flex: 1 1 auto !important;
        }
        
        .modal-header,
        .modal-footer {
            flex-shrink: 0 !important;
        }
        
        /* Custom scrollbar for better UX */
        .modal-body::-webkit-scrollbar {
            width: 6px;
        }
        
        .modal-body::-webkit-scrollbar-track {
            background: #f1f5f9;
        }
        
        .modal-body::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 3px;
        }
        
        .modal-body::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }
    `;
    document.head.appendChild(additionalStyles);
});