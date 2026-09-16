/* ============================================
   PRAJAPATI ELECTRICAL — Admin Panel Logic
   ============================================ */

// Redefined to use standard authenticated client instead of leaking service_role key client-side.
// Row Level Security (RLS) policies permit authenticated administrators to perform these actions securely.
const adminClient = supabase;

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
    users: 'User Roles',
    leads: 'Lead Pipeline',
    careers: 'Careers Board',
    support: 'Support Queue',
    finance: 'Transactions',
    settings: 'Systems Settings'
  };

  navItems.forEach(item => {
    item.addEventListener('click', async () => {
      const target = item.dataset.panel;
      navItems.forEach(n => n.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      item.classList.add('active');
      const panelEl = document.getElementById(`panel-${target}`);
      if (panelEl) panelEl.classList.add('active');
      topbarTitle.textContent = panelTitles[target] || 'Admin';
      closeMobileSidebar();

      // Dynamically reload panel data on click
      if (target === 'dashboard') {
        await loadStats();
        await loadRecentBookings();
      } else if (target === 'products') {
        await loadProducts();
      } else if (target === 'categories') {
        await loadCategories();
      } else if (target === 'bookings') {
        await loadBookings();
      } else if (target === 'services') {
        await loadServices();
      } else if (target === 'users') {
        await loadUsers();
      } else if (target === 'leads') {
        await loadLeads();
      } else if (target === 'careers') {
        await loadCareers();
        await loadApplicants();
      } else if (target === 'support') {
        await loadSupportTickets();
      } else if (target === 'finance') {
        await loadFinanceTransactions();
      } else if (target === 'settings') {
        loadSettings();
      }
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
      try {
        const file = fileInput.files[0];
        const res = await uploadMediaFile(file, 'product-images');
        imageUrl = res.publicUrl;
      } catch (uploadError) {
        showToast('Image upload failed: ' + uploadError.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Save Product';
        return;
      }
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
          <div class="table-actions" style="justify-content: flex-start;">
            <button class="btn-edit" onclick="editService(${s.id})" title="Edit"><i class="fas fa-pen"></i></button>
            <button class="btn-delete" onclick="deleteService(${s.id}, '${s.name.replace(/'/g, "\\'")}')" title="Delete"><i class="fas fa-trash"></i></button>
            <button class="btn-edit" onclick="toggleService(${s.id}, ${!s.is_active})" title="${s.is_active ? 'Disable' : 'Enable'}">
              <i class="fas ${s.is_active ? 'fa-eye-slash' : 'fa-eye'}"></i>
            </button>
          </div>
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

  window.openServiceModal = function(title = 'Add Service') {
    document.getElementById('service-modal-title').textContent = title;
    document.getElementById('service-modal').classList.add('open');
  };

  window.closeServiceModal = function() {
    document.getElementById('service-modal').classList.remove('open');
    document.getElementById('service-form').reset();
    document.getElementById('service-edit-id').value = '';
  };

  document.getElementById('btn-add-service').addEventListener('click', () => {
    openServiceModal('Add Service');
  });

  window.editService = async function(id) {
    const { data: srv, error } = await adminClient.from('services').select('*').eq('id', id).single();
    if (error || !srv) { showToast('Failed to load service.', 'error'); return; }

    document.getElementById('service-edit-id').value = srv.id;
    document.getElementById('service-name').value = srv.name;
    document.getElementById('service-desc').value = srv.description || '';
    document.getElementById('service-price').value = srv.price_range || '';
    document.getElementById('service-icon').value = srv.icon || 'fas fa-bolt';
    document.getElementById('service-sort').value = srv.sort_order || 0;
    document.getElementById('service-active').checked = srv.is_active;
    
    openServiceModal('Edit Service');
  };

  window.deleteService = async function(id, name) {
    if (!confirm(`Delete service "${name}"?`)) return;
    const { error } = await adminClient.from('services').delete().eq('id', id);
    if (error) { showToast('Failed to delete.', 'error'); }
    else { showToast('Service deleted.'); await loadServices(); await loadStats(); }
  };

  document.getElementById('service-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('service-save-btn');
    btn.disabled = true;
    
    const editId = document.getElementById('service-edit-id').value;
    const srvData = {
      name: document.getElementById('service-name').value.trim(),
      description: document.getElementById('service-desc').value.trim(),
      price_range: document.getElementById('service-price').value.trim(),
      icon: document.getElementById('service-icon').value.trim() || 'fas fa-bolt',
      sort_order: parseInt(document.getElementById('service-sort').value) || 0,
      is_active: document.getElementById('service-active').checked
    };

    let error;
    if (editId) {
      ({ error } = await adminClient.from('services').update(srvData).eq('id', editId));
    } else {
      ({ error } = await adminClient.from('services').insert(srvData));
    }

    if (error) { showToast('Failed to save: ' + error.message, 'error'); }
    else {
      showToast(editId ? 'Service updated!' : 'Service added!');
      closeServiceModal();
      await loadServices();
      await loadStats();
    }
    btn.disabled = false;
  });

  // ══════════════════════════════════════
  // USERS LIST & ROLE MANAGEMENT
  // ══════════════════════════════════════
  let employeesList = [];

  async function loadEmployees() {
    const { data, error } = await adminClient
      .from('profiles')
      .select('id, full_name, role')
      .in('role', ['employee', 'manager', 'admin', 'owner', 'super_admin']);
    if (!error) {
      employeesList = data || [];
    }
  }

  window.updateUserRole = async function(id, role) {
    const { error } = await adminClient.from('profiles').update({ role }).eq('id', id);
    if (error) {
      showToast('Failed to update user role: ' + error.message, 'error');
    } else {
      showToast('User role updated!');
      await loadUsers();
      await loadEmployees();
      await loadStats();
    }
  };

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

    const roles = [
      'super_admin', 'admin', 'owner', 'manager', 'employee', 
      'customer', 'distributor', 'dealer', 'retailer', 
      'franchise_partner', 'vendor'
    ];

    tbody.innerHTML = data.map(u => {
      const options = roles.map(r => `
        <option value="${r}" ${u.role === r ? 'selected' : ''}>${r}</option>
      `).join('');

      return `
        <tr>
          <td><strong>${u.full_name || 'No Name'}</strong></td>
          <td>${u.phone || '-'}</td>
          <td>
            <select class="status-select-inline" onchange="updateUserRole('${u.id}', this.value)">
              ${options}
            </select>
          </td>
          <td style="color:rgba(255,255,255,0.4);">${formatDate(u.created_at)}</td>
        </tr>
      `;
    }).join('');
  }

  // ══════════════════════════════════════
  // LEADS MANAGEMENT
  // ══════════════════════════════════════
  window.assignLead = async function(leadId, employeeId) {
    const val = employeeId === '' ? null : employeeId;
    const { error } = await adminClient.from('leads').update({ assigned_employee_id: val, status: val ? 'assigned' : 'new' }).eq('id', leadId);
    if (error) {
      showToast('Failed to assign lead: ' + error.message, 'error');
    } else {
      showToast('Lead assigned successfully!');
      await loadLeads();
    }
  };

  window.updateLeadStatus = async function(leadId, status) {
    const { error } = await adminClient.from('leads').update({ status }).eq('id', leadId);
    if (error) {
      showToast('Failed to update lead status: ' + error.message, 'error');
    } else {
      showToast('Lead status updated!');
      await loadLeads();
    }
  };

  async function loadLeads() {
    const { data, error } = await adminClient
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return;

    const tbody = document.getElementById('leads-table-body');
    if (!tbody) return;
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8"><div class="admin-empty"><i class="fas fa-filter"></i><p>No leads yet.</p></div></td></tr>';
      return;
    }

    tbody.innerHTML = data.map(l => {
      const empOptions = employeesList.map(e => `
        <option value="${e.id}" ${l.assigned_employee_id === e.id ? 'selected' : ''}>${e.full_name || 'Staff'}</option>
      `).join('');

      return `
        <tr>
          <td><strong>${l.name}</strong></td>
          <td>${l.phone}</td>
          <td>${l.email || '-'}</td>
          <td><span class="status-badge badge-info">${l.source}</span></td>
          <td>${l.territory || '-'}</td>
          <td style="max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${(l.details || '').replace(/"/g, '&quot;')}">${l.details || '-'}</td>
          <td>
            <select class="status-select-inline" onchange="assignLead(${l.id}, this.value)">
              <option value="">-- Unassigned --</option>
              ${empOptions}
            </select>
          </td>
          <td>
            <select class="status-select-inline" onchange="updateLeadStatus(${l.id}, this.value)">
              <option value="new" ${l.status === 'new' ? 'selected' : ''}>New</option>
              <option value="contacted" ${l.status === 'contacted' ? 'selected' : ''}>Contacted</option>
              <option value="qualified" ${l.status === 'qualified' ? 'selected' : ''}>Qualified</option>
              <option value="assigned" ${l.status === 'assigned' ? 'selected' : ''}>Assigned</option>
              <option value="closed_won" ${l.status === 'closed_won' ? 'selected' : ''}>Closed Won</option>
              <option value="closed_lost" ${l.status === 'closed_lost' ? 'selected' : ''}>Closed Lost</option>
            </select>
          </td>
        </tr>
      `;
    }).join('');
  }

  // ══════════════════════════════════════
  // CAREERS BOARD
  // ══════════════════════════════════════
  window.openJobModal = function() {
    document.getElementById('job-modal').classList.add('open');
  };

  window.toggleJobStatus = async function(id, isActive) {
    const { error } = await adminClient.from('careers').update({ is_active: isActive }).eq('id', id);
    if (error) {
      showToast('Failed to update job status.', 'error');
    } else {
      showToast('Job status updated!');
      await loadCareers();
    }
  };

  window.deleteJob = async function(id) {
    if (!confirm('Delete this job opening?')) return;
    const { error } = await adminClient.from('careers').delete().eq('id', id);
    if (error) {
      showToast('Failed to delete job.', 'error');
    } else {
      showToast('Job opening deleted.');
      await loadCareers();
    }
  };

  window.updateApplicationStatus = async function(id, status) {
    const { error } = await adminClient.from('applications').update({ status }).eq('id', id);
    if (error) {
      showToast('Failed to update application status: ' + error.message, 'error');
    } else {
      showToast('Application status updated!');
      await loadApplicants();
    }
  };

  async function loadCareers() {
    const { data, error } = await adminClient
      .from('careers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return;

    const tbody = document.getElementById('jobs-table-body');
    if (!tbody) return;
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4"><div class="admin-empty"><i class="fas fa-briefcase"></i><p>No job openings.</p></div></td></tr>';
      return;
    }

    tbody.innerHTML = data.map(j => `
      <tr>
        <td><strong>${j.title}</strong></td>
        <td>${j.location || '-'}</td>
        <td>
          <button class="btn-edit" onclick="toggleJobStatus(${j.id}, ${!j.is_active})">
            <i class="fas ${j.is_active ? 'fa-eye-slash' : 'fa-eye'}"></i> ${j.is_active ? 'Active' : 'Inactive'}
          </button>
          <button class="btn-delete" onclick="deleteJob(${j.id})"><i class="fas fa-trash"></i></button>
        </td>
        <td style="color:rgba(255,255,255,0.4);">${formatDate(j.created_at)}</td>
      </tr>
    `).join('');
  }

  async function loadApplicants() {
    const { data, error } = await adminClient
      .from('applications')
      .select('*, careers(title)')
      .order('created_at', { ascending: false });

    if (error) return;

    const tbody = document.getElementById('applicants-table-body');
    if (!tbody) return;
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5"><div class="admin-empty"><i class="fas fa-file-invoice"></i><p>No applicants yet.</p></div></td></tr>';
      return;
    }

    tbody.innerHTML = data.map(a => `
      <tr>
        <td><strong>${a.name}</strong><br><small style="color:rgba(255,255,255,0.4)">For: ${a.careers?.title || 'Unknown Job'}</small></td>
        <td>${a.email}</td>
        <td>${a.phone}</td>
        <td>
          ${a.resume_url 
            ? `<a href="${a.resume_url}" target="_blank" class="status-badge badge-primary" style="text-decoration:none;"><i class="fas fa-download"></i> View Resume</a>`
            : '-'
          }
        </td>
        <td>
          <select class="status-select-inline" onchange="updateApplicationStatus(${a.id}, this.value)">
            <option value="applied" ${a.status === 'applied' ? 'selected' : ''}>Applied</option>
            <option value="screening" ${a.status === 'screening' ? 'selected' : ''}>Screening</option>
            <option value="interviewing" ${a.status === 'interviewing' ? 'selected' : ''}>Interviewing</option>
            <option value="offered" ${a.status === 'offered' ? 'selected' : ''}>Offered</option>
            <option value="rejected" ${a.status === 'rejected' ? 'selected' : ''}>Rejected</option>
          </select>
        </td>
      </tr>
    `).join('');
  }

  document.getElementById('job-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('job-title-inp').value.trim();
    const location = document.getElementById('job-location-inp').value.trim();
    const description = document.getElementById('job-desc-inp').value.trim();

    const { error } = await adminClient.from('careers').insert({
      title,
      location,
      description,
      is_active: true
    });

    if (error) {
      showToast('Failed to publish job opening: ' + error.message, 'error');
    } else {
      showToast('Job opening published successfully!');
      document.getElementById('job-modal').classList.remove('open');
      document.getElementById('job-form').reset();
      await loadCareers();
    }
  });

  // ══════════════════════════════════════
  // SUPPORT QUEUE
  // ══════════════════════════════════════
  window.assignTicket = async function(ticketId, employeeId) {
    const val = employeeId === '' ? null : employeeId;
    const { error } = await adminClient.from('support_tickets').update({ assigned_employee_id: val, status: val ? 'assigned' : 'open' }).eq('id', ticketId);
    if (error) {
      showToast('Failed to assign ticket: ' + error.message, 'error');
    } else {
      showToast('Ticket assigned successfully!');
      await loadSupportTickets();
    }
  };

  window.updateTicketStatus = async function(ticketId, status) {
    const { error } = await adminClient.from('support_tickets').update({ status }).eq('id', ticketId);
    if (error) {
      showToast('Failed to update ticket status: ' + error.message, 'error');
    } else {
      showToast('Ticket status updated!');
      await loadSupportTickets();
    }
  };

  async function loadSupportTickets() {
    const { data, error } = await adminClient
      .from('support_tickets')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false });

    if (error) return;

    const tbody = document.getElementById('tickets-table-body');
    if (!tbody) return;
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6"><div class="admin-empty"><i class="fas fa-ticket"></i><p>No support tickets.</p></div></td></tr>';
      return;
    }

    tbody.innerHTML = data.map(t => {
      const empOptions = employeesList.map(e => `
        <option value="${e.id}" ${t.assigned_employee_id === e.id ? 'selected' : ''}>${e.full_name || 'Staff'}</option>
      `).join('');

      return `
        <tr>
          <td>#${t.id}</td>
          <td><strong>${t.subject}</strong><br><small style="color:rgba(255,255,255,0.4)">By: ${t.profiles?.full_name || 'Customer'}</small></td>
          <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${(t.description || '').replace(/"/g, '&quot;')}">${t.description || '-'}</td>
          <td><span class="status-badge ${t.priority === 'urgent' || t.priority === 'high' ? 'badge-danger' : 'badge-info'}">${t.priority}</span></td>
          <td>
            <select class="status-select-inline" onchange="assignTicket(${t.id}, this.value)">
              <option value="">-- Unassigned --</option>
              ${empOptions}
            </select>
          </td>
          <td>
            <select class="status-select-inline" onchange="updateTicketStatus(${t.id}, this.value)">
              <option value="open" ${t.status === 'open' ? 'selected' : ''}>Open</option>
              <option value="assigned" ${t.status === 'assigned' ? 'selected' : ''}>Assigned</option>
              <option value="resolved" ${t.status === 'resolved' ? 'selected' : ''}>Resolved</option>
              <option value="closed" ${t.status === 'closed' ? 'selected' : ''}>Closed</option>
            </select>
          </td>
        </tr>
      `;
    }).join('');
  }

  // ══════════════════════════════════════
  // TRANSACTIONS
  // ══════════════════════════════════════
  async function loadFinanceTransactions() {
    const { data, error } = await adminClient
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return;

    const tbody = document.getElementById('finance-table-body');
    if (!tbody) return;
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6"><div class="admin-empty"><i class="fas fa-indian-rupee-sign"></i><p>No transactions recorded yet.</p></div></td></tr>';
      return;
    }

    tbody.innerHTML = data.map(p => `
      <tr>
        <td><code>${p.transaction_id || 'MOCK_TXN_' + p.id}</code></td>
        <td><strong>${formatPrice(p.amount)}</strong></td>
        <td><span class="status-badge badge-primary">${p.booking_id ? 'Service Booking' : p.order_id ? 'Product Order' : 'General Payment'}</span></td>
        <td><span class="status-badge ${p.status === 'captured' ? 'badge-success' : p.status === 'failed' ? 'badge-danger' : 'badge-info'}">${p.status}</span></td>
        <td>${p.payment_gateway || 'Razorpay'}</td>
        <td style="color:rgba(255,255,255,0.4);">${formatDateTime(p.created_at)}</td>
      </tr>
    `).join('');
  }

  // ══════════════════════════════════════
  // SYSTEM CONFIGURATION SETTINGS
  // ══════════════════════════════════════
  window.loadSettings = function() {
    const rzpMid = localStorage.getItem('setting-rzp-mid') || 'rzp_test_418Dsm';
    const resendKey = localStorage.getItem('setting-resend-key') || 're_RF8xePnN_8fA7E1Gz8e3yS1';
    const cloudinaryName = localStorage.getItem('setting-cloudinary-name') || 'prajapati-elect-cloudinary';
    const ga4Tag = localStorage.getItem('setting-ga4-tag') || 'G-LXMPELECT';

    document.getElementById('setting-rzp-mid').value = rzpMid;
    document.getElementById('setting-resend-key').value = resendKey;
    document.getElementById('setting-cloudinary-name').value = cloudinaryName;
    document.getElementById('setting-ga4-tag').value = ga4Tag;
  };

  document.getElementById('admin-settings-form').addEventListener('submit', (e) => {
    e.preventDefault();
    localStorage.setItem('setting-rzp-mid', document.getElementById('setting-rzp-mid').value.trim());
    localStorage.setItem('setting-resend-key', document.getElementById('setting-resend-key').value.trim());
    localStorage.setItem('setting-cloudinary-name', document.getElementById('setting-cloudinary-name').value.trim());
    localStorage.setItem('setting-ga4-tag', document.getElementById('setting-ga4-tag').value.trim());
    showToast('Platform settings saved successfully!');
  });

  // ── Initial setup triggers ──
  await loadEmployees();
  await loadUsers();
  await loadLeads();
  await loadCareers();
  await loadApplicants();
  await loadSupportTickets();
  await loadFinanceTransactions();
  loadSettings();

  // ── Close modals on overlay click ──
  document.querySelectorAll('.admin-modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('open');
      }
    });
  });
});
