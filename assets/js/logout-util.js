/**
 * Logout Utility - Handles user logout functionality
 * Part of the dinner hosting website performance optimization
 */

(function() {
    'use strict';

    // Wait for DOM to be ready
    function ready(fn) {
        if (document.readyState !== 'loading') {
            fn();
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    }

    // Initialize logout functionality
    ready(function() {
        initializeLogoutUtility();
    });

    function initializeLogoutUtility() {
        attachLogoutListeners();
        checkAutoLogout();
    }

    // Attach logout event listeners
    function attachLogoutListeners() {
        // Find logout buttons/links
        const logoutElements = document.querySelectorAll('[data-action="logout"], #logoutBtn, .logout-btn');
        
        logoutElements.forEach(element => {
            element.addEventListener('click', function(e) {
                e.preventDefault();
                confirmLogout();
            });
        });

        // Handle logout from keyboard shortcut (Ctrl+L)
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'l' && getCurrentUser()) {
                e.preventDefault();
                confirmLogout();
            }
        });
    }

    // Confirm logout with user
    function confirmLogout() {
        const user = getCurrentUser();
        if (!user) {
            console.log('No user logged in');
            return;
        }

        // Create confirmation modal or use browser confirm
        if (window.bootstrap && document.getElementById('logoutConfirmModal')) {
            showLogoutModal();
        } else {
            const confirmed = confirm('Are you sure you want to log out?');
            if (confirmed) {
                performLogout();
            }
        }
    }

    // Show logout confirmation modal
    function showLogoutModal() {
        let modal = document.getElementById('logoutConfirmModal');
        
        // Create modal if it doesn't exist
        if (!modal) {
            modal = createLogoutModal();
            document.body.appendChild(modal);
        }
        
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    // Create logout confirmation modal
    function createLogoutModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'logoutConfirmModal';
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-hidden', 'true');
        
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Confirm Logout</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="d-flex align-items-center">
                            <i class="bi bi-question-circle-fill text-warning me-3" style="font-size: 2rem;"></i>
                            <div>
                                <p class="mb-1"><strong>Are you sure you want to log out?</strong></p>
                                <p class="text-muted mb-0 small">You'll need to log in again to access your account.</p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-warning" id="confirmLogoutBtn">
                            <i class="bi bi-box-arrow-right me-1"></i>Log Out
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listener to confirm button
        modal.querySelector('#confirmLogoutBtn').addEventListener('click', function() {
            const bsModal = bootstrap.Modal.getInstance(modal);
            bsModal.hide();
            performLogout();
        });
        
        return modal;
    }

    // Perform the actual logout
    function performLogout() {
        const user = getCurrentUser();
        
        if (!user) {
            console.log('No user to log out');
            return;
        }

        // Check if we're on the home page for special handling
        const currentPage = window.location.pathname;
        const isHomePage = currentPage.includes('index.html') || currentPage === '/' || currentPage.endsWith('/');
        
        // If on home page, use specialized function for better UI update
        if (isHomePage) {
            // Show logout progress first
            showLogoutProgress();
            
            // Short delay then use specialized function
            setTimeout(() => {
                handleHomePageLogout();
            }, 500);
            return;
        }

        // Standard logout process for other pages
        showLogoutProgress();

        // Simulate logout process
        setTimeout(() => {
            // Clear user data
            clearUserSession();
            
            // Update UI
            updateUIAfterLogout();
            
            // Show success message
            showLogoutSuccess(user.name || 'User');
            
            // Redirect if needed
            handlePostLogoutRedirection();
            
        }, 1000);
    }

    // Show logout progress
    function showLogoutProgress() {
        // Create or update progress indicator
        let progressDiv = document.querySelector('.logout-progress');
        if (!progressDiv) {
            progressDiv = document.createElement('div');
            progressDiv.className = 'logout-progress alert alert-info position-fixed';
            progressDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 200px;';
            document.body.appendChild(progressDiv);
        }
        
        progressDiv.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="spinner-border spinner-border-sm me-2" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                Logging out...
            </div>
        `;
    }

    // Clear user session data
    function clearUserSession() {
        // Remove from localStorage
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userPreferences');
        localStorage.removeItem('authToken');
        
        // Remove from sessionStorage
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('sessionData');
        
        // Clear any auth cookies (if using cookies)
        document.cookie.split(";").forEach(function(c) { 
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        
        // Clear any temporary data
        if (window.tempUserData) {
            window.tempUserData = null;
        }
    }    // Update UI after logout
    function updateUIAfterLogout() {
        // Clear global user variable
        if (window.currentUser) {
            window.currentUser = null;
        }
        
        // Hide authenticated elements
        const authElements = document.querySelectorAll('.auth-dependent');
        authElements.forEach(el => {
            el.style.display = 'none';
            el.classList.add('d-none');
        });        // Show login button
        const loginButtons = document.querySelectorAll('.login-btn, #loginBtn');
        loginButtons.forEach(btn => {
            btn.style.display = '';
            btn.classList.remove('d-none');
            // Ensure visibility
            btn.style.visibility = 'visible';
            btn.style.opacity = '1';
        });
        
        // Special handling for homepage login button
        ensureLoginButtonVisibility();
        
        // Reset navbar user display
        const userDropdown = document.querySelector('#userDropdown');
        if (userDropdown) {
            userDropdown.innerHTML = `
                <i class="bi bi-person-circle me-2 text-primary-custom"></i>
                <span class="user-name">User</span>
            `;
        }
          // Call updateUIForUserStatus if it exists to properly refresh UI
        if (typeof updateUIForUserStatus === 'function') {
            updateUIForUserStatus();
        }
        
        // Force a more thorough UI update for the home page
        if (typeof forceLoginUIUpdate === 'function') {
            forceLoginUIUpdate();
        }
        
        // Force refresh of page-specific UI elements
        refreshPageSpecificUI();
        
        // Clear any user-specific content
        clearUserSpecificContent();
        
        // Update authentication state if LoginFix is available
        if (window.LoginFix && window.LoginFix.updateAuthenticationState) {
            window.LoginFix.updateAuthenticationState();
        }
    }

    // Refresh page-specific UI elements after logout
    function refreshPageSpecificUI() {
        const currentPage = window.location.pathname;
        
        // If on host dashboard, clear host-specific content
        if (currentPage.includes('host-dashboard')) {
            // Clear dashboard content
            const dashboardStats = document.querySelectorAll('.stat-value');
            dashboardStats.forEach(stat => stat.textContent = '0');
            
            // Clear dinner table
            const dinnerTableBody = document.getElementById('dinnerTableBody');
            if (dinnerTableBody) {
                dinnerTableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center py-4">
                            <p class="text-muted mb-0">Please log in to view your dinners.</p>
                        </td>
                    </tr>
                `;
            }
        }
        
        // If on guest dashboard, clear guest-specific content
        if (currentPage.includes('guest-dashboard')) {
            // Clear reservations
            const upcomingReservations = document.getElementById('upcomingReservations');
            const pastReservations = document.getElementById('pastReservations');
            
            if (upcomingReservations) {
                upcomingReservations.innerHTML = `
                    <div class="col-12 text-center py-4">
                        <p class="text-muted">Please log in to view your reservations.</p>
                    </div>
                `;
            }
            
            if (pastReservations) {
                pastReservations.innerHTML = `
                    <div class="col-12 text-center py-4">
                        <p class="text-muted">Please log in to view your reservations.</p>
                    </div>
                `;
            }
        }
    }

    // Clear user-specific content
    function clearUserSpecificContent() {
        // Clear any displayed user data
        const userNameElements = document.querySelectorAll('.user-name');
        userNameElements.forEach(el => el.textContent = '');
        
        // Clear user avatar/profile elements
        const userAvatars = document.querySelectorAll('.user-avatar');
        userAvatars.forEach(avatar => {
            avatar.src = '';
            avatar.style.display = 'none';
        });
        
        // Reset any user-specific counters or data
        const userCounters = document.querySelectorAll('.user-counter');
        userCounters.forEach(counter => counter.textContent = '0');
    }

    // Show logout success message
    function showLogoutSuccess(userName) {
        // Remove progress indicator
        const progressDiv = document.querySelector('.logout-progress');
        if (progressDiv) {
            progressDiv.remove();
        }
        
        // Show success message
        let successDiv = document.querySelector('.logout-success');
        if (!successDiv) {
            successDiv = document.createElement('div');
            successDiv.className = 'logout-success alert alert-success alert-dismissible fade show position-fixed';
            successDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
            document.body.appendChild(successDiv);
        }
        
        successDiv.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi bi-check-circle-fill me-2"></i>
                <span>Goodbye, ${userName}! You have been logged out successfully.</span>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 5000);
    }    // Handle post-logout redirection    function handlePostLogoutRedirection() {
        const currentPage = window.location.pathname;
        
        // List of pages that require authentication
        const protectedPages = [
            '/host-dashboard.html',
            '/guest-dashboard.html',
            '/profile.html',
            '/settings.html'
        ];
        
        // If on a protected page, show immediate feedback and redirect
        if (protectedPages.some(page => currentPage.includes(page))) {
            // Show immediate redirect notice for dashboard pages
            if (currentPage.includes('dashboard')) {
                const redirectNotice = document.createElement('div');
                redirectNotice.className = 'alert alert-warning alert-dismissible fade show position-fixed';
                redirectNotice.style.cssText = 'top: 80px; left: 50%; transform: translateX(-50%); z-index: 9999; min-width: 400px;';
                redirectNotice.innerHTML = `
                    <div class="d-flex align-items-center">
                        <i class="bi bi-info-circle-fill me-2"></i>
                        <span>Redirecting to home page...</span>
                        <div class="spinner-border spinner-border-sm ms-2" role="status"></div>
                    </div>
                `;
                document.body.appendChild(redirectNotice);
            }
            
            // Shorter delay for better user experience
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        }        // For index.html, we need to refresh the page to properly update the UI
        else if (currentPage.includes('index.html') || currentPage === '/' || currentPage.endsWith('/')) {
            // Force login button visibility immediately
            ensureLoginButtonVisibility();
            
            // Give time for UI updates to attempt to apply
            setTimeout(() => {
                // Force a page refresh to ensure clean UI state
                window.location.reload();
            }, 300);
        }
    }

    // Check for auto-logout conditions
    function checkAutoLogout() {
        const user = getCurrentUser();
        if (!user) return;
        
        // Check for expired session
        if (user.loginTime) {
            const loginTime = new Date(user.loginTime);
            const now = new Date();
            const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);
            
            // Auto-logout after 24 hours
            if (hoursSinceLogin > 24) {
                console.log('Session expired, auto-logging out');
                performAutoLogout();
                return;
            }
        }
        
        // Set up periodic checks
        setInterval(() => {
            const currentUser = getCurrentUser();
            if (currentUser && currentUser.loginTime) {
                const loginTime = new Date(currentUser.loginTime);
                const now = new Date();
                const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);
                
                if (hoursSinceLogin > 24) {
                    performAutoLogout();
                }
            }
        }, 60000); // Check every minute
    }

    // Perform auto-logout
    function performAutoLogout() {
        clearUserSession();
        updateUIAfterLogout();
        
        // Show session expired message
        showSessionExpiredMessage();
        
        handlePostLogoutRedirection();
    }

    // Show session expired message
    function showSessionExpiredMessage() {
        const message = document.createElement('div');
        message.className = 'alert alert-warning alert-dismissible fade show position-fixed';
        message.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        
        message.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi bi-clock-history me-2"></i>
                <span>Your session has expired. Please log in again to continue.</span>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(message);
        
        // Auto-hide after 8 seconds
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 8000);
    }

    // Get current user
    function getCurrentUser() {
        try {
            const userStr = localStorage.getItem('currentUser');
            return userStr ? JSON.parse(userStr) : null;
        } catch (e) {
            console.error('Error parsing user data:', e);
            return null;
        }
    }    // Export functions for other scripts to use    window.LogoutUtil = {
        performLogout: performLogout,
        confirmLogout: confirmLogout,
        clearUserSession: clearUserSession,        
        getCurrentUser: getCurrentUser,
        checkAutoLogout: checkAutoLogout,
        updateUIAfterLogout: updateUIAfterLogout,
        ensureLoginButtonVisibility: ensureLoginButtonVisibility
    };

    // Also expose key functions directly on window for easier access
    window.performLogout = performLogout;
    window.confirmLogout = confirmLogout;
    window.updateLogoutUI = updateUIAfterLogout;
    window.ensureLoginButtonVisibility = ensureLoginButtonVisibility;

    /**
     * Special handler for homepage logout
     * This ensures the login button becomes visible immediately after logout on the home page
     */
    function ensureLoginButtonVisibility() {
        // Target specifically the login button on homepage
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            // Force display properties
            loginBtn.style.display = 'inline-block';
            loginBtn.style.visibility = 'visible';
            loginBtn.style.opacity = '1';
            loginBtn.classList.remove('d-none');
            
            // Also make sure any parent wrapper is visible
            if (loginBtn.parentElement) {
                loginBtn.parentElement.style.display = '';
                loginBtn.parentElement.classList.remove('d-none');
            }
            
            // Force a repaint to ensure visibility
            loginBtn.offsetHeight;
        }
    }

    /**
     * Special function to handle logout specifically on the home page
     * This makes sure the login button is visible immediately without requiring a page refresh
     */
    function handleHomePageLogout() {
        // Clear user session first
        clearUserSession();
        
        // Direct UI updates for home page
        const userDropdown = document.querySelector('#userDropdown');
        const loginBtn = document.getElementById('loginBtn');
        const authElements = document.querySelectorAll('.auth-dependent');
        const guestButtons = document.querySelectorAll('.guest-only');
        const hostButtons = document.querySelectorAll('.host-only');
        
        // Hide auth elements immediately
        authElements.forEach(el => {
            el.style.display = 'none';
            el.classList.add('d-none');
        });
        
        // Hide role-specific elements
        guestButtons.forEach(el => {
            el.style.display = 'none';
            el.classList.add('d-none');
        });
        
        hostButtons.forEach(el => {
            el.style.display = 'none';
            el.classList.add('d-none');
        });
        
        // Show login button with all possible fixes
        if (loginBtn) {
            loginBtn.classList.remove('d-none');
            loginBtn.style.display = 'inline-block';
            loginBtn.style.visibility = 'visible';
            loginBtn.style.opacity = '1';
            
            // Make sure parent is visible
            const parentLi = loginBtn.closest('li');
            if (parentLi) {
                parentLi.style.display = '';
                parentLi.style.visibility = 'visible';
            }
            
            // Force a repaint
            loginBtn.offsetHeight;
        }
        
        // Update current user global variable
        window.currentUser = null;
        
        // Show success message
        showLogoutSuccess("User");
        
        // Use any available helper functions
        if (typeof forceLoginButtonVisibility === 'function') {
            forceLoginButtonVisibility();
        }
        
        if (typeof forceLoginUIUpdate === 'function') {
            forceLoginUIUpdate();
        }
        
        // Refresh page after a short delay
        setTimeout(() => {
            window.location.reload();
        }, 500);
    }

})();
