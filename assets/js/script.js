/**
 * Dinner Hosting Web Application - Main JavaScript
 * This file contains all the core functionality for the dinner hosting application
 */

// ===== GLOBAL VARIABLES =====
let currentUser = null;
let dinners = [];
let reservations = [];
let users = [];
let dataLoadedPromise = null; // Added for idempotency

// ===== DOM READY =====
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the application
  init();
  
  // Add event listeners
  setupEventListeners();
  
  // Setup modal navigation between login and registration
  const showRegisterFromLogin = document.getElementById('showRegisterFromLogin');
  if (showRegisterFromLogin) {
    showRegisterFromLogin.addEventListener('click', function(e) {
      e.preventDefault();
      ModalManager.switch('loginModal', 'registerModal');
    });
  }
  
  const showLoginFromRegister = document.getElementById('showLoginFromRegister');
  if (showLoginFromRegister) {
    showLoginFromRegister.addEventListener('click', function(e) {
      e.preventDefault();
      ModalManager.switch('registerModal', 'loginModal');
    });
  }
});

// ===== INITIALIZATION =====
/**
 * Initialize the application by loading data and setting up the UI
 */
async function init() {
  try {
    // Load data from JSON
    await loadData();

    // Check if user is logged in (from localStorage)
    checkUserLoginStatus();

    // Update UI based on user status
    updateUIForUserStatus();    // Populate dinner listings and filters ONLY if on a page that needs them (e.g., index.html)
    // Check for a specific element unique to index.html's main content area
    if (document.getElementById('dinnerListingsContainer') || document.querySelector('.featured-dinners-section')) {
      if (typeof displayDinners === 'function') {
        // Only display upcoming dinners in Featured Dinners section
        const upcomingDinners = getUpcomingDinners(dinners);
        displayDinners(upcomingDinners);
      }
      if (typeof setupFilterListeners === 'function') setupFilterListeners();
      if (typeof updateFilterCounts === 'function') updateFilterCounts();
    }

  } catch (error) {
    if (typeof showNotification === 'function') {
        showNotification('Error loading application data. Please try again later.', 'error');
    }
  }
}

/**
 * Load all required data from JSON files
 */
async function loadData() {
  if (dataLoadedPromise) {
    return dataLoadedPromise; // Return existing promise if already loading/loaded
  }

  dataLoadedPromise = (async () => {
    try {      // Initialize arrays
      dinners = [];
      reservations = DataManager.loadData('reservations', []);
      users = [];
        // Load initial data from dinners.json file
      let jsonUsersLoaded = false;
      try {
        const response = await fetch('data/dinners.json');
        if (response.ok) {
          const data = await response.json();
          
          // Load dinners from JSON
          dinners = data.dinners || [];
          
          // Load users from JSON file as the initial user base
          if (data.users && data.users.length > 0) {
            users = [...data.users]; // Copy users from JSON
            jsonUsersLoaded = true;
          }
        }
      } catch (fetchError) {
        // Fallback: Add some sample data if JSON can't be loaded (CORS issue with file://)
        dinners = [
          {
            "id": "1",
            "title": "Vegetarian Pasta Night",
            "date": "2025-05-22",
            "time": "18:00",
            "description": "Delicious homemade pasta with a variety of vegetarian sauces and toppings. Bring your appetite!",
            "price": 27,
            "maxGuests": 6,
            "image": "https://images.unsplash.com/photo-1556761223-4c4282c73f77",
            "hostId": 2,
            "hostName": "Tiffany Chen",
            "isPublic": true,
            "category": "vegetarian",
            "createdAt": "2025-05-12T00:00:00.000Z"
          },
          {
            "id": "2",
            "title": "Breakfast for Dinner",
            "date": "2025-05-23",
            "time": "19:00",
            "description": "Join us for a fun twist on dinner - we're serving up all your breakfast favorites! Pancakes, eggs, bacon, and more.",
            "price": 22,
            "maxGuests": 8,
            "image": "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b",
            "hostId": 1,
            "hostName": "Alex Johnson",
            "isPublic": true,
            "category": "american",
            "createdAt": "2025-05-13T00:00:00.000Z"
          },
          {
            "id": "3",
            "title": "Italian Feast Night",
            "date": "2025-05-24",
            "time": "19:30",
            "description": "Authentic Italian dishes prepared by a native chef. Traditional recipes passed down through generations.",
            "price": 35,
            "maxGuests": 10,
            "image": "https://images.unsplash.com/photo-1546833999-b9f581a1996d",
            "hostId": 3,
            "hostName": "Marco Rossi",
            "isPublic": true,
            "category": "italian",
            "createdAt": "2025-05-14T00:00:00.000Z"          }        ];
      }      // First, check if there are already saved dinners in localStorage
      const savedDinners = DataManager.loadData('dinners', []);
      if (savedDinners && savedDinners.length > 0) {
        // Use the saved dinners instead of the ones from JSON
        dinners = savedDinners;
      }
      
      // Then load any newly created dinners from localStorage and merge them
      const newlyCreatedDinners = DataManager.loadData('newlyCreatedDinners', []);
      if (newlyCreatedDinners.length > 0) {
        // Merge new dinners with existing dinners (avoid duplicates by ID)
        newlyCreatedDinners.forEach(newDinner => {
          const existingIndex = dinners.findIndex(d => d.id === newDinner.id);
          if (existingIndex !== -1) {
            // Update existing dinner with potentially newer data
            dinners[existingIndex] = newDinner;
          } else {
            // Add new dinner
            dinners.push(newDinner);
          }
        });
      }
        // Save the combined dinners array to the main 'dinners' key for compatibility
      DataManager.saveData('dinners', dinners);

      // Load any newly registered users from localStorage and merge them
      const newlyRegisteredUsers = DataManager.loadData('newlyRegisteredUsers', []);
      if (newlyRegisteredUsers.length > 0) {
        // Merge new users with existing users (avoid duplicates by email)
        newlyRegisteredUsers.forEach(newUser => {
          const existingUser = users.find(u => u.email === newUser.email);
          if (!existingUser) {
            users.push(newUser);
          }
        });
      }
      
      // Save the combined users array to the main 'users' key for compatibility
      DataManager.saveData('users', users);

      return true; // Indicate success
    } catch (error) {
      dataLoadedPromise = null; // Reset promise if loading failed to allow retry
      throw error; // Propagate the error
    }
  })();

  return dataLoadedPromise;
}

