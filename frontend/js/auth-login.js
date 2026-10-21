/**
 * Affinova - Login Page Controller (Part 2)
 * Handles client-side validation, password reveal, API integration, and redirection.
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');
  const togglePasswordBtn = document.getElementById('toggleLoginPassword');
  const rememberMeCheckbox = document.getElementById('rememberMe');
  const submitBtn = document.getElementById('loginSubmitBtn');
  const alertBox = document.getElementById('loginAlert');
  const alertText = document.getElementById('loginAlertText');

  // Forgot Password Modal elements
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  const forgotModal = document.getElementById('forgotModal');
  const closeForgotModal = document.getElementById('closeForgotModal');
  const forgotForm = document.getElementById('forgotForm');
  const forgotEmailInput = document.getElementById('forgotEmail');
  const forgotAlert = document.getElementById('forgotAlert');

  // Load remembered email if available
  const savedEmail = localStorage.getItem('affinova_remembered_email');
  if (savedEmail && emailInput) {
    emailInput.value = savedEmail;
    if (rememberMeCheckbox) rememberMeCheckbox.checked = true;
  }

  // Password visibility toggle
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPassword = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
      
      togglePasswordBtn.innerHTML = isPassword
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" x2="22" y1="2" y2="22"></line></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    });
  }

  // Show Alert helper
  function showAlert(msg, type = 'error') {
    if (!alertBox || !alertText) return;
    alertBox.className = `auth-alert ${type}`;
    alertText.textContent = msg;
    alertBox.style.display = 'flex';
  }

  function hideAlert() {
    if (alertBox) alertBox.style.display = 'none';
  }

  // Handle Form Submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert();

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (!email || !password) {
        showAlert('Please enter both your email address and password.');
        return;
      }

      // Set Loading State
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg class="animate-spin" style="animation: spin 1s linear infinite; width: 18px; height: 18px;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle style="opacity: 0.25;" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path style="opacity: 0.75;" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        Authenticating...
      `;

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'Authentication failed. Please check your credentials.');
        }

        // Handle Remember Me
        if (rememberMeCheckbox && rememberMeCheckbox.checked) {
          localStorage.setItem('affinova_remembered_email', email);
        } else {
          localStorage.removeItem('affinova_remembered_email');
        }

        // Store JWT token and user profile
        localStorage.setItem('affinova_token', data.access_token);
        localStorage.setItem('affinova_user', JSON.stringify(data.user));

        showAlert('Login successful! Redirecting to your dashboard...', 'success');

        // Redirect to React User Dashboard
        setTimeout(() => {
          window.location.href = '/dashboard/';
        }, 800);

      } catch (err) {
        showAlert(err.message || 'Unable to connect to Affinova servers. Please try again.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });
  }

  // Forgot Password Modal
  if (forgotPasswordLink && forgotModal) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      forgotModal.style.display = 'flex';
      if (emailInput.value) forgotEmailInput.value = emailInput.value;
    });

    if (closeForgotModal) {
      closeForgotModal.addEventListener('click', () => {
        forgotModal.style.display = 'none';
      });
    }

    forgotModal.addEventListener('click', (e) => {
      if (e.target === forgotModal) forgotModal.style.display = 'none';
    });
  }

  // Forgot Form Submit
  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = forgotEmailInput.value.trim();
      if (!email) return;

      const submitForgotBtn = forgotForm.querySelector('button[type="submit"]');
      submitForgotBtn.disabled = true;
      submitForgotBtn.textContent = 'Sending Link...';

      try {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        
        forgotAlert.textContent = data.message || 'If an account exists, a password reset link has been dispatched to your email.';
        forgotAlert.className = 'auth-alert success';
        forgotAlert.style.display = 'flex';

        setTimeout(() => {
          forgotModal.style.display = 'none';
          forgotAlert.style.display = 'none';
          submitForgotBtn.disabled = false;
          submitForgotBtn.textContent = 'Send Reset Instructions';
        }, 3000);
      } catch (err) {
        forgotAlert.textContent = 'Failed to submit request. Please try again later.';
        forgotAlert.className = 'auth-alert error';
        forgotAlert.style.display = 'flex';
        submitForgotBtn.disabled = false;
        submitForgotBtn.textContent = 'Send Reset Instructions';
      }
    });
  }
});
