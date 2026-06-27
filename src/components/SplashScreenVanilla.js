/**
 * SplashScreen.js - Standalone Vanilla JS Implementation of the Animated Splash Screen
 * 
 * This file provides a pure vanilla JS implementation of the Fast Coverage (FC) Splash Screen.
 * It is fully functional, easy to customize, and can be used on standard static HTML websites 
 * or alternative environments without any external dependencies.
 */

class VanillaSplashScreen {
  constructor(options = {}) {
    this.duration = options.duration || 2600; // Total loading animation time in ms
    this.onComplete = options.onComplete || null;
    this.containerId = options.containerId || 'splash-screen-root';
    this.sessionKey = options.sessionKey || 'fc_splash_shown';
    this.logoText = options.logoText || 'FC';
    this.titleText = options.titleText || 'FAST COVERAGE';
    this.subtitleText = options.subtitleText || 'Breaking News • Live Updates • Global Coverage';
  }

  init() {
    // 1. Accessibility Check: Respect user preference for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // 2. Session Check: Show only once per browser session
    const alreadyShown = sessionStorage.getItem(this.sessionKey);

    if (alreadyShown === 'true' || prefersReducedMotion) {
      this.finishImmediate();
      return;
    }

    // 3. Render and animate
    this.render();
    this.startTimers();
  }

  render() {
    // Create splash screen overlay element
    const overlay = document.createElement('div');
    overlay.id = this.containerId;
    overlay.className = 'splash-overlay';
    
    // Split title into individual letter nodes to trigger the typing effect
    const lettersHtml = this.titleText.split('').map((char, index) => {
      const delay = index * 40 + 200;
      const spacing = char === ' ' ? 'margin-right: 0.45em' : 'margin-right: 0.02em';
      const displayText = char === ' ' ? '&nbsp;' : char;
      return `<span class="splash-letter" style="animation-delay: ${delay}ms; ${spacing}">${displayText}</span>`;
    }).join('');

    overlay.innerHTML = `
      <div class="splash-content" id="splash_content_wrapper">
        <div class="logo-container" id="splash_logo_ring_container">
          <div class="light-sweep-ring"></div>
          <div class="splash-logo-badge" id="splash_logo_icon">${this.logoText}</div>
        </div>
        <div class="splash-title-container" id="splash_title_wrapper">
          <h1 class="splash-title-text">${lettersHtml}</h1>
        </div>
        <p class="splash-subtitle" id="splash_tagline">${this.subtitleText}</p>
      </div>
      <div class="loading-bar-container" id="splash_progress_bar">
        <div class="loading-bar-fill" style="animation-duration: ${this.duration}ms"></div>
      </div>
    `;

    document.body.appendChild(overlay);
    
    // Inject a slight zoom/fade transition placeholder on the main page wrapper if it exists
    const mainShell = document.getElementById('public_news_shell') || document.getElementById('root');
    if (mainShell) {
      mainShell.classList.add('app-reveal-init');
    }
  }

  startTimers() {
    const overlay = document.getElementById(this.containerId);
    const mainShell = document.getElementById('public_news_shell') || document.getElementById('root');

    // Start fade-out effect as loading bar finishes
    setTimeout(() => {
      if (overlay) {
        overlay.classList.add('splash-fade-out');
      }
      if (mainShell) {
        mainShell.classList.add('app-reveal-active');
      }
    }, this.duration);

    // Completely remove the elements and finalize
    setTimeout(() => {
      this.remove();
    }, this.duration + 600); // 600ms corresponds to transition duration
  }

  finishImmediate() {
    sessionStorage.setItem(this.sessionKey, 'true');
    const mainShell = document.getElementById('public_news_shell') || document.getElementById('root');
    if (mainShell) {
      mainShell.classList.remove('app-reveal-init');
      mainShell.classList.add('app-reveal-active');
    }
    if (this.onComplete) {
      this.onComplete();
    }
  }

  remove() {
    sessionStorage.setItem(this.sessionKey, 'true');
    const overlay = document.getElementById(this.containerId);
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
    if (this.onComplete) {
      this.onComplete();
    }
  }
}

// Export for standard modern ESM environments, but support global execution too
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VanillaSplashScreen;
} else {
  window.VanillaSplashScreen = VanillaSplashScreen;
}
