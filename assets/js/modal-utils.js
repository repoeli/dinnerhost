/**
 * Modal Utilities - Centralized modal management
 * Consolidates all modal-related functionality to reduce code duplication
 */

/**
 * Modal manager for centralized modal operations
 */
const ModalManager = {
  /**
   * Show a modal by ID
   * @param {string} modalId - The ID of the modal element
   * @returns {bootstrap.Modal|null} The Bootstrap modal instance or null if not found
   */
  show(modalId) {
    const modalElement = document.getElementById(modalId);
    if (!modalElement) {
      console.error(`Modal element with ID '${modalId}' not found`);
      return null;
    }
    
    try {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
      return modal;
    } catch (error) {
      console.error(`Error showing modal '${modalId}':`, error);
      return null;
    }
  },

  /**
   * Hide a modal by ID
   * @param {string} modalId - The ID of the modal element
   */
  hide(modalId) {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
  },

  /**
   * Get modal instance by ID
   * @param {string} modalId - The ID of the modal element
   * @returns {bootstrap.Modal|null} The Bootstrap modal instance or null
   */
  getInstance(modalId) {
    const modalElement = document.getElementById(modalId);
    return modalElement ? bootstrap.Modal.getInstance(modalElement) : null;
  },

  /**
   * Switch from one modal to another
   * @param {string} fromModalId - The ID of the modal to hide
   * @param {string} toModalId - The ID of the modal to show
   */
  switch(fromModalId, toModalId) {
    this.hide(fromModalId);
    // Small delay to ensure the first modal is hidden before showing the second
    setTimeout(() => {
      this.show(toModalId);
    }, 150);
  },

  /**
   * Set modal content and show
   * @param {string} modalId - The ID of the modal element
   * @param {Object} content - Object containing content to set
   */
  showWithContent(modalId, content) {
    const modalElement = document.getElementById(modalId);
    if (!modalElement) {
      console.error(`Modal element with ID '${modalId}' not found`);
      return null;
    }

    // Set content if provided
    if (content.title) {
      const titleElement = modalElement.querySelector('.modal-title');
      if (titleElement) titleElement.textContent = content.title;
    }

    if (content.body) {
      const bodyElement = modalElement.querySelector('.modal-body');
      if (bodyElement) {
        if (typeof content.body === 'string') {
          bodyElement.innerHTML = content.body;
        } else {
          bodyElement.appendChild(content.body);
        }
      }
    }

    return this.show(modalId);
  }
};

/**
 * Form utilities for consistent form handling
 */
