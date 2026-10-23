/**
 * Affinova - Registration Page Controller (Part 3)
 * Handles client-side validation, live password requirements, step-2 email verification,
 * resend timer, and automated onboarding redirect.
 */

document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('registerForm');
  const step1Card = document.getElementById('step1Card');
  const step2Card = document.getElementById('step2Card');
  const alertBox = document.getElementById('registerAlert');
  const alertText = document.getElementById('registerAlertText');

  // Input Fields
  const fullNameInput = document.getElementById('regFullName');
  const emailInput = document.getElementById('regEmail');
  const phoneInput = document.getElementById('regPhone');
  const passwordInput = document.getElementById('regPassword');
  const confirmPasswordInput = document.getElementById('regConfirmPassword');
  const termsCheckbox = document.getElementById('regTerms');
  const submitBtn = document.getElementById('registerSubmitBtn');

  // Password Toggles
  const togglePasswordBtn = document.getElementById('toggleRegPassword');
  const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPassword');

  // Live Requirement Badges
  const reqLength = document.getElementById('reqLength');
  const reqNumber = document.getElementById('reqNumber');
  const reqSpecial = document.getElementById('reqSpecial');

  // Step 2 Elements
  const verifyEmailDisplay = document.getElementById('verifyEmailDisplay');
  const digitInputs = document.querySelectorAll('.code-digit');
  const verifySubmitBtn = document.getElementById('verifySubmitBtn');
  const resendBtn = document.getElementById('resendVerifyCodeBtn');
  const resendCountdown = document.getElementById('resendCountdown');
  const verifyAlert = document.getElementById('verifyAlert');
  const verifyAlertText = document.getElementById('verifyAlertText');

  let currentPendingEmail = '';
  let resendTimer = null;
  let countdownSeconds = 60;

  // Toggle Password visibility helper
  function setupPasswordToggle(button, input) {
    if (!button || !input) return;
    button.addEventListener('click', () => {
      const isPassword = input.getAttribute('type') === 'password';
      input.setAttribute('type', isPassword ? 'text' : 'password');
      button.innerHTML = isPassword
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" x2="22" y1="2" y2="22"></line></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    });
  }

  setupPasswordToggle(togglePasswordBtn, passwordInput);
  setupPasswordToggle(toggleConfirmPasswordBtn, confirmPasswordInput);

  // Live Password Validation Checklist
  if (passwordInput) {
    passwordInput.addEventListener('input', () => {
      const val = passwordInput.value;

      // 1. Length >= 8
      if (val.length >= 8) {
        reqLength.classList.add('valid');
        reqLength.querySelector('svg').style.color = 'var(--accent-primary)';
      } else {
        reqLength.classList.remove('valid');
        reqLength.querySelector('svg').style.color = 'var(--text-muted)';
      }

      // 2. Contains number
      if (/\d/.test(val)) {
        reqNumber.classList.add('valid');
        reqNumber.querySelector('svg').style.color = 'var(--accent-primary)';
      } else {
        reqNumber.classList.remove('valid');
        reqNumber.querySelector('svg').style.color = 'var(--text-muted)';
      }

      // 3. Contains special character
      if (/[!@#$%^&*(),.?":{}|<>]/.test(val)) {
        reqSpecial.classList.add('valid');
        reqSpecial.querySelector('svg').style.color = 'var(--accent-primary)';
      } else {
        reqSpecial.classList.remove('valid');
        reqSpecial.querySelector('svg').style.color = 'var(--text-muted)';
      }
    });
  }

  function showAlert(box, textBox, msg, type = 'error') {
    if (!box || !textBox) return;
    box.className = `auth-alert ${type}`;
    textBox.textContent = msg;
    box.style.display = 'flex';
  }

  function hideAlert(box) {
    if (box) box.style.display = 'none';
  }

  // Handle Initial Registration Submission (Step 1)
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert(alertBox);

      const fullName = fullNameInput.value.trim();
      const email = emailInput.value.trim();
      const phone = phoneInput.value.trim();
      const password = passwordInput.value;
      const confirmPassword = confirmPasswordInput.value;
      const termsAccepted = termsCheckbox.checked;

      // Validation
      if (!fullName || !email || !phone || !password || !confirmPassword) {
        showAlert(alertBox, alertText, 'All fields are required to establish your account.');
        return;
      }

      if (!termsAccepted) {
        showAlert(alertBox, alertText, 'Please review and accept the Terms & Privacy Policy to proceed.');
        return;
      }

      if (password.length < 8 || !/\d/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        showAlert(alertBox, alertText, 'Password does not meet all security requirements.');
        return;
      }

      if (password !== confirmPassword) {
        showAlert(alertBox, alertText, 'Passwords do not match. Please verify.');
        return;
      }

      // UI Loading state
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg class="animate-spin" style="animation: spin 1s linear infinite; width: 18px; height: 18px;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle style="opacity: 0.25;" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path style="opacity: 0.75;" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        Creating account...
      `;

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: fullName,
            email: email,
            phone_number: phone,
            password: password
          })
        });

        let data;
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = { detail: text || 'Server response could not be parsed.' };
        }

        if (!response.ok) {
          throw new Error(data.detail || 'Registration failed. Please check your information.');
        }

        // Transition to Step 2 (Email Verification)
        currentPendingEmail = email;
        if (verifyEmailDisplay) {
          verifyEmailDisplay.textContent = email;
        }

        // If email failed or test mode, show OTP hint banner so user is never blocked!
        if (data.otp_hint) {
          const alertBoxStep2 = document.getElementById('verifyAlert');
          const alertTextStep2 = document.getElementById('verifyAlertText');
          if (alertBoxStep2 && alertTextStep2) {
            alertBoxStep2.className = 'auth-alert active';
            alertBoxStep2.style.background = 'rgba(46, 230, 166, 0.1)';
            alertBoxStep2.style.borderColor = 'rgba(46, 230, 166, 0.3)';
            alertBoxStep2.style.color = '#2ee6a6';
            alertTextStep2.innerHTML = `<strong>Verification Code:</strong> <span style="letter-spacing: 2px; font-weight: bold; font-size: 1.1rem; color: #fff;">${data.otp_hint}</span> (Live Cloud Preview)`;
          }
          // Auto-fill digit inputs for smooth UX
          if (digitInputs.length === 6) {
            const digits = data.otp_hint.split('');
            digits.forEach((d, i) => { digitInputs[i].value = d; });
          }
        }

        step1Card.style.display = 'none';
        step2Card.classList.add('active');
        step2Card.style.display = 'flex';

        startResendCountdown();

        // Focus first digit input
        if (digitInputs.length > 0) digitInputs[0].focus();

      } catch (err) {
        showAlert(alertBox, alertText, err.message);
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  // Digit Inputs Auto-advance & backspace navigation
  digitInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      const val = e.target.value.replace(/[^0-9]/g, '');
      e.target.value = val.slice(-1); // Only allow 1 character

      if (val && index < digitInputs.length - 1) {
        digitInputs[index + 1].focus();
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && index > 0) {
        digitInputs[index - 1].focus();
      }
    });

    // Handle full code paste
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasteData = (e.clipboardData || window.clipboardData).getData('text').trim();
      if (/^\d{6}$/.test(pasteData)) {
        pasteData.split('').forEach((char, i) => {
          if (digitInputs[i]) digitInputs[i].value = char;
        });
        digitInputs[digitInputs.length - 1].focus();
      }
    });
  });

  // Start Resend Timer
  function startResendCountdown() {
    countdownSeconds = 60;
    resendBtn.disabled = true;
    resendCountdown.textContent = `(${countdownSeconds}s)`;

    if (resendTimer) clearInterval(resendTimer);
    resendTimer = setInterval(() => {
      countdownSeconds--;
      if (countdownSeconds <= 0) {
        clearInterval(resendTimer);
        resendBtn.disabled = false;
        resendCountdown.textContent = '';
      } else {
        resendCountdown.textContent = `(${countdownSeconds}s)`;
      }
    }, 1000);
  }

  // Resend code click
  if (resendBtn) {
    resendBtn.addEventListener('click', async () => {
      if (countdownSeconds > 0) return;
      try {
        const res = await fetch('/api/auth/resend-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: currentPendingEmail })
        });
        const data = await res.json();
        
        if (data.otp_hint) {
          const alertBoxStep2 = document.getElementById('verifyAlert');
          const alertTextStep2 = document.getElementById('verifyAlertText');
          if (alertBoxStep2 && alertTextStep2) {
            alertBoxStep2.className = 'auth-alert active';
            alertBoxStep2.style.background = 'rgba(46, 230, 166, 0.1)';
            alertBoxStep2.style.borderColor = 'rgba(46, 230, 166, 0.3)';
            alertBoxStep2.style.color = '#2ee6a6';
            alertTextStep2.innerHTML = `<strong>New Verification Code:</strong> <span style="letter-spacing: 2px; font-weight: bold; font-size: 1.1rem; color: #fff;">${data.otp_hint}</span>`;
          }
          if (digitInputs.length === 6) {
            const digits = data.otp_hint.split('');
            digits.forEach((d, i) => { digitInputs[i].value = d; });
          }
        } else {
          showAlert(verifyAlert, verifyAlertText, data.message || 'A new verification code has been dispatched.', 'success');
        }
        startResendCountdown();
      } catch (err) {
        showAlert(verifyAlert, verifyAlertText, 'Failed to resend code. Please try again.');
      }
    });
  }

  // Step 2: Verification Submit
  if (verifySubmitBtn) {
    verifySubmitBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      hideAlert(verifyAlert);

      let code = '';
      digitInputs.forEach(input => code += input.value);

      if (code.length !== 6) {
        showAlert(verifyAlert, verifyAlertText, 'Please enter the complete 6-digit verification code.');
        return;
      }

      verifySubmitBtn.disabled = true;
      const originalText = verifySubmitBtn.textContent;
      verifySubmitBtn.textContent = 'Verifying...';

      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: currentPendingEmail,
            code: code
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'Verification code is invalid or has expired.');
        }

        // Store auth tokens and user data
        localStorage.setItem('affinova_token', data.access_token);
        localStorage.setItem('affinova_user', JSON.stringify(data.user));

        showAlert(verifyAlert, verifyAlertText, 'Account verified! Launching your affiliate dashboard...', 'success');

        setTimeout(() => {
          window.location.href = '/dashboard/';
        }, 1000);

      } catch (err) {
        showAlert(verifyAlert, verifyAlertText, err.message);
        verifySubmitBtn.disabled = false;
        verifySubmitBtn.textContent = originalText;
      }
    });
  }
});
