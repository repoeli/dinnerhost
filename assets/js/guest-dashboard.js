/**
 * Guest Dashboard - JavaScript
 * This file contains specific functionality for the guest dashboard page
 * - Handles displaying user's upcoming and past reservations
 * - Provides functionality to modify and cancel reservations
 * - Manages user interface elements and event listeners
 */

// ===== DOM READY =====
document.addEventListener('DOMContentLoaded', () => {
  // Initialize guest dashboard
  initGuestDashboard();
});

// ===== INITIALIZATION =====
/**
 * Initialize the guest dashboard page
 * Checks user authentication, loads reservations, and sets up event listeners
 */
async function initGuestDashboard() {
  try {
    // Ensure global data is loaded first from script.js
    if (typeof loadData === 'function') {      await loadData(); // Wait for data from script.js to be loaded
    } else {
      if (typeof showNotification === 'function') {
        showNotification('Critical application error. Please contact support.', 'error');
      }
      return;
    }

    // Check if user is logged in (currentUser should be set by loadData via checkUserLoginStatus)
    if (!currentUser) {
      // Redirect to login if not logged in
      window.location.href = 'index.html';
      return;
    }
    
    // Set user name in navbar and welcome message
    document.getElementById('navUsername').textContent = currentUser.name;
    document.getElementById('guestName').textContent = currentUser.name;
    
    // Load guest's reservations
    await loadGuestReservations();
      // Set up event listeners
    setupGuestDashboardEvents();
    
  } catch (error) {
    showNotification('Error loading dashboard data. Please try again.', 'error');
  }
}

// ===== AUTHENTICATION FUNCTIONS =====
/**
 * Check if a user is currently logged in
 * Retrieves user data from localStorage and sets the global currentUser variable
 */
function checkUserLoginStatus() {
  const userJson = localStorage.getItem('currentUser');
  if (userJson) {
    try {
      currentUser = JSON.parse(userJson);
    } catch (error) {
      localStorage.removeItem('currentUser');
    }
  }
}

/**
 * Handle user logout
 * Clears user data from localStorage and redirects to home page
 */
function handleLogout() {
  // Clear user data
  currentUser = null;
  localStorage.removeItem('currentUser');
  
  // Show notification
  showNotification('You have been logged out', 'info');
  
  // Redirect to home page
  window.location.href = 'index.html';
}

// ===== DATA LOADING =====
/**
 * Load the guest's reservations
 * Fetches latest data, filters reservations for the current user, and
 * separates them into upcoming and past reservations
 * @returns {Object} Object containing arrays of upcoming and past reservations
 */
async function loadGuestReservations() {
  // Make sure we have the latest data by ensuring script.js's loadData has completed.
  // The initGuestDashboard already awaits loadData(), so `dinners`, `reservations`, `users` should be populated.

  // Find reservations by matching user ID, email, or name
  const guestReservations = findGuestReservations();
  
  // Sort and organize reservations by date
  const now = new Date();
  const upcomingReservations = [];
  const pastReservations = [];
  
  guestReservations.forEach(reservation => {
    // Find associated dinner
    const dinner = dinners.find(d => d.id === reservation.dinnerId);
    if (!dinner) return; // Skip if dinner not found
    
    // Determine if past or upcoming
    const dinnerDate = new Date(`${dinner.date}T${dinner.time}`);
    
    if (dinnerDate >= now) {
      upcomingReservations.push({ reservation, dinner });
    } else {
      pastReservations.push({ reservation, dinner });
    }
  });
  
  // Sort upcoming by date (soonest first)
  upcomingReservations.sort((a, b) => {
    const dateA = new Date(`${a.dinner.date}T${a.dinner.time}`);
    const dateB = new Date(`${b.dinner.date}T${b.dinner.time}`);
    return dateA - dateB;
  });
  
  // Sort past by date (most recent first)
  pastReservations.sort((a, b) => {
    const dateA = new Date(`${a.dinner.date}T${a.dinner.time}`);
    const dateB = new Date(`${b.dinner.date}T${b.dinner.time}`);
    return dateB - dateA;
  });
  
  // Update badge counts
  document.getElementById('upcomingCount').textContent = upcomingReservations.length;
  document.getElementById('pastCount').textContent = pastReservations.length;
  
  // Display reservations
  displayUpcomingReservations(upcomingReservations);
  displayPastReservations(pastReservations);
  
  return { upcoming: upcomingReservations, past: pastReservations };
}

