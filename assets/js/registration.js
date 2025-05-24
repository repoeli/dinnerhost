/**
 * Supplementary registration functionality for Dinner Hosting app
 * This file handles additional registration features that aren't in script.js
 */

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  console.log("Registration.js: Initializing additional registration functionality");
  
  // Set up password validation for registration form
  setupPasswordValidation();
});

/**
 * Setup password validation for the registration form
 */
function setupPasswordValidation() {
  const registerPassword = document.getElementById('registerPassword');
  const registerConfirmPassword = document.getElementById('registerConfirmPassword');
  
  if (registerPassword && registerConfirmPassword) {
    registerConfirmPassword.addEventListener('input', () => {
      validatePasswordMatch(registerPassword, registerConfirmPassword);
    });
    
    registerPassword.addEventListener('input', () => {
      validatePasswordMatch(registerPassword, registerConfirmPassword);
    });
    
    console.log("Registration.js: Password validation listeners added");
  } else {
    console.log("Registration.js: Password validation elements not found on this page");
  }
}

/**
 * Validate that passwords match in real-time
 */
function validatePasswordMatch(password, confirmPassword) {
  if (password.value !== confirmPassword.value) {
    confirmPassword.setCustomValidity("Passwords don't match");
  } else {
    confirmPassword.setCustomValidity('');
  }
}

/**
 * Show the login modal
 */
function showLoginModal() {
  const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
  loginModal.show();
}

/**
 * Handle the registration form submission
 */
function handleRegistration(e) {
  e.preventDefault();

  // Get form values
  const userType = document.querySelector('input[name="userType"]:checked').value;
  const fullName = document.getElementById('fullName').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const termsCheck = document.getElementById('termsCheck').checked;

  // Validate form
  if (!validateRegistrationForm(fullName, email, phone, password, confirmPassword, termsCheck)) {
    return;
  }

  // Check if email already exists
  if (users.some(user => user.email === email)) {
    showNotification('This email address is already registered. Please use a different email or log in.', 'error');
    return;
  }

  // Create new user object
  const newUser = {
    id: Date.now(),
    name: fullName,
    email: email,
    phone: phone,
    password: password, // In a real app, this would be hashed
    type: userType,
    createdAt: new Date().toISOString()
  };
  // In a real app, we'd send this to a server
  // For now, simulate adding to our local data
  users.push(newUser);

  // Save data to storage
  DataManager.saveData();

  // Get user data without password for localStorage
  const { password: _, ...userWithoutPassword } = newUser;

  // Store user in localStorage (login the user)
  localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));

  // Show success notification
  showNotification(`Welcome, ${fullName}! Your account has been created successfully.`, 'success');

  // Redirect to appropriate dashboard
  setTimeout(() => {
    window.location.href = userType === 'host' ? 'host-dashboard.html' : 'guest-dashboard.html';
  }, 1500);
}

/**
 * Validate registration form inputs
 */
function validateRegistrationForm(fullName, email, phone, password, confirmPassword, termsCheck) {
  // Check if all fields are filled
  if (!fullName || !email || !phone || !password || !confirmPassword) {
    showNotification('Please fill in all fields', 'error');
    return false;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showNotification('Please enter a valid email address', 'error');
    return false;
  }

  // Validate phone format (basic check)
  const phoneRegex = /^[0-9\-\+\(\)\s]{7,15}$/;
  if (!phoneRegex.test(phone)) {
    showNotification('Please enter a valid phone number', 'error');
    return false;
  }

  // Check password length
  if (password.length < 6) {
    showNotification('Password must be at least 6 characters long', 'error');
    return false;
  }

  // Check if passwords match
  if (password !== confirmPassword) {
    showNotification('Passwords do not match', 'error');
    return false;
  }

  // Check terms agreement
  if (!termsCheck) {
    showNotification('You must agree to the Terms of Service and Privacy Policy', 'error');
    return false;
  }

  return true;
}

/**
 * Validate that passwords match in real-time
 */
function validatePasswordMatch() {
  const password = document.getElementById('password');
  const confirmPassword = document.getElementById('confirmPassword');
  
  if (password.value !== confirmPassword.value) {
    confirmPassword.setCustomValidity("Passwords don't match");
  } else {
    confirmPassword.setCustomValidity('');
  }
}

/**
 * Handle the login form submission
 */
function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  
  // Find the user
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    // Successful login
    const { password, ...userWithoutPassword } = user; // Remove password from the object
    
    // Store in localStorage
    localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
    
    // Show notification
    showNotification(`Welcome back, ${user.name}!`, 'success');
    
    // Redirect based on user type
    setTimeout(() => {
      window.location.href = user.type === 'host' ? 'host-dashboard.html' : 'guest-dashboard.html';
    }, 1000);
  } else {
    // Failed login
    showNotification('Invalid email or password', 'error');  }
}
