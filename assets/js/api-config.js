/**
 * API Configuration
 * 
 * This file contains API configuration settings for external services.
 * In a production environment, these keys should be managed securely
 * and not stored directly in the codebase.
 *  * Usage:
 * 1. The proxy endpoint handles API authentication securely
 * 2. Access this configuration from other JavaScript files using:
 *    const endpoint = apiConfig.unsplash.endpoint;
 */

// Unsplash API configuration
const apiConfig = {
  unsplash: {
    endpoint: 'https://unsplash-proxy-app-fb6c8f079fb7.herokuapp.com/search' // Proxy endpoint to hide API key
    /**
     * Using Heroku proxy for production to secure API key:
     * 1. API key is stored as environment variable on Heroku
     * 2. Proxy handles authentication with Unsplash
     * 3. Frontend only makes requests to our proxy endpoint
     */
  }
};

// Initialize tooltips if Bootstrap is available
document.addEventListener('DOMContentLoaded', function() {
  if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }
});
