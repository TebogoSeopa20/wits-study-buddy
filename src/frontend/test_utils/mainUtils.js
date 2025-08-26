// Mobile menu functionality - Modular version for testing

/**
 * Initialize mobile menu toggle functionality
 */
export function initMobileMenuToggle() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', function() {
            const navLinks = document.querySelector('.nav-links');
            if (navLinks) {
                navLinks.classList.toggle('show');
            }
        });
    }
    return mobileMenuButton;
}

/**
 * Initialize scroll animations with IntersectionObserver
 * @param {number} threshold - Intersection threshold (default: 0.1)
 * @returns {Object} Observer instance and animated elements
 */
export function initScrollAnimations(threshold = 0.1) {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    let observer = null;
    
    if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold });

        // Create a common simulateIntersection method for testing
        const simulateIntersection = function(isIntersecting) {
            if (isIntersecting) {
                // Add fade-in class to ALL animated elements for testing purposes
                animatedElements.forEach(el => {
                    el.classList.add('fade-in');
                    observer.unobserve(el);
                });
            }
        };

        animatedElements.forEach(el => {
            observer.observe(el);
            // Store observer reference for testing purposes
            el.__observer = {
                simulateIntersection: simulateIntersection
            };
        });
    } else {
        // Fallback for browsers that don't support IntersectionObserver
        animatedElements.forEach(el => {
            el.classList.add('fade-in');
        });
    }

    return { observer, animatedElements };
}

/**
 * Check if current view is mobile and update UI accordingly
 * @param {number} breakpoint - Mobile breakpoint in pixels (default: 768)
 */
export function checkMobileView(breakpoint = 768) {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    if (!mobileMenuButton) return false;
    
    const navLinks = document.querySelector('.nav-links');
    const authButtons = document.querySelector('.navbar .auth-buttons');
    const isMobile = window.innerWidth <= breakpoint;
    
    // Check if we're on a small screen (mobile view)
    if (isMobile) {
        mobileMenuButton.style.display = 'block';
        if (navLinks) navLinks.classList.add('hidden-mobile');
        if (authButtons) authButtons.classList.add('hidden-mobile');
    } else {
        // We're on a big screen
        mobileMenuButton.style.display = 'none';
        if (navLinks) navLinks.classList.remove('hidden-mobile');
        if (authButtons) authButtons.classList.remove('hidden-mobile');
    }
    
    return isMobile;
}

/**
 * Initialize full mobile navigation functionality
 * @returns {Object} References to mobile nav elements
 */
export function initMobileNavigation() {
    const mobileNavButton = document.getElementById('mobile-menu-button');
    const mobileNavClose = document.getElementById('mobile-nav-close');
    const mobileNav = document.getElementById('mobile-nav');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-links a');
    
    // Open mobile menu
    if (mobileNavButton) {
        mobileNavButton.addEventListener('click', function() {
            if (mobileNav) {
                mobileNav.classList.add('active');
                document.body.style.overflow = 'hidden'; // Prevent scrolling when menu is open
            }
        });
    }
    
    // Close mobile menu
    if (mobileNavClose) {
        mobileNavClose.addEventListener('click', function() {
            if (mobileNav) {
                mobileNav.classList.remove('active');
                document.body.style.overflow = ''; // Re-enable scrolling
            }
        });
    }
    
    // Close menu when clicking a link
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (mobileNav) {
                mobileNav.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });
    
    return {
        mobileNavButton,
        mobileNavClose,
        mobileNav,
        mobileNavLinks
    };
}

/**
 * Initialize all mobile menu functionality
 * This is the main initialization function that combines all features
 */
export function initAllMobileFeatures() {
    // Initialize mobile menu toggle if it exists
    initMobileMenuToggle();
    
    // Initialize scroll animations
    const scrollData = initScrollAnimations();
    
    // Initialize mobile navigation
    const navElements = initMobileNavigation();
    
    // Set initial display state for mobile menu button
    checkMobileView();
    
    // Check when window is resized
    window.addEventListener('resize', checkMobileView);
    
    return {
        scrollData,
        navElements
    };
}

// This allows the module to work as a drop-in replacement
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initAllMobileFeatures);
}

// Default export for convenience
export default {
    initMobileMenuToggle,
    initScrollAnimations,
    checkMobileView,
    initMobileNavigation,
    initAllMobileFeatures
};