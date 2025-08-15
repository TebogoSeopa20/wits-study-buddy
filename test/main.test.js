// main.test.js
import {
    initMobileMenuToggle,
    initScrollAnimations,
    checkMobileView,
    initMobileNavigation,
    initAllMobileFeatures
} from '../src/frontend/js/main.js';

describe('Mobile Menu Module', () => {
    let originalDocument;
    let originalWindow;

    beforeAll(() => {
        // Store original globals
        originalDocument = global.document;
        originalWindow = global.window;
    });

    afterAll(() => {
        // Restore original globals
        global.document = originalDocument;
        global.window = originalWindow;
    });

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // Create basic DOM structure
        document.body.innerHTML = `
            <button id="mobile-menu-button">Menu</button>
            <div class="nav-links"></div>
            <div class="auth-buttons"></div>
            <div id="mobile-nav">
                <button id="mobile-nav-close">Close</button>
                <div class="mobile-nav-links">
                    <a href="#">Link 1</a>
                    <a href="#">Link 2</a>
                </div>
            </div>
            <div class="animate-on-scroll">Animated Element</div>
        `;

        // Mock window properties
        global.window = {
            innerWidth: 1024,
            addEventListener: jest.fn(),
            IntersectionObserver: jest.fn().mockImplementation((callback, options) => ({
                observe: jest.fn(),
                unobserve: jest.fn(),
                disconnect: jest.fn(),
                callback,
                options
            })),
            removeEventListener: jest.fn()
        };
    });

    describe('initMobileMenuToggle', () => {

        test('should toggle nav-links show class when button is clicked', () => {
            const button = initMobileMenuToggle();
            const navLinks = document.querySelector('.nav-links');
            
            // Simulate click
            button.click();
            
            expect(navLinks.classList.contains('show')).toBe(true);
            
            // Click again to toggle off
            button.click();
            expect(navLinks.classList.contains('show')).toBe(false);
        });

        test('should handle missing button gracefully', () => {
            document.getElementById('mobile-menu-button').remove();
            const result = initMobileMenuToggle();
            expect(result).toBeNull();
        });

        test('should handle missing nav-links gracefully', () => {
            document.querySelector('.nav-links').remove();
            const button = initMobileMenuToggle();
            
            expect(() => button.click()).not.toThrow();
        });
    });

    describe('checkMobileView', () => {
        test('should show mobile menu button on small screens', () => {
            window.innerWidth = 500;
            const result = checkMobileView();
            
            expect(result).toBe(true);
            expect(document.getElementById('mobile-menu-button').style.display).toBe('block');
            expect(document.querySelector('.nav-links').classList.contains('hidden-mobile')).toBe(true);
        });

        test('should hide mobile menu button on large screens', () => {
            window.innerWidth = 1024;
            const result = checkMobileView();
            
            expect(result).toBe(false);
            expect(document.getElementById('mobile-menu-button').style.display).toBe('none');
            expect(document.querySelector('.nav-links').classList.contains('hidden-mobile')).toBe(false);
        });

        test('should use custom breakpoint', () => {
            window.innerWidth = 900;
            const result = checkMobileView(1000);
            expect(result).toBe(true);
        });

        test('does nothing if mobileMenuButton is missing', () => {
            document.getElementById('mobile-menu-button').remove();
            const result = checkMobileView();
            expect(result).toBe(false);
        });
    });

    describe('initScrollAnimations', () => {


        test('should add fade-in class when element intersects', () => {
            const { observer } = initScrollAnimations();
            const animatedElement = document.querySelector('.animate-on-scroll');
            
            // Simulate intersection
            observer.callback([{
                target: animatedElement,
                isIntersecting: true
            }]);
            
            expect(animatedElement.classList.contains('fade-in')).toBe(true);
        });

        test('should fallback gracefully when IntersectionObserver is not supported', () => {
            // Remove IntersectionObserver
            delete window.IntersectionObserver;
            
            const result = initScrollAnimations();
            const animatedElement = document.querySelector('.animate-on-scroll');
            
            expect(animatedElement.classList.contains('fade-in')).toBe(true);
            expect(result.observer).toBeNull();
        });
    });

    describe('initMobileNavigation', () => {
        test('should return navigation elements', () => {
            const result = initMobileNavigation();
            
            expect(result.mobileNavButton).toBe(document.getElementById('mobile-menu-button'));
            expect(result.mobileNavClose).toBe(document.getElementById('mobile-nav-close'));
            expect(result.mobileNav).toBe(document.getElementById('mobile-nav'));
            expect(result.mobileNavLinks.length).toBe(2);
        });

        test('should open mobile menu when button is clicked', () => {
            const { mobileNavButton, mobileNav } = initMobileNavigation();
            
            mobileNavButton.click();
            
            expect(mobileNav.classList.contains('active')).toBe(true);
            expect(document.body.style.overflow).toBe('hidden');
        });

        test('should close mobile menu when link is clicked', () => {
            const { mobileNavLinks, mobileNav } = initMobileNavigation();
            
            // Open menu first
            document.getElementById('mobile-menu-button').click();
            
            // Click a link
            mobileNavLinks[0].click();
            
            expect(mobileNav.classList.contains('active')).toBe(false);
            expect(document.body.style.overflow).toBe('');
        });
    });
});
