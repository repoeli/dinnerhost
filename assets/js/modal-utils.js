/**
 * Modal Management Utilities
 * Centralized modal operations for the Dinner Hosting Platform
 */

class ModalManager {
  /**
   * Shows a Bootstrap modal by ID
   * @param {string} modalId - ID of the modal to show
   */
  static show(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();
    }
  }

  /**
   * Hides a Bootstrap modal by ID
   * @param {string} modalId - ID of the modal to hide
   */
  static hide(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      const bsModal = bootstrap.Modal.getInstance(modal);
      if (bsModal) {
        bsModal.hide();
      }
    }
  }

  /**
   * Switches from one modal to another with a delay
   * @param {string} fromModalId - ID of the modal to hide
   * @param {string} toModalId - ID of the modal to show
   */
  static switch(fromModalId, toModalId) {
    this.hide(fromModalId);
    setTimeout(() => this.show(toModalId), 300);
  }

  /**
   * Shows a modal with custom content in the modal body
   * @param {string} modalId - ID of the modal to show
   * @param {string} content - HTML content to set in the modal body
   */
  static showWithContent(modalId, content) {
    const modal = document.getElementById(modalId);
    if (modal && content) {
      const modalBody = modal.querySelector('.modal-body');
      if (modalBody) {
        modalBody.innerHTML = content;
      }
      this.show(modalId);
    }
  }
}

class FormUtils {
  /**
   * Resets a form to its initial state
   * @param {string} formId - ID of the form to reset
   */
  static resetForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
      form.reset();
    }
  }

  /**
   * Gets form data from a form element
   * @param {string} formId - ID of the form
   * @returns {FormData|null} - FormData object or null if form not found
   */
  static getFormData(formId) {
    const form = document.getElementById(formId);
    if (form) {
      return new FormData(form);
    }
    return null;
  }

  /**
   * Validates a form using built-in HTML5 validation
   * @param {string} formId - ID of the form to validate
   * @returns {boolean} - True if form is valid, false otherwise
   */
  static validateForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
      return form.checkValidity();
    }
    return false;
  }
}

class ButtonUtils {
  /**
   * Sets a button to loading state or reverts it back to normal
   * @param {string} buttonId - ID of the button
   * @param {boolean} [isLoading=true] - Whether to show loading state
   */
  static setLoading(buttonId, isLoading = true) {
    const button = document.getElementById(buttonId);
    if (button) {
      if (isLoading) {
        button.disabled = true;
        const originalText = button.textContent;
        button.setAttribute('data-original-text', originalText);
        button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';
      } else {
        button.disabled = false;
        const originalText = button.getAttribute('data-original-text');
        if (originalText) {
          button.textContent = originalText;
        }
      }
    }
  }

  /**
   * Sets the text content of a button
   * @param {string} buttonId - ID of the button
   * @param {string} text - New text to set
   */
  static setText(buttonId, text) {
    const button = document.getElementById(buttonId);
    if (button) {
      button.textContent = text;
    }
  }
}

class NotificationUtils {
  /**
   * Shows a notification toast message
   * @param {string} message - Message to display in the notification
   * @param {string} [type='success'] - Type of notification: 'success', 'error', 'warning', or 'info'
   */
  static showNotification(message, type = 'success') {
    // Remove any existing notifications
    const existingNotification = document.querySelector('.notification-toast');
    if (existingNotification) {
      existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification-toast alert alert-${this.getNotificationClass(type)} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    
    notification.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(notification);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (notification && notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }
  /**
   * Maps notification type to Bootstrap alert class
   * @param {string} type - Notification type: 'success', 'error', 'warning', or 'info'
   * @returns {string} - Corresponding Bootstrap alert class
   */
  static getNotificationClass(type) {
    const typeMap = {
      'success': 'success',
      'error': 'danger',
      'warning': 'warning',
      'info': 'info'
    };
    return typeMap[type] || 'info';
  }
}

class ImageUtils {
  /**
   * Sets up image selection functionality for a container
   * @param {string} containerId - ID of the container with image options
   */
  static setupImageSelection(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      this.setupImageSelectionForContainer(containerId);
    }
  }

  /**
   * Sets up click handlers for image selection within a container
   * @param {string} containerId - ID of the container with image options
   */
  static setupImageSelectionForContainer(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Remove existing event listeners
    const images = container.querySelectorAll('.dinner-image-option img');
    images.forEach(img => {
      const newImg = img.cloneNode(true);
      img.parentNode.replaceChild(newImg, img);
    });

    // Add click handlers to images
    container.addEventListener('click', (e) => {
      if (e.target.matches('.dinner-image-option img')) {
        // Remove previous selections
        container.querySelectorAll('.dinner-image-option').forEach(option => {
          option.classList.remove('selected');
        });

        // Add selection to clicked image
        const imageOption = e.target.closest('.dinner-image-option');
        imageOption.classList.add('selected');

        // Store selected image data
        const imageUrl = e.target.src;
        const photographer = imageOption.dataset.photographer;
        const photoUrl = imageOption.dataset.photoUrl;

        // Set the main image if it exists
        const mainImage = document.getElementById('selectedDinnerImage') || document.getElementById('selectedEditImage');
        if (mainImage) {
          mainImage.src = imageUrl;
          mainImage.style.display = 'block';
        }

        // Store the data for form submission
        window.selectedImageData = {
          url: imageUrl,
          photographer: photographer,
          photoUrl: photoUrl
        };
      }
    });
  }
}

// Global utility functions for backward compatibility
/**
 * Shows a notification toast message (global function for backward compatibility)
 * @param {string} message - Message to display in the notification
 * @param {string} [type='success'] - Type of notification: 'success', 'error', 'warning', or 'info'
 */
function showNotification(message, type = 'success') {
  NotificationUtils.showNotification(message, type);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ModalManager, FormUtils, ButtonUtils, NotificationUtils, ImageUtils };
}