// ===== EVENT LISTENERS =====
/**
 * Set up all event listeners for the application
 */
function setupEventListeners() {  // Check if we're on the host dashboard page (avoid setting up duplicate listeners)
  const currentPath = window.location.pathname;
  const isHostDashboard = currentPath.includes('host-dashboard.html');
  
  // Navigation buttons
  const hostBtns = document.querySelectorAll('#hostDinnerBtn, #btnHost');
  const findBtn = document.getElementById('btnFind');
  const loginBtn = document.getElementById('loginBtn');
  
  hostBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', handleHostDinnerClick);
    }
  });
  
  if (findBtn) {
    findBtn.addEventListener('click', () => {
      document.getElementById('mainContent').scrollIntoView({ behavior: 'smooth' });
    });
  }
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      ModalManager.show('loginModal');
    });
  }
    // Note: Hero search functionality moved to handleHeroSearch.js
  
  // Filter buttons
  setupFilterListeners();
  // Authentication forms (global, needed on all pages)
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  
  if (loginForm) {
    // Remove any existing handlers by cloning the form
    const newLoginForm = loginForm.cloneNode(true);
    if (loginForm.parentNode) {
      loginForm.parentNode.replaceChild(newLoginForm, loginForm);
    }
    
    // Add the handleLogin listener
    newLoginForm.addEventListener('submit', handleLogin);
  }
  
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }    // Logout button (only if not already handled by specific dashboard)
  if (!isHostDashboard && !window.location.pathname.includes('guest-dashboard.html')) {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      // Remove any existing listeners and add a fresh one
      const newLogoutBtn = logoutBtn.cloneNode(true);
      if (logoutBtn.parentNode) {
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
      }
      
      newLogoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Logout clicked in script.js');
        
        // Use the global performLogout if available
        if (typeof window.performLogout === 'function') {
          window.performLogout();
        } else {
          handleLogout();
        }
      });
    }
  }
  
  // Create dinner form (only on index.html, dashboard has its own handler)
  if (!isHostDashboard) {
    const createDinnerForm = document.getElementById('createDinnerForm');
    if (createDinnerForm) {
      createDinnerForm.addEventListener('submit', handleCreateDinner);
    }
    
    // Image search - only set up on index.html, not on host dashboard
    const searchImagesBtn = document.getElementById('searchImagesBtn');
    if (searchImagesBtn) {
      searchImagesBtn.addEventListener('click', handleImageSearch);
    }
  }
  
  // Reservation form guest count buttons
  const guestsDecreaseBtn = document.getElementById('guestsDecrease');
  const guestsIncreaseBtn = document.getElementById('guestsIncrease');
  
  if (guestsDecreaseBtn) {
    guestsDecreaseBtn.addEventListener('click', () => updateGuestCount(-1));
  }
  
  if (guestsIncreaseBtn) {
    guestsIncreaseBtn.addEventListener('click', () => updateGuestCount(1));
  }
  
  // Reservation form
  const reservationForm = document.getElementById('reservationForm');
  if (reservationForm) {
    reservationForm.addEventListener('submit', handleReservation);
  }
}

/**
 * Set up event listeners specifically for filter buttons
 */
function setupFilterListeners() {
  const filterButtons = document.querySelectorAll('[id^="filter-"]');
  
  filterButtons.forEach(button => {
    if (button) {
      // Remove any existing listeners first
      button.removeEventListener('click', handleFilterClick);
      // Add the listener
      button.addEventListener('click', handleFilterClick);
    }
  });
}

// ===== USER AUTHENTICATION =====
/**
 * Check if the user is logged in based on localStorage data
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
 * Update the UI based on whether a user is logged in or not
 */
function updateUIForUserStatus() {
  // Re-check user login status to ensure we have the latest
  checkUserLoginStatus();
  
  // Get user from localStorage if not in global variable
  if (!currentUser) {
    try {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        currentUser = JSON.parse(userStr);
        console.log("Updated currentUser from localStorage:", currentUser.email);
      }
    } catch (e) {
      console.error("Error parsing currentUser:", e);
    }
  }
  
  const authButtons = document.querySelectorAll('.auth-dependent');
  const guestButtons = document.querySelectorAll('.guest-only');
  const hostButtons = document.querySelectorAll('.host-only');
  const userNameElements = document.querySelectorAll('.user-name');
  const loginBtn = document.getElementById('loginBtn');
  
  if (currentUser) {
    // User is logged in
    console.log("Updating UI for logged in user:", currentUser.email, "Type:", currentUser.type);
    authButtons.forEach(el => el.classList.remove('d-none'));
    
    // Show/hide elements based on user type
    if (currentUser.type === 'host') {
      hostButtons.forEach(el => el.classList.remove('d-none'));
      guestButtons.forEach(el => el.classList.add('d-none'));
    } else {
      hostButtons.forEach(el => el.classList.add('d-none'));
      guestButtons.forEach(el => el.classList.remove('d-none'));
    }
    
    // Update name displays
    userNameElements.forEach(el => {
      el.textContent = currentUser.name;
    });
    
    // Ensure the logout button is visible and properly set up
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.style.display = 'block';
      if (logoutBtn.parentElement) {
        logoutBtn.parentElement.style.display = 'block';
      }
    }
    
    // Hide login button if present
    if (loginBtn) loginBtn.classList.add('d-none');} else {
    // No user is logged in
    authButtons.forEach(el => el.classList.add('d-none'));
    hostButtons.forEach(el => el.classList.add('d-none'));
    guestButtons.forEach(el => el.classList.add('d-none'));
      // Show login button if present
    if (loginBtn) {
      loginBtn.classList.remove('d-none');
      loginBtn.style.display = '';
      loginBtn.style.visibility = 'visible';
      loginBtn.style.opacity = '1';
      
      // Call the special function to ensure login button is fully visible
      if (typeof forceLoginButtonVisibility === 'function') {
        forceLoginButtonVisibility();
      }
    }  }
}

