/**
 * Host Dashboard - JavaScript
 * This file contains specific functionality for the host dashboard page
 */

// ===== DOM READY =====
document.addEventListener('DOMContentLoaded', () => {  // Check if Bootstrap is loaded properly
  if (typeof bootstrap === 'undefined') {
    alert('Critical error: Bootstrap library not loaded. Please check your internet connection and refresh.');
    return;
  }
  
  // Initialize host dashboard
  initHostDashboard();
});

// ===== INITIALIZATION =====
/**
 * Initialize the host dashboard page
 */
async function initHostDashboard() {
  try {
    // Check if dinners array exists globally
    if (typeof dinners === 'undefined') {
      throw new Error('Global data not available');
    }
    
    // Ensure global data is loaded first
    if (typeof loadData === 'function') {
      await loadData(); // Wait for data from script.js to be loaded
    } else {
      showNotification('Critical application error. Please contact support.', 'error');
      return;
    }

    // Check if user is logged in and is a host
    if (!currentUser) {
      // Redirect to login if not logged in
      window.location.href = 'index.html';
      return;
    }
    
    if (currentUser.type !== 'host') {
      // Redirect to guest dashboard if not a host
      window.location.href = 'guest-dashboard.html';
      return;
    }
      // Set user name in navbar
    const navUsername = document.getElementById('navUsername');
    if (navUsername) {
        navUsername.textContent = currentUser.name;
    }
    
    // Load host's dinners
    await loadHostDinners();
    
    // Update dashboard stats
    updateDashboardStats();
    
    // Set up event listeners
    setupHostDashboardEvents();
    
  } catch (error) {
    showNotification('Error loading dashboard data. Please try again.', 'error');
  }
}

// ===== DATA LOADING =====
/**
 * Load the host's dinners
 */
async function loadHostDinners() {
  // In a real app, we'd fetch this from an API with the host's ID
  // Here we'll filter the existing data
  
  // Get host dinners
  const hostDinners = dinners.filter(dinner => dinner.hostId === currentUser.id);
  
  // Display dinners in table
  displayDinnersTable(hostDinners);
  
  return hostDinners;
}

/**
 * Display dinners in the table
 */
