// Enhanced landing page functionality with animations

// Initialize scroll animations
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        animatedElements.forEach(el => {
            observer.observe(el);
        });
    } else {
        animatedElements.forEach(el => {
            el.classList.add('fade-in');
        });
    }
}

// Initialize counter animations
function initCounterAnimations() {
    const counters = document.querySelectorAll('.stat-number[data-target]');
    const statsSection = document.querySelector('.stats');
    
    if (!statsSection || !counters.length) return;
    
    function animateCounter(element, target) {
        let current = 0;
        const increment = target / 100;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            
            const formattedNumber = Math.floor(current).toLocaleString();
            element.textContent = target === 95 ? Math.floor(current) + '%' : formattedNumber + '+';
        }, 20);
    }
    
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                counters.forEach(counter => {
                    const target = parseInt(counter.getAttribute('data-target'));
                    animateCounter(counter, target);
                });
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    statsObserver.observe(statsSection);
}

// Initialize mobile navigation
function initMobileNavigation() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileNavClose = document.getElementById('mobile-nav-close');
    const mobileNav = document.getElementById('mobile-nav');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-links a');
    
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', function() {
            if (mobileNav) {
                mobileNav.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    }
    
    if (mobileNavClose) {
        mobileNavClose.addEventListener('click', function() {
            if (mobileNav) {
                mobileNav.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
    
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (mobileNav) {
                mobileNav.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });
}

// Initialize smooth scrolling
function initSmoothScrolling() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const headerHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Initialize all features
function initAllFeatures() {
    initScrollAnimations();
    initCounterAnimations();
    initMobileNavigation();
    initSmoothScrolling();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initAllFeatures);