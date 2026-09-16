/* ============================================
   PRAJAPATI ELECTRICAL — Auth Page Logic
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {

  // ── Guard routing dispatcher ──
  try {
    const user = await getCurrentUser();
    if (user) {
      const profile = await getCurrentProfile();
      if (!profile) {
        await supabase.auth.signOut();
        return;
      }
      if (['super_admin', 'admin', 'owner', 'manager'].includes(profile.role)) {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'dashboard.html';
      }
      return;
    }
  } catch (err) {
    console.warn("Auth routing skipped due to error:", err);
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

    if (role !== 'customer') {
      if (role === 'employee') {
        window.location.href = 'careers.html';
      } else {
        window.location.href = 'network.html';
      }
      return;
    }

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
        showMessage(authMessage, authMessageText, 'Success! Please check your email for a confirmation link.', 'success');
        signupForm.reset();
        setLoading(btn, false);
      } else {
        window.location.href = 'dashboard.html';
      }
    } catch (err) {
      console.error(err);
      showMessage(authMessage, authMessageText, err.message || 'Sign up latency error.');
      setLoading(btn, false);
    }
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