/**
 * Find reservations for the current guest
 * Matches reservations by user ID, email, or name
 * @returns {Array} Array of reservation objects
 */
function findGuestReservations() {
  // Try to match by user ID, email, and name to catch all possible reservations
  const guestReservations = reservations.filter(r => {
    // If the reservation has a userId, match by that first (most reliable)
    if (r.userId && currentUser.id && r.userId.toString() === currentUser.id.toString()) {
      return true;
    }
    
    // Fall back to email matching if available
    const emailMatch = r.email && currentUser.email && 
                      r.email.toLowerCase() === currentUser.email.toLowerCase();
    
    // Also try name matching as a last resort
    const nameMatch = r.guestName && currentUser.name && 
                     r.guestName.toLowerCase() === currentUser.name.toLowerCase();
    
    // Return true if any of the conditions match
    return emailMatch || nameMatch;
  });
  
  
  
  return guestReservations;
}

/**
 * Display upcoming reservations
 * Creates and populates the UI cards for upcoming reservations
 * @param {Array} upcomingReservations - Array of upcoming reservation objects
 */
function displayUpcomingReservations(upcomingReservations) {
  const container = document.getElementById('upcomingReservations');
  if (!container) return;
  
  container.innerHTML = '';
  
  // Show "no reservations" message if needed
  if (upcomingReservations.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="mb-4">
          <i class="bi bi-calendar-x display-1 text-muted"></i>
        </div>
        <h4>You don't have any upcoming reservations</h4>
        <p class="text-muted mb-4">Find your next dinner experience!</p>
        <a href="index.html#featured-dinners" class="btn btn-warning">Browse Dinners</a>
      </div>
    `;
    return;
  }
  
  // Display each reservation
  upcomingReservations.forEach(({ reservation, dinner }) => {
    // Format date and time
    const dinnerDate = new Date(`${dinner.date}T${dinner.time}`);
    const formattedDate = dinnerDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
    
    // Format dietary preferences
    let preferencesHtml = '';
    if (reservation.preferences && reservation.preferences.length > 0) {
      preferencesHtml = reservation.preferences
        .map(pref => `<span class="badge bg-light text-dark me-1">${pref}</span>`)
        .join('');
    }
    
    // Create card
    const card = document.createElement('div');
    card.className = 'col-md-6 col-lg-4 mb-4';
    card.innerHTML = `
      <div class="card border-0 shadow-sm h-100">
        <img src="${dinner.image}" class="card-img-top" alt="${dinner.title}" style="height: 160px; object-fit: cover;">
        <div class="card-body">
          <h5 class="card-title">${dinner.title}</h5>
          <div class="mb-2 d-flex flex-wrap gap-1">
            <span class="badge ${getCategoryBadgeClass(dinner.category)}">${formatCategory(dinner.category)}</span>
          </div>
          
          <div class="mb-3">
            <div><i class="bi bi-calendar-event me-2"></i>${formattedDate}</div>
            <div><i class="bi bi-clock me-2"></i>${dinner.time}</div>
            <div><i class="bi bi-person-circle me-2"></i>Hosted by ${dinner.hostName}</div>
          </div>
          
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
              <span class="fw-bold">${reservation.seats} ${reservation.seats > 1 ? 'spots' : 'spot'}</span>
              <span class="text-primary">($${(dinner.price * reservation.seats).toFixed(2)})</span>
            </div>
            ${preferencesHtml ? `<div>${preferencesHtml}</div>` : ''}
          </div>
          
          ${reservation.notes ? `<div class="mb-3"><small class="text-muted">Note: ${reservation.notes}</small></div>` : ''}
          
          <div class="d-flex justify-content-between mt-auto">
            <button class="btn btn-sm btn-outline-secondary modify-btn" data-reservation-id="${reservation.id}">
              <i class="bi bi-pencil me-1"></i>Modify
            </button>
            <button class="btn btn-sm btn-outline-danger cancel-btn" data-reservation-id="${reservation.id}">
              <i class="bi bi-x-circle me-1"></i>Cancel
            </button>
          </div>
        </div>
      </div>
    `;
    
    container.appendChild(card);
  });
  
  // Add event listeners to buttons
  document.querySelectorAll('.modify-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const reservationId = btn.dataset.reservationId;
      modifyReservation(reservationId);
    });
  });
  
  document.querySelectorAll('.cancel-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const reservationId = btn.dataset.reservationId;
      confirmCancelReservation(reservationId);
    });
  });
}

/**
 * Display past reservations
 * Creates and populates the UI cards for past reservations
 * @param {Array} pastReservations - Array of past reservation objects
 */
function displayPastReservations(pastReservations) {
  const container = document.getElementById('pastReservations');
  if (!container) return;
  
  container.innerHTML = '';
  
  // Show "no reservations" message if needed
  if (pastReservations.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="mb-4">
          <i class="bi bi-clock-history display-1 text-muted"></i>
        </div>
        <h4>No past reservations found</h4>
        <p class="text-muted">Your dinner history will appear here</p>
      </div>
    `;
    return;
  }
  
  // Display each reservation
  pastReservations.forEach(({ reservation, dinner }) => {
    // Format date and time
    const dinnerDate = new Date(`${dinner.date}T${dinner.time}`);
    const formattedDate = dinnerDate.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    // Create card
    const card = document.createElement('div');
    card.className = 'col-md-6 col-lg-4 mb-4';
    card.innerHTML = `
      <div class="card border-0 shadow-sm h-100">
        <div class="card-body">
          <div class="d-flex mb-3">
            <img src="${dinner.image}" class="rounded me-3" alt="${dinner.title}" style="width: 64px; height: 64px; object-fit: cover;">
            <div>
              <h5 class="card-title mb-1">${dinner.title}</h5>
              <div><small class="text-muted">${formattedDate}</small></div>
              <span class="badge ${getCategoryBadgeClass(dinner.category)}">${formatCategory(dinner.category)}</span>
            </div>
          </div>
          
          <div class="text-muted mb-3">
            <div><i class="bi bi-person-circle me-1"></i>Hosted by ${dinner.hostName}</div>
            <div><i class="bi bi-people me-1"></i>${reservation.seats} ${reservation.seats > 1 ? 'guests' : 'guest'}</div>
          </div>
        </div>
      </div>
    `;
    
    container.appendChild(card);
  });
}