function displayDinnersTable(hostDinners) {
  const tableBody = document.getElementById('dinnerTableBody');
  
  if (!tableBody) return;
  
  tableBody.innerHTML = '';
  
  if (hostDinners.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-4">
          <p class="text-muted mb-0">You haven't created any dinners yet.</p>
          <button class="btn btn-sm btn-warning mt-2" id="emptyStateCreateBtn">
            Create Your First Dinner
          </button>
        </td>
      </tr>
    `;
      // Add event listener to the create button
    const createBtn = document.getElementById('emptyStateCreateBtn');
    if (createBtn) {
      createBtn.addEventListener('click', () => {
        ModalManager.show('createDinnerModal');
      });
    }
    
    return;
  }
  
  // Sort dinners by date (most recent first)
  hostDinners.sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateB - dateA;
  });
  
  // Add a row for each dinner
  hostDinners.forEach(dinner => {
    // Get dinner status
    const dinnerDate = new Date(`${dinner.date}T${dinner.time}`);
    const now = new Date();
    let status = 'upcoming';
    let statusText = 'Upcoming';
    let statusClass = 'bg-primary';
    
    if (dinnerDate < now) {
      status = 'past';
      statusText = 'Completed';
      statusClass = 'bg-secondary';
    } else if (dinnerDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) { // less than 24 hours
      status = 'soon';
      statusText = 'Soon';
      statusClass = 'bg-warning text-dark';
    }
    
    if (!dinner.isPublic) {
      status = 'draft';
      statusText = 'Draft';
      statusClass = 'bg-info text-dark';
    }
    
    // Calculate guest count
    const dinnerReservations = reservations.filter(r => r.dinnerId === dinner.id);
    const guestCount = dinnerReservations.reduce((total, reservation) => total + reservation.seats, 0);
    
    // Format date and time
    const formattedDate = dinnerDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    
    const formattedTime = dinner.time;
      // Create row
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <div class="d-flex align-items-center">
          <div class="position-relative me-3">
            <img src="${dinner.image}" class="rounded" width="48" height="48" style="object-fit: cover;">
            ${dinner.imageAttribution && dinner.imageAttribution.photographerName ? 
              `<div class="position-absolute bottom-0 end-0 opacity-75" data-bs-toggle="tooltip" 
                data-bs-placement="bottom" title="Photo by ${dinner.imageAttribution.photographerName} on Unsplash">
                <i class="bi bi-info-circle bg-dark text-white rounded-circle" style="font-size: 10px; padding: 2px;"></i>
              </div>` : ''}
          </div>
          <div>
            <h6 class="mb-0">${dinner.title}</h6>
            <span class="badge ${getCategoryBadgeClass(dinner.category)} mt-1">${formatCategory(dinner.category)}</span>
          </div>
        </div>
      </td>
      <td>
        <div>
          <div><i class="bi bi-calendar-date me-1"></i>${formattedDate}</div>
          <div><i class="bi bi-clock me-1"></i>${formattedTime}</div>
        </div>
      </td>
      <td>
        <div class="d-flex align-items-center">
          <span class="fw-bold me-2">${guestCount}/${dinner.maxGuests}</span>
          <div class="progress flex-grow-1" style="height: 6px;">
            <div class="progress-bar bg-warning" role="progressbar" style="width: ${(guestCount / dinner.maxGuests) * 100}%"></div>
          </div>
        </div>
      </td>
      <td>$${dinner.price}</td>
      <td><span class="badge ${statusClass}">${statusText}</span></td>
      <td>
        <div class="btn-group">
          <button class="btn btn-sm btn-outline-secondary view-guests-btn" data-dinner-id="${dinner.id}">
            <i class="bi bi-people"></i>
          </button>
          <button class="btn btn-sm btn-outline-secondary edit-dinner-btn" data-dinner-id="${dinner.id}">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger delete-dinner-btn" data-dinner-id="${dinner.id}">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    `;
      tableBody.appendChild(row);
  });
  
  // Add event listeners to action buttons
  addActionButtonListeners();
  
  // Initialize tooltips for image attribution
  initializeTooltips();
}

/**
 * Initialize Bootstrap tooltips
 */
function initializeTooltips() {
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
}

/**
 * Update the dashboard statistics
 */
function updateDashboardStats() {
  // Filter host's dinners
  const hostDinners = dinners.filter(dinner => dinner.hostId === currentUser.id);
  const now = new Date();
  
  // Count upcoming dinners
  const upcomingDinners = hostDinners.filter(dinner => {
    const dinnerDate = new Date(`${dinner.date}T${dinner.time}`);
    return dinnerDate >= now;
  });
  
  // Count total guests and earnings
  let totalGuests = 0;
  let totalEarnings = 0;
  
  hostDinners.forEach(dinner => {
    const dinnerReservations = reservations.filter(r => r.dinnerId === dinner.id);
    const guestCount = dinnerReservations.reduce((total, reservation) => total + reservation.seats, 0);
    
    totalGuests += guestCount;
    totalEarnings += guestCount * dinner.price;
  });
  
  // Update HTML elements
  document.getElementById('upcomingCount').textContent = upcomingDinners.length;
  document.getElementById('guestsCount').textContent = totalGuests;
  document.getElementById('earningsCount').textContent = `$${totalEarnings}`;
}

// ===== EVENT LISTENERS =====
/**
 * Set up event listeners for the host dashboard
 */