// Expose updateUIForUserStatus globally to be used by other scripts
window.updateUIForUserStatus = updateUIForUserStatus;

/**
 * Handle the login form submission
 */
async function handleLogin(e) {
  e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  
  // Ensure data is loaded before attempting login
  if (typeof users === 'undefined' || users.length === 0) {
    try {
      await loadData();
    } catch (error) {
      showNotification('Unable to load user data. Please refresh the page and try again.', 'error');
      return;
    }
  }
    // Check if users array is still empty after loading
  if (!users || users.length === 0) {
    showNotification('No user accounts found. Please register first.', 'error');
    return;
  }
  
  // Find the user
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    // Successful login
    
    const { password, ...userWithoutPassword } = user; // Remove password from the object
    currentUser = userWithoutPassword;
    
    // Store in localStorage
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Update UI    updateUIForUserStatus();
    
    // Close modal
    ModalManager.hide('loginModal');
      // Show notification
    showNotification(`Welcome back, ${user.name}!`, 'success');
    
    // Redirect to appropriate dashboard if on main page
    if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
      setTimeout(() => {
        // Redirect to appropriate dashboard based on user type
        if (user.type === 'host') {
          window.location.href = 'host-dashboard.html';
        } else {
          window.location.href = 'guest-dashboard.html';        }
      }, 1000); // Delay to show the welcome message first
    } else {
    }
  } else {
    // Failed login
    showNotification('Invalid email or password', 'error');
  }
}

/**
 * Handle the registration form submission
 */
function handleRegister(e) {
  e.preventDefault();
  
  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const phone = document.getElementById('registerPhone').value;
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('registerConfirmPassword').value;
  const userType = document.querySelector('input[name="userType"]:checked').value;
  const termsAccepted = document.getElementById('registerTerms').checked;
  
  // Validate form
  if (!name || !email || !phone || !password || !confirmPassword) {
    showNotification('Please fill out all required fields', 'error');
    return;
  }
  
  if (password !== confirmPassword) {
    showNotification('Passwords do not match', 'error');
    return;
  }
  
  if (!termsAccepted) {
    showNotification('You must accept the Terms of Service and Privacy Policy', 'error');
    return;
  }
  
  // Check if user already exists
  if (users.some(u => u.email === email)) {
    showNotification('This email is already registered', 'error');
    return;
  }  // Create new user
  const newUser = {
    id: Date.now(),
    name,
    email,
    phone,
    password, // In a real app, this would be hashed
    type: userType,
    createdAt: new Date().toISOString()
  };
  
  // Add to newly registered users in localStorage (separate from JSON users)
  const newlyRegisteredUsers = DataManager.loadData('newlyRegisteredUsers', []);
  newlyRegisteredUsers.push(newUser);
  DataManager.saveData('newlyRegisteredUsers', newlyRegisteredUsers);
  
  // Also add to the current users array for immediate use
  users.push(newUser);
  
  // In a real app, we'd send this to a server
  // For now, we'll just simulate a successful registration
  const { password: _, ...userWithoutPassword } = newUser; // Remove password from the object
  currentUser = userWithoutPassword;
  
  // Store in localStorage
  localStorage.setItem('currentUser', JSON.stringify(currentUser));
  
  // Update UI
  updateUIForUserStatus();
    // Close modal
  ModalManager.hide('registerModal');
    // Show notification
  showNotification(`Welcome, ${name}! Your account has been created.`, 'success');
  
  // No automatic redirect - stay on the current page
}

/**
 * Log out the current user
 */
function handleLogout() {
  // Clear user data
  currentUser = null;
  localStorage.removeItem('currentUser');
  
  // Update UI
  updateUIForUserStatus();
  
  // Show notification
  showNotification('You have been logged out', 'info');
  
  // Stay on the current page instead of redirecting
}

// ===== DINNER HANDLING =====
/**
 * Updates the filter counts based on the available dinners
 * @param {Array} dinnersToCount - Optional array of dinners to count, defaults to global dinners array
 */
