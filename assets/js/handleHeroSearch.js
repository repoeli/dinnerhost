/**
 * Handle hero search input
 * Searches through available dinners based on user input
 * and updates the featured dinners section with results
 * Includes loading animations and notifications for search status
 */
/**
 * Handles the hero search functionality for filtering dinner events based on user input.
 * 
 * This function performs a comprehensive search across multiple dinner properties including
 * title, description, cuisine type, location, host name, category, and date. It includes
 * robust error handling, loading states, visual feedback, and maintains search history.
 * 
 * The function validates all dependencies before proceeding and gracefully handles missing
 * functions or data. It filters only upcoming dinners and provides user feedback through
 * notifications and visual effects.
 * 
 * Key Features:
 * - Validates search input and required dependencies (dinners array, display functions)
 * - Searches across multiple dinner properties with case-insensitive matching
 * - Maintains recent search history via saveRecentSearch()
 * - Provides loading states with spinner and section highlighting
 * - Updates filter counts and UI states after search completion
 * - Shows appropriate notifications for search results or errors
 * - Handles empty search terms by displaying all upcoming dinners with shake animation
 * - Includes comprehensive error handling with proper cleanup
 * 
 * Dependencies:
 * - Global dinners array containing dinner event data
 * - displayDinners() function for rendering filtered results
 * - getUpcomingDinners() function for filtering future events
 * - showNotification() function for user feedback
 * - saveRecentSearch() function for search history
 * - updateFilterCounts() or updateSearchFilterCounts() for UI updates
 * 
 * DOM Elements:
 * - #heroSearch: Main search input field
 * - #heroSearchBtn: Search button with loading states
 * - #featured-dinners: Section container for visual effects
 * - .dinner-search-container: Container for shake animation
 * - Filter buttons with IDs starting with 'filter-'
 * 
 * @throws {Error} Catches and handles any errors during search execution
 * @returns {void} No return value - performs DOM manipulation and UI updates
 */
