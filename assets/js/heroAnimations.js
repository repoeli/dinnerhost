/**
 * Optimized Hero Animations - Performance Focused
 * Prevents layout shifts and improves Core Web Vitals
 */

// Use immediate execution to reduce delays
(function() {
  'use strict';
  
  // Cache DOM elements for better performance
  let cachedElements = {};
    /**
   * Retrieves cached DOM elements or fetches them once
   * @param {string} id - ID of the element to retrieve
   * @returns {HTMLElement|null} - The cached DOM element or null
   */
  function getCachedElement(id) {
    if (!cachedElements[id]) {
      cachedElements[id] = document.getElementById(id);
    }
    return cachedElements[id];
  }
  
  /**
   * Sets up the "Explore Dinners" button click handler
   * Smoothly scrolls to featured dinners section and focuses search
   */
  function setupExploreDinnersButton() {
    const exploreBtn = getCachedElement('exploreDinnersBtn');
    if (!exploreBtn) return;
    
    exploreBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      const featuredSection = getCachedElement('featured-dinners');
      if (featuredSection) {
        // Use requestAnimationFrame for smoother performance
        requestAnimationFrame(function() {
          featuredSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
          
          // Focus the search box with optimized timing
          setTimeout(function() {
            const searchInput = getCachedElement('heroSearch');
            if (searchInput && typeof searchInput.focus === 'function') {
              try {
                searchInput.focus();
              } catch (e) {
                // Ignore focus errors in case element is not focusable
              }
            }
          }, 800);
        });
      }
    }, { passive: false });
  }
    /**
   * Sets up focus and blur effects for the search input
   * Adds/removes classes for visual feedback using requestAnimationFrame
   */
  function setupSearchFocusEffects() {
    const searchInput = getCachedElement('heroSearch');
    const searchContainer = document.querySelector('.dinner-search-container');
    
    if (!searchInput || !searchContainer) return;
    
    // Use passive listeners for better performance
    searchInput.addEventListener('focus', function() {
      requestAnimationFrame(function() {
        searchContainer.classList.add('search-focused');
      });
    }, { passive: true });
    
    searchInput.addEventListener('blur', function() {
      requestAnimationFrame(function() {
        searchContainer.classList.remove('search-focused');
      });
    }, { passive: true });
  }
    /**
   * Implements lazy loading for non-critical sections
   * Uses IntersectionObserver for efficient loading when sections come into view
   * Includes fallback for browsers without IntersectionObserver support
   */
  function lazyLoadNonCriticalSections() {
    // Check for Intersection Observer support
    if (!('IntersectionObserver' in window)) {
      // Fallback for older browsers - just add visible class
      const sections = document.querySelectorAll('.stats-section, .featured-dinners-section');
      sections.forEach(function(section) {
        section.classList.add('visible');
      });
      return;
    }
    
    const lazyLoadSections = document.querySelectorAll('.stats-section, .featured-dinners-section');
    if (lazyLoadSections.length === 0) return;
    
    const sectionObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          requestAnimationFrame(function() {
            entry.target.classList.add('visible');
          });
          sectionObserver.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '50px', // Reduced from 100px for better performance
      threshold: 0.1
    });
    
    lazyLoadSections.forEach(function(section) {
      sectionObserver.observe(section);
    });
  }
    /**
   * Prevents layout shifts in the hero section
   * Sets CSS properties to maintain stability during page load
   */
  function stabilizeHeroLayout() {
    const hero = document.querySelector('.hero');
    const heroContent = document.querySelector('.hero-content');
    
    if (hero && heroContent) {
      // Force layout stability
      hero.style.containIntrinsicSize = '100vw 80vh';
      heroContent.style.contain = 'layout style';
      
      // Add preload class for smooth fade-in
      heroContent.classList.add('hero-preload');
    }
  }
  
  /**
   * Initializes all hero animations and optimizations
   * Sets up event listeners and triggers initial functions
   */
  function init() {
    setupExploreDinnersButton();
    setupSearchFocusEffects();
    stabilizeHeroLayout();
    
    // Delay non-critical operations
    if (window.requestIdleCallback) {
      window.requestIdleCallback(lazyLoadNonCriticalSections);
    } else {
      setTimeout(lazyLoadNonCriticalSections, 100);
    }
  }
  
  // Use DOMContentLoaded for faster initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();
