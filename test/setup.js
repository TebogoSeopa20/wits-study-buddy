// test/setup.js

// Inject initial HTML to mock DOM structure
document.body.innerHTML = `
<div class="navbar">
  <div class="logo">Logo</div>
  <ul class="nav-links">
    <li><a href="#">Home</a></li>
    <li><a href="#">About</a></li>
    <li><a href="#">Contact</a></li>
  </ul>
  <div class="auth-buttons">
    <button>Login</button>
    <button>Register</button>
  </div>
  <button id="mobile-menu-button" aria-label="Toggle menu">Menu</button>
</div>

<div id="mobile-nav">
  <button id="mobile-nav-close" aria-label="Close menu">Close</button>
  <ul class="mobile-nav-links">
    <li><a href="#">Home</a></li>
    <li><a href="#">About</a></li>
    <li><a href="#">Contact</a></li>
  </ul>
</div>

<div class="content">
  <div class="animate-on-scroll">Animated element 1</div>
  <div class="animate-on-scroll">Animated element 2</div>
</div>
`;

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
    this.elements = new Set();
    this.mockInstance = {
      observe: jest.fn((element) => this.elements.add(element)),
      unobserve: jest.fn((element) => this.elements.delete(element)),
      disconnect: jest.fn(() => this.elements.clear()),
      elements: this.elements
    };

    IntersectionObserver.mock = this.mockInstance;
  }

  observe(element) {
    this.mockInstance.observe(element);
  }

  unobserve(element) {
    this.mockInstance.unobserve(element);
  }

  disconnect() {
    this.mockInstance.disconnect();
  }

  simulateIntersection(isIntersecting = true) {
    const entries = Array.from(this.elements).map(target => ({
      isIntersecting,
      target,
      boundingClientRect: {},
      intersectionRatio: isIntersecting ? 1 : 0,
      intersectionRect: {},
      rootBounds: null,
      time: Date.now()
    }));

    this.callback(entries, this);
  }
};

// Mock window resize functionality
window.resizeTo = function (width, height) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width
  });

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height
  });

  window.dispatchEvent(new Event('resize'));
};

// Set initial window size
window.innerWidth = 1024;
window.innerHeight = 768;

// Mock getBoundingClientRect
const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
Element.prototype.getBoundingClientRect = function () {
  const className = this.className || '';

  if (className.includes('logo')) {
    return { width: 100, height: 50, top: 0, left: 0, right: 100, bottom: 50 };
  } else if (className.includes('nav-links')) {
    return { width: 300, height: 50, top: 0, left: 100, right: 400, bottom: 50 };
  } else if (className.includes('auth-buttons')) {
    return { width: 200, height: 50, top: 0, left: 400, right: 600, bottom: 50 };
  } else if (className.includes('navbar')) {
    return { width: 800, height: 50, top: 0, left: 0, right: 800, bottom: 50 };
  }

  return { width: 100, height: 100, top: 0, left: 0, right: 100, bottom: 100 };
};

// Mock offsetWidth and offsetHeight
Object.defineProperty(Element.prototype, 'offsetWidth', {
  get() {
    if (this.classList.contains('logo')) return 100;
    if (this.classList.contains('nav-links')) return 300;
    if (this.classList.contains('auth-buttons')) return 200;
    if (this.classList.contains('navbar')) return 800;
    return 100;
  },
  configurable: true
});

Object.defineProperty(Element.prototype, 'offsetHeight', {
  get() {
    return 50;
  },
  configurable: true
});

// Silence test noise
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn()
};

// ✅ Safe mock for document.readyState
Object.defineProperty(document, 'readyState', {
  get: () => 'loading',
  configurable: true,
});

// Optional: simulate DOMContentLoaded
document.dispatchEvent(new Event('DOMContentLoaded'));

// Mock window.dispatchEvent
window.dispatchEvent = jest.fn(window.dispatchEvent);
