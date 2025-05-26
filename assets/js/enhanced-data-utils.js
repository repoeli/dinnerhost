/**
 * Enhanced Data Management Utilities
 * Centralized data operations for the Dinner Hosting Platform
 */

class DataManager {
  /**
   * Saves data to localStorage with the specified key
   * @param {string} key - The storage key
   * @param {any} data - The data to store (will be JSON stringified)
   * @returns {boolean} - Success status of the save operation
   */
  static saveData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Loads data from localStorage for the specified key
   * @param {string} key - The storage key to retrieve
   * @param {any} defaultValue - Value to return if key doesn't exist or on error
   * @returns {any} - The parsed data or defaultValue
   */
  static loadData(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  }

  /**
   * Updates global data using a transform function
   * @param {string} key - The storage key to update
   * @param {Function} updateFunction - Function that transforms current data
   * @returns {boolean} - Success status of the update operation
   */
  static updateGlobalData(key, updateFunction) {
    const currentData = this.loadData(key, []);
    const updatedData = updateFunction(currentData);
    return this.saveData(key, updatedData);
  }  /**
   * Deletes data with the specified key from localStorage
   * @param {string} key - The storage key to delete
   * @returns {boolean} - Success status of the delete operation
   */
  static deleteData(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clears all data from localStorage
   * @returns {boolean} - Success status of the clear operation
   */
  static clearAllData() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Saves all global data arrays to localStorage if they exist
   * @returns {boolean} - Success status of the save operation
   */
  static saveAllGlobalData() {
    try {
      // Save global arrays to localStorage
      if (typeof dinners !== 'undefined') this.saveData('dinners', dinners);
      if (typeof reservations !== 'undefined') this.saveData('reservations', reservations);
      if (typeof users !== 'undefined') this.saveData('users', users);
      return true;
    } catch (error) {
      return false;
    }
  }
  /**
   * Gets the size in bytes of the stored data for a key
   * @param {string} key - The storage key to check
   * @returns {number} - Size in bytes
   */
  static getDataSize(key) {
    const data = localStorage.getItem(key);
    return data ? data.length : 0;
  }
}

class ReservationUtils {
  /**
   * Generates a unique reservation ID
   * @returns {string} - Unique reservation ID
   */
  static generateReservationId() {
    return 'res_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
  }

  /**
   * Creates a new reservation and updates related dinner data
   * @param {string} dinnerId - ID of the dinner being reserved
   * @param {Object} guestData - Guest information for the reservation
   * @returns {Object} - The created reservation object
   */
  static createReservation(dinnerId, guestData) {
    const reservation = {
      id: this.generateReservationId(),
      dinnerId: dinnerId,
      guestName: guestData.name,
      guestEmail: guestData.email,
      guestCount: parseInt(guestData.guestCount),
      specialRequests: guestData.specialRequests || '',
      reservationDate: new Date().toISOString(),
      status: 'confirmed'
    };

    // Save reservation
    const reservations = DataManager.loadData('reservations', []);
    reservations.push(reservation);
    DataManager.saveData('reservations', reservations);

    // Update dinner guest count
    this.updateDinnerGuestCount(dinnerId, parseInt(guestData.guestCount));

    return reservation;
  }
  /**
   * Updates the guest count for a specific dinner
   * @param {string} dinnerId - ID of the dinner to update
   * @param {number} additionalGuests - Number of guests to add (positive) or remove (negative)
   * @returns {boolean} - Success status of the update operation
   */
  static updateDinnerGuestCount(dinnerId, additionalGuests) {
    DataManager.updateGlobalData('dinners', (dinners) => {
      return dinners.map(dinner => {
        if (dinner.id === dinnerId) {
          return {
            ...dinner,
            currentGuests: (dinner.currentGuests || 0) + additionalGuests
          };
        }
        return dinner;
      });
    });
  }
  /**
   * Gets reservations for a specific guest by email
   * @param {string} guestEmail - Email of the guest
   * @returns {Array} - Array of reservation objects for the guest
   */
  static getReservationsByGuest(guestEmail) {
    const reservations = DataManager.loadData('reservations', []);
    return reservations.filter(res => res.guestEmail === guestEmail);
  }

