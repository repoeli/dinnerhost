/**
 * Fire Animation for Dinner Hosting Application
 * Creates a beautiful flame effect on featured dinners
 */

class FireAnimation {
  constructor(options = {}) {
    // Default configuration
    this.config = {
      containerId: options.containerId || 'featured-dinners',
      particleCount: options.particleCount || 50,
      baseHue: options.baseHue || 15, // Orange-ish base color
      hueVariation: options.hueVariation || 20,
      speedFactor: options.speedFactor || 1,
      sizeMultiplier: options.sizeMultiplier || 1,
      duration: options.duration || 2000
    };
    
    this.container = document.getElementById(this.config.containerId);
    this.particles = [];
    this.isAnimating = false;
    this.initialized = false;
  }
  
  /**
   * Initialize the fire animation system
   */
  init() {
    if (this.initialized || !this.container) return;
    
    // Create flame container
    this.flameContainer = document.createElement('div');
    this.flameContainer.className = 'flame-container';
    this.flameContainer.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 0;
      pointer-events: none;
      overflow: hidden;
      z-index: 5;
      opacity: 0;
      transition: height 0.3s ease-out, opacity 0.3s ease-out;
    `;
    
    // Create flame layer
    this.flameLayer = document.createElement('div');
    this.flameLayer.className = 'flame-layer';
    this.flameLayer.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 100%;
    `;
    
    this.flameContainer.appendChild(this.flameLayer);
    this.container.style.position = this.container.style.position || 'relative';
    this.container.appendChild(this.flameContainer);
    
    this.initialized = true;
  }
  
  /**
   * Create a single flame particle
   */
  createParticle() {
    const particle = document.createElement('div');
    
    // Randomize particle properties
    const size = (5 + Math.random() * 15) * this.config.sizeMultiplier;
    const posX = Math.random() * 100; // percentage
    const speed = (1 + Math.random() * 2) * this.config.speedFactor;
    const delay = Math.random() * 1000;
    const hue = this.config.baseHue + (Math.random() * this.config.hueVariation * 2 - this.config.hueVariation);
    const opacity = 0.5 + Math.random() * 0.5;
    
    // Set particle styling
    particle.className = 'flame-particle';
    particle.style.cssText = `
      position: absolute;
      bottom: -20px;
      left: ${posX}%;
      width: ${size}px;
      height: ${size * 1.5}px;
      background: radial-gradient(ellipse at center, 
        hsla(${hue}, 100%, 75%, ${opacity}) 0%, 
        hsla(${hue - 10}, 100%, 50%, ${opacity * 0.8}) 40%, 
        hsla(${hue - 20}, 100%, 40%, 0) 100%);
      border-radius: 50% 50% 25% 25%;
      filter: blur(${size / 10}px);
      transform: translateY(0) scale(1);
      opacity: ${opacity};
      animation: flame-rise ${2 / speed}s ease-out ${delay}ms infinite;
      box-shadow: 0 0 ${size/2}px hsla(${hue}, 100%, 60%, 0.5);
    `;
    
    return particle;
  }
  
  /**
   * Animate the fire effect
   */
  animate() {
    if (!this.initialized) {
      this.init();
    }
    
    if (this.isAnimating) return;
    this.isAnimating = true;
    
    // Clear any existing particles
    this.flameLayer.innerHTML = '';
    this.particles = [];
    
    // Add CSS animation for particles
    if (!document.getElementById('flame-keyframes')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'flame-keyframes';
      styleSheet.textContent = `
        @keyframes flame-rise {
          0% {
            transform: translateY(0) scale(1) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          50% {
            transform: translateY(-100px) scale(1.5) rotate(${Math.random() > 0.5 ? 5 : -5}deg);
          }
          100% {
            transform: translateY(-200px) scale(0.5) rotate(${Math.random() > 0.5 ? 10 : -10}deg);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(styleSheet);
    }
    
    // Make container visible
    this.flameContainer.style.height = '200px';
    this.flameContainer.style.opacity = '1';
    
    // Create particles
    for (let i = 0; i < this.config.particleCount; i++) {
      const particle = this.createParticle();
      this.flameLayer.appendChild(particle);
      this.particles.push(particle);
    }
    
    // Stop animation after duration
    setTimeout(() => {
      this.stop();
    }, this.config.duration);
  }
  
  /**
   * Stop the fire animation
   */
  stop() {
    if (!this.isAnimating) return;
    
    this.flameContainer.style.height = '0';
    this.flameContainer.style.opacity = '0';
    
    // Clean up particles after transition completes
    setTimeout(() => {
      this.flameLayer.innerHTML = '';
      this.particles = [];
      this.isAnimating = false;
    }, 300);
  }
}

// Initialize fire animation when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Create global fire animation instance
  window.fireAnimation = new FireAnimation({
    particleCount: 60,
    baseHue: 20,    // Slightly more orange
    hueVariation: 15, 
    duration: 2500  // Slightly longer duration
  });
  
  // Set up element hover effects
  setupFireHoverEffects();
});

/**
 * Set up hover effects for dinner cards to trigger fire animation
 */
function setupFireHoverEffects() {
  // Apply to each dinner card
  const dinnerCards = document.querySelectorAll('.dinner-card');
  
  dinnerCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      // Get card boundaries
      const rect = card.getBoundingClientRect();
      
      // Create a localized fire effect
      const localFire = new FireAnimation({
        particleCount: 30,
        baseHue: 15 + Math.random() * 10, // Slight variation between cards
        duration: 1500,
        sizeMultiplier: 0.8
      });
      
      // Create custom container for this card
      const fireContainer = document.createElement('div');
      fireContainer.className = 'card-fire-container';
      fireContainer.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        overflow: hidden;
        z-index: 1;
      `;
      
      card.style.position = 'relative';
      card.appendChild(fireContainer);
      
      // Initialize and animate
      localFire.config.containerId = null;
      localFire.container = fireContainer;
      localFire.init();
      localFire.animate();
      
      // Remove container after animation
      setTimeout(() => {
        card.removeChild(fireContainer);
      }, 2000);
    });
  });
  
  // Apply to featured section for search effects
  const featuredSection = document.getElementById('featured-dinners');
  if (featuredSection) {
    // Trigger animation when search is performed
    const searchBtn = document.getElementById('heroSearchBtn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        // Only animate if there's text in the search box
        const searchInput = document.getElementById('heroSearch');
        if (searchInput && searchInput.value.trim()) {
          window.fireAnimation.animate();
        }
      });
    }
    
    // Also trigger on Enter key in search box
    const searchInput = document.getElementById('heroSearch');
    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && searchInput.value.trim()) {
          window.fireAnimation.animate();
        }
      });
    }
  }
  
  // Apply to filter buttons
  const filterButtons = document.querySelectorAll('[id^="filter-"]');
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      window.fireAnimation.animate();
    });
  });
}