function setupHostDashboardEvents() {
  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }  // Create dinner button
  const createDinnerBtn = document.getElementById('createDinnerBtn');  if (createDinnerBtn) {
    createDinnerBtn.addEventListener('click', () => {
      try {
        const createDinnerModalElement = document.getElementById('createDinnerModal');        if (!createDinnerModalElement) {
          showNotification('Modal element not found', 'error');
          return;
        }
          // Force modal to show with direct bootstrap call
        ModalManager.show('createDinnerModal');
      } catch (error) {
        alert('Error opening the Create Dinner modal. Please try refreshing the page.');
      }
    });
  }
  
  // Create dinner form
  const createDinnerForm = document.getElementById('createDinnerForm');
  if (createDinnerForm) {
    createDinnerForm.addEventListener('submit', handleCreateDinner);
  }
  
  // Edit dinner form
  const editDinnerForm = document.getElementById('editDinnerForm');
  if (editDinnerForm) {
    editDinnerForm.addEventListener('submit', handleEditDinner);
  }    // Image search buttons
  const searchImagesBtn = document.getElementById('searchImagesBtn');
  const editSearchImagesBtn = document.getElementById('editSearchImagesBtn');
  
  if (searchImagesBtn) {
    searchImagesBtn.addEventListener('click', function() {
      handleImageSearch(false);
    });
  }
  
  if (editSearchImagesBtn) {
    editSearchImagesBtn.addEventListener('click', function() {
      handleImageSearch(true);
    });
  }
  
  // Delete confirmation
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', handleDeleteDinner);
  }
  
  // Dinner search
  const dinnerSearch = document.getElementById('dinnerSearch');
  if (dinnerSearch) {
    dinnerSearch.addEventListener('input', handleDinnerSearch);
  }
  
  // Dinner status filter
  const dinnerStatusFilter = document.getElementById('dinnerStatusFilter');
  if (dinnerStatusFilter) {
    dinnerStatusFilter.addEventListener('change', handleDinnerStatusFilter);
  }
  
  // Export guests list
  const exportGuestsBtn = document.getElementById('exportGuestsBtn');
  if (exportGuestsBtn) {
    exportGuestsBtn.addEventListener('click', handleExportGuestsList);
  }
}

/**
 * Add event listeners to action buttons in the dinner table
 */
function addActionButtonListeners() {
  const viewGuestsBtns = document.querySelectorAll('.view-guests-btn');
  const editDinnerBtns = document.querySelectorAll('.edit-dinner-btn');
  const deleteDinnerBtns = document.querySelectorAll('.delete-dinner-btn');

  viewGuestsBtns.forEach(btn => {
    btn.addEventListener('click', (event) => {
      const dinnerId = event.currentTarget.dataset.dinnerId;
      showGuestsList(dinnerId);
    });
  });

  editDinnerBtns.forEach(btn => {
    btn.addEventListener('click', (event) => {
      const dinnerId = event.currentTarget.dataset.dinnerId;
      editDinner(dinnerId);
    });
  });

  deleteDinnerBtns.forEach(btn => {
    btn.addEventListener('click', (event) => {
      const dinnerId = event.currentTarget.dataset.dinnerId;
      confirmDeleteDinner(dinnerId);
    });
  });
}

// ===== DINNER HANDLERS =====
/**
 * Handle dinner search
 */
function handleDinnerSearch() {
  const searchTerm = document.getElementById('dinnerSearch').value.toLowerCase();
  const statusFilter = document.getElementById('dinnerStatusFilter').value;
  
  // Filter host's dinners
  const hostDinners = dinners.filter(dinner => dinner.hostId === currentUser.id);
  
  // Apply search and status filters
  const filteredDinners = hostDinners.filter(dinner => {
    const matchesSearch = dinner.title.toLowerCase().includes(searchTerm) ||
                          dinner.description.toLowerCase().includes(searchTerm) ||
                          dinner.category.toLowerCase().includes(searchTerm);
    
    if (!matchesSearch) return false;
    
    // Apply status filter if set to something other than 'all'
    if (statusFilter !== 'all') {
      const dinnerDate = new Date(`${dinner.date}T${dinner.time}`);
      const now = new Date();
      
      switch (statusFilter) {
        case 'upcoming':
          return dinnerDate >= now;
        case 'past':
          return dinnerDate < now;
        case 'draft':
          return !dinner.isPublic;
        default:
          return true;
      }
    }
    
    return true;
  });
  
  // Display filtered dinners
  displayDinnersTable(filteredDinners);
}

