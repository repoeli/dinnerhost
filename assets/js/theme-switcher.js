/**
 * Theme Switcher Functionality
 * Handles light/dark mode toggling and persistence
 */

// Theme switching functionality
class ThemeSwitcher {
  constructor() {
    this.storageKey = 'preferred-theme';
    this.defaultTheme = 'light';
    this.darkTheme = 'dark';
    this.currentTheme = this.loadThemePreference();
    
    // Set initial theme on page load
    this.setTheme(this.currentTheme);
  }
  
  // Initialize theme toggle
  init() {
    // Apply theme on page load
    this.applyTheme();
    
    // Add event listener to theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      // Set initial toggle state
      themeToggle.checked = this.currentTheme === this.darkTheme;
      
      // Add event listener
      themeToggle.addEventListener('change', () => {
        this.toggleTheme();
      });
    }
  }
  
  // Toggle between light and dark themes
  toggleTheme() {
    const newTheme = this.currentTheme === this.darkTheme ? this.defaultTheme : this.darkTheme;
    this.setTheme(newTheme);
    this.saveThemePreference(newTheme);
  }
  
  // Set theme
  setTheme(theme) {
    this.currentTheme = theme;
    this.applyTheme();
  }
  
  // Apply current theme to document
  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.currentTheme);
  }
  
  // Save theme preference to localStorage
  saveThemePreference(theme) {
    localStorage.setItem(this.storageKey, theme);
  }
  
  // Load theme preference from localStorage
  loadThemePreference() {
    const savedTheme = localStorage.getItem(this.storageKey);
    
    // Check for saved preference
    if (savedTheme) {
      return savedTheme;
    }
    
    // Check for system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return this.darkTheme;
    }
    
    // Default to light theme
    return this.defaultTheme;
  }
  
  // Get current theme
  getCurrentTheme() {
    return this.currentTheme;
  }
}

// Initialize theme switcher on DOM load
document.addEventListener('DOMContentLoaded', () => {
  window.themeSwitcher = new ThemeSwitcher();
  window.themeSwitcher.init();
});
