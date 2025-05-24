/**
 * Enhanced Data Management Utilities
 * Consolidates data operations and provides consistent data handling across the application
 */

/**
 * Data manager for centralized data operations
 */
const DataManager = {  /**
   * Save data to localStorage with error handling
   * @param {Object} data - Data object to save (optional, uses global variables if not provided)
   * @returns {Promise<boolean>} Promise that resolves to true if save was successful
   */
  async saveData(data) {
    try {
      // If no data provided, use global variables
      if (!data) {
        data = {
          dinners: typeof dinners !== 'undefined' ? dinners : [],
          reservations: typeof reservations !== 'undefined' ? reservations : [],
          users: typeof users !== 'undefined' ? users : []
        };
      }

      // Validate data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data format');
      }

      // Save to localStorage
      localStorage.setItem('dinnersData', JSON.stringify(data.dinners || []));
      localStorage.setItem('reservationsData', JSON.stringify(data.reservations || []));
      localStorage.setItem('usersData', JSON.stringify(data.users || []));
      
      return true;
    } catch (error) {
      console.error('Error saving data:', error);
      if (typeof showNotification === 'function') {
        showNotification('Failed to save data. Please try again.', 'error');
      }
      return false;
    }
  },

  /**
   * Load data from localStorage with fallback to JSON files
   * @returns {Promise<Object>} Promise that resolves to data object
   */
  async loadData() {
    try {
      // Try to load from localStorage first
      const localDinners = localStorage.getItem('dinnersData');
      const localReservations = localStorage.getItem('reservationsData');
      const localUsers = localStorage.getItem('usersData');

      if (localDinners && localReservations && localUsers) {
        return {
          dinners: JSON.parse(localDinners),
          reservations: JSON.parse(localReservations),
          users: JSON.parse(localUsers)
        };
      }

      // Fallback to JSON file
      const response = await fetch('data/dinners.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        dinners: data.dinners || [],
        reservations: data.reservations || [],
        users: data.users || []
      };
    } catch (error) {
      console.error('Error loading data:', error);
      return {
        dinners: [],
        reservations: [],
        users: []
      };
    }
  },

  /**
   * Update global data variables and save to storage
   * @param {Object} updates - Object containing data updates
   * @returns {Promise<boolean>} Promise that resolves to true if update was successful
   */
  async updateGlobalData(updates) {
    try {
      // Update global variables if they exist
      if (updates.dinners && typeof window.dinners !== 'undefined') {
        window.dinners = updates.dinners;
      }
      if (updates.reservations && typeof window.reservations !== 'undefined') {
        window.reservations = updates.reservations;
      }
      if (updates.users && typeof window.users !== 'undefined') {
        window.users = updates.users;
      }

      // Save to storage
      const dataToSave = {
        dinners: updates.dinners || window.dinners || [],
        reservations: updates.reservations || window.reservations || [],
        users: updates.users || window.users || []
      };

      return await this.saveData(dataToSave);
    } catch (error) {
      console.error('Error updating global data:', error);
      return false;
    }
  }
};

/**
 * Reservation utilities for consistent reservation handling
 */