// ===== UTILITY FUNCTIONS =====
/**
 * Gets the appropriate Bootstrap badge class for a dinner category
 * @param {string} category - The dinner category (gourmet, vegan, ethnic, theme, casual)
 * @returns {string} CSS class name for the badge
 */
function getCategoryBadgeClass(category) {
  switch (category) {
    case 'gourmet':
      return 'bg-dark';
    case 'vegan':
      return 'bg-success';
    case 'ethnic':
      return 'bg-info';
    case 'theme':
      return 'bg-primary';
    case 'casual':
    default:
      return 'bg-secondary';
  }
}

/**
 * Format category names for display (capitalizes first letter)
 * @param {string} category - The dinner category
 * @returns {string} Formatted category name
 */
function formatCategory(category) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

// ===== EVENT LISTENERS =====
/**
 * Set up event listeners for the guest dashboard
 */
function setupGuestDashboardEvents() {
  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  // Cancel reservation confirmation
  const confirmCancelBtn = document.getElementById('confirmCancelBtn');
  if (confirmCancelBtn) {
    confirmCancelBtn.addEventListener('click', handleCancelReservation);
  }
  
  // Modify reservation form
  const modifyReservationForm = document.getElementById('modifyReservationForm');
  if (modifyReservationForm) {
    modifyReservationForm.addEventListener('submit', handleModifyReservation);
  }
  
  // Guest count buttons for modify form
  const modifyGuestsDecreaseBtn = document.getElementById('modifyGuestsDecrease');
  const modifyGuestsIncreaseBtn = document.getElementById('modifyGuestsIncrease');
  
  if (modifyGuestsDecreaseBtn) {
    modifyGuestsDecreaseBtn.addEventListener('click', () => updateModifyGuestCount(-1));
  }
  
  if (modifyGuestsIncreaseBtn) {
    modifyGuestsIncreaseBtn.addEventListener('click', () => updateModifyGuestCount(1));
  }
}

