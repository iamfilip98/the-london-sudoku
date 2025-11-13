/**
 * Mobile Gesture Handler
 *
 * Provides swipe gesture detection for mobile navigation:
 * - Swipe left: Next page
 * - Swipe right: Previous page
 * - Configurable swipe threshold
 * - Touch-only (no mouse events)
 */

class MobileGestureHandler {
  constructor(options = {}) {
    this.enabled = false;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;
    this.touchEndY = 0;
    this.touchStartTime = 0;
    this.isSwiping = false;

    // Configuration
    this.config = {
      minSwipeDistance: options.minSwipeDistance || 100, // Minimum distance for swipe (pixels)
      maxSwipeTime: options.maxSwipeTime || 500, // Maximum time for swipe (ms)
      maxVerticalDeviation: options.maxVerticalDeviation || 100, // Max vertical movement (pixels)
      edgeMargin: options.edgeMargin || 50, // Margin from edge to start swipe (pixels)
      enableSwipeNav: options.enableSwipeNav !== false, // Enable swipe navigation
      enablePullToRefresh: options.enablePullToRefresh || false, // Enable pull-to-refresh
      onSwipeLeft: options.onSwipeLeft || (() => {}),
      onSwipeRight: options.onSwipeRight || (() => {}),
      onSwipeUp: options.onSwipeUp || (() => {}),
      onSwipeDown: options.onSwipeDown || (() => {})
    };

    this.init();
  }

  /**
   * Initialize gesture detection
   */
  init() {
    // Only enable on touch devices
    if (!('ontouchstart' in window)) {
      return;
    }

    this.enabled = true;

    // Bind event handlers
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);