function handleHeroSearch() {
  const searchInput = document.getElementById('heroSearch');
  if (!searchInput) {
    return;
  }
  
  const searchTerm = searchInput.value.trim().toLowerCase();// Check if dinners array is available
  if (typeof dinners === 'undefined') {
    if (typeof showNotification === 'function') {
      showNotification('Search data not loaded yet. Please wait a moment and try again.', 'error');
    }
    return;
  }
  
  if (!Array.isArray(dinners)) {
    if (typeof showNotification === 'function') {
      showNotification('Search data is invalid. Please refresh the page.', 'error');
    }
    return;
  }
  
  // Check if required functions are available
  if (typeof displayDinners !== 'function') {
    if (typeof showNotification === 'function') {
      showNotification('Search functionality not ready. Please refresh the page.', 'error');
    }
    return;
  }
  
  if (typeof getUpcomingDinners !== 'function') {
    if (typeof showNotification === 'function') {
      showNotification('Search functionality not ready. Please refresh the page.', 'error');
    }
    return;
  }
  // Don't proceed if search term is empty - just show all dinners
  if (searchTerm === '') {
    // Show all upcoming dinners (page 1)
    displayDinners(getUpcomingDinners(dinners), 1);
    
    // Reset section header
    resetSectionHeader();
    
    // Show a subtle shake animation on the search box
    const searchContainer = document.querySelector('.dinner-search-container');
    if (searchContainer) {
      searchContainer.classList.add('shake-animation');
      setTimeout(() => {
        searchContainer.classList.remove('shake-animation');
      }, 500);
    }
    return;
  }
  
  // Save search term to recent searches
  saveRecentSearch(searchTerm);
  
  // Add loading state to search button
  const searchBtn = document.getElementById('heroSearchBtn');
  if (searchBtn) {
    searchBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Searching...';
    searchBtn.disabled = true;
  }
      // Apply highlight effect to the featured dinners section
  const featuredSection = document.getElementById('featured-dinners');
  if (featuredSection) {
    // Show loading state
    featuredSection.classList.add('section-loading');
    
    // Apply highlight effect to the featured dinners section
    featuredSection.classList.add('highlight-section');
  }
  
  try {
    // Filter dinners based on search term (from upcoming dinners only)
    const upcomingDinners = getUpcomingDinners(dinners);
    const filteredDinners = upcomingDinners.filter(dinner => {
      return (
        dinner.title?.toLowerCase().includes(searchTerm) ||
        dinner.description?.toLowerCase().includes(searchTerm) ||
        dinner.cuisineType?.toLowerCase().includes(searchTerm) ||
        dinner.location?.toLowerCase().includes(searchTerm) ||
        dinner.hostName?.toLowerCase().includes(searchTerm) ||
        dinner.category?.toLowerCase().includes(searchTerm) ||
        (dinner.date && dinner.date.includes(searchTerm))
      );
    });    // Set a small timeout to allow the loading effect to be noticeable  
    setTimeout(() => {
      // Display filtered dinners (reset to page 1)
      displayDinners(filteredDinners, 1);
      
      // Update search results heading
      updateSearchResultsHeading(searchTerm, filteredDinners.length);
      
      // Clear any active filter buttons
      document.querySelectorAll('[id^="filter-"]').forEach(btn => {
        btn.classList.remove('active');
      });
      
      // Add active class to "All" filter button to indicate a custom filter is applied
      const allFilterBtn = document.querySelector('#filter-all');
      if (allFilterBtn) {
        allFilterBtn.classList.add('active');
      }
      
      // Update filter button badges - use unified function from script.js if available
      if (typeof updateFilterCounts === 'function') {
        updateFilterCounts(filteredDinners);
      } else {
        // Fallback: update filter counts manually if function not available
        updateSearchFilterCounts(filteredDinners);
      }
      
      // Reset search button
      if (searchBtn) {
        searchBtn.innerHTML = '<i class="bi bi-search me-1"></i>Find Dinners';
        searchBtn.disabled = false;
      }
      
      // Remove loading state
      if (featuredSection) {
        featuredSection.classList.remove('section-loading');
      }
      
      // Show notification based on results
      if (filteredDinners.length === 0) {
        showNotification(`No dinners found matching "${searchTerm}". Try a different search term.`, 'info');
      } else {
        showNotification(`Found ${filteredDinners.length} dinners matching "${searchTerm}"`, 'success');
      }
      
      // Remove highlight effect after animation completes
      setTimeout(() => {
        if (featuredSection) {
          featuredSection.classList.remove('highlight-section');
        }
      }, 1500);
    }, 600);
      } catch (error) {
    // Reset search button and loading state in case of error
    if (searchBtn) {
      searchBtn.innerHTML = '<i class="bi bi-search me-1"></i>Find Dinners';
      searchBtn.disabled = false;
    }
    
    if (featuredSection) {
      featuredSection.classList.remove('section-loading');
      featuredSection.classList.remove('highlight-section');
    }
    
    // Show error notification
    showNotification('Search encountered an error. Please try again.', 'danger');
  }
}

/**
 * Updates the search results heading with search term and result count
 * @param {string} searchTerm - The search term
 * @param {number} resultCount - Number of results found
 */
function updateSearchResultsHeading(searchTerm, resultCount) {
  const sectionHeader = document.querySelector('.section-header');
  if (!sectionHeader || !searchTerm) return;
  
  const h2 = sectionHeader.querySelector('h2');
  const p = sectionHeader.querySelector('p');
  
  if (h2 && searchTerm) {
    h2.innerHTML = `Search Results: "${searchTerm}"`;
    h2.classList.add('search-results-heading');
  }
  
  if (p) {
    if (resultCount === 0) {
      p.textContent = 'No matching dinners found. Try a different search term or browse our featured dinners.';
    } else {
      p.textContent = `Found ${resultCount} dinner${resultCount !== 1 ? 's' : ''} matching your search`;
    }
  }
}

/**
 * Updates the filter button counts based on filtered dinners from search results
 * @param {Array} filteredDinners - Array of filtered dinner objects
 */