// ===== RESERVATION HANDLERS =====
/**
 * Show the cancel reservation confirmation modal
 * Populates the modal with the reservation details and shows it
 * @param {string} reservationId - The ID of the reservation to cancel
 */
function confirmCancelReservation(reservationId) {
  // Find reservation
  const reservation = reservations.find(r => r.id.toString() === reservationId);  if (!reservation) {
    showNotification('Reservation not found', 'error');
    return;
  }
  
  // Find dinner
  const dinner = dinners.find(d => d.id === reservation.dinnerId);
  if (!dinner) {
    showNotification('Dinner information not found', 'error');
    return;
  }
  
  // Set modal content
  document.getElementById('cancelReservationId').value = reservationId;
  document.getElementById('cancelDinnerTitle').textContent = dinner.title;
    // Show modal
  ModalManager.show('cancelReservationModal');
}

/**
 * Handle canceling a reservation
 * Removes the reservation from storage and updates the UI
 * @returns {Promise<void>} Promise that resolves when the operation is complete
 */
async function handleCancelReservation() {
  const reservationId = document.getElementById('cancelReservationId').value;
    // Find and remove reservation
  const reservationIndex = reservations.findIndex(r => r.id.toString() === reservationId.toString());
  if (reservationIndex === -1) {
    showNotification('Reservation not found for cancellation', 'error');
    return;
  }
    // Remove reservation
  reservations.splice(reservationIndex, 1);
  
  // Save changes to storage
  await DataManager.saveData({
    dinners,
    reservations,
    users
  });
    // Close modal
  ModalManager.hide('cancelReservationModal');
  
  // Show notification
  showNotification('Your reservation has been canceled successfully', 'success');
  
  // Reload reservations
  loadGuestReservations();
}

/**
 * Show the modify reservation modal
 * Populates the form with existing reservation data and shows the modal
 * @param {string} reservationId - The ID of the reservation to modify
 */
function modifyReservation(reservationId) {  // Find reservation
  const reservation = reservations.find(r => r.id.toString() === reservationId.toString());
  if (!reservation) {
    showNotification('Reservation not found for modification', 'error');
    return;
  }
  
  // Find dinner
  const dinner = dinners.find(d => d.id === reservation.dinnerId);
  if (!dinner) {
    showNotification('Dinner information not found', 'error');
    return;
  }
  
  // Set form values
  document.getElementById('modifyReservationId').value = reservationId;
  document.getElementById('modifyDinnerId').value = dinner.id;
  document.getElementById('modifyDinnerTitle').textContent = dinner.title;
  document.getElementById('modifyGuestsCount').value = reservation.seats;
  document.getElementById('modifySpecialRequests').value = reservation.notes || '';
  
  // Set dietary preferences
  document.getElementById('modifyPrefVegetarian').checked = reservation.preferences?.includes('vegetarian') || false;
  document.getElementById('modifyPrefVegan').checked = reservation.preferences?.includes('vegan') || false;
  document.getElementById('modifyPrefGlutenFree').checked = reservation.preferences?.includes('gluten-free') || false;
  document.getElementById('modifyPrefDairyFree').checked = reservation.preferences?.includes('dairy-free') || false;
  
  // Calculate available spots
  const dinnerReservations = reservations.filter(r => r.dinnerId === dinner.id && r.id.toString() !== reservationId);
  const reservedSeats = dinnerReservations.reduce((total, r) => total + r.seats, 0);
  const availableSpots = dinner.maxGuests - reservedSeats;
  
  document.getElementById('modifyAvailableSpots').textContent = `Available spots: ${availableSpots}`;
  
  // Set pricing
  document.getElementById('modifyPerPersonPrice').textContent = `$${dinner.price.toFixed(2)}`;
  document.getElementById('modifyTotalPrice').textContent = `$${(dinner.price * reservation.seats).toFixed(2)}`;
    // Show modal
  ModalManager.show('modifyReservationModal');
}

