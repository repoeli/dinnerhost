/**
 * Enhanced Hero Animations
 * Adds subtle parallax and animation effects to the hero section
 */

document.addEventListener('DOMContentLoaded', () => {
  // Apply enhanced animations to hero section
  setupHeroAnimations();
  
  // Setup explore dinners button
  setupExploreDinnersButton();
  
  // Setup search focus effects
  setupSearchFocusEffects();
});

/**
 * Sets up the Explore Dinners button click handler
 * Handles smooth scrolling to the featured dinners section and focusing the search input
 */
function setupExploreDinnersButton() {
  const exploreBtn = document.getElementById('exploreDinnersBtn');
  if (!exploreBtn) return;
  
  exploreBtn.addEventListener('click', () => {
    const featuredSection = document.getElementById('featured-dinners');
    if (featuredSection) {
      featuredSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      
      // Focus the search box when scrolled to
      setTimeout(() => {
        const searchInput = document.getElementById('heroSearch');
        if (searchInput) {
          searchInput.focus();
        }
      }, 800); // Delay to wait for the scroll to complete
    }
  });
}

/**
 * Sets up enhanced animations for the hero section
 */
function setupHeroAnimations() {
  const hero = document.querySelector('.hero');
  const heroBackground = document.querySelector('.hero-background');
  
  if (!hero || !heroBackground) return;
  
  // Throttled mouse move handler for better performance
  let mouseThrottle = null;
  hero.addEventListener('mousemove', (e) => {
    if (mouseThrottle) return;
    
    mouseThrottle = setTimeout(() => {
      const xValue = e.clientX - window.innerWidth / 2;
      const yValue = e.clientY - window.innerHeight / 2;
      
      // More subtle movement for better performance
      heroBackground.style.transform = `scale(1.05) translate(${xValue * 0.005}px, ${yValue * 0.005}px)`;
      mouseThrottle = null;
    }, 16); // ~60fps throttling
  });
  
  // Return to original position when mouse leaves
  hero.addEventListener('mouseleave', () => {
    heroBackground.style.transform = 'scale(1.05)';
    heroBackground.style.transition = 'transform 0.3s ease-out';
    
    // Reset transition after animation
    setTimeout(() => {
      heroBackground.style.transition = '';
    }, 300);
  });
  
  // Throttled scroll handler for better performance
  let scrollThrottle = null;
  let ticking = false;
  
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollPosition = window.scrollY;
        const heroContent = hero.querySelector('.hero-content');
        
        // Only update if elements exist and scroll position changed significantly
        if (heroContent && scrollPosition > 50) {
          const opacity = Math.max(0, 1 - scrollPosition / 800); // Slower fade for better performance
          heroContent.style.opacity = opacity.toString();
        } else if (heroContent) {
          heroContent.style.opacity = '1';
        }
        
        ticking = false;
      });
      
      ticking = true;
    }
  }, { passive: true }); // Passive listener for better performance
}

/**
 * Sets up enhanced focus effects for the search input
 */
function setupSearchFocusEffects() {
  const searchInput = document.getElementById('heroSearch');
  const searchContainer = document.querySelector('.dinner-search-container');
  
  if (!searchInput || !searchContainer) return;
  
  // Add focus effects
  searchInput.addEventListener('focus', () => {
    searchContainer.classList.add('search-focused');
  });
  
  searchInput.addEventListener('blur', () => {
    searchContainer.classList.remove('search-focused');
  });
}