    // Add event listeners
    document.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd, { passive: true });

  }

  /**
   * Handle touch start
   */
  handleTouchStart(event) {
    // Don't interfere with input fields, textareas, or select elements
    if (this.isInteractiveElement(event.target)) {
      this.isSwiping = false;
      return;
    }

    const touch = event.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchStartTime = Date.now();
    this.isSwiping = true;
  }

  /**
   * Handle touch move
   */
  handleTouchMove(event) {
    if (!this.isSwiping) return;

    const touch = event.touches[0];
    this.touchEndX = touch.clientX;
    this.touchEndY = touch.clientY;

    // Calculate deltas
    const deltaX = this.touchEndX - this.touchStartX;
    const deltaY = this.touchEndY - this.touchStartY;

    // If horizontal swipe is dominant, prevent default scroll behavior
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 20) {
      event.preventDefault();
    }
  }

  /**
   * Handle touch end
   */
  handleTouchEnd(event) {
    if (!this.isSwiping) return;

    const deltaX = this.touchEndX - this.touchStartX;
    const deltaY = this.touchEndY - this.touchStartY;
    const deltaTime = Date.now() - this.touchStartTime;

    // Reset swiping flag
    this.isSwiping = false;

    // Check if swipe meets criteria
    if (deltaTime > this.config.maxSwipeTime) {
      return; // Swipe too slow
    }

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Horizontal swipe
    if (absX > this.config.minSwipeDistance && absY < this.config.maxVerticalDeviation) {
      if (deltaX > 0) {
        // Swipe right
        this.handleSwipeRight();
      } else {
        // Swipe left
        this.handleSwipeLeft();
      }
    }
    // Vertical swipe
    else if (absY > this.config.minSwipeDistance && absX < this.config.maxVerticalDeviation) {
      if (deltaY > 0) {
        // Swipe down
        this.handleSwipeDown();
      } else {
        // Swipe up
        this.handleSwipeUp();
      }
    }
  }

  /**
   * Handle swipe left (next page/action)
   */
  handleSwipeLeft() {
    this.config.onSwipeLeft();

    if (this.config.enableSwipeNav) {
      this.navigateNext();
    }
  }

  /**
   * Handle swipe right (previous page/action)
   */
  handleSwipeRight() {
    this.config.onSwipeRight();

    if (this.config.enableSwipeNav) {
      this.navigatePrevious();
    }
  }

  /**
   * Handle swipe up
   */
  handleSwipeUp() {
    this.config.onSwipeUp();
  }

  /**
   * Handle swipe down
   */
  handleSwipeDown() {
    this.config.onSwipeDown();

    if (this.config.enablePullToRefresh && window.scrollY === 0) {
      this.handlePullToRefresh();
    }
  }

  /**
   * Navigate to next page
   */
  navigateNext() {
    const activeNavLink = document.querySelector('.nav-link.active');
    if (!activeNavLink) return;

    const allNavLinks = Array.from(document.querySelectorAll('.nav-link[data-page]'));
    const currentIndex = allNavLinks.indexOf(activeNavLink);

    if (currentIndex < allNavLinks.length - 1) {
      const nextLink = allNavLinks[currentIndex + 1];
      nextLink.click();

      // Visual feedback
      this.showSwipeFeedback('left');
    }
  }

  /**
   * Navigate to previous page
   */
  navigatePrevious() {
    const activeNavLink = document.querySelector('.nav-link.active');
    if (!activeNavLink) return;

    const allNavLinks = Array.from(document.querySelectorAll('.nav-link[data-page]'));
    const currentIndex = allNavLinks.indexOf(activeNavLink);

    if (currentIndex > 0) {
      const prevLink = allNavLinks[currentIndex - 1];
      prevLink.click();

      // Visual feedback
      this.showSwipeFeedback('right');
    }
  }

  /**
   * Show visual feedback for swipe
   */
  showSwipeFeedback(direction) {
    // Create feedback indicator
    const feedback = document.createElement('div');
    feedback.className = 'swipe-feedback';
    feedback.style.cssText = `
      position: fixed;
      ${direction === 'left' ? 'right: 20px' : 'left: 20px'};
      top: 50%;
      transform: translateY(-50%);
      width: 60px;
      height: 60px;
      background: rgba(102, 126, 234, 0.8);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      color: white;
      z-index: 10000;
      animation: swipeFeedbackAnim 0.5s ease-out;
      pointer-events: none;
    `;

    feedback.textContent = direction === 'left' ? '◀' : '▶';
    document.body.appendChild(feedback);

    // Remove after animation
    setTimeout(() => feedback.remove(), 500);
  }

  /**
   * Handle pull-to-refresh
   */
  handlePullToRefresh() {

    // Show loading indicator
    const loader = document.createElement('div');
    loader.id = 'pull-refresh-loader';
    loader.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(102, 126, 234, 0.9);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10000;
      animation: slideDown 0.3s ease-out;
    `;
    loader.textContent = '🔄 Refreshing...';
    document.body.appendChild(loader);

    // Reload page after brief delay
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }

  /**
   * Check if element is interactive (should not trigger swipe)
   */
  isInteractiveElement(element) {
    const tagName = element.tagName.toLowerCase();
    const interactiveTags = ['input', 'textarea', 'select', 'button', 'a'];
    const interactiveClasses = ['sudoku-cell', 'number-btn', 'action-btn'];

    // Check tag name
    if (interactiveTags.includes(tagName)) {
      return true;
    }

    // Check if element or parent has interactive class
    let current = element;
    while (current && current !== document.body) {
      if (interactiveClasses.some(cls => current.classList.contains(cls))) {
        return true;
      }
      current = current.parentElement;
    }

    return false;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Disable gesture handler
   */
  disable() {
    if (!this.enabled) return;

    document.removeEventListener('touchstart', this.handleTouchStart);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);

    this.enabled = false;
  }

  /**
   * Re-enable gesture handler
   */
  enable() {
    if (this.enabled) return;

    document.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd, { passive: true });

    this.enabled = true;
  }
}

// Add CSS animation for swipe feedback
const style = document.createElement('style');
style.textContent = `
  @keyframes swipeFeedbackAnim {
    0% {
      opacity: 0;
      transform: translateY(-50%) scale(0.5);
    }
    50% {
      opacity: 1;
      transform: translateY(-50%) scale(1.1);
    }
    100% {
      opacity: 0;
      transform: translateY(-50%) scale(1);
    }
  }

  @keyframes slideDown {
    from {
      transform: translate(-50%, -100px);
      opacity: 0;
    }
    to {
      transform: translate(-50%, 0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobileGestureHandler;
}

// Make available globally
window.MobileGestureHandler = MobileGestureHandler;