/**
 * Update the guest count in the modify form
 * Handles the increment/decrement of guest count and updates pricing
 * @param {number} change - The amount to change the count by (+1 or -1)
 */
function updateModifyGuestCount(change) {
  const countInput = document.getElementById('modifyGuestsCount');
  const dinnerId = document.getElementById('modifyDinnerId').value;
  const reservationId = document.getElementById('modifyReservationId').value;
  let currentCount = parseInt(countInput.value);
  
  // Find dinner
  const dinner = dinners.find(d => d.id === dinnerId);
  if (!dinner) return;
  
  // Calculate available spots (excluding current reservation)
  const dinnerReservations = reservations.filter(r => r.dinnerId === dinnerId && r.id.toString() !== reservationId);
  const reservedSeats = dinnerReservations.reduce((total, r) => total + r.seats, 0);
  const availableSpots = dinner.maxGuests - reservedSeats;
  
  // Update count
  currentCount += change;
  
  // Validate the new count
  if (currentCount < 1) {
    currentCount = 1;
  } else if (currentCount > availableSpots) {
    currentCount = availableSpots;
    showNotification(`Maximum ${availableSpots} spots available`, 'warning');
  }
  
  // Update the input
  countInput.value = currentCount;
  
  // Update the price
  const perPersonPrice = dinner.price;
  const totalPrice = perPersonPrice * currentCount;
  
  document.getElementById('modifyTotalPrice').textContent = `$${totalPrice.toFixed(2)}`;
}

/**
 * Handle modifying a reservation
 * Processes the form submission to update an existing reservation
 * @param {Event} e - The form submission event
 * @returns {Promise<void>} Promise that resolves when the operation is complete
 */
async function handleModifyReservation(e) {
  e.preventDefault();
  
  const reservationId = document.getElementById('modifyReservationId').value;
  const seats = parseInt(document.getElementById('modifyGuestsCount').value);
  const notes = document.getElementById('modifySpecialRequests').value;
  
  // Get dietary preferences
  const preferences = [];
  if (document.getElementById('modifyPrefVegetarian').checked) preferences.push('vegetarian');
  if (document.getElementById('modifyPrefVegan').checked) preferences.push('vegan');
  if (document.getElementById('modifyPrefGlutenFree').checked) preferences.push('gluten-free');
  if (document.getElementById('modifyPrefDairyFree').checked) preferences.push('dairy-free');
    // Find reservation
  const reservationIndex = reservations.findIndex(r => r.id.toString() === reservationId.toString());
  if (reservationIndex === -1) {
    showNotification('Reservation not found for update', 'error');
    return;
  }
  
  // Update reservation
  reservations[reservationIndex] = {
    ...reservations[reservationIndex],
    seats,
    notes,
    preferences,
    updatedAt: new Date().toISOString()  };
  
  // Save changes to storage
  await DataManager.saveData({
    dinners,
    reservations,
    users
  });
  
  // Close modal
  ModalManager.hide('modifyReservationModal');
  
  // Show notification
  showNotification('Your reservation has been updated successfully', 'success');
  
  // Reload reservations
  loadGuestReservations();
}