function updateSearchFilterCounts(filteredDinners) {
  if (!filteredDinners) return;
  
  // Count dinners by category
  const today = new Date().toISOString().split('T')[0];
  const thisWeekEnd = new Date();
  thisWeekEnd.setDate(thisWeekEnd.getDate() + 7);
  const thisWeekEndStr = thisWeekEnd.toISOString().split('T')[0];
  
  const counts = {
    all: filteredDinners.length,
    today: filteredDinners.filter(d => d.date && d.date.includes(today)).length,
    'this-week': filteredDinners.filter(d => {
      const dinnerDate = d.date ? new Date(d.date) : null;
      return dinnerDate && dinnerDate <= thisWeekEnd;
    }).length,
    vegetarian: filteredDinners.filter(d => d.category === 'vegetarian' || d.tags?.includes('vegetarian')).length,
    'under-20': filteredDinners.filter(d => d.price && parseFloat(d.price) < 20).length
  };
  
  // Update filter button badges
  Object.keys(counts).forEach(filter => {
    const badge = document.querySelector(`#filter-${filter} .badge`);
    if (badge) {
      badge.textContent = counts[filter];
    }
  });
}

/**
 * Saves a search term to recent searches
 * @param {string} term - The search term to save
 */
function saveRecentSearch(term) {
  if (!term || term.trim() === '') return;
  
  // Get existing recent searches from localStorage
  let recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
  
  // Add new term at the beginning (if not already there)
  if (!recentSearches.includes(term)) {
    recentSearches.unshift(term);
    
    // Keep only the 5 most recent searches
    recentSearches = recentSearches.slice(0, 5);
    
    // Save back to localStorage
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
  } else {
    // Move to the beginning if already exists
    recentSearches = recentSearches.filter(t => t !== term);
    recentSearches.unshift(term);
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
  }
  
  // Update UI
  updateRecentSearchesUI();
}

/**
 * Updates the recent searches UI
 */
function updateRecentSearchesUI() {
  const recentSearchesContainer = document.getElementById('recentSearches');
  if (!recentSearchesContainer) return;
  
  const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
  
  if (recentSearches.length === 0) {
    recentSearchesContainer.style.display = 'none';
    return;
  }
  
  // Show the container
  recentSearchesContainer.style.display = 'block';
  
  // Clear existing content
  const searchList = recentSearchesContainer.querySelector('.recent-searches-list');
  if (searchList) {
    searchList.innerHTML = '';
    
    // Add each search term
    recentSearches.forEach(term => {
      const searchItem = document.createElement('button');
      searchItem.className = 'recent-search-item';
      searchItem.innerHTML = `
        <i class="bi bi-clock-history"></i>
        <span>${term}</span>
      `;
      
      // Add click event to use this search term
      searchItem.addEventListener('click', () => {
        const searchInput = document.getElementById('heroSearch');
        if (searchInput) {
          searchInput.value = term;
          handleHeroSearch();
        }
      });
      
      searchList.appendChild(searchItem);
    });
  }
}

/**
 * Reset the section header to its default state
 */
function resetSectionHeader() {
  const sectionHeader = document.querySelector('.section-header');
  if (!sectionHeader) return;
  
  const h2 = sectionHeader.querySelector('h2');
  const p = sectionHeader.querySelector('p');
  
  if (h2) {
    h2.innerHTML = 'Featured Dinners';
    h2.classList.remove('search-results-heading');
  }
  
  if (p) {
    p.textContent = 'Discover unique dining experiences in your community';
  }
}

/**
 * Initialize search functionality when the page loads
 */
document.addEventListener('DOMContentLoaded', () => {
  // Wait for dependencies to load before setting up search
  const initSearchWithDelay = () => {
    // Check if main dependencies are available
    if (typeof dinners !== 'undefined' && 
        typeof displayDinners === 'function' && 
        typeof getUpcomingDinners === 'function') {
      
      setupSearchFunctionality();
      
    } else {
      setTimeout(initSearchWithDelay, 500);
    }
  };
  
  // Start checking for dependencies
  initSearchWithDelay();
});

/**
 * Set up search functionality once dependencies are ready
 */
function setupSearchFunctionality() {
  // Initialize recent searches UI
  updateRecentSearchesUI();
  
  // Set up search input focus/blur events
  const searchInput = document.getElementById('heroSearch');
  if (searchInput) {
    // Show recent searches when input is focused
    searchInput.addEventListener('focus', () => {
      const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      if (recentSearches.length > 0) {
        document.getElementById('recentSearches').style.display = 'block';
      }
    });
    
    // Search on Enter key press
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleHeroSearch();
      }
    });
  }
  
  // Set up search button click event
  const searchBtn = document.getElementById('heroSearchBtn');
  if (searchBtn) {
    searchBtn.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent any default form submission
      handleHeroSearch();
    });
  }
}