function updateFilterCounts(dinnersToCount = dinners) {
  // Get filter badges
  const allCountBadge = document.querySelector('#filter-all .badge');
  const todayCountBadge = document.querySelector('#filter-today .badge');
  const weekCountBadge = document.querySelector('#filter-this-week .badge');
  const vegetarianCountBadge = document.querySelector('#filter-vegetarian .badge');
  const under20CountBadge = document.querySelector('#filter-under-20 .badge');
  
  if (!allCountBadge || !dinnersToCount) return; // Not on the index page or badges not found
  
  // If counting all dinners, filter to upcoming ones for Featured Dinners section
  const upcomingDinners = dinnersToCount === dinners ? getUpcomingDinners(dinners) : dinnersToCount;
  
  // Count for each filter (all based on upcoming dinners)
  const allCount = upcomingDinners.length;
  
  // Today's dinners (using today's date)
  const today = new Date().toISOString().split('T')[0];
  const todayCount = upcomingDinners.filter(dinner => dinner.date === today).length;
  
  // This week's dinners
  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);
  
  const weekCount = upcomingDinners.filter(dinner => {
    const dinnerDate = new Date(`${dinner.date}T${dinner.time}`);
    return dinnerDate >= now && dinnerDate <= nextWeek;
  }).length;
  
  // Vegetarian dinners - check both category and description for compatibility
  const vegetarianCount = upcomingDinners.filter(dinner => 
    dinner.category === 'vegan' || 
    dinner.category === 'vegetarian' || 
    dinner.tags?.includes('vegetarian') ||
    dinner.description?.toLowerCase().includes('vegan') || 
    dinner.description?.toLowerCase().includes('vegetarian')
  ).length;
  
  // Dinners under $20
  const under20Count = upcomingDinners.filter(dinner => {
    const price = dinner.price ? parseFloat(dinner.price) : 0;
    return price < 20;
  }).length;
  
  // Update badges
  allCountBadge.textContent = allCount;
  todayCountBadge.textContent = todayCount;
  weekCountBadge.textContent = weekCount;
  vegetarianCountBadge.textContent = vegetarianCount;
  under20CountBadge.textContent = under20Count;
}

/**
 * Handle the Host Dinner button click
 */
function handleHostDinnerClick() {
  if (!currentUser) {
    // Show login modal if not logged in
    ModalManager.show('authModal');
  } else if (currentUser.type !== 'host') {
    // If user is not a host, show message
    showNotification('You need a host account to create dinners. Please register as a host.', 'error');  } else {
    // Show create dinner modal for hosts
    ModalManager.show('createDinnerModal');
  }
}

/**
 * Display the list of dinners on the page with pagination
 * @param {Array} dinnersToShow - Array of dinner objects to display
 * @param {number} page - Current page number (1-based, defaults to 1)
 */