const ReservationUtils = {
  /**
   * Find reservation by ID
   * @param {string|number} reservationId - Reservation ID to find
   * @returns {Object|null} Reservation object or null if not found
   */
  findById(reservationId) {
    if (typeof window.reservations === 'undefined') return null;
    return window.reservations.find(r => r.id.toString() === reservationId.toString()) || null;
  },

  /**
   * Get reservations for a specific dinner
   * @param {string|number} dinnerId - Dinner ID
   * @returns {Array} Array of reservation objects
   */
  getByDinnerId(dinnerId) {
    if (typeof window.reservations === 'undefined') return [];
    return window.reservations.filter(r => r.dinnerId.toString() === dinnerId.toString());
  },

  /**
   * Calculate remaining spots for a dinner
   * @param {Object} dinner - Dinner object
   * @returns {number} Number of remaining spots
   */
  calculateRemainingSpots(dinner) {
    if (!dinner) return 0;
    
    const dinnerReservations = this.getByDinnerId(dinner.id);
    const reservedSeats = dinnerReservations.reduce((total, reservation) => total + reservation.seats, 0);
    return Math.max(0, dinner.maxGuests - reservedSeats);
  },

  /**
   * Remove reservation by ID
   * @param {string|number} reservationId - Reservation ID to remove
   * @returns {boolean} True if reservation was removed
   */
  removeById(reservationId) {
    if (typeof window.reservations === 'undefined') return false;
    
    const index = window.reservations.findIndex(r => r.id.toString() === reservationId.toString());
    if (index !== -1) {
      window.reservations.splice(index, 1);
      return true;
    }
    return false;
  },

  /**
   * Update reservation by ID
   * @param {string|number} reservationId - Reservation ID to update
   * @param {Object} updates - Updates to apply
   * @returns {boolean} True if reservation was updated
   */
  updateById(reservationId, updates) {
    if (typeof window.reservations === 'undefined') return false;
    
    const index = window.reservations.findIndex(r => r.id.toString() === reservationId.toString());
    if (index !== -1) {
      window.reservations[index] = {
        ...window.reservations[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      return true;
    }
    return false;
  }
};

/**
 * Dinner utilities for consistent dinner handling
 */
const DinnerUtils = {
  /**
   * Find dinner by ID
   * @param {string|number} dinnerId - Dinner ID to find
   * @returns {Object|null} Dinner object or null if not found
   */
  findById(dinnerId) {
    if (typeof window.dinners === 'undefined') return null;
    return window.dinners.find(d => d.id.toString() === dinnerId.toString()) || null;
  },

  /**
   * Get dinners by host ID
   * @param {string|number} hostId - Host ID
   * @returns {Array} Array of dinner objects
   */
  getByHostId(hostId) {
    if (typeof window.dinners === 'undefined') return [];
    return window.dinners.filter(d => d.hostId.toString() === hostId.toString());
  },

  /**
   * Remove dinner by ID and associated reservations
   * @param {string|number} dinnerId - Dinner ID to remove
   * @returns {boolean} True if dinner was removed
   */
  removeById(dinnerId) {
    if (typeof window.dinners === 'undefined') return false;
    
    const dinnerIndex = window.dinners.findIndex(d => d.id.toString() === dinnerId.toString());
    if (dinnerIndex !== -1) {
      // Remove dinner
      window.dinners.splice(dinnerIndex, 1);
      
      // Remove associated reservations
      if (typeof window.reservations !== 'undefined') {
        window.reservations = window.reservations.filter(r => r.dinnerId.toString() !== dinnerId.toString());
      }
      
      return true;
    }
    return false;
  },

  /**
   * Update dinner by ID
   * @param {string|number} dinnerId - Dinner ID to update
   * @param {Object} updates - Updates to apply
   * @returns {boolean} True if dinner was updated
   */
  updateById(dinnerId, updates) {
    if (typeof window.dinners === 'undefined') return false;
    
    const index = window.dinners.findIndex(d => d.id.toString() === dinnerId.toString());
    if (index !== -1) {
      window.dinners[index] = {
        ...window.dinners[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      return true;
    }
    return false;
  },

  /**
   * Format dinner date for display
   * @param {Object} dinner - Dinner object
   * @returns {string} Formatted date string
   */
  formatDate(dinner) {
    if (!dinner || !dinner.date || !dinner.time) return '';
    
    const dinnerDate = new Date(`${dinner.date}T${dinner.time}`);
    return dinnerDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  },

  /**
   * Get category badge class
   * @param {string} category - Dinner category
   * @returns {string} Bootstrap badge class
   */
  getCategoryBadgeClass(category) {
    const categoryClasses = {
      'italian': 'bg-danger',
      'asian': 'bg-warning text-dark',
      'mexican': 'bg-success',
      'american': 'bg-primary',
      'mediterranean': 'bg-info text-dark',
      'indian': 'bg-secondary',
      'french': 'bg-dark',
      'vegetarian': 'bg-success',
      'vegan': 'bg-success',
      'casual': 'bg-light text-dark',
      'fine-dining': 'bg-dark'
    };
    
    return categoryClasses[category?.toLowerCase()] || 'bg-secondary';
  }
};

// Make utilities available globally
window.DataManager = DataManager;
window.ReservationUtils = ReservationUtils;
window.DinnerUtils = DinnerUtils;
