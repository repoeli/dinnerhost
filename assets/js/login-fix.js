/**
 * Login Fix - Handles login form issues and authentication states
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

    // Initialize login fixes
    ready(function() {
        initializeLoginFixes();
    });

    function initializeLoginFixes() {
        fixLoginModalHandling();
        fixFormValidation();
        fixAuthenticationState();
        fixModalSwitching();
    }    // Fix login modal handling
    function fixLoginModalHandling() {
        const loginForm = document.getElementById('loginForm');
        const loginModal = document.getElementById('loginModal');
        
        if (loginForm) {
            // Clone the form to remove any existing event listeners
            const newLoginForm = loginForm.cloneNode(true);
            if (loginForm.parentNode) {
                loginForm.parentNode.replaceChild(newLoginForm, loginForm);
            }
            
            // Add the handleLoginSubmit listener
            newLoginForm.addEventListener('submit', handleLoginSubmit);
        }        // Fix modal backdrop issues
        if (loginModal) {
            loginModal.addEventListener('hidden.bs.modal', function() {
                // Remove any lingering backdrop elements
                const backdrops = document.querySelectorAll('.modal-backdrop');
                backdrops.forEach(backdrop => backdrop.remove());
                
                // Reset body scroll
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
            });
        }
    }

    // Handle login form submission
    function handleLoginSubmit(event) {
        event.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        if (!email || !password) {
            showLoginError('Please fill in all fields.');
            return;
        }

        // Basic email validation
        if (!isValidEmail(email)) {
            showLoginError('Please enter a valid email address.');
            return;
        }

        // Simulate login process
        performLogin(email, password);
    }    // Perform login
    function performLogin(email, password) {
        // Show loading state
        const submitBtn = document.querySelector('#loginForm button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Logging in...';
        submitBtn.disabled = true;

        // First try to use the users array from the main script
        if (typeof window.users !== 'undefined' && Array.isArray(window.users) && window.users.length > 0) {
            // Log for debugging
            console.log("Login attempt for email:", email);
            
            // Find user in the users array - make sure to check both email and password
            const user = window.users.find(u => u.email === email && u.password === password);
            
            if (user) {
                // Success - found a matching user
                console.log("User found:", user.email, "Type:", user.type);
                setTimeout(() => {
                    const { password, ...userWithoutPassword } = user;
                    localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
                    
                    // Make sure to pass the correct user type to handleLoginSuccess
                    handleLoginSuccess(email, userWithoutPassword.type);
                    
                    // Reset button
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }, 800);
            } else {
                // Failed login - no matching user
                setTimeout(() => {
                    handleLoginError('Invalid email or password. Please try again.');
                    
                    // Reset button
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }, 800);
            }        } else {
            // Fallback to demo mode for testing
            setTimeout(() => {
                // Try to find the user in any other source (like localStorage)
                const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
                const localUser = localUsers.find(u => u.email === email && u.password === password);
                
                if (localUser) {
                    // Found in localStorage
                    console.log("User found in localStorage:", localUser.email, "Type:", localUser.type);
                    const { password, ...userWithoutPassword } = localUser;
                    localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
                    handleLoginSuccess(email, userWithoutPassword.type);
                } else if (email && password.length >= 6) {
                    // For demo purposes, accept any valid email/password combination
                    console.log("Demo login successful for:", email);
                    // Determine user type from email for demo purposes
                    const userType = email.includes('host') ? 'host' : 'guest';
                    handleLoginSuccess(email, userType);
                } else {
                    handleLoginError('Invalid credentials. Please try again.');
                }
                
                // Reset button
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 800);
        }
    }    // Handle successful login
    function handleLoginSuccess(email, userType = null) {
        // Make sure we have the user type from the user object
        // If userType is null, try to determine from email
        if (!userType) {
            userType = email.includes('host') ? 'host' : 'guest';
        }
        
        console.log("Login successful. Email:", email, "User Type:", userType);
        
        // Set user session if not already set
        if (!localStorage.getItem('currentUser')) {
            const userData = {
                email: email,
                name: email.split('@')[0],
                type: userType,
                loginTime: new Date().toISOString()
            };
            
            localStorage.setItem('currentUser', JSON.stringify(userData));
        }
        
        // Get current user data to ensure we have the latest info
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        if (modal) {
            modal.hide();
        }
        
        // Update UI - use the main script's function if available for better compatibility
        if (typeof window.updateUIForUserStatus === 'function') {
            window.updateUIForUserStatus();
        } else {
            updateAuthenticationState();
        }
          // Show success message with user type
        const userTypeDisplay = currentUser.type === 'host' ? 'Host' : 'Guest';
        showSuccessMessage(`Welcome back, ${userTypeDisplay}! You are now logged in.`);
        
        // Clear form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.reset();
        }
        
        // Redirect to appropriate dashboard
        setTimeout(() => {
            // Make sure currentUser is still valid
            const currentUserCheck = JSON.parse(localStorage.getItem('currentUser'));
            if (!currentUserCheck) {
                console.error("User data lost during redirect");
                return;
            }
            
            console.log("Redirecting user based on type:", currentUserCheck.type);
            
            // Check if we're on the main page
            if (window.location.pathname === '/' || 
                window.location.pathname.endsWith('index.html') || 
                window.location.pathname.endsWith('/')) {
                
                // Redirect based on user type - ensure this works for hosts
                if (currentUserCheck.type === 'host') {
                    console.log("Redirecting to host dashboard");
                    window.location.href = 'host-dashboard.html';
                } else {
                    console.log("Redirecting to guest dashboard");
                    window.location.href = 'guest-dashboard.html';
                }
            }
        }, 1000); // Delay to show the welcome message first
    }

    // Handle login error
    function handleLoginError(message) {
        showLoginError(message);
    }

    // Show login error
    function showLoginError(message) {
        let errorDiv = document.querySelector('#loginModal .alert-danger');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-danger alert-dismissible fade show';
            errorDiv.innerHTML = `
                <span class="error-message"></span>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            document.querySelector('#loginModal .modal-body').insertBefore(errorDiv, document.getElementById('loginForm'));
        }
        
        errorDiv.querySelector('.error-message').textContent = message;
    }

    // Fix form validation
    function fixFormValidation() {
        const forms = document.querySelectorAll('#loginModal form, #registerModal form');
        
        forms.forEach(form => {
            form.addEventListener('submit', function(event) {
                if (!form.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                form.classList.add('was-validated');
            }, false);
        });
    }

    // Fix authentication state
    function fixAuthenticationState() {
        updateAuthenticationState();
        
        // Listen for storage changes (if user logs in/out in another tab)
        window.addEventListener('storage', function(e) {
            if (e.key === 'currentUser') {
                updateAuthenticationState();
            }
        });
    }    // Update authentication state
    function updateAuthenticationState() {
        const currentUser = getCurrentUser();
        const authElements = document.querySelectorAll('.auth-dependent');
        const guestElements = document.querySelectorAll('.guest-only');
        const hostElements = document.querySelectorAll('.host-only');
        const userNameElements = document.querySelectorAll('.user-name');
        const loginBtn = document.getElementById('loginBtn');
        
        if (currentUser) {
            // User is logged in
            authElements.forEach(el => {
                el.style.display = '';
                el.classList.remove('d-none');
            });
            
            // Set user name in all relevant places
            userNameElements.forEach(el => {
                el.textContent = currentUser.name || currentUser.email.split('@')[0];
            });
            
            // Show/hide elements based on user type
            if (currentUser.type === 'host') {
                hostElements.forEach(el => {
                    el.style.display = '';
                    el.classList.remove('d-none');
                });
                guestElements.forEach(el => {
                    el.style.display = 'none';
                    el.classList.add('d-none');
                });
            } else {
                guestElements.forEach(el => {
                    el.style.display = '';
                    el.classList.remove('d-none');
                });
                hostElements.forEach(el => {
                    el.style.display = 'none';
                    el.classList.add('d-none');
                });
            }
            
            // Hide login button if present
            if (loginBtn) {
                loginBtn.style.display = 'none';
                loginBtn.classList.add('d-none');
            }
            
            // Update user info in navbar
            updateNavbarUserInfo(currentUser);
        } else {
            // User is not logged in
            authElements.forEach(el => {
                el.style.display = 'none';
                el.classList.add('d-none');
            });
            guestElements.forEach(el => {
                el.style.display = 'none';
                el.classList.add('d-none');
            });
            hostElements.forEach(el => {
                el.style.display = 'none';
                el.classList.add('d-none');
            });
            
            // Show login button if present
            if (loginBtn) {
                loginBtn.style.display = '';
                loginBtn.classList.remove('d-none');
            }
        }
    }// Update navbar user info
    function updateNavbarUserInfo(user) {
        const userDropdown = document.querySelector('#userDropdown');
        if (userDropdown) {
            userDropdown.innerHTML = `
                <i class="bi bi-person-circle me-2 text-primary-custom"></i>
                <span class="user-name">${user.name}</span>
            `;
        }
    }

    // Fix modal switching
    function fixModalSwitching() {
        // Switch from login to register
        const showRegisterFromLogin = document.getElementById('showRegisterFromLogin');
        if (showRegisterFromLogin) {
            showRegisterFromLogin.addEventListener('click', function(e) {
                e.preventDefault();
                switchModal('loginModal', 'registerModal');
            });
        }
        
        // Switch from register to login
        const showLoginFromRegister = document.getElementById('showLoginFromRegister');
        if (showLoginFromRegister) {
            showLoginFromRegister.addEventListener('click', function(e) {
                e.preventDefault();
                switchModal('registerModal', 'loginModal');
            });
        }
    }

    // Switch between modals
    function switchModal(fromModalId, toModalId) {
        const fromModal = bootstrap.Modal.getInstance(document.getElementById(fromModalId));
        const toModal = new bootstrap.Modal(document.getElementById(toModalId));
        
        if (fromModal) {
            fromModal.hide();
        }
        
        setTimeout(() => {
            toModal.show();
        }, 300);
    }

    // Utility functions
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }    function getCurrentUser() {
        try {
            const userStr = localStorage.getItem('currentUser');
            if (!userStr) return null;
            
            const user = JSON.parse(userStr);
            
            // Validate user object has the required fields
            if (!user || !user.email) {
                console.error('Invalid user object in localStorage');
                return null;
            }
            
            // Ensure user has a type property
            if (!user.type) {
                // Explicitly check for host emails
                const isHost = user.email.includes('host');
                user.type = isHost ? 'host' : 'guest';
                
                console.log("Fixed user type:", user.type, "for user:", user.email);
                
                // Update the localStorage with the corrected user object
                localStorage.setItem('currentUser', JSON.stringify(user));
            }
            
            return user;
        } catch (e) {
            console.error('Error parsing user data:', e);
            localStorage.removeItem('currentUser'); // Clear invalid data
            return null;
        }
    }

    function showSuccessMessage(message) {
        // Create or update success message
        let successDiv = document.querySelector('.alert-success');
        if (!successDiv) {
            successDiv = document.createElement('div');
            successDiv.className = 'alert alert-success alert-dismissible fade show position-fixed';
            successDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
            document.body.appendChild(successDiv);
        }
        
        successDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 5000);
    }    // Export functions for other scripts to use
    window.LoginFix = {
        updateAuthenticationState: updateAuthenticationState,
        getCurrentUser: getCurrentUser,
        showSuccessMessage: showSuccessMessage,
        performLogin: performLogin,
        handleLoginSuccess: handleLoginSuccess
    };

})();