function displayDinners(dinnersToShow, page = 1) {
  const container = document.getElementById('dinners-container');
  const paginationContainer = document.getElementById('dinners-pagination');
  
  if (!container) return;
  
  // Pagination settings
  const dinnersPerPage = 6;
  const totalPages = Math.ceil(dinnersToShow.length / dinnersPerPage);
  
  // Ensure page is within valid range
  page = Math.max(1, Math.min(page, totalPages || 1));
  
  // Calculate start and end indices for current page
  const startIndex = (page - 1) * dinnersPerPage;
  const endIndex = Math.min(startIndex + dinnersPerPage, dinnersToShow.length);
  
  // Get dinners for current page
  const dinnersForCurrentPage = dinnersToShow.slice(startIndex, endIndex);
  
  // Clear container with fade-out effect
  container.classList.add('fade-out');
  
  // Use timeout to allow the fade-out animation to complete
  setTimeout(() => {
    container.innerHTML = '';
      if (dinnersToShow.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <div class="no-results-container">
            <i class="bi bi-search fs-1 text-muted mb-3"></i>
            <p class="text-muted fs-5">No dinners found matching your criteria.</p>
            <button class="btn btn-outline-warning mt-3" onclick="clearSearchAndReload()">
              <i class="bi bi-arrow-repeat me-2"></i>View All Dinners
            </button>
          </div>
        </div>
      `;
      
      // Remove fade-out class and add fade-in class
      container.classList.remove('fade-out');
      container.classList.add('fade-in');
      
      // Clear pagination if no results
      if (paginationContainer) {
        paginationContainer.innerHTML = '';
      }
      
      return;
    }
    
    // Create delay sequence for staggered animation
    dinnersForCurrentPage.forEach((dinner, index) => {// Calculate remaining spots
    const dinnerReservations = reservations.filter(r => r.dinnerId === dinner.id);
    const reservedSeats = dinnerReservations.reduce((total, reservation) => total + reservation.seats, 0);
    const spotsRemaining = dinner.maxGuests - reservedSeats;
    
    // Format date
    const dinnerDate = new Date(`${dinner.date}T${dinner.time}`);
    const formattedDate = dinnerDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
    
    // Create dinner card with animation delay
    const dinnerCard = document.createElement('div');
    dinnerCard.className = 'col-md-6 col-lg-4 mb-4 dinner-card-container';
    dinnerCard.style.animationDelay = `${index * 0.1}s`;
    
    dinnerCard.innerHTML = `
      <div class="card dinner-card h-100">
        <div class="position-relative dinner-image-container">
          <img src="${dinner.image}" class="card-img-top" alt="${dinner.title}">
          ${dinner.category ? `<span class="dinner-tag">${formatCategory(dinner.category)}</span>` : ''}
          ${dinner.imageAttribution && dinner.imageAttribution.photographerName ? 
            `<small class="position-absolute bottom-0 end-0 bg-dark bg-opacity-50 text-white px-2 py-1 small">
              Photo by <a href="${dinner.imageAttribution.photoUrl}" target="_blank" class="text-white">${dinner.imageAttribution.photographerName}</a> on Unsplash
            </small>` : ''}
        </div>
        <div class="card-body">
          <h5 class="card-title">${dinner.title}</h5>
          <div class="mb-2">
            <span class="badge bg-secondary text-white me-2">
              ${dinnerDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <span class="badge bg-secondary text-white">
              ${dinner.time}
            </span>
          </div>
          <p class="card-text">${truncateText(dinner.description, 80)}</p>
          
          <div class="host-info">
            <i class="bi bi-person-circle"></i> ${dinner.hostName}
          </div>
          
          <div class="dinner-meta">
            <div class="dinner-price">$${dinner.price} <span class="text-muted fs-6">per person</span></div>
            <div class="dinner-rating">
              <i class="bi bi-people-fill"></i> ${spotsRemaining} of ${dinner.maxGuests} spots left
            </div>
          </div>
          
          <button class="btn btn-reserve w-100 mt-3 reserve-btn" data-dinner-id="${dinner.id}">
            Reserve a Spot
          </button>
        </div>
      </div>
    `;
      container.appendChild(dinnerCard);
    });
      // Remove fade-out class and add fade-in class
    container.classList.remove('fade-out');
    container.classList.add('fade-in');      // Add event listeners to the reserve buttons
    document.querySelectorAll('.reserve-btn').forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault(); // Prevent any default action
        const dinnerId = this.dataset.dinnerId;
        handleReserveClick(dinnerId);
      });
    });
    
    // Update pagination UI
    if (paginationContainer) {
      renderPaginationControls(paginationContainer, page, totalPages, dinnersToShow.length);
    }
    
    // Initialize fire animation effects for the new dinner cards if available
    if (typeof setupFireHoverEffects === 'function') {
      setupFireHoverEffects();
    }
  }, 300); // Wait for fade-out animation to complete
}

/**
 * Render pagination controls
 * @param {HTMLElement} container - Container element for pagination
 * @param {number} currentPage - Current active page
 * @param {number} totalPages - Total number of pages
 * @param {number} totalItems - Total number of items
 */
function renderPaginationControls(container, currentPage, totalPages, totalItems) {
  if (!container) return;
  
  // Clear existing content
  container.innerHTML = '';
  
  // Don't show pagination if there's only one page or no items
  if (totalPages <= 1 || totalItems === 0) return;
  
  // Previous button
  const prevLi = document.createElement('li');
  prevLi.className = `page-item${currentPage === 1 ? ' disabled' : ''}`;
  prevLi.innerHTML = `
    <a class="page-link" href="#" aria-label="Previous" ${currentPage === 1 ? 'tabindex="-1" aria-disabled="true"' : ''} data-page="${currentPage - 1}">
      <span aria-hidden="true">&laquo;</span> Prev
    </a>
  `;
  container.appendChild(prevLi);
  
  // Determine which page numbers to show
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  
  // Adjust start page if we're near the end
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }
  
  // First page link if not showing page 1
  if (startPage > 1) {
    const firstLi = document.createElement('li');
    firstLi.className = 'page-item';
    firstLi.innerHTML = `<a class="page-link" href="#" data-page="1">1</a>`;
    container.appendChild(firstLi);
    
    // Add ellipsis if not showing page 2
    if (startPage > 2) {
      const ellipsisLi = document.createElement('li');
      ellipsisLi.className = 'page-item disabled';
      ellipsisLi.innerHTML = `<a class="page-link" href="#" tabindex="-1" aria-disabled="true">...</a>`;
      container.appendChild(ellipsisLi);
    }
  }
  
  // Page number links
  for (let i = startPage; i <= endPage; i++) {
    const pageLi = document.createElement('li');
    pageLi.className = `page-item${i === currentPage ? ' active' : ''}`;
    pageLi.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
    container.appendChild(pageLi);
  }
  
  // Last page link if not showing the last page
  if (endPage < totalPages) {
    // Add ellipsis if not showing second-to-last page
    if (endPage < totalPages - 1) {
      const ellipsisLi = document.createElement('li');
      ellipsisLi.className = 'page-item disabled';
      ellipsisLi.innerHTML = `<a class="page-link" href="#" tabindex="-1" aria-disabled="true">...</a>`;
      container.appendChild(ellipsisLi);
    }
    
    const lastLi = document.createElement('li');
    lastLi.className = 'page-item';
    lastLi.innerHTML = `<a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a>`;
    container.appendChild(lastLi);
  }
  
  // Next button
  const nextLi = document.createElement('li');
  nextLi.className = `page-item${currentPage === totalPages ? ' disabled' : ''}`;
  nextLi.innerHTML = `
    <a class="page-link" href="#" aria-label="Next" ${currentPage === totalPages ? 'tabindex="-1" aria-disabled="true"' : ''} data-page="${currentPage + 1}">
      Next <span aria-hidden="true">&raquo;</span>
    </a>
  `;
  container.appendChild(nextLi);
    // Add event listeners to pagination links
  container.querySelectorAll('.page-link').forEach(link => {
    if (!link.parentElement.classList.contains('disabled') && !link.parentElement.classList.contains('active')) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const pageNum = parseInt(this.dataset.page);
        if (!isNaN(pageNum)) {
          // We need to access the current filtered dinners, but we can't directly access dinnersToShow
          // from the closure. Instead, let's store the current filter in a data attribute on the container
          const currentFilter = document.querySelector('[id^="filter-"].active')?.dataset.filter || 'all';
          
          // Re-apply the filter and go to the selected page
          const filteredDinners = getFilteredDinners(currentFilter);
          displayDinners(filteredDinners, pageNum);
        }
      });
    }
  });
}

/**
 * Clears search and reloads all dinners
 */
function clearSearchAndReload() {
  // Clear search input
  const searchInput = document.getElementById('heroSearch');
  if (searchInput) {
    searchInput.value = '';
  }
  
  // Reset the section header (use function from handleHeroSearch.js if available)
  if (typeof resetSectionHeader === 'function') {
    resetSectionHeader();
  } else {
    // Fallback implementation
    const sectionHeader = document.querySelector('.section-header');
    if (sectionHeader) {
      const h2 = sectionHeader.querySelector('h2');
      const p = sectionHeader.querySelector('p');
      
      if (h2) {
        h2.innerHTML = 'Featured Dinners';
        h2.classList.remove('search-results-heading');
      }
      
      if (p) {
        p.textContent = 'Discover unique dining experiences in your community';
      }
    }  }
  
  // Display only upcoming dinners (reset to page 1)
  const upcomingDinners = getUpcomingDinners(dinners);
  displayDinners(upcomingDinners, 1);
  
  // Reset filter buttons
  document.querySelectorAll('[id^="filter-"]').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const allFilterBtn = document.querySelector('#filter-all');
  if (allFilterBtn) {
    allFilterBtn.classList.add('active');
  }
}

/**
 * Truncates text to specified length and adds ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated text with ellipsis if needed
 */
function truncateText(text, maxLength) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

/**
 * Handle dinner filter button clicks
 */
function handleFilterClick(e) {
  const filterType = e.target.dataset.filter;
  
  let filteredDinners = [...dinners];
  
  // Update active class on filter buttons
  document.querySelectorAll('[id^="filter-"]').forEach(btn => {
    btn.classList.remove('active');
  });
  e.target.classList.add('active');
  
  // Apply filtering
  filteredDinners = getFilteredDinners(filterType);
  
  // Trigger fire animation if available
  if (window.fireAnimation && typeof window.fireAnimation.animate === 'function') {
    window.fireAnimation.animate();
  }
  
  // Update display (always start at page 1 when applying a filter)
  displayDinners(filteredDinners, 1);
}

/**
 * Get filtered dinners based on filter type
 * @param {string} filterType - The type of filter to apply
 * @returns {Array} Filtered array of dinner objects
 */
function getFilteredDinners(filterType) {
  // Start with only upcoming dinners (future dates)
  const upcomingDinners = getUpcomingDinners(dinners);
  let filteredDinners = [...upcomingDinners];
  
  // Apply filtering to upcoming dinners only
  switch (filterType) {
    case 'today':
      const today = new Date().toISOString().split('T')[0];
      filteredDinners = upcomingDinners.filter(dinner => dinner.date === today);
      break;
      
    case 'this-week':
      const now = new Date();
      const nextWeek = new Date(now);
      nextWeek.setDate(now.getDate() + 7);
      
      filteredDinners = upcomingDinners.filter(dinner => {
        const dinnerDate = new Date(`${dinner.date}T${dinner.time}`);
        return dinnerDate >= now && dinnerDate <= nextWeek;
      });
      break;
      
    case 'vegetarian':
      filteredDinners = upcomingDinners.filter(dinner => 
        dinner.category === 'vegan' || 
        dinner.category === 'vegetarian' || 
        dinner.description.toLowerCase().includes('vegan') || 
        dinner.description.toLowerCase().includes('vegetarian')
      );
      break;
      
    case 'under-20':
      filteredDinners = upcomingDinners.filter(dinner => dinner.price < 20);
      break;
      
    case 'all':
    default:
      // Show all upcoming dinners
      filteredDinners = upcomingDinners;
      break;
  }
  
  return filteredDinners;
}

/**
 * Get the Bootstrap badge class for a dinner category
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
 * Format category names for display
 */
function formatCategory(category) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

/**
 * Handle the Create Dinner form submission
 */
async function handleCreateDinner(e) {
  e.preventDefault();
  
  if (!currentUser || currentUser.type !== 'host') {
    showNotification('You need to be logged in as a host to create dinners', 'error');
    return;
  }
  
  // Get form values
  const title = document.getElementById('dinnerTitle').value;
  const dateTime = document.getElementById('dinnerDate').value; // Format: YYYY-MM-DDThh:mm
  const price = parseFloat(document.getElementById('dinnerPrice').value);  const maxGuests = parseInt(document.getElementById('dinnerMaxGuests').value);
  const description = document.getElementById('dinnerDescription').value;
  const category = document.getElementById('dinnerCategory').value;
  const isPublic = document.getElementById('dinnerPublic').checked;
  
  // Get selected image and attribution data
  const selectedImageOption = document.querySelector('.dinner-image-option.selected');
  let image = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0';
  let photographerName = '';
  let photoUrl = '';
  
  if (selectedImageOption) {
    const selectedImageElement = selectedImageOption.querySelector('img');
    if (selectedImageElement) {
      image = selectedImageElement.src;
      photographerName = selectedImageOption.getAttribute('data-photographer') || '';
      photoUrl = selectedImageOption.getAttribute('data-photo-url') || '';
    }
  }
  
  // Split date and time
  const [date, time] = dateTime.split('T');
  
  // Create new dinner object
  const newDinner = {
    id: Date.now().toString(),
    title,
    date,
    time,
    description,    price,
    maxGuests,
    image,
    hostId: currentUser.id,
    hostName: currentUser.name,
    isPublic,
    category,
    createdAt: new Date().toISOString(),
    imageAttribution: {
      photographerName,
      photoUrl
    }
  };  // Add to dinners array
  dinners.push(newDinner);
  
  // Save to the newly created dinners localStorage key for persistence across page reloads
  const newlyCreatedDinners = DataManager.loadData('newlyCreatedDinners', []);
  newlyCreatedDinners.push(newDinner);
  DataManager.saveData('newlyCreatedDinners', newlyCreatedDinners);
  
  // Save data to storage
  DataManager.saveAllGlobalData();
  
  // Close modal
  ModalManager.hide('createDinnerModal');
    // Show notification
  showNotification('Your dinner has been created successfully!', 'success');
  
  // Update dinner listings - only show upcoming dinners in Featured Dinners section
  const upcomingDinners = getUpcomingDinners(dinners);
  displayDinners(upcomingDinners);
  
  // Update filter badge counts
  updateFilterCounts();
}

/**
 * Handle image search for dinner creation
 */
function handleImageSearch() {
  const searchTerm = document.getElementById('dinnerImageSearch').value;
  const resultsContainer = document.getElementById('imageResults');
  
  if (!searchTerm) {
    showNotification('Please enter a search term', 'error');
    return;
  }  // Clear previous results
  resultsContainer.innerHTML = '<div class="text-center py-3"><div class="spinner-border text-warning" role="status"></div><div class="mt-2">Searching for images...</div></div>';
  
  // Use proxy endpoint to fetch images
  const proxyEndpoint = typeof apiConfig !== 'undefined' && apiConfig.unsplash && apiConfig.unsplash.endpoint 
    ? apiConfig.unsplash.endpoint 
    : 'https://unsplash-proxy-app-fb6c8f079fb7.herokuapp.com/search';
    const endpoint = `${proxyEndpoint}?q=${encodeURIComponent(searchTerm)}&per_page=6&orientation=landscape`;
  
  // Add timeout to the fetch request
  const fetchWithTimeout = (url, options, timeout = 10000) => {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      )
    ]);  };
  
  // Fetch images from proxy endpoint (no API key needed)
  fetchWithTimeout(endpoint)
  .then(response => {
    if (!response.ok) {
      throw new Error(`Proxy API responded with status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    resultsContainer.innerHTML = '';
    
    if (data.results.length === 0) {
      resultsContainer.innerHTML = '<div class="col-12 text-center py-3">No images found. Try a different search term.</div>';
      return;
    }
    
    data.results.forEach(item => {
      const imageCol = document.createElement('div');
      imageCol.className = 'col-4 mb-2';
      imageCol.innerHTML = `
        <div class="dinner-image-option" data-photographer="${item.user.name}" data-photo-url="${item.links.html}">
          <img src="${item.urls.small}" alt="${item.alt_description || 'Food image'}" class="img-fluid rounded cursor-pointer">
          <div class="photographer-credit small text-muted mt-1">Photo by ${item.user.name}</div>
        </div>
      `;
      resultsContainer.appendChild(imageCol);
    });    // Add click event to select images
    ImageUtils.setupImageSelection('.dinner-image-option');  })  .catch(error => {
    // Show error message if images can't be loaded
    resultsContainer.innerHTML = `<div class="col-12 text-center py-2">
        <div class="alert alert-warning">
          <small><strong>Note:</strong> Unable to load images at the moment. Please try again later.</small>
        </div>
      </div>`;
  });
}

// Filter dinners to show only upcoming ones (future dates)
function getUpcomingDinners(dinners) {
    if (!dinners || !Array.isArray(dinners)) {
        return [];
    }
    
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Set to start of today for comparison
    
    return dinners.filter(dinner => {
        if (!dinner.date) return false;
        
        const dinnerDate = new Date(dinner.date);
        return dinnerDate >= now;
    });
}

// ===== RESERVATION HANDLING =====
/**
 * Handle the Reserve button click for a dinner
 */
function handleReserveClick(dinnerId) {
  // Find the dinner
  const dinner = dinners.find(d => d.id === dinnerId);
  if (!dinner) {
    showNotification('Dinner not found', 'error');
    return;
  }
    // Check if user is logged in
  if (!currentUser) {
    // Show authentication modal
    const authModalElement = document.getElementById('authModal');    ModalManager.show('authModal');
    return;
  }
  
  // Calculate remaining spots
  const dinnerReservations = reservations.filter(r => r.dinnerId === dinnerId);
  const reservedSeats = dinnerReservations.reduce((total, reservation) => total + reservation.seats, 0);
  const spotsRemaining = dinner.maxGuests - reservedSeats;
  
  // Format date and time for display
  const dinnerDate = new Date(`${dinner.date}T${dinner.time}`);
  const formattedDate = dinnerDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = dinner.time;
    // Update reservation modal with dinner details
  document.getElementById('reservationDinnerId').value = dinnerId;
  document.getElementById('reservationDinnerTitle').textContent = dinner.title;
  document.getElementById('reservationHostName').textContent = dinner.hostName;
  document.getElementById('reservationDateTime').textContent = `${formattedDate} at ${formattedTime}`;
  document.getElementById('reservationSpots').textContent = `${spotsRemaining} of ${dinner.maxGuests} spots available`;
  // Note: reservationPrice element doesn't exist in HTML, so we're removing it
  document.getElementById('perPersonPrice').textContent = `$${dinner.price.toFixed(2)}`;
  document.getElementById('totalPrice').textContent = `$${dinner.price.toFixed(2)}`;
  
  // Pre-fill guest info if user is logged in
  if (currentUser) {
    document.getElementById('guestName').value = currentUser.name;
    document.getElementById('guestEmail').value = currentUser.email;
    document.getElementById('guestPhone').value = currentUser.phone || '';
  }
  
  // Reset guest count to 1
  document.getElementById('guestsCount').value = '1';
    // Show the modal
  ModalManager.show('reserveDinnerModal');
}

/**
 * Update the guest count and recalculate the price
 */
function updateGuestCount(change) {
  const countInput = document.getElementById('guestsCount');
  let currentCount = parseInt(countInput.value);
  
  // Get dinner details
  const dinnerId = document.getElementById('reservationDinnerId').value;
  const dinner = dinners.find(d => d.id === dinnerId);
  
  // Calculate remaining spots
  const dinnerReservations = reservations.filter(r => r.dinnerId === dinnerId);
  const reservedSeats = dinnerReservations.reduce((total, reservation) => total + reservation.seats, 0);
  const spotsRemaining = dinner.maxGuests - reservedSeats;
  
  // Update count
  currentCount += change;
  
  // Validate the new count
  if (currentCount < 1) {
    currentCount = 1;
  } else if (currentCount > spotsRemaining) {
    currentCount = spotsRemaining;
    showNotification(`Maximum ${spotsRemaining} spots available`, 'warning');
  }
  
  // Update the input
  countInput.value = currentCount;
  
  // Update the price
  const perPersonPrice = dinner.price;
  const totalPrice = perPersonPrice * currentCount;
  
  document.getElementById('totalPrice').textContent = `$${totalPrice.toFixed(2)}`;
}

/**
 * Handle the reservation form submission
 */
async function handleReservation(e) {
  e.preventDefault();
  
  // Get form values
  const dinnerId = document.getElementById('reservationDinnerId').value;
  const guestName = document.getElementById('guestName').value;
  const guestEmail = document.getElementById('guestEmail').value;
  const guestPhone = document.getElementById('guestPhone').value;
  const seats = parseInt(document.getElementById('guestsCount').value);
  const notes = document.getElementById('specialRequests').value;
  
  // Get dietary preferences
  const preferences = [];
  if (document.getElementById('prefVegetarian').checked) preferences.push('vegetarian');
  if (document.getElementById('prefVegan').checked) preferences.push('vegan');
  if (document.getElementById('prefGlutenFree').checked) preferences.push('gluten-free');
  if (document.getElementById('prefDairyFree').checked) preferences.push('dairy-free');
  
  // Validate available spots
  const dinner = dinners.find(d => d.id === dinnerId);
  const dinnerReservations = reservations.filter(r => r.dinnerId === dinnerId);
  const reservedSeats = dinnerReservations.reduce((total, reservation) => total + reservation.seats, 0);
  const spotsRemaining = dinner.maxGuests - reservedSeats;
  
  if (seats > spotsRemaining) {
    showNotification(`Only ${spotsRemaining} spots available`, 'error');
    return;
  }
    // Create reservation
  const newReservation = {
    id: Math.random().toString(16).slice(2, 6), // Simple ID generation
    dinnerId,
    userId: currentUser ? currentUser.id : null, // Add user ID if user is logged in
    guestName,
    email: guestEmail,
    phone: guestPhone,
    seats,
    notes,
    preferences,
    createdAt: new Date().toISOString()
  };
    // Add to reservations array
  reservations.push(newReservation);
  // Save data to storage to make sure it persists
  DataManager.saveAllGlobalData();
  
  // Close modal
  ModalManager.hide('reserveDinnerModal');
  
  // Show notification
  showNotification('Your reservation has been confirmed!', 'success');
  
  // If user is logged in, redirect to guest dashboard
  if (currentUser) {
    setTimeout(() => {
      window.location.href = 'guest-dashboard.html';
    }, 1500);
  }
}

// ===== ADDITIONAL UTILITY FUNCTIONS =====
/**
 * Format a date string to a readable format
 */
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

// Force update the login/logout UI elements
// This is a special function to ensure UI correctly reflects login state
// especially for the home page after logout
function forceLoginUIUpdate() {
  // Reset all UI elements first
  const authElements = document.querySelectorAll('.auth-dependent');
  const guestButtons = document.querySelectorAll('.guest-only');
  const hostButtons = document.querySelectorAll('.host-only');
  
  // Hide auth-dependent elements
  authElements.forEach(el => {
    el.classList.add('d-none');
    el.style.display = 'none';
  });
  
  // Hide role-specific elements
  guestButtons.forEach(el => {
    el.classList.add('d-none');
    el.style.display = 'none';
  });
  
  hostButtons.forEach(el => {
    el.classList.add('d-none');
    el.style.display = 'none';
  });
  
  // Show/hide login button based on login state
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    if (!currentUser) {
      // User is logged out - show login button
      loginBtn.classList.remove('d-none');
      loginBtn.style.display = '';
      loginBtn.style.visibility = 'visible';
      loginBtn.style.opacity = '1';
    } else {
      // User is logged in - hide login button
      loginBtn.classList.add('d-none');
      loginBtn.style.display = 'none';
    }
  }
  
  // Update user dropdown if logged in
  if (currentUser) {
    authElements.forEach(el => {
      el.classList.remove('d-none');
      el.style.display = '';
    });
    
    // Show/hide elements based on user type
    if (currentUser.type === 'host') {
      hostButtons.forEach(el => {
        el.classList.remove('d-none');
        el.style.display = '';
      });
    } else {
      guestButtons.forEach(el => {
        el.classList.remove('d-none');
        el.style.display = '';
      });
    }
  }
}

/**
 * Ensure login button is visible after logout on homepage
 * This function is a special fix for the login button visibility issue on homepage
 */
function forceLoginButtonVisibility() {
  const loginBtn = document.getElementById('loginBtn');
  
  if (loginBtn) {
    // Remove any display:none styling
    loginBtn.style.display = '';
    
    // Remove Bootstrap d-none class
    loginBtn.classList.remove('d-none');
    
    // Ensure visibility
    loginBtn.style.visibility = 'visible';
    loginBtn.style.opacity = '1';
    
    // If button is inside a container, make sure it's visible too
    const parentLi = loginBtn.closest('li');
    if (parentLi) {
      parentLi.style.display = '';
      parentLi.classList.remove('d-none');
    }
  }
  
  // Return true if button exists
  return !!loginBtn;
}

// Note: Filter count functionality has been moved to handleHeroSearch.js

// Note: The handleHeroSearch function has been moved to handleHeroSearch.js