/**
 * Handle dinner status filter change
 */
function handleDinnerStatusFilter() {
  // Trigger the search function which includes the status filter logic
  handleDinnerSearch();
}

/**
 * Handle dinner creation form submission
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
  const price = parseFloat(document.getElementById('dinnerPrice').value);
  const maxGuests = parseInt(document.getElementById('dinnerMaxGuests').value);  const description = document.getElementById('dinnerDescription').value;
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
    description,
    price,
    maxGuests,
    image,    hostId: currentUser.id,
    hostName: currentUser.name,
    isPublic,
    category,
    createdAt: new Date().toISOString(),
    imageAttribution: {
      photographerName,
      photoUrl
    }  };    // Add to dinners array
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
  
  // Reset form
  document.getElementById('createDinnerForm').reset();
  
  // Update dashboard
  updateDashboardStats();
  displayDinnersTable(dinners.filter(dinner => dinner.hostId === currentUser.id));
}

/**
 * Show the edit dinner modal
 */
function editDinner(dinnerId) {
  // Find the dinner
  const dinner = dinners.find(d => d.id.toString() === dinnerId.toString());  if (!dinner) {
    showNotification('Dinner not found for edit', 'error');
    return;
  }
  
  // Populate the form
  document.getElementById('editDinnerId').value = dinnerId;
  document.getElementById('editDinnerTitle').value = dinner.title;
  document.getElementById('editDinnerPrice').value = dinner.price;
  document.getElementById('editDinnerMaxGuests').value = dinner.maxGuests;
  document.getElementById('editDinnerDescription').value = dinner.description;
  document.getElementById('editDinnerCategory').value = dinner.category;
  document.getElementById('editDinnerPublic').checked = dinner.isPublic;
  
  // Set date and time
  const dateTime = `${dinner.date}T${dinner.time}`;
  document.getElementById('editDinnerDate').value = dateTime;
    // Show current image
  document.getElementById('editDinnerCurrentImage').src = dinner.image;
  
  // Show the modal
  ModalManager.show('editDinnerModal');
}

/**
 * Handle dinner editing
 */
function handleEditDinner(e) {
  e.preventDefault();
  
  // Get form values
  const dinnerId = document.getElementById('editDinnerId').value;
  const title = document.getElementById('editDinnerTitle').value;
  const dateTime = document.getElementById('editDinnerDate').value;
  const price = parseFloat(document.getElementById('editDinnerPrice').value);
  const maxGuests = parseInt(document.getElementById('editDinnerMaxGuests').value);
  const description = document.getElementById('editDinnerDescription').value;
  const category = document.getElementById('editDinnerCategory').value;
  const isPublic = document.getElementById('editDinnerPublic').checked;
    // Get selected image or use current one
  const selectedImageOption = document.querySelector('#editImageResults .dinner-image-option.selected');
  let image = document.getElementById('editDinnerCurrentImage').src;
  // Correctly access imageAttribution from the found dinner, not a potentially stale index
  const dinnerIndex = dinners.findIndex(d => d.id.toString() === dinnerId.toString());
  let photographerName = dinners[dinnerIndex]?.imageAttribution?.photographerName || '';
  let photoUrl = dinners[dinnerIndex]?.imageAttribution?.photoUrl || '';
  
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
    // Find and update the dinner
  if (dinnerIndex === -1) {
    showNotification('Dinner not found for update', 'error');
    return;
  }
    // Update dinner object
  dinners[dinnerIndex] = {
    ...dinners[dinnerIndex],
    title,
    date,
    time,
    description,
    price,
    maxGuests,
    image,
    isPublic,
    category,
    updatedAt: new Date().toISOString(),
    imageAttribution: {
      photographerName,
      photoUrl
    }
  };
  
  // Update the dinner in newlyCreatedDinners localStorage if it exists there
  const newlyCreatedDinners = DataManager.loadData('newlyCreatedDinners', []);
  const newlyCreatedIndex = newlyCreatedDinners.findIndex(d => d.id.toString() === dinnerId.toString());
  if (newlyCreatedIndex !== -1) {
    newlyCreatedDinners[newlyCreatedIndex] = dinners[dinnerIndex];
    DataManager.saveData('newlyCreatedDinners', newlyCreatedDinners);
  }
  
  // Save data to storage
  DataManager.saveAllGlobalData();
  
  // Close modal
  ModalManager.hide('editDinnerModal');
  
  // Show notification
  showNotification('Dinner updated successfully', 'success');
  
  // Update dashboard
  updateDashboardStats();
  displayDinnersTable(dinners.filter(dinner => dinner.hostId === currentUser.id));
}

