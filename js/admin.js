/* ============================================
   PRAJAPATI ELECTRICAL — Admin Panel Logic
   ============================================ */

// Service role client for admin operations
const SUPABASE_SERVICE_KEY = window.ENV?.SUPABASE_SERVICE_ROLE_KEY || window.ENV?.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkc2ltdXNza2puYXl6c2d5ZmdjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDgwMzMyMSwiZXhwIjoyMDk2Mzc5MzIxfQ.tdwKruLJuJU7W-QYRao0v4yvT-MY395D3Kjv2tW7FI8';
const adminClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

document.addEventListener('DOMContentLoaded', async () => {

  // ── Auth Guard — Must be admin ──
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = 'auth.html';
    return;
  }

  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') {
    window.location.href = 'dashboard.html';
    return;
  }

  document.getElementById('admin-name').textContent = profile.full_name || user.email;

  // ── Toast ──
  function showToast(message, type = 'success') {
    const toast = document.getElementById('admin-toast');
    const text = document.getElementById('admin-toast-text');
    const icon = toast.querySelector('i');
    text.textContent = message;
    toast.className = `admin-toast show ${type}`;
    icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
    setTimeout(() => toast.classList.remove('show'), 3500);
  }

  // ── Sidebar Navigation ──
  const navItems = document.querySelectorAll('.admin-nav-item[data-panel]');
  const panels = document.querySelectorAll('.admin-panel');
  const topbarTitle = document.getElementById('topbar-title');

  const panelTitles = {
    dashboard: 'Dashboard',
    products: 'Products',
    categories: 'Categories',
    bookings: 'Bookings',
    services: 'Services',
    users: 'Users'
  };

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const target = item.dataset.panel;
      navItems.forEach(n => n.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      item.classList.add('active');
      document.getElementById(`panel-${target}`).classList.add('active');
      topbarTitle.textContent = panelTitles[target] || 'Admin';
      closeMobileSidebar();
    });
  });

  // ── Mobile Sidebar ──
  const sidebar = document.getElementById('admin-sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const mobileBtn = document.getElementById('mobile-menu-btn');

  function closeMobileSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
  }

  if (mobileBtn) {
    mobileBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('show');
    });
  }

  if (overlay) overlay.addEventListener('click', closeMobileSidebar);

  // ── Logout ──
  document.getElementById('admin-logout').addEventListener('click', signOut);

  // ══════════════════════════════════════
  // DASHBOARD STATS
  // ══════════════════════════════════════
  async function loadStats() {
    const [products, bookings, users, services] = await Promise.all([
      adminClient.from('products').select('id', { count: 'exact', head: true }),
      adminClient.from('bookings').select('id', { count: 'exact', head: true }),
      adminClient.from('profiles').select('id', { count: 'exact', head: true }),
      adminClient.from('services').select('id', { count: 'exact', head: true })
    ]);

    document.getElementById('stat-products').textContent = products.count || 0;
    document.getElementById('stat-bookings').textContent = bookings.count || 0;
    document.getElementById('stat-users').textContent = users.count || 0;
    document.getElementById('stat-services').textContent = services.count || 0;
  }

  async function loadRecentBookings() {
    const { data, error } = await adminClient
      .from('bookings')
      .select('*, services(name), profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) return;

    const tbody = document.getElementById('recent-bookings-body');
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:rgba(255,255,255,0.3);padding:30px;">No bookings yet</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(b => `
      <tr>
        <td>${b.profiles?.full_name || 'Unknown'}</td>
        <td>${b.services?.name || 'Service'}</td>
        <td>${b.preferred_date ? formatDate(b.preferred_date) : formatDate(b.created_at)}</td>
        <td><span class="status-badge ${getStatusBadgeClass(b.status)}">${getStatusLabel(b.status)}</span></td>
      </tr>
    `).join('');
  }

  await loadStats();
  await loadRecentBookings();

  // ══════════════════════════════════════
  // PRODUCTS MANAGEMENT
  // ══════════════════════════════════════
  let categoriesList = [];

  async function loadCategoriesForSelect() {
    const { data } = await adminClient.from('categories').select('*').order('sort_order');
    categoriesList = data || [];
    const select = document.getElementById('product-category');
    select.innerHTML = '<option value="">-- Select --</option>';
    categoriesList.forEach(c => {
      select.innerHTML += `<option value="${c.id}">${c.name}</option>`;
    });
  }

  async function loadProducts() {
    const { data, error } = await adminClient
      .from('products')
      .select('*, categories(name)')
      .order('sort_order');

    if (error) { console.error(error); return; }

    const tbody = document.getElementById('products-table-body');
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7"><div class="admin-empty"><i class="fas fa-box-open"></i><p>No products yet. Add your first product!</p></div></td></tr>';
      return;
    }

    tbody.innerHTML = data.map(p => `
      <tr>
        <td>
          ${p.image_url
            ? `<img src="${p.image_url}" alt="${p.name}" class="product-thumb">`
            : `<div class="product-thumb-placeholder"><i class="fas fa-image"></i></div>`
          }
        </td>
        <td><strong>${p.name}</strong>${p.brand ? `<br><small style="color:rgba(255,255,255,0.4)">${p.brand}</small>` : ''}</td>
        <td>${p.categories?.name || '-'}</td>
        <td>${p.price > 0 ? formatPrice(p.price) : '-'}${p.mrp > p.price ? `<br><small style="text-decoration:line-through;color:rgba(255,255,255,0.3)">${formatPrice(p.mrp)}</small>` : ''}</td>
        <td><span class="status-badge ${p.in_stock ? 'badge-success' : 'badge-danger'}">${p.in_stock ? 'In Stock' : 'Out'}</span></td>
        <td>${p.featured ? '<i class="fas fa-star" style="color:#fbbf24;"></i>' : '-'}</td>
        <td>
          <div class="table-actions">
            <button class="btn-edit" onclick="editProduct(${p.id})"><i class="fas fa-pen"></i></button>
            <button class="btn-delete" onclick="deleteProduct(${p.id}, '${p.name.replace(/'/g, "\\'")}')"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  await loadCategoriesForSelect();
  await loadProducts();

  // Product Modal
  window.openProductModal = function(title = 'Add Product') {
    document.getElementById('product-modal-title').textContent = title;
    document.getElementById('product-modal').classList.add('open');
  };

  window.closeProductModal = function() {
    document.getElementById('product-modal').classList.remove('open');
    document.getElementById('product-form').reset();
    document.getElementById('product-edit-id').value = '';
    document.getElementById('product-image-preview').classList.remove('show');
  };

  document.getElementById('btn-add-product').addEventListener('click', () => {
    openProductModal('Add Product');
  });

  // Image preview
  document.getElementById('product-image').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const preview = document.getElementById('product-image-preview');
        preview.src = ev.target.result;
        preview.classList.add('show');
      };
      reader.readAsDataURL(file);
    }
  });

  // Edit Product
  window.editProduct = async function(id) {
    const { data: product, error } = await adminClient
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !product) { showToast('Failed to load product.', 'error'); return; }

    document.getElementById('product-edit-id').value = product.id;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-price').value = product.price || '';
    document.getElementById('product-mrp').value = product.mrp || '';
    document.getElementById('product-category').value = product.category_id || '';
    document.getElementById('product-brand').value = product.brand || '';
    document.getElementById('product-desc').value = product.description || '';
    document.getElementById('product-in-stock').checked = product.in_stock;
    document.getElementById('product-featured').checked = product.featured;

    if (product.image_url) {
      const preview = document.getElementById('product-image-preview');
      preview.src = product.image_url;
      preview.classList.add('show');
    }

    openProductModal('Edit Product');
  };

  // Delete Product
  window.deleteProduct = async function(id, name) {
    if (!confirm(`Delete product "${name}"? This cannot be undone.`)) return;
    const { error } = await adminClient.from('products').delete().eq('id', id);
    if (error) { showToast('Failed to delete product.', 'error'); }
    else { showToast('Product deleted.'); await loadProducts(); await loadStats(); }
  };

  // Save Product
  document.getElementById('product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('product-save-btn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const editId = document.getElementById('product-edit-id').value;
    const fileInput = document.getElementById('product-image');
    let imageUrl = '';

    // Upload image if selected
    if (fileInput.files[0]) {
      const file = fileInput.files[0];
      const ext = file.name.split('.').pop();
      const fileName = `product_${Date.now()}.${ext}`;

      const { data: uploadData, error: uploadError } = await adminClient.storage
        .from('product-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (uploadError) {
        showToast('Image upload failed: ' + uploadError.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Save Product';
        return;
      }

      const { data: urlData } = adminClient.storage.from('product-images').getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
    }

    const productData = {
      name: document.getElementById('product-name').value.trim(),
      price: parseFloat(document.getElementById('product-price').value) || 0,
      mrp: parseFloat(document.getElementById('product-mrp').value) || 0,
      category_id: document.getElementById('product-category').value || null,
      brand: document.getElementById('product-brand').value.trim(),
      description: document.getElementById('product-desc').value.trim(),
      in_stock: document.getElementById('product-in-stock').checked,
      featured: document.getElementById('product-featured').checked,
    };

    if (imageUrl) productData.image_url = imageUrl;

    let error;
    if (editId) {
      ({ error } = await adminClient.from('products').update(productData).eq('id', editId));
    } else {
      ({ error } = await adminClient.from('products').insert(productData));
    }

    if (error) {
      showToast('Failed to save product: ' + error.message, 'error');
    } else {
      showToast(editId ? 'Product updated!' : 'Product added!');
      closeProductModal();
      await loadProducts();
      await loadStats();
    }

    btn.disabled = false;
    btn.textContent = 'Save Product';
  });

  // ══════════════════════════════════════
  // CATEGORIES MANAGEMENT
  // ══════════════════════════════════════
  async function loadCategories() {
    const { data, error } = await adminClient.from('categories').select('*').order('sort_order');
    if (error) return;

    const tbody = document.getElementById('categories-table-body');
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5"><div class="admin-empty"><i class="fas fa-tags"></i><p>No categories.</p></div></td></tr>';
      return;
    }

    tbody.innerHTML = data.map(c => `
      <tr>
        <td><i class="${c.icon}" style="font-size:1.2rem;color:#FF8C38;"></i></td>
        <td><strong>${c.name}</strong></td>
        <td style="color:rgba(255,255,255,0.5);">${c.description || '-'}</td>
        <td>${c.sort_order}</td>
        <td>
          <div class="table-actions">
            <button class="btn-edit" onclick="editCategory(${c.id})"><i class="fas fa-pen"></i></button>
            <button class="btn-delete" onclick="deleteCategory(${c.id}, '${c.name.replace(/'/g, "\\'")}')"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  await loadCategories();

  window.openCategoryModal = function(title = 'Add Category') {
    document.getElementById('category-modal-title').textContent = title;
    document.getElementById('category-modal').classList.add('open');
  };

  window.closeCategoryModal = function() {
    document.getElementById('category-modal').classList.remove('open');
    document.getElementById('category-form').reset();
    document.getElementById('category-edit-id').value = '';
  };

  document.getElementById('btn-add-category').addEventListener('click', () => {
    openCategoryModal('Add Category');
  });

  window.editCategory = async function(id) {
    const { data: cat, error } = await adminClient.from('categories').select('*').eq('id', id).single();
    if (error || !cat) { showToast('Failed to load category.', 'error'); return; }

    document.getElementById('category-edit-id').value = cat.id;
    document.getElementById('category-name').value = cat.name;
    document.getElementById('category-icon').value = cat.icon || '';
    document.getElementById('category-sort').value = cat.sort_order || 0;
    document.getElementById('category-desc').value = cat.description || '';
    openCategoryModal('Edit Category');
  };

  window.deleteCategory = async function(id, name) {
    if (!confirm(`Delete category "${name}"?`)) return;
    const { error } = await adminClient.from('categories').delete().eq('id', id);
    if (error) { showToast('Failed to delete.', 'error'); }
    else { showToast('Category deleted.'); await loadCategories(); await loadCategoriesForSelect(); }
  };

  document.getElementById('category-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('category-edit-id').value;
    const catData = {
      name: document.getElementById('category-name').value.trim(),
      icon: document.getElementById('category-icon').value.trim() || 'fas fa-tag',
      sort_order: parseInt(document.getElementById('category-sort').value) || 0,
      description: document.getElementById('category-desc').value.trim()
    };

    let error;
    if (editId) {
      ({ error } = await adminClient.from('categories').update(catData).eq('id', editId));
    } else {
      ({ error } = await adminClient.from('categories').insert(catData));
    }

    if (error) { showToast('Failed to save: ' + error.message, 'error'); }
    else {
      showToast(editId ? 'Category updated!' : 'Category added!');
      closeCategoryModal();
      await loadCategories();
      await loadCategoriesForSelect();
    }
  });

  // ══════════════════════════════════════
  // BOOKINGS MANAGEMENT
  // ══════════════════════════════════════
  async function loadBookings() {
    const { data, error } = await adminClient
      .from('bookings')
      .select('*, services(name), profiles(full_name, phone)')
      .order('created_at', { ascending: false });

    if (error) return;

    const tbody = document.getElementById('bookings-table-body');
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8"><div class="admin-empty"><i class="fas fa-calendar-xmark"></i><p>No bookings yet.</p></div></td></tr>';
      return;
    }

    tbody.innerHTML = data.map(b => `
      <tr>
        <td><strong>${b.profiles?.full_name || 'Unknown'}</strong></td>
        <td>${b.phone || b.profiles?.phone || '-'}</td>
        <td>${b.services?.name || '-'}</td>
        <td>${b.preferred_date ? formatDate(b.preferred_date) : '-'}${b.preferred_time ? '<br><small>' + b.preferred_time + '</small>' : ''}</td>
        <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${(b.description || '').replace(/"/g, '&quot;')}">${b.description || '-'}</td>
        <td>
          <select class="status-select" onchange="updateBookingStatus(${b.id}, this.value)" data-current="${b.status}">
            <option value="pending" ${b.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="confirmed" ${b.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="in_progress" ${b.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
            <option value="completed" ${b.status === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="cancelled" ${b.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td>
          <input type="text" class="status-select" style="width:120px;" value="${b.admin_notes || ''}" placeholder="Add notes..." onchange="updateBookingNotes(${b.id}, this.value)">
        </td>
        <td>
          <small style="color:rgba(255,255,255,0.3);">${formatDateTime(b.created_at)}</small>
        </td>
      </tr>
    `).join('');
  }

  await loadBookings();

  window.updateBookingStatus = async function(id, status) {
    const { error } = await adminClient.from('bookings').update({ status }).eq('id', id);
    if (error) { showToast('Failed to update.', 'error'); }
    else { showToast('Booking status updated!'); await loadRecentBookings(); }
  };

  window.updateBookingNotes = async function(id, notes) {
    const { error } = await adminClient.from('bookings').update({ admin_notes: notes }).eq('id', id);
    if (error) { showToast('Failed to save notes.', 'error'); }
    else { showToast('Notes saved!'); }
  };

  // ══════════════════════════════════════
  // SERVICES MANAGEMENT
  // ══════════════════════════════════════
  async function loadServices() {
    const { data, error } = await adminClient.from('services').select('*').order('sort_order');
    if (error) return;

    const tbody = document.getElementById('services-table-body');
    tbody.innerHTML = data.map(s => `
      <tr>
        <td><i class="${s.icon}" style="font-size:1.2rem;color:#FF8C38;"></i></td>
        <td><strong>${s.name}</strong></td>
        <td>${s.price_range || '-'}</td>
        <td><span class="status-badge ${s.is_active ? 'badge-success' : 'badge-danger'}">${s.is_active ? 'Active' : 'Inactive'}</span></td>
        <td>
          <button class="btn-edit" onclick="toggleService(${s.id}, ${!s.is_active})">
            <i class="fas ${s.is_active ? 'fa-eye-slash' : 'fa-eye'}"></i> ${s.is_active ? 'Disable' : 'Enable'}
          </button>
        </td>
      </tr>
    `).join('');
  }

  await loadServices();

  window.toggleService = async function(id, active) {
    const { error } = await adminClient.from('services').update({ is_active: active }).eq('id', id);
    if (error) { showToast('Failed to update.', 'error'); }
    else { showToast(`Service ${active ? 'enabled' : 'disabled'}.`); await loadServices(); await loadStats(); }
  };

  // ══════════════════════════════════════
  // USERS LIST
  // ══════════════════════════════════════
  async function loadUsers() {
    const { data, error } = await adminClient
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return;

    const tbody = document.getElementById('users-table-body');
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4"><div class="admin-empty"><i class="fas fa-users"></i><p>No users.</p></div></td></tr>';
      return;
    }

    tbody.innerHTML = data.map(u => `
      <tr>
        <td><strong>${u.full_name || 'No Name'}</strong></td>
        <td>${u.phone || '-'}</td>
        <td><span class="status-badge ${u.role === 'admin' ? 'badge-primary' : 'badge-info'}">${u.role}</span></td>
        <td style="color:rgba(255,255,255,0.4);">${formatDate(u.created_at)}</td>
      </tr>
    `).join('');
  }

  await loadUsers();

  // ── Close modals on overlay click ──
  document.querySelectorAll('.admin-modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('open');
      }
    });
  });
});
