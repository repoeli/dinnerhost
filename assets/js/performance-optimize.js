/**
 * Performance Optimization Script
 * Handles critical performance improvements for Core Web Vitals
 */

(function() {
  'use strict';
  
  // Prevent layout shifts by setting stable dimensions
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
  
  // Optimize image loading to prevent CLS
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
  
  // Lazy load non-critical CSS
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
  
  // Optimize font loading
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
  
  // Initialize optimizations
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