const FormUtils = {
  /**
   * Get form data as an object
   * @param {string|HTMLFormElement} formIdOrElement - Form ID or form element
   * @returns {Object} Form data as key-value pairs
   */
  getFormData(formIdOrElement) {
    const form = typeof formIdOrElement === 'string' 
      ? document.getElementById(formIdOrElement)
      : formIdOrElement;
    
    if (!form) return {};

    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }

    // Handle checkboxes and radio buttons
    const checkboxes = form.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      data[checkbox.name || checkbox.id] = checkbox.checked;
    });

    const radios = form.querySelectorAll('input[type="radio"]:checked');
    radios.forEach(radio => {
      data[radio.name] = radio.value;
    });

    return data;
  },

  /**
   * Reset form and clear validation states
   * @param {string|HTMLFormElement} formIdOrElement - Form ID or form element
   */
  reset(formIdOrElement) {
    const form = typeof formIdOrElement === 'string' 
      ? document.getElementById(formIdOrElement)
      : formIdOrElement;
    
    if (form) {
      form.reset();
      // Clear validation classes
      form.querySelectorAll('.is-invalid, .is-valid').forEach(el => {
        el.classList.remove('is-invalid', 'is-valid');
      });
    }
  },

  /**
   * Validate required fields
   * @param {Object} data - Form data object
   * @param {Array} requiredFields - Array of required field names
   * @returns {Object} Validation result with isValid boolean and errors array
   */
  validateRequired(data, requiredFields) {
    const errors = [];
    
    requiredFields.forEach(field => {
      if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
        errors.push(`${field} is required`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid email format
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate phone format
   * @param {string} phone - Phone number to validate
   * @returns {boolean} True if valid phone format
   */
  validatePhone(phone) {
    const phoneRegex = /^[0-9\-\+\(\)\s]{7,15}$/;
    return phoneRegex.test(phone);
  }
};

/**
 * Button utilities for consistent button handling
 */
const ButtonUtils = {
  /**
   * Add loading state to button
   * @param {HTMLElement} button - Button element
   * @param {string} loadingText - Text to show while loading
   */
  setLoading(button, loadingText = 'Loading...') {
    if (!button) return;
    
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span>${loadingText}`;
  },

  /**
   * Remove loading state from button
   * @param {HTMLElement} button - Button element
   */
  clearLoading(button) {
    if (!button) return;
    
    button.disabled = false;
    if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
      delete button.dataset.originalText;
    }
  },

  /**
   * Add event listener with automatic cleanup
   * @param {HTMLElement} element - Element to add listener to
   * @param {string} event - Event type
   * @param {Function} handler - Event handler function
   */
  addListener(element, event, handler) {
    if (!element) return;
    
    // Remove existing listener first to prevent duplicates
    element.removeEventListener(event, handler);
    element.addEventListener(event, handler);
  }
};

/**
 * Image Selection Utilities
 */
const ImageUtils = {
  /**
   * Setup image selection handlers for dynamically loaded images
   * @param {string} containerSelector - CSS selector for the container holding image options
   */
  setupImageSelection(containerSelector = '.dinner-image-option') {
    document.querySelectorAll(containerSelector).forEach(option => {
      option.addEventListener('click', function() {
        // Remove selection from all options in the same container
        const container = this.closest('.row') || document;
        container.querySelectorAll('.dinner-image-option').forEach(el => {
          el.classList.remove('selected');
          el.style.border = 'none';
        });
        
        // Add selection to clicked option
        this.classList.add('selected');
        this.style.border = '3px solid var(--primary-color)';
      });
    });
  },

  /**
   * Setup image selection handlers for a specific container
   * @param {string} containerId - ID of the container holding image options
   */
  setupImageSelectionForContainer(containerId) {
    document.querySelectorAll(`#${containerId} .dinner-image-option`).forEach(option => {
      option.addEventListener('click', function() {
        document.querySelectorAll(`#${containerId} .dinner-image-option`).forEach(el => {
          el.classList.remove('selected');
          el.style.border = 'none';
        });
        this.classList.add('selected');
        this.style.border = '3px solid var(--primary-color)';
      });
    });
  }
};

/**
 * Notification Utilities
 */
const NotificationUtils = {
  /**
   * Show a notification message to the user
   * @param {string} message - The message to display
   * @param {string} type - The type of notification (info, success, warning, error)
   */
  show(message, type = 'info') {
    // Create notification container if it doesn't exist
    let notificationContainer = document.getElementById('notificationContainer');
    if (!notificationContainer) {
      notificationContainer = document.createElement('div');
      notificationContainer.id = 'notificationContainer';
      notificationContainer.className = 'position-fixed top-0 end-0 p-3';
      notificationContainer.style.zIndex = '1050';
      document.body.appendChild(notificationContainer);
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `toast align-items-center ${this.getNotificationClass(type)} border-0`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');
    notification.setAttribute('aria-atomic', 'true');
    
    notification.innerHTML = `
      <div class="d-flex">
        <div class="toast-body text-white">
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;
    
    notificationContainer.appendChild(notification);
    
    // Initialize and show the toast
    const toast = new bootstrap.Toast(notification, {
      autohide: true,
      delay: 5000
    });
    toast.show();
    
    // Remove the element after it's hidden
    notification.addEventListener('hidden.bs.toast', function() {
      notification.remove();
    });
  },

  /**
   * Get the Bootstrap class for a notification type
   * @param {string} type - The notification type
   * @returns {string} The corresponding Bootstrap class
   */
  getNotificationClass(type) {
    const classes = {
      'info': 'text-bg-info',
      'success': 'text-bg-success',
      'warning': 'text-bg-warning',
      'error': 'text-bg-danger',
      'danger': 'text-bg-danger'
    };
    return classes[type] || classes['info'];
  }
};

/**
 * Global showNotification function for backward compatibility
 */
function showNotification(message, type = 'info') {
  NotificationUtils.show(message, type);
}

// Make utilities available globally
window.ModalManager = ModalManager;
window.FormUtils = FormUtils;
window.ButtonUtils = ButtonUtils;
window.ImageUtils = ImageUtils;
window.NotificationUtils = NotificationUtils;
window.showNotification = showNotification;
