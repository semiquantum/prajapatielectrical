/* ============================================
   PRAJAPATI ELECTRICAL — Auth Page Logic
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {

  // ── Check if already logged in ──
  const user = await getCurrentUser();
  if (user) {
    const profile = await getCurrentProfile();
    if (profile?.role === 'admin') {
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
        authSubtitle.textContent = 'Sign up to book electrical services online';
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

  // ── Show/Hide Message ──
  function showMessage(el, textEl, text, type = 'error') {
    textEl.textContent = text;
    el.className = `auth-message show ${type}`;
    const icon = el.querySelector('i');
    if (type === 'success') icon.className = 'fas fa-check-circle';
    else if (type === 'info') icon.className = 'fas fa-info-circle';
    else icon.className = 'fas fa-exclamation-circle';
  }

  function hideMessage(el) {
    el.classList.remove('show');
  }

  // ── Set Button Loading ──
  function setLoading(btn, loading) {
    if (loading) {
      btn.classList.add('loading');
      btn.disabled = true;
    } else {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  }

  // ── LOGIN ──
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        showMessage(authMessage, authMessageText, error.message);
        setLoading(btn, false);
        return;
      }

      // Check role and redirect
      const profile = await getCurrentProfile();
      if (profile?.role === 'admin') {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'dashboard.html';
      }
    } catch (err) {
      showMessage(authMessage, authMessageText, 'An unexpected error occurred. Please try again.');
      setLoading(btn, false);
    }
  });

  // ── SIGNUP ──
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessage(authMessage);

    const name = document.getElementById('signup-name').value.trim();
    const phone = document.getElementById('signup-phone').value.trim();
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
            phone: phone
          }
        }
      });

      if (error) {
        showMessage(authMessage, authMessageText, error.message);
        setLoading(btn, false);
        return;
      }

      // If email confirmation is required
      if (data.user && !data.session) {
        showMessage(authMessage, authMessageText,
          'Account created! Please check your email to verify your account before logging in.',
          'success'
        );
        signupForm.reset();
        setLoading(btn, false);
      } else {
        // Auto-confirmed (if email confirmation is disabled)
        window.location.href = 'dashboard.html';
      }
    } catch (err) {
      showMessage(authMessage, authMessageText, 'An unexpected error occurred. Please try again.');
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
      showMessage(resetMessage, resetMessageText, 'Please enter your email address.');
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
          'Password reset link sent! Check your email inbox.',
          'success'
        );
        resetForm.reset();
      }
    } catch (err) {
      showMessage(resetMessage, resetMessageText, 'An unexpected error occurred.');
    }

    setLoading(btn, false);
  });

  // ── Handle URL params (e.g., redirect from booking) ──
  const urlParams = new URLSearchParams(window.location.search);
  const redirectMsg = urlParams.get('msg');
  if (redirectMsg === 'login_required') {
    showMessage(authMessage, authMessageText, 'Please login to book a service.', 'info');
  }

  // Check for tab param
  const tabParam = urlParams.get('tab');
  if (tabParam === 'signup') {
    document.getElementById('tab-signup').click();
  }
});
