/* ============================================
   PRAJAPATI ELECTRICAL — Dashboard Logic
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {

  // ── Auth Guard ──
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = 'auth.html?msg=login_required';
    return;
  }

  // ── Load Profile ──
  const profile = await getCurrentProfile();
  if (!profile) {
    window.location.href = 'auth.html';
    return;
  }

  // If admin, redirect to admin panel
  if (profile.role === 'admin') {
    window.location.href = 'admin.html';
    return;
  }

  // ── Populate UI ──
  const displayName = profile.full_name || user.email.split('@')[0];
  document.getElementById('welcome-heading').textContent = `Welcome, ${displayName}!`;
  document.getElementById('user-display-name').textContent = displayName;
  document.getElementById('user-avatar').textContent = displayName.charAt(0).toUpperCase();

  // Populate profile form
  document.getElementById('profile-name').value = profile.full_name || '';
  document.getElementById('profile-email').value = user.email;
  document.getElementById('profile-phone').value = profile.phone || '';
  document.getElementById('profile-address').value = profile.address || '';

  // Pre-fill booking phone and address
  document.getElementById('booking-phone').value = profile.phone || '';
  document.getElementById('booking-address').value = profile.address || '';

  // Set min date for booking
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('booking-date').setAttribute('min', today);
  document.getElementById('booking-date').value = today;

  // ── Logout ──
  document.getElementById('logout-btn').addEventListener('click', signOut);

  // ── Tab Switching ──
  const tabs = document.querySelectorAll('.dash-tab');
  const panels = document.querySelectorAll('.dash-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.panel;
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`panel-${target}`).classList.add('active');
    });
  });

  // Check URL params for tab
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  if (tabParam) {
    const targetTab = document.querySelector(`.dash-tab[data-panel="${tabParam}"]`);
    if (targetTab) targetTab.click();
  }

  // ── Toast ──
  function showToast(message, type = 'success') {
    const toast = document.getElementById('dash-toast');
    const toastText = document.getElementById('toast-text');
    const icon = toast.querySelector('i');

    toastText.textContent = message;
    toast.className = `dash-toast show ${type}`;
    icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  }

  // ══════════════════════════════════════
  // PROFILE
  // ══════════════════════════════════════
  document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('save-profile-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    const updates = {
      full_name: document.getElementById('profile-name').value.trim(),
      phone: document.getElementById('profile-phone').value.trim(),
      address: document.getElementById('profile-address').value.trim(),
    };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      showToast('Failed to update profile: ' + error.message, 'error');
    } else {
      showToast('Profile updated successfully!');
      document.getElementById('user-display-name').textContent = updates.full_name;
      document.getElementById('user-avatar').textContent = updates.full_name.charAt(0).toUpperCase();
    }

    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
  });

  // ══════════════════════════════════════
  // LOAD SERVICES (for booking form)
  // ══════════════════════════════════════
  async function loadServices() {
    const { data: services, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      console.error('Error loading services:', error);
      return;
    }

    const select = document.getElementById('booking-service');
    services.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.name}${s.price_range ? ' (' + s.price_range + ')' : ''}`;
      select.appendChild(opt);
    });

    // Check URL params for pre-selected service
    const serviceParam = urlParams.get('service');
    if (serviceParam) {
      select.value = serviceParam;
    }
  }

  await loadServices();

  // ══════════════════════════════════════
  // SUBMIT BOOKING
  // ══════════════════════════════════════
  document.getElementById('booking-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submit-booking-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

    const serviceId = document.getElementById('booking-service').value;
    const date = document.getElementById('booking-date').value;
    const time = document.getElementById('booking-time').value;
    const phone = document.getElementById('booking-phone').value.trim();
    const address = document.getElementById('booking-address').value.trim();
    const desc = document.getElementById('booking-desc').value.trim();

    if (!serviceId) {
      showToast('Please select a service.', 'error');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Booking';
      return;
    }

    const { error } = await supabase
      .from('bookings')
      .insert({
        user_id: user.id,
        service_id: parseInt(serviceId),
        preferred_date: date || null,
        preferred_time: time || '',
        phone: phone,
        address: address,
        description: desc
      });

    if (error) {
      showToast('Failed to submit booking: ' + error.message, 'error');
    } else {
      showToast('Booking submitted successfully! We will contact you soon.');
      document.getElementById('booking-form').reset();
      document.getElementById('booking-phone').value = profile.phone || '';
      document.getElementById('booking-address').value = profile.address || '';
      document.getElementById('booking-date').value = today;
      await loadBookings();
      // Switch to bookings tab
      document.querySelector('.dash-tab[data-panel="bookings"]').click();
    }

    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Booking';
  });

  // ══════════════════════════════════════
  // LOAD BOOKINGS
  // ══════════════════════════════════════
  async function loadBookings() {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*, services(name, icon)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading bookings:', error);
      return;
    }

    const list = document.getElementById('bookings-list');
    const empty = document.getElementById('bookings-empty');
    const badge = document.getElementById('bookings-count');

    badge.textContent = bookings.length;

    if (bookings.length === 0) {
      list.innerHTML = '';
      list.appendChild(empty);
      empty.style.display = 'block';
      return;
    }

    list.innerHTML = bookings.map(b => `
      <div class="booking-item">
        <div class="booking-info">
          <h4><i class="${b.services?.icon || 'fas fa-bolt'}" style="color:#FF6B00;margin-right:8px;"></i>${b.services?.name || 'Service'}</h4>
          <p>${b.description || 'No description provided'}</p>
          ${b.preferred_date ? `<p style="margin-top:4px;"><i class="fas fa-calendar" style="margin-right:6px;"></i>${formatDate(b.preferred_date)}${b.preferred_time ? ' • ' + b.preferred_time : ''}</p>` : ''}
          ${b.address ? `<p><i class="fas fa-map-marker-alt" style="margin-right:6px;"></i>${b.address}</p>` : ''}
          ${b.admin_notes ? `<p style="color:#60a5fa;margin-top:4px;"><i class="fas fa-comment" style="margin-right:6px;"></i>${b.admin_notes}</p>` : ''}
        </div>
        <div class="booking-meta">
          <div class="booking-date">
            ${formatDateTime(b.created_at)}
          </div>
          <span class="status-badge ${getStatusBadgeClass(b.status)}">${getStatusLabel(b.status)}</span>
          ${b.status === 'pending' ? `<button class="btn-cancel-booking" data-id="${b.id}" title="Cancel this booking"><i class="fas fa-times"></i></button>` : ''}
        </div>
      </div>
    `).join('');

    // Cancel booking handlers
    list.querySelectorAll('.btn-cancel-booking').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to cancel this booking?')) return;
        const id = btn.dataset.id;
        const { error } = await supabase
          .from('bookings')
          .update({ status: 'cancelled' })
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          showToast('Failed to cancel booking.', 'error');
        } else {
          showToast('Booking cancelled.');
          await loadBookings();
        }
      });
    });
  }

  await loadBookings();

  // ══════════════════════════════════════
  // LOAD PRODUCTS
  // ══════════════════════════════════════
  let allProducts = [];
  let allCategories = [];

  async function loadCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');

    if (error) {
      console.error('Error loading categories:', error);
      return;
    }

    allCategories = data;
    const select = document.getElementById('product-category-filter');
    data.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      select.appendChild(opt);
    });
  }

  async function loadProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .order('sort_order');

    if (error) {
      console.error('Error loading products:', error);
      return;
    }

    allProducts = data;
    renderProducts(data);
  }

  function renderProducts(products) {
    const grid = document.getElementById('products-grid');
    const empty = document.getElementById('products-empty');

    if (products.length === 0) {
      grid.innerHTML = '';
      grid.appendChild(empty);
      empty.style.display = 'block';
      return;
    }

    grid.innerHTML = products.map(p => `
      <div class="dash-product-card">
        ${p.image_url
          ? `<img class="dash-product-img" src="${p.image_url}" alt="${p.name}" loading="lazy">`
          : `<div class="dash-product-img" style="display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.15);font-size:2.5rem;"><i class="fas fa-image"></i></div>`
        }
        <div class="dash-product-body">
          <h4>${p.name}</h4>
          <p class="product-brand">${p.brand || p.categories?.name || ''}</p>
          ${p.price > 0
            ? `<div><span class="product-price">${formatPrice(p.price)}</span>${p.mrp > p.price ? `<span class="product-mrp">${formatPrice(p.mrp)}</span>` : ''}</div>`
            : `<span class="product-price">Contact for Price</span>`
          }
          <div class="product-stock ${p.in_stock ? 'in-stock' : 'out-of-stock'}">
            <i class="fas ${p.in_stock ? 'fa-check-circle' : 'fa-times-circle'}"></i>
            ${p.in_stock ? 'In Stock' : 'Out of Stock'}
          </div>
          <a href="https://wa.me/917250191427?text=Hi!%20I'm%20interested%20in%20${encodeURIComponent(p.name)}" target="_blank" rel="noopener" class="product-wa-btn">
            <i class="fab fa-whatsapp"></i> Enquire
          </a>
        </div>
      </div>
    `).join('');
  }

  await loadCategories();
  await loadProducts();

  // ── Product Filtering ──
  document.getElementById('product-search').addEventListener('input', filterProducts);
  document.getElementById('product-category-filter').addEventListener('change', filterProducts);

  function filterProducts() {
    const search = document.getElementById('product-search').value.toLowerCase();
    const catId = document.getElementById('product-category-filter').value;

    let filtered = allProducts;

    if (search) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(search) ||
        (p.brand && p.brand.toLowerCase().includes(search)) ||
        (p.description && p.description.toLowerCase().includes(search))
      );
    }

    if (catId) {
      filtered = filtered.filter(p => p.category_id == catId);
    }

    renderProducts(filtered);
  }
});
