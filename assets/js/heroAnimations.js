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
  
  // Add subtle parallax effect on mouse move
  hero.addEventListener('mousemove', (e) => {
    const xValue = e.clientX - window.innerWidth / 2;
    const yValue = e.clientY - window.innerHeight / 2;
    
    // Subtle movement based on mouse position
    heroBackground.style.transform = `scale(1.05) translate(${xValue * 0.01}px, ${yValue * 0.01}px)`;
  });
  
  // Return to original position when mouse leaves
  hero.addEventListener('mouseleave', () => {
    heroBackground.style.transform = 'scale(1.05)';
    setTimeout(() => {
      // Resume the subtle-zoom animation after a short delay
      heroBackground.style.animation = 'subtle-zoom 30s infinite alternate cubic-bezier(0.25, 0.1, 0.25, 1)';
    }, 500);
  });
  
  // Pause the standard animation when mouse enters to allow for parallax effect
  hero.addEventListener('mouseenter', () => {
    heroBackground.style.animation = 'none';
  });
  
  // Add scroll-based effects
  window.addEventListener('scroll', () => {
    const scrollPosition = window.scrollY;
    
    // Fade out hero elements on scroll
    if (scrollPosition > 50) {
      const opacity = Math.max(0, 1 - scrollPosition / 500);
      hero.style.setProperty('--scroll-opacity', opacity.toString());
      hero.querySelector('.hero-content').style.opacity = opacity.toString();
    } else {
      hero.style.setProperty('--scroll-opacity', '1');
      hero.querySelector('.hero-content').style.opacity = '1';
    }
  });
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
