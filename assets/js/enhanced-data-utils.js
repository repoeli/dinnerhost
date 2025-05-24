/**
 * Enhanced Data Management Utilities
 * Centralized data operations for the Dinner Hosting Platform
 */

class DataManager {  static saveData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      return false;
    }
  }
  static loadData(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  }

  static updateGlobalData(key, updateFunction) {
    const currentData = this.loadData(key, []);
    const updatedData = updateFunction(currentData);
    return this.saveData(key, updatedData);
  }
  static deleteData(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  }  static clearAllData() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      return false;
    }
  }
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

  static getDataSize(key) {
    const data = localStorage.getItem(key);
    return data ? data.length : 0;
  }
}

class ReservationUtils {
  static generateReservationId() {
    return 'res_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

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

  static getReservationsByGuest(guestEmail) {
    const reservations = DataManager.loadData('reservations', []);
    return reservations.filter(res => res.guestEmail === guestEmail);
  }

  static getReservationsByDinner(dinnerId) {
    const reservations = DataManager.loadData('reservations', []);
    return reservations.filter(res => res.dinnerId === dinnerId);
  }

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
  static generateDinnerId() {
    return 'dinner_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

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

  static getDinnerById(dinnerId) {
    const dinners = DataManager.loadData('dinners', []);
    return dinners.find(dinner => dinner.id === dinnerId);
  }

  static getDinnersByHost(hostEmail) {
    const dinners = DataManager.loadData('dinners', []);
    return dinners.filter(dinner => dinner.hostEmail === hostEmail);
  }

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

  static getRecentDinners(limit = 6) {
    const dinners = this.getAvailableDinners();
    return dinners
      .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
      .slice(0, limit);
  }
}

class UserUtils {
  static setCurrentUser(userData) {
    return DataManager.saveData('currentUser', userData);
  }

  static getCurrentUser() {
    return DataManager.loadData('currentUser', null);
  }

  static isLoggedIn() {
    const user = this.getCurrentUser();
    return user && user.email;
  }

  static logout() {
    return DataManager.deleteData('currentUser');
  }

  static getUserType() {
    const user = this.getCurrentUser();
    return user ? user.userType : null;
  }
}

// Global utility functions for backward compatibility
function updateGlobalDinners(updateFunction) {
  return DataManager.updateGlobalData('dinners', updateFunction);
}

function updateGlobalReservations(updateFunction) {
  return DataManager.updateGlobalData('reservations', updateFunction);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DataManager, ReservationUtils, DinnerUtils, UserUtils };
}