  /**
   * Gets all reservations for a specific dinner
   * @param {string} dinnerId - ID of the dinner
   * @returns {Array} - Array of reservation objects for the dinner
   */
  static getReservationsByDinner(dinnerId) {
    const reservations = DataManager.loadData('reservations', []);
    return reservations.filter(res => res.dinnerId === dinnerId);
  }

  /**
   * Cancels a reservation and updates dinner guest count
   * @param {string} reservationId - ID of the reservation to cancel
   * @returns {boolean} - Success status of the cancellation
   */
  static cancelReservation(reservationId) {
    const reservations = DataManager.loadData('reservations', []);
    const reservation = reservations.find(res => res.id === reservationId);
    
    if (reservation) {
      // Update dinner guest count
      this.updateDinnerGuestCount(reservation.dinnerId, -reservation.guestCount);
      
      // Remove reservation
      const updatedReservations = reservations.filter(res => res.id !== reservationId);
      DataManager.saveData('reservations', updatedReservations);
      
      return true;
    }
    return false;
  }
}

class DinnerUtils {
  /**
   * Generates a unique dinner ID
   * @returns {string} - Unique dinner ID
   */
  static generateDinnerId() {
    return 'dinner_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
  }
  /**
   * Creates a new dinner event with the provided data
   * @param {Object} dinnerData - Data for the new dinner
   * @returns {Object} - The created dinner object
   */
  static createDinner(dinnerData) {
    const dinner = {
      id: this.generateDinnerId(),
      title: dinnerData.title,
      cuisine: dinnerData.cuisine,
      price: parseFloat(dinnerData.price),
      date: dinnerData.date,
      time: dinnerData.time,
      maxGuests: parseInt(dinnerData.maxGuests),
      currentGuests: 0,
      description: dinnerData.description,
      menu: dinnerData.menu || '',
      dietaryOptions: dinnerData.dietaryOptions || [],
      image: dinnerData.image || '',
      photographer: dinnerData.photographer || '',
      photoUrl: dinnerData.photoUrl || '',
      hostName: dinnerData.hostName,
      hostEmail: dinnerData.hostEmail,
      address: dinnerData.address,
      createdDate: new Date().toISOString(),
      status: 'active'
    };

    // Save dinner
    const dinners = DataManager.loadData('dinners', []);
    dinners.push(dinner);
    DataManager.saveData('dinners', dinners);

    return dinner;
  }
  /**
   * Updates an existing dinner with new data
   * @param {string} dinnerId - ID of the dinner to update
   * @param {Object} updateData - Data to update the dinner with
   * @returns {boolean} - Success status of the update operation
   */
  static updateDinner(dinnerId, updateData) {
    return DataManager.updateGlobalData('dinners', (dinners) => {
      return dinners.map(dinner => {
        if (dinner.id === dinnerId) {
          return { ...dinner, ...updateData };
        }
        return dinner;
      });
    });
  }
  /**
   * Deletes a dinner and its associated reservations
   * @param {string} dinnerId - ID of the dinner to delete
   * @returns {boolean} - Success status of the delete operation
   */
  static deleteDinner(dinnerId) {
    // Remove associated reservations first
    const reservations = DataManager.loadData('reservations', []);
    const updatedReservations = reservations.filter(res => res.dinnerId !== dinnerId);
    DataManager.saveData('reservations', updatedReservations);

    // Remove dinner
    return DataManager.updateGlobalData('dinners', (dinners) => {
      return dinners.filter(dinner => dinner.id !== dinnerId);
    });
  }
  /**
   * Gets a dinner by its ID
   * @param {string} dinnerId - ID of the dinner to find
   * @returns {Object|undefined} - The dinner object or undefined if not found
   */
  static getDinnerById(dinnerId) {
    const dinners = DataManager.loadData('dinners', []);
    return dinners.find(dinner => dinner.id === dinnerId);
  }
  /**
   * Gets all dinners hosted by a specific user
   * @param {string} hostEmail - Email of the host
   * @returns {Array} - Array of dinner objects for the host
   */
  static getDinnersByHost(hostEmail) {
    const dinners = DataManager.loadData('dinners', []);
    return dinners.filter(dinner => dinner.hostEmail === hostEmail);
  }
  /**
   * Gets all available dinners that are in the future and have space
   * @returns {Array} - Array of available dinner objects
   */
  static getAvailableDinners() {
    const dinners = DataManager.loadData('dinners', []);
    const currentDate = new Date();
    
    return dinners.filter(dinner => {
      const dinnerDate = new Date(dinner.date);
      return dinnerDate >= currentDate && 
             dinner.status === 'active' && 
             dinner.currentGuests < dinner.maxGuests;
    });
  }
  /**
   * Filters dinners based on provided criteria
   * @param {Object} filters - Object containing filter criteria
   * @param {string} [filters.cuisine] - Filter by cuisine type
   * @param {number} [filters.maxPrice] - Maximum price filter
   * @param {string} [filters.date] - Specific date to filter by
   * @param {string} [filters.searchTerm] - Search term for text search
   * @returns {Array} - Array of filtered dinner objects
   */
  static filterDinners(filters) {
    const dinners = this.getAvailableDinners();
    
    return dinners.filter(dinner => {
      // Cuisine filter
      if (filters.cuisine && filters.cuisine !== 'all' && dinner.cuisine !== filters.cuisine) {
        return false;
      }
      
      // Price filter
      if (filters.maxPrice && dinner.price > parseFloat(filters.maxPrice)) {
        return false;
      }
      
      // Date filter
      if (filters.date && dinner.date !== filters.date) {
        return false;
      }
      
      // Search term filter
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        return dinner.title.toLowerCase().includes(searchTerm) ||
               dinner.description.toLowerCase().includes(searchTerm) ||
               dinner.cuisine.toLowerCase().includes(searchTerm);
      }
      
      return true;
    });
  }
  /**
   * Gets the most recently created available dinners
   * @param {number} [limit=6] - Maximum number of dinners to return
   * @returns {Array} - Array of recent dinner objects
   */
  static getRecentDinners(limit = 6) {
    const dinners = this.getAvailableDinners();
    return dinners
      .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
      .slice(0, limit);
  }
}

