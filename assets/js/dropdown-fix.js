/**
 * Dropdown Fix - Handles dropdown menu issues and interactions
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

    // Initialize dropdown fixes
    ready(function() {
        initializeDropdownFixes();
    });

    function initializeDropdownFixes() {
        fixDropdownToggle();
        fixDropdownOutsideClick();
        fixDropdownKeyboard();
        fixDropdownPositioning();
        fixMobileDropdowns();
    }    // Fix dropdown toggle behavior
    function fixDropdownToggle() {
        // Specifically target the user dropdown to avoid conflicts with other dropdowns
        const userDropdown = document.querySelector('#userDropdown');
        
        if (userDropdown) {
            // First try to use Bootstrap's API
            if (typeof bootstrap !== 'undefined' && bootstrap.Dropdown) {
                try {
                    let dropdownInstance = bootstrap.Dropdown.getInstance(userDropdown);
                    if (!dropdownInstance) {
                        dropdownInstance = new bootstrap.Dropdown(userDropdown);
                        console.log('User dropdown initialized with Bootstrap API');
                    }
                } catch (error) {
                    console.error('Error initializing dropdown with Bootstrap:', error);
                }
            }
            
            // Add click handler as a fallback that works with Bootstrap
            userDropdown.addEventListener('click', function(e) {
                // Don't prevent default to allow Bootstrap to handle the toggle
                e.stopPropagation();
                
                // If Bootstrap failed, implement fallback toggle
                if (typeof bootstrap === 'undefined' || !bootstrap.Dropdown) {
                    const dropdown = userDropdown.closest('.dropdown');
                    const menu = dropdown.querySelector('.dropdown-menu');
                    
                    if (menu) {
                        const isOpen = menu.classList.contains('show');
                        
                        // Close all other dropdowns first
                        closeAllDropdowns();
                        
                        if (!isOpen) {
                            menu.classList.add('show');
                            userDropdown.setAttribute('aria-expanded', 'true');
                            dropdown.classList.add('show');
                        } else {
                            menu.classList.remove('show');
                            userDropdown.setAttribute('aria-expanded', 'false');
                            dropdown.classList.remove('show');
                        }
                    }
                }
            });
        }
    }

    // Fix outside click behavior
    function fixDropdownOutsideClick() {
        document.addEventListener('click', function(e) {
            const isDropdownClick = e.target.closest('.dropdown');
            
            if (!isDropdownClick) {
                closeAllDropdowns();
            }
        });
    }

    // Fix keyboard navigation
    function fixDropdownKeyboard() {
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeAllDropdowns();
            }
            
            // Handle arrow key navigation
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                const activeDropdown = document.querySelector('.dropdown.show');
                if (activeDropdown) {
                    e.preventDefault();
                    navigateDropdownItems(activeDropdown, e.key === 'ArrowDown');
                }
            }
            
            // Handle Enter key
            if (e.key === 'Enter') {
                const focusedItem = document.querySelector('.dropdown-item:focus');
                if (focusedItem) {
                    e.preventDefault();
                    focusedItem.click();
                }
            }
        });
    }

    // Navigate dropdown items with keyboard
    function navigateDropdownItems(dropdown, isDown) {
        const items = dropdown.querySelectorAll('.dropdown-item:not(.disabled)');
        const currentFocus = document.activeElement;
        let currentIndex = Array.from(items).indexOf(currentFocus);
        
        if (currentIndex === -1) {
            currentIndex = isDown ? -1 : items.length;
        }
        
        const nextIndex = isDown 
            ? (currentIndex + 1) % items.length
            : (currentIndex - 1 + items.length) % items.length;
            
        items[nextIndex].focus();
    }

    // Fix dropdown positioning
    function fixDropdownPositioning() {
        const dropdowns = document.querySelectorAll('.dropdown');
        
        dropdowns.forEach(dropdown => {
            const toggle = dropdown.querySelector('.dropdown-toggle');
            const menu = dropdown.querySelector('.dropdown-menu');
            
            if (toggle && menu) {
                toggle.addEventListener('click', function() {
                    setTimeout(() => {
                        adjustDropdownPosition(dropdown, menu);
                    }, 10);
                });
            }
        });
        
        // Adjust on window resize
        window.addEventListener('resize', debounce(function() {
            const openDropdowns = document.querySelectorAll('.dropdown.show');
            openDropdowns.forEach(dropdown => {
                const menu = dropdown.querySelector('.dropdown-menu');
                if (menu) {
                    adjustDropdownPosition(dropdown, menu);
                }
            });
        }, 250));
    }

    // Adjust dropdown position to prevent overflow
    function adjustDropdownPosition(dropdown, menu) {
        const rect = menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Reset classes
        menu.classList.remove('dropdown-menu-end', 'dropup');
        
        // Check if dropdown overflows right edge
        if (rect.right > viewportWidth - 20) {
            menu.classList.add('dropdown-menu-end');
        }
        
        // Check if dropdown overflows bottom edge
        if (rect.bottom > viewportHeight - 20) {
            dropdown.classList.add('dropup');
        }
    }

    // Fix mobile dropdown behavior
    function fixMobileDropdowns() {
        // On mobile, ensure dropdowns work properly with touch
        if (window.innerWidth <= 768) {
            const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
            
            dropdownToggles.forEach(toggle => {
                // Remove hover effects on mobile
                const dropdown = toggle.closest('.dropdown');
                dropdown.style.pointerEvents = 'auto';
                
                // Ensure touch events work
                toggle.addEventListener('touchend', function(e) {
                    e.preventDefault();
                    toggle.click();
                });
            });
        }
    }

    // Close all open dropdowns
    function closeAllDropdowns() {
        const openDropdowns = document.querySelectorAll('.dropdown.show');
        
        openDropdowns.forEach(dropdown => {
            const menu = dropdown.querySelector('.dropdown-menu');
            const toggle = dropdown.querySelector('.dropdown-toggle');
            
            if (menu) {
                menu.classList.remove('show');
            }
            if (toggle) {
                toggle.setAttribute('aria-expanded', 'false');
            }
            dropdown.classList.remove('show');
        });
    }

    // Fix dropdown item interactions
    function fixDropdownItemInteractions() {
        const dropdownItems = document.querySelectorAll('.dropdown-item');
        
        dropdownItems.forEach(item => {
            // Prevent default for items with data-action
            if (item.hasAttribute('data-action')) {
                item.addEventListener('click', function(e) {
                    e.preventDefault();
                    const action = item.getAttribute('data-action');
                    handleDropdownAction(action, item);
                });
            }
            
            // Add proper focus styles
            item.addEventListener('focus', function() {
                item.classList.add('focused');
            });
            
            item.addEventListener('blur', function() {
                item.classList.remove('focused');
            });
        });
    }    // Handle dropdown actions
    function handleDropdownAction(action, item) {
        switch (action) {
            case 'logout':
                if (typeof window.confirmLogout === 'function') {
                    window.confirmLogout();
                } else if (window.LogoutUtil && window.LogoutUtil.confirmLogout) {
                    window.LogoutUtil.confirmLogout();
                } else {
                    console.log('Logout action triggered but no logout handler found');
                }
                break;
            case 'profile':
                showProfile();
                break;
            case 'settings':
                showSettings();
                break;
            default:
                console.log('Unknown dropdown action:', action);
        }
        
        // Close dropdown after action
        closeAllDropdowns();
    }

    // Handle logout action    // Show profile (placeholder)
    function showProfile() {
        console.log('Profile action triggered');
        // Implement profile functionality
    }

    // Show settings (placeholder)
    function showSettings() {
        console.log('Settings action triggered');
        // Implement settings functionality
    }

    // Utility: Debounce function
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Initialize item interactions when DOM is ready
    ready(function() {
        fixDropdownItemInteractions();
    });

    // Export functions for other scripts to use
    window.DropdownFix = {
        closeAllDropdowns: closeAllDropdowns,
        adjustDropdownPosition: adjustDropdownPosition,
        handleDropdownAction: handleDropdownAction
    };

    // Re-initialize on dynamic content changes
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1 && node.classList && node.classList.contains('dropdown')) {
                        setTimeout(() => initializeDropdownFixes(), 100);
                    }
                });
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();
