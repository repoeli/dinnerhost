/**
 * Performance Optimization Script
 * Handles critical performance improvements for Core Web Vitals
 */

(function() {
  'use strict';
    /**
   * Prevents Cumulative Layout Shifts (CLS) by setting stable dimensions
   * for key page elements before content loads
   */
  function preventLayoutShifts() {
    // Set stable hero dimensions
    const hero = document.querySelector('.hero');
    if (hero) {
      hero.style.containIntrinsicSize = '100vw 80vh';
      hero.style.minHeight = '600px';
    }
    
    // Stabilize navbar height
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      navbar.style.height = '76px';
      navbar.style.minHeight = '76px';
    }
  }
    /**
   * Optimizes image loading to improve Largest Contentful Paint (LCP)
   * Sets dimensions immediately and implements a smooth fade-in effect
   * when images are loaded
   */
  function optimizeImageLoading() {
    const heroImg = document.querySelector('.hero-background-img');
    if (heroImg) {
      // Set dimensions immediately to prevent layout shifts
      heroImg.style.width = '100%';
      heroImg.style.height = '100%';
      heroImg.style.objectFit = 'cover';
      heroImg.style.position = 'absolute';
      heroImg.style.top = '0';
      heroImg.style.left = '0';
      
      // Add load event handler for fade-in effect
      heroImg.addEventListener('load', function() {
        this.style.opacity = '1';
        this.style.transition = 'opacity 0.3s ease-in-out';
      }, { once: true, passive: true });
      
      // Set initial opacity for fade-in effect
      if (heroImg.complete) {
        heroImg.style.opacity = '1';
      } else {
        heroImg.style.opacity = '0';
      }
    }
  }
    /**
   * Lazily loads non-critical CSS resources to improve initial page load
   * Uses the print media query trick to load CSS asynchronously without
   * blocking the page render
   */
  function loadNonCriticalCSS() {
    const stylesheets = [
      'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css'
    ];
    
    stylesheets.forEach(function(href) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.media = 'print';
      link.onload = function() {
        this.media = 'all';
      };
      document.head.appendChild(link);
    });
  }
    /**
   * Optimizes font loading using the font-display: swap property
   * Prevents invisible text during font loading by using system fonts first
   */
  function optimizeFontLoading() {
    // Preload system fonts for better performance
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'Segoe UI';
        font-display: swap;
      }
    `;
    document.head.appendChild(style);
  }
    /**
   * Initializes all performance optimizations
   * Calls critical optimizations immediately and defers non-critical ones
   * using requestIdleCallback when available
   */
  function init() {
    preventLayoutShifts();
    optimizeImageLoading();
    optimizeFontLoading();
    
    // Load non-critical resources after page load
    if (window.requestIdleCallback) {
      window.requestIdleCallback(loadNonCriticalCSS);
    } else {
      setTimeout(loadNonCriticalCSS, 1000);
    }
  }
  
  // Run as early as possible
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();
