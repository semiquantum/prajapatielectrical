/* ============================================
   PRAJAPATI ELECTRICAL — Supabase Configuration
   Shared across all public pages
   ============================================ */

// Synchronously load js/env.js if not already loaded (for client-side environment support)
if (typeof window.ENV === 'undefined') {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'js/env.js', false); // false makes request synchronous
    xhr.send(null);
    if (xhr.status === 200) {
      const script = document.createElement('script');
      script.text = xhr.responseText;
      document.head.appendChild(script);
    }
  } catch (e) {
    console.warn('Failed to load environment script js/env.js dynamically:', e);
  }
}

const SUPABASE_URL = window.ENV?.SUPABASE_URL || 'https://rdsimusskjnayzsgyfgc.supabase.co';
const SUPABASE_ANON_KEY = window.ENV?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkc2ltdXNza2puYXl6c2d5ZmdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MDMzMjEsImV4cCI6MjA5NjM3OTMyMX0.FLnlMIhh39t3Vjs0l6X3Z1CyKfTDVgbTfS9xfAkKc98';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Auth Helper Functions ──

async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function getCurrentProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return data;
}

async function isAdmin() {
  const profile = await getCurrentProfile();
  return profile?.role === 'admin';
}

async function signOut() {
  await supabase.auth.signOut();
  window.location.href = 'index.html';
}

// ── UI Helper: Update navbar auth state ──
async function updateNavAuth() {
  const user = await getCurrentUser();
  const authBtnWrap = document.getElementById('nav-auth-buttons');
  const userMenu = document.getElementById('nav-user-menu');
  const mobileAuthBtn = document.getElementById('mobile-nav-auth');

  if (!authBtnWrap && !userMenu && !mobileAuthBtn) return;

  if (user) {
    const profile = await getCurrentProfile();
    const displayName = profile?.full_name || user.email.split('@')[0];

    if (authBtnWrap) authBtnWrap.style.display = 'none';
    if (userMenu) {
      userMenu.style.display = 'flex';
      const nameEl = userMenu.querySelector('.user-name');
      if (nameEl) nameEl.textContent = displayName;
    }
    if (mobileAuthBtn) {
      mobileAuthBtn.href = 'dashboard.html';
      mobileAuthBtn.innerHTML = '<i class="fas fa-user"></i> Dashboard';
    }
  } else {
    if (authBtnWrap) authBtnWrap.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
    if (mobileAuthBtn) {
      mobileAuthBtn.href = 'auth.html';
      mobileAuthBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login / Sign Up';
    }
  }
}

// ── Format helpers ──
function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getStatusBadgeClass(status) {
  const map = {
    'pending': 'badge-warning',
    'confirmed': 'badge-info',
    'in_progress': 'badge-primary',
    'completed': 'badge-success',
    'cancelled': 'badge-danger'
  };
  return map[status] || 'badge-default';
}

function getStatusLabel(status) {
  const map = {
    'pending': 'Pending',
    'confirmed': 'Confirmed',
    'in_progress': 'In Progress',
    'completed': 'Completed',
    'cancelled': 'Cancelled'
  };
  return map[status] || status;
}

// ── Resend Email Integration (Mock / Real) ──
async function sendEmailNotification(to, subject, htmlBody) {
  const apiKey = localStorage.getItem('setting-resend-key') || window.ENV?.RESEND_API_KEY || 're_RF8xePnN_8fA7E1Gz8e3yS1';
  console.log(`[Email Notification] Triggering email using Resend API Key: ${apiKey}`);
  console.log(`[Email Notification] To: ${to}\nSubject: ${subject}\nBody Preview: ${htmlBody.substring(0, 150)}...`);

  // Log in Audit Logs
  try {
    const user = await getCurrentUser();
    await supabase.from('audit_logs').insert({
      actor_id: user ? user.id : null,
      action: 'send_email',
      table_name: 'notifications',
      details: { to, subject, body_preview: htmlBody.substring(0, 150) }
    });
  } catch(e) {
    console.warn('Failed to insert audit log for email:', e);
  }

  return { success: true, message: 'Email sent successfully via Resend API Mock' };
}

// ── Cloudinary / Supabase Storage Upload Helper ──
async function uploadMediaFile(file, bucketName = 'product-images') {
  const cloudinaryCloudName = localStorage.getItem('setting-cloudinary-name') || window.ENV?.CLOUDINARY_CLOUD_NAME;
  
  if (cloudinaryCloudName) {
    console.log(`[Upload Helper] Uploading to Cloudinary (Cloud Name: ${cloudinaryCloudName}) using unsigned preset...`);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'prajapati_preset'); // Standard unsigned preset

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Upload Helper] Cloudinary upload success:', data.secure_url);
        return { publicUrl: data.secure_url };
      } else {
        throw new Error('Cloudinary response was not OK');
      }
    } catch (e) {
      console.warn('[Upload Helper] Cloudinary upload failed, falling back to Supabase Storage:', e);
    }
  }

  // Fallback to Supabase Storage
  console.log(`[Upload Helper] Uploading to Supabase Storage bucket: ${bucketName}...`);
  const ext = file.name.split('.').pop();
  const filePath = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
  
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, { cacheControl: '3600', upsert: true });

  if (error) {
    throw error;
  }

  const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
  console.log('[Upload Helper] Supabase upload success:', urlData.publicUrl);
  return { publicUrl: urlData.publicUrl };
}