/**
 * Show the delete confirmation modal
 */
function confirmDeleteDinner(dinnerId) {
  // Find the dinner
  const dinner = dinners.find(d => d.id.toString() === dinnerId.toString());  if (!dinner) {
    showNotification('Dinner not found for delete confirmation', 'error');
    return;
  }
    // Set modal content
  // Ensure the hidden input ID for dinnerId matches what handleDeleteDinner expects
  document.getElementById('dinnerIdToDelete').value = dinnerId; 
  document.getElementById('dinnerNameToDelete').textContent = dinner.title;
    // Show the modal
  ModalManager.show('deleteConfirmModal');
}

/**
 * Handle dinner deletion
 */
function handleDeleteDinner() {
  const dinnerId = document.getElementById('dinnerIdToDelete').value;
  
  // Find and remove the dinner
  const dinnerIndex = dinners.findIndex(d => d.id.toString() === dinnerId.toString());
  if (dinnerIndex === -1) {
    showNotification('Dinner not found for deletion', 'error');
    return;
  }
    // Remove dinner
  dinners.splice(dinnerIndex, 1);
  
  // Also remove from newlyCreatedDinners localStorage if it exists there
  const newlyCreatedDinners = DataManager.loadData('newlyCreatedDinners', []);
  const updatedNewlyCreatedDinners = newlyCreatedDinners.filter(d => d.id.toString() !== dinnerId.toString());
  if (updatedNewlyCreatedDinners.length !== newlyCreatedDinners.length) {
    DataManager.saveData('newlyCreatedDinners', updatedNewlyCreatedDinners);
  }
  
  // Also remove associated reservations
  const updatedReservations = reservations.filter(r => r.dinnerId !== dinnerId);
  reservations.length = 0;
  reservations.push(...updatedReservations);
  
  // Save data to storage
  DataManager.saveAllGlobalData();
  
  // Close modal
  ModalManager.hide('deleteConfirmModal');
  
  // Show notification
  showNotification('Dinner deleted successfully', 'success');
  
  // Update dashboard
  updateDashboardStats();
  displayDinnersTable(dinners.filter(dinner => dinner.hostId === currentUser.id));
}

/**
 * Show the guests list modal for a specific dinner
 */
