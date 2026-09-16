/* ============================================
   PRAJAPATI ELECTRICAL — Auth Page Logic
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {

  // ── Guard routing dispatcher ──
  const user = await getCurrentUser();
  if (user) {
    const profile = await getCurrentProfile();
    if (['super_admin', 'admin', 'owner', 'manager'].includes(profile?.role)) {
      window.location.href = 'admin.html';
    } else {
      window.location.href = 'dashboard.html';
    }
    return;
  }

  // ── DOM Elements ──
  const tabs = document.querySelectorAll('.auth-tab');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const resetForm = document.getElementById('reset-form');
  const mainView = document.getElementById('auth-main-view');
  const resetView = document.getElementById('auth-reset-view');
  const authHeading = document.getElementById('auth-heading');
  const authSubtitle = document.getElementById('auth-subtitle');
  const authMessage = document.getElementById('auth-message');
  const authMessageText = document.getElementById('auth-message-text');
  const resetMessage = document.getElementById('reset-message');
  const resetMessageText = document.getElementById('reset-message-text');
  const forgotLink = document.getElementById('forgot-password-link');
  const resetBackBtn = document.getElementById('reset-back-btn');

  const otpView = document.getElementById('auth-otp-view');
  const otpBackBtn = document.getElementById('otp-back-btn');
  const otpForm = document.getElementById('otp-form');
  const otpMessage = document.getElementById('otp-message');
  const otpMessageText = document.getElementById('otp-message-text');
  const resendBtn = document.getElementById('resend-otp-btn');
  const resendTimer = document.getElementById('resend-timer');
  const otpTargetEmail = document.getElementById('otp-target-email');

  let currentSignupEmail = '';

  // ── Tab Switching ──
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      hideMessage(authMessage);

      if (target === 'login') {
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
        authHeading.textContent = 'Welcome Back';
        authSubtitle.textContent = 'Login to book services & manage your account';
      } else {
        loginForm.classList.remove('active');
        signupForm.classList.add('active');
        authHeading.textContent = 'Create Account';
        authSubtitle.textContent = 'Sign up to access dashboards and partner portals';
      }
    });
  });

  // ── Password Toggle ──
  document.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      const icon = btn.querySelector('i');

      if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
      } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
      }
    });
  });

  // ── Message Banner control ──
  function getFriendlyErrorMessage(errorMsg) {
    if (!errorMsg) return 'An unexpected error occurred. Please try again.';
    const msg = errorMsg.toLowerCase();
    
    if (msg.includes('jwt') || msg.includes('session')) {
      return 'Your session has expired. Please log in again.';
    }
    if (msg.includes('invalid login credentials')) {
      return 'Invalid email or password.';
    }
    if (msg.includes('rate limit') || msg.includes('too many requests')) {
      return 'Too many attempts. Please try again later.';
    }
    if (msg.includes('fetch') || msg.includes('network') || msg.includes('failed to fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    if (msg.includes('user already registered')) {
      return 'An account with this email already exists.';
    }
    return errorMsg;
  }

  function showMessage(el, textEl, text, type = 'error') {
    textEl.textContent = getFriendlyErrorMessage(text);
    el.className = `auth-message show ${type}`;
    const icon = el.querySelector('i');
    if (type === 'success') icon.className = 'fas fa-check-circle';
    else if (type === 'info') icon.className = 'fas fa-info-circle';
    else icon.className = 'fas fa-exclamation-circle';
  }

  function hideMessage(el) {
    el.classList.remove('show');
  }

  function setLoading(btn, loading) {
    if (loading) {
      btn.classList.add('loading');
      btn.disabled = true;
    } else {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  }

  // ── LOGIN SUBMIT ──
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessage(authMessage);

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('login-btn');

    if (!email || !password) {
      showMessage(authMessage, authMessageText, 'Please fill in all fields.');
      return;
    }

    setLoading(btn, true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        showMessage(authMessage, authMessageText, error.message);
        setLoading(btn, false);
        return;
      }

      // Check role dispatch
      const profile = await getCurrentProfile();
      if (['super_admin', 'admin', 'owner', 'manager'].includes(profile?.role)) {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'dashboard.html';
      }
    } catch (err) {
      showMessage(authMessage, authMessageText, 'Connection latency or authentication failure. Retry.');
      setLoading(btn, false);
    }
  });

  // ── SIGNUP SUBMIT ──
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessage(authMessage);

    const name = document.getElementById('signup-name').value.trim();
    const phone = document.getElementById('signup-phone').value.trim();
    const role = document.getElementById('signup-role').value;
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const btn = document.getElementById('signup-btn');

    if (!name || !email || !password) {
      showMessage(authMessage, authMessageText, 'Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      showMessage(authMessage, authMessageText, 'Password must be at least 6 characters.');
      return;
    }

    setLoading(btn, true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            phone: phone,
            role: role
          }
        }
      });

      if (error) {
        showMessage(authMessage, authMessageText, error.message);
        setLoading(btn, false);
        return;
      }

      if (data.user && !data.session) {
        currentSignupEmail = email;
        otpTargetEmail.textContent = email;
        mainView.style.display = 'none';
        otpView.style.display = 'block';
        signupForm.reset();
        setLoading(btn, false);
      } else {
        window.location.href = 'dashboard.html';
      }
    } catch (err) {
      showMessage(authMessage, authMessageText, 'Sign up latency error.');
      setLoading(btn, false);
    }
  });

  // ── OTP VERIFICATION ──
  otpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessage(otpMessage);

    const token = document.getElementById('otp-code').value.trim();
    const btn = document.getElementById('otp-btn');

    if (token.length !== 6) {
      showMessage(otpMessage, otpMessageText, 'Please enter a valid 6-digit code.');
      return;
    }

    setLoading(btn, true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: currentSignupEmail,
        token: token,
        type: 'signup'
      });

      if (error) {
        showMessage(otpMessage, otpMessageText, error.message);
        setLoading(btn, false);
        return;
      }

      window.location.href = 'dashboard.html';
    } catch (err) {
      showMessage(otpMessage, otpMessageText, 'Verification connection error.');
      setLoading(btn, false);
    }
  });

  // ── RESEND OTP ──
  resendBtn.addEventListener('click', async () => {
    resendBtn.style.display = 'none';
    resendTimer.style.display = 'inline';
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: currentSignupEmail,
      });

      if (error) {
        showMessage(otpMessage, otpMessageText, error.message);
      } else {
        showMessage(otpMessage, otpMessageText, 'OTP resent via Resend! Check your inbox.', 'success');
      }
    } catch (err) {
      showMessage(otpMessage, otpMessageText, 'Failed to resend OTP.');
    }
    
    let timeLeft = 60;
    resendTimer.textContent = `(${timeLeft}s)`;
    const timerId = setInterval(() => {
      timeLeft--;
      resendTimer.textContent = `(${timeLeft}s)`;
      if (timeLeft <= 0) {
        clearInterval(timerId);
        resendTimer.style.display = 'none';
        resendBtn.style.display = 'inline';
      }
    }, 1000);
  });

  otpBackBtn.addEventListener('click', () => {
    otpView.style.display = 'none';
    mainView.style.display = 'block';
    hideMessage(otpMessage);
  });

  // ── FORGOT PASSWORD ──
  forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    mainView.style.display = 'none';
    resetView.classList.add('active');
  });

  resetBackBtn.addEventListener('click', () => {
    resetView.classList.remove('active');
    mainView.style.display = 'block';
    hideMessage(resetMessage);
  });

  resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessage(resetMessage);

    const email = document.getElementById('reset-email').value.trim();
    const btn = document.getElementById('reset-btn');

    if (!email) {
      showMessage(resetMessage, resetMessageText, 'Please enter email address.');
      return;
    }

    setLoading(btn, true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth.html'
      });

      if (error) {
        showMessage(resetMessage, resetMessageText, error.message);
      } else {
        showMessage(resetMessage, resetMessageText,
          'Password reset link logged and dispatched! Check inbox.',
          'success'
        );
        resetForm.reset();
      }
    } catch (err) {
      showMessage(resetMessage, resetMessageText, 'Reset link dispatch error.');
    }
    setLoading(btn, false);
  });

});
