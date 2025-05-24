/**
 * API Configuration
 * 
 * This file contains API configuration settings for external services.
 * In a production environment, these keys should be managed securely
 * and not stored directly in the codebase.
 * 
 * Usage:
 * 1. Replace 'YOUR_UNSPLASH_ACCESS_KEY' with your actual Unsplash API key
 * 2. Access this configuration from other JavaScript files using:
 *    const apiKey = apiConfig.unsplash.accessKey;
 */

// Unsplash API configuration
const apiConfig = {
  unsplash: {
    accessKey: 'jbLyVpcZxCaNeFlbcRQ5cH_GsL8NzmotumC-RvkyZtw', // Replace with your actual Unsplash API key from https://unsplash.com/developers
    /**
     * For production environments, consider:
     * 1. Using environment variables
     * 2. Using a backend proxy to make API calls
     * 3. Implementing proper key rotation and management
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