function showGuestsList(dinnerId) {
  const dinner = dinners.find(d => d.id.toString() === dinnerId);
  if (!dinner) {
    showNotification('Could not find dinner details.', 'error');
    return;
  }

  const modalElement = document.getElementById('guestsListModal');
  if (!modalElement) {
    showNotification('Guest list display error.', 'error');
    return;
  }
  
  // Find all reservations for this dinner
  const dinnerReservations = reservations.filter(r => r.dinnerId.toString() === dinnerId.toString());
  
  // Calculate stats
  const totalGuests = dinnerReservations.reduce((total, reservation) => total + reservation.seats, 0);
  const spotsLeft = dinner.maxGuests - totalGuests;
  
  // Update modal content
  const titleElement = document.getElementById('guestsDinnerTitle');
  const totalCountElement = document.getElementById('guestsTotalCount');
  const spotsLeftElement = document.getElementById('guestsAvailableSpots');
  
  if (titleElement) titleElement.textContent = dinner.title;
  if (totalCountElement) totalCountElement.textContent = `${totalGuests} ${totalGuests === 1 ? 'guest' : 'guests'}`;
  if (spotsLeftElement) spotsLeftElement.textContent = `${spotsLeft} ${spotsLeft === 1 ? 'spot' : 'spots'} left`;
  
  // Populate table with guests
  const tableBody = document.getElementById('guestsTableBody');
  if (tableBody) {
    tableBody.innerHTML = '';
    
    if (dinnerReservations.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-4">
            <p class="text-muted mb-0">No guests have reserved spots for this dinner yet.</p>
          </td>
        </tr>
      `;
    } else {
      dinnerReservations.forEach(reservation => {
        const row = document.createElement('tr');
        
        // Format dietary preferences
        let preferencesHtml = 'None';
        if (reservation.preferences && reservation.preferences.length > 0) {
          preferencesHtml = reservation.preferences
            .map(pref => `<span class="badge bg-light text-dark me-1">${pref}</span>`)
            .join(' ');
        }
        
        row.innerHTML = `
          <td>${reservation.guestName}</td>
          <td>
            <div>${reservation.email}</div>
            ${reservation.phone ? `<div class="small text-muted">${reservation.phone}</div>` : ''}
          </td>
          <td>${reservation.seats}</td>
          <td>${preferencesHtml}</td>
          <td>${reservation.notes || '-'}</td>
        `;
        
        tableBody.appendChild(row);
      });
    }
  }
    // Show the modal
  ModalManager.show('guestsListModal');
}

/**
 * Handle exporting the guest list
 */
function handleExportGuestsList() {
  // In a real app, this would generate a CSV or PDF file
  // For this example, we'll just show a notification
  showNotification('Guest list exported successfully', 'success');
}

/**
 * Handle image search for dinner creation/editing
 */
function handleImageSearch(isEdit = false) {
  // Clear any conflicting event listeners or issues by getting fresh references
  const searchTermInput = isEdit ? 'editDinnerImageSearch' : 'dinnerImageSearch';
  const resultsContainerId = isEdit ? 'editImageResults' : 'imageResults';
  
  const searchTermElement = document.getElementById(searchTermInput);
  const resultsContainer = document.getElementById(resultsContainerId);
    if (!searchTermElement) {
    showNotification('Search input field not found, please try again', 'error');
    return;
  }
  
  if (!resultsContainer) {
    showNotification('Results container not found, please try again', 'error');
    return;
  }
    const searchTerm = searchTermElement.value.trim();
  
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
    ]);
  };
    // Fetch images from proxy endpoint (no API key needed)
  fetchWithTimeout(endpoint)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Proxy API responded with status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      // Get a fresh reference to the container to avoid any issues
      const resultsContainer = document.getElementById(resultsContainerId);
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
      });
      
      // Add click event to select images
      ImageUtils.setupImageSelectionForContainer(resultsContainerId);
    })    .catch(error => {    const resultsContainer = document.getElementById(resultsContainerId);
    
    // Show error message if images can't be loaded
    resultsContainer.innerHTML = `<div class="col-12 text-center py-2">
        <div class="alert alert-warning">
          <small><strong>Note:</strong> Unable to load images at the moment. Please try again later.</small>
        </div>
      </div>`;
  });
}