class UserUtils {
  /**
   * Sets the current user in localStorage
   * @param {Object} userData - User data to store
   * @returns {boolean} - Success status of the save operation
   */
  static setCurrentUser(userData) {
    return DataManager.saveData('currentUser', userData);
  }
  /**
   * Gets the current logged-in user
   * @returns {Object|null} - Current user data or null if not logged in
   */
  static getCurrentUser() {
    return DataManager.loadData('currentUser', null);
  }
  /**
   * Checks if a user is currently logged in
   * @returns {boolean} - True if a user is logged in, false otherwise
   */
  static isLoggedIn() {
    const user = this.getCurrentUser();
    return user && user.email;
  }
  /**
   * Logs out the current user by removing user data from localStorage
   * @returns {boolean} - Success status of the logout operation
   */
  static logout() {
    return DataManager.deleteData('currentUser');
  }
  /**
   * Gets the user type of the current logged-in user
   * @returns {string|null} - User type or null if not logged in
   */
  static getUserType() {
    const user = this.getCurrentUser();
    return user ? user.userType : null;
  }
}

// Global utility functions for backward compatibility
/**
 * Updates the global dinners array using a transform function
 * @param {Function} updateFunction - Function that transforms the dinners array
 * @returns {boolean} - Success status of the update operation
 */
function updateGlobalDinners(updateFunction) {
  return DataManager.updateGlobalData('dinners', updateFunction);
}

/**
 * Updates the global reservations array using a transform function
 * @param {Function} updateFunction - Function that transforms the reservations array
 * @returns {boolean} - Success status of the update operation
 */
function updateGlobalReservations(updateFunction) {
  return DataManager.updateGlobalData('reservations', updateFunction);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DataManager, ReservationUtils, DinnerUtils, UserUtils };
}
