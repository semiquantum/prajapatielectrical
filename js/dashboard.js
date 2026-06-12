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

  // Redirect admin users to admin panel
  if (['super_admin', 'admin', 'owner', 'manager'].includes(profile.role)) {
    window.location.href = 'admin.html';
    return;
  }

  // ── UI Welcome Display ──
  const displayName = profile.full_name || user.email.split('@')[0];
  document.getElementById('welcome-heading').textContent = `Welcome, ${displayName}!`;
  document.getElementById('user-display-name').textContent = displayName;
  document.getElementById('user-avatar').textContent = displayName.charAt(0).toUpperCase();

  // Role Badge text mapping
  const roleLabelMap = {
    'customer': 'Customer Portal',
    'employee': 'Employee Field Board',
    'distributor': 'Distributor Portal',
    'franchise_partner': 'Franchise Partner Portal',
    'dealer': 'Dealer Outlet Portal',
    'retailer': 'Retailer Portal',
    'vendor': 'Vendor Supply Portal'
  };
  document.getElementById('user-role-badge').textContent = roleLabelMap[profile.role] || 'Customer';

  // ── Populate Profile Form Defaults ──
  document.getElementById('profile-name').value = profile.full_name || '';
  document.getElementById('profile-email').value = user.email;
  document.getElementById('profile-phone').value = profile.phone || '';
  document.getElementById('profile-address').value = profile.address || '';

  // ── Dynamic Navigation Tabs Rendering based on Role ──
  const tabsBar = document.getElementById('dash-tabs-bar');
  let tabsHtml = `<button class="dash-tab active" data-panel="profile"><i class="fas fa-user"></i> Profile</button>`;

  if (profile.role === 'customer') {
    tabsHtml += `
      <button class="dash-tab" data-panel="book"><i class="fas fa-calendar-plus"></i> Book Service</button>
      <button class="dash-tab" data-panel="bookings"><i class="fas fa-list-check"></i> My Bookings <span class="tab-badge" id="bookings-count">0</span></button>
      <button class="dash-tab" data-panel="orders"><i class="fas fa-receipt"></i> Orders &amp; Invoices</button>
      <button class="dash-tab" data-panel="tickets"><i class="fas fa-ticket-simple"></i> Support Tickets</button>
    `;
  } else if (profile.role === 'employee') {
    tabsHtml += `
      <button class="dash-tab" data-panel="employee"><i class="fas fa-screwdriver-wrench"></i> Task Assignments</button>
    `;
  } else if (profile.role === 'distributor') {
    tabsHtml += `
      <button class="dash-tab" data-panel="distributor"><i class="fas fa-map-location-dot"></i> B2B Distributor</button>
    `;
  } else if (profile.role === 'franchise_partner') {
    tabsHtml += `
      <button class="dash-tab" data-panel="franchise"><i class="fas fa-store"></i> Franchise Stats</button>
    `;
  } else if (['dealer', 'retailer'].includes(profile.role)) {
    tabsHtml += `
      <button class="dash-tab" data-panel="dealer"><i class="fas fa-boxes-packing"></i> B2B Dealer</button>
    `;
  } else if (profile.role === 'vendor') {
    tabsHtml += `
      <button class="dash-tab" data-panel="vendor"><i class="fas fa-file-contract"></i> Vendor Panel</button>
    `;
  }

  tabsHtml += `<button class="dash-tab" data-panel="notifications"><i class="fas fa-bell"></i> Alerts</button>`;
  tabsBar.innerHTML = tabsHtml;

  // ── Tabs Switching Handler ──
  const tabs = document.querySelectorAll('.dash-tab');
  const panels = document.querySelectorAll('.dash-panel');
  const sidebar = document.getElementById('dash-sidebar');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.panel;
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`panel-${target}`).classList.add('active');
      
      // Close sidebar on mobile after clicking a tab
      if (window.innerWidth <= 992) {
        sidebar.classList.remove('open');
      }
    });
  });

  // ── Mobile Sidebar Toggle ──
  const toggleBtn = document.getElementById('dash-sidebar-toggle');
  const closeBtn = document.getElementById('dash-sidebar-close');
  
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.add('open');
    });
  }
  
  if (closeBtn && sidebar) {
    closeBtn.addEventListener('click', () => {
      sidebar.classList.remove('open');
    });
  }

  // Clock min date setup
  const bookingDateEl = document.getElementById('booking-date');
  if (bookingDateEl) {
    const today = new Date().toISOString().split('T')[0];
    bookingDateEl.setAttribute('min', today);
    bookingDateEl.value = today;
  }

  // ── Logout ──
  document.getElementById('logout-btn').addEventListener('click', signOut);

  // ── Toast Notifications ──
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

  // ── Save Profile Settings ──
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
    }
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
  });

  // ══════════════════════════════════════
  // ROLE CONDITIONAL EXECUTION BOARDS
  // ══════════════════════════════════════
  
  if (profile.role === 'customer') {
    await loadServicesSelect();
    await loadBookings();
    await loadCustomerOrders();
    await loadSupportTickets();

    // Link booking form submit
    document.getElementById('booking-form').addEventListener('submit', handleServiceBookingSubmit);
    // Link ticket form submit
    document.getElementById('dashboard-ticket-form').addEventListener('submit', handleTicketSubmit);
  } 
  
  else if (profile.role === 'employee') {
    await loadEmployeeDetails();
    await loadEmployeeTasks();
    
    // clock-in button
    document.getElementById('btn-clock-in').addEventListener('click', handleEmployeeClockIn);
    // status updates
    document.getElementById('emp-task-update-form').addEventListener('submit', handleTaskStatusSave);
  } 
  
  else if (profile.role === 'distributor') {
    await loadDistributorProfile();
    await loadDistributorBulkSelect();
    await loadB2BLeads();
    
    document.getElementById('bulk-order-form').addEventListener('submit', handleBulkOrderSubmit);
  } 
  
  else if (['dealer', 'retailer'].includes(profile.role)) {
    await loadDealerStockRequests();
    document.getElementById('stock-request-form').addEventListener('submit', handleStockRequestSubmit);
  } 
  
  else if (profile.role === 'vendor') {
    await loadVendorPurchaseOrders();
  }

  await loadAlerts();

  // ══════════════════════════════════════
  // CUSTOMER DASHBOARD FUNCTIONS
  // ══════════════════════════════════════

  async function loadServicesSelect() {
    const { data: services } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    const select = document.getElementById('booking-service');
    if (select) {
      select.innerHTML = '<option value="">-- Choose a Service --</option>';
      services?.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `${s.name} (${s.price_range || 'Inspection'})`;
        select.appendChild(opt);
      });
      
      const urlParams = new URLSearchParams(window.location.search);
      const serviceParam = urlParams.get('service');
      if (serviceParam) select.value = serviceParam;
    }
  }

  async function handleServiceBookingSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('submit-booking-btn');
    btn.disabled = true;

    const serviceId = document.getElementById('booking-service').value;
    const date = document.getElementById('booking-date').value;
    const time = document.getElementById('booking-time').value;
    const phone = document.getElementById('booking-phone').value.trim();
    const address = document.getElementById('booking-address').value.trim();
    const desc = document.getElementById('booking-desc').value.trim();

    try {
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

      if (error) throw error;
      showToast("Booking request submitted! Tracking code logged.");
      document.getElementById('booking-form').reset();
      await loadBookings();
      document.querySelector('.dash-tab[data-panel="bookings"]').click();
    } catch (err) {
      showToast("Booking failed: " + err.message, "error");
    } finally {
      btn.disabled = false;
    }
  }

  async function loadBookings() {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*, services(name, icon)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const list = document.getElementById('bookings-list');
    const badge = document.getElementById('bookings-count');
    badge.textContent = bookings?.length || 0;

    if (!bookings || bookings.length === 0) {
      list.innerHTML = `<div class="empty-state"><i class="fas fa-calendar-xmark"></i><h4>No bookings yet</h4><p>Your service request logs display here.</p></div>`;
      return;
    }

    list.innerHTML = bookings.map(b => `
      <div class="booking-item">
        <div class="booking-info">
          <h4><i class="${b.services?.icon || 'fas fa-bolt'}" style="color:var(--accent); margin-right:8px;"></i>${b.services?.name}</h4>
          <p>${b.description || 'No description provided'}</p>
          <p style="margin-top:6px; font-size:0.8rem; opacity:0.7;"><i class="fas fa-clock"></i> Scheduled: ${formatDate(b.preferred_date)} • ${b.preferred_time}</p>
          ${b.before_photo_url ? `<p style="margin-top:6px;"><i class="fas fa-image"></i> before-photo uploaded by tech</p>` : ''}
          ${b.admin_notes ? `<p style="color:#60a5fa; margin-top:4px;"><i class="fas fa-comment"></i> Notes: ${b.admin_notes}</p>` : ''}
        </div>
        <div class="booking-meta">
          <span class="status-badge ${getStatusBadgeClass(b.status)}">${getStatusLabel(b.status)}</span>
          ${b.status === 'pending' ? `<button class="btn-cancel-booking" onclick="cancelBooking(${b.id})">Cancel</button>` : ''}
        </div>
      </div>
    `).join('');
  }

  window.cancelBooking = async function(id) {
    if (!confirm("Confirm booking cancellation?")) return;
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      showToast("Cancellation failed.", "error");
    } else {
      showToast("Booking cancelled.");
      await loadBookings();
    }
  };

  async function loadCustomerOrders() {
    const { data: orders } = await supabase
      .from('orders')
      .select('*, order_items(*, products(name)), invoices(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const container = document.getElementById('orders-list-container');
    if (!orders || orders.length === 0) return;

    container.innerHTML = `
      <table class="dash-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Product/Items Purchased</th>
            <th>Total Amount</th>
            <th>Status</th>
            <th>Invoice</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map(o => `
            <tr>
              <td>#${o.id}</td>
              <td>${o.order_items?.map(oi => `${oi.products?.name} (x${oi.quantity})`).join(', ') || 'Wholesale Material'}</td>
              <td><strong>${formatPrice(o.total_amount)}</strong></td>
              <td><span class="status-badge badge-primary">${o.status}</span></td>
              <td>
                ${o.invoices?.length > 0 
                  ? `<a href="#" onclick="alert('Downloading Invoice PDF...')" style="color:var(--accent); font-weight:700;"><i class="fas fa-file-pdf"></i> ${o.invoices[0].invoice_number}</a>` 
                  : 'Pending'
                }
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  async function loadSupportTickets() {
    const { data: tickets } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const container = document.getElementById('tickets-list-container');
    if (!tickets || tickets.length === 0) return;

    container.innerHTML = `
      <table class="dash-table">
        <thead>
          <tr>
            <th>Ticket ID</th>
            <th>Subject</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Date Opened</th>
          </tr>
        </thead>
        <tbody>
          ${tickets.map(t => `
            <tr>
              <td>#${t.id}</td>
              <td>${t.subject}</td>
              <td><span class="status-badge badge-warning">${t.priority}</span></td>
              <td><span class="status-badge badge-success">${t.status}</span></td>
              <td>${formatDate(t.created_at)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  async function handleTicketSubmit(e) {
    e.preventDefault();
    const subject = document.getElementById('t-subject').value.trim();
    const priority = document.getElementById('t-priority').value;
    const desc = document.getElementById('t-desc').value.trim();

    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          subject: subject,
          priority: priority,
          description: desc,
          status: 'open'
        });

      if (error) throw error;
      showToast("Support ticket registered successfully!");
      document.getElementById('dashboard-ticket-form').reset();
      await loadSupportTickets();
    } catch (err) {
      showToast("Ticket filing failed.", "error");
    }
  }

  // ══════════════════════════════════════
  // EMPLOYEE FIELD BOARD FUNCTIONS
  // ══════════════════════════════════════

  async function loadEmployeeDetails() {
    const { data: emp } = await supabase
      .from('employees')
      .select('*')
      .eq('id', user.id)
      .single();

    if (emp) {
      const statusText = document.getElementById('attend-status-text');
      statusText.textContent = emp.attendance_status.toUpperCase();
      statusText.style.color = emp.attendance_status === 'present' ? '#22C55E' : '#ef4444';
    }
  }

  async function handleEmployeeClockIn() {
    const { error } = await supabase
      .from('employees')
      .update({ attendance_status: 'present' })
      .eq('id', user.id);

    if (error) {
      showToast("Clock-in failed.", "error");
    } else {
      showToast("Clocked-In successfully for today!");
      await loadEmployeeDetails();
    }
  }

  async function loadEmployeeTasks() {
    const { data: tasks } = await supabase
      .from('bookings')
      .select('*, services(name), profiles(full_name)')
      .eq('assigned_employee_id', user.id)
      .order('created_at', { ascending: false });

    const container = document.getElementById('emp-tasks-container');
    if (!tasks || tasks.length === 0) {
      container.innerHTML = `<div class="empty-state"><i class="fas fa-clipboard-check"></i><h4>No tasks assigned</h4><p>Refresh grid later.</p></div>`;
      return;
    }

    container.innerHTML = `
      <table class="dash-table">
        <thead>
          <tr>
            <th>Task ID</th>
            <th>Customer</th>
            <th>Service Target</th>
            <th>Schedule Date</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${tasks.map(t => `
            <tr>
              <td>#${t.id}</td>
              <td>${t.profiles?.full_name || 'Client'}</td>
              <td>${t.services?.name}</td>
              <td>${formatDate(t.preferred_date)}</td>
              <td><span class="status-badge ${getStatusBadgeClass(t.status)}">${t.status}</span></td>
              <td>
                <button class="btn btn-secondary" onclick="openTaskUpdateModal(${t.id})" style="padding:6px 12px; font-size:0.8rem;">Update Task</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  window.openTaskUpdateModal = function(id) {
    document.getElementById('update-task-id').value = id;
    document.getElementById('task-status-update-wrap').style.display = 'block';
  };

  async function handleTaskStatusSave(e) {
    e.preventDefault();
    const taskId = document.getElementById('update-task-id').value;
    const status = document.getElementById('update-status-val').value;
    const notes = document.getElementById('update-task-notes').value.trim();

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: status,
          admin_notes: notes || 'Technician closed status'
        })
        .eq('id', taskId);

      if (error) throw error;
      showToast("Task assignment updated successfully!");
      document.getElementById('task-status-update-wrap').style.display = 'none';
      document.getElementById('emp-task-update-form').reset();
      await loadEmployeeTasks();
    } catch (err) {
      showToast("Update failed: " + err.message, "error");
    }
  }

  // ══════════════════════════════════════
  // DISTRIBUTOR FUNCTIONS
  // ══════════════════════════════════════

  async function loadDistributorProfile() {
    const { data: dist } = await supabase
      .from('distributors')
      .select('*')
      .eq('id', user.id)
      .single();

    if (dist) {
      document.getElementById('dist-territory-text').textContent = dist.territory;
      document.getElementById('dist-commission-text').textContent = `${dist.commission_rate}%`;
    }
  }

  async function loadDistributorBulkSelect() {
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('in_stock', true);

    const select = document.getElementById('bulk-product');
    if (select) {
      select.innerHTML = '';
      products?.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.name} (Unit: Per ${p.unit || 'piece'} - B2B Price: ${formatPrice(p.price)})`;
        select.appendChild(opt);
      });
    }
  }

  async function handleBulkOrderSubmit(e) {
    e.preventDefault();
    const prodId = document.getElementById('bulk-product').value;
    const qty = parseInt(document.getElementById('bulk-qty').value);

    const product = allProducts.find(p => p.id == prodId);
    if (!product) return;

    const total = product.price * qty;

    try {
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          order_type: 'bulk',
          total_amount: total,
          shipping_address: 'Central Warehouse B2B Distributor Hub (Default)',
          phone: profile.phone || '0000000000',
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: parseInt(prodId),
          quantity: qty,
          price: product.price
        });

      showToast("Bulk order transaction logged successfully! Admin is reviewing invoice allocation.");
      document.getElementById('bulk-order-form').reset();
    } catch (err) {
      showToast("Order entry failed.", "error");
    }
  }

  async function loadB2BLeads() {
    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    const container = document.getElementById('dist-leads-container');
    if (!leads || leads.length === 0) {
      container.innerHTML = `<p style="font-size:0.9rem; color:rgba(255,255,255,0.4)">No active leads in your block coordinates currently.</p>`;
      return;
    }

    container.innerHTML = `
      <table class="dash-table">
        <thead>
          <tr>
            <th>Lead Name</th>
            <th>Phone</th>
            <th>Type/Source</th>
            <th>Territory</th>
            <th>Date Captured</th>
          </tr>
        </thead>
        <tbody>
          ${leads.map(l => `
            <tr>
              <td>${l.name}</td>
              <td>${l.phone}</td>
              <td><span class="status-badge badge-info">${l.source}</span></td>
              <td>${l.territory || 'Rampur Bujurg'}</td>
              <td>${formatDate(l.created_at)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  // ══════════════════════════════════════
  // DEALER & RETAILER FUNCTIONS
  // ══════════════════════════════════════

  async function loadDealerStockRequests() {
    const { data: requests } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.id)
      .eq('subject', 'Stock Request')
      .order('created_at', { ascending: false });

    const container = document.getElementById('stock-requests-container');
    if (!requests || requests.length === 0) {
      container.innerHTML = `<p style="font-size:0.9rem; color:rgba(255,255,255,0.4); margin-top:10px;">No replenishment requests logged.</p>`;
      return;
    }

    container.innerHTML = `
      <table class="dash-table">
        <thead>
          <tr>
            <th>Request ID</th>
            <th>Replenishment Material Specifications</th>
            <th>Delivery Priority</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${requests.map(r => `
            <tr>
              <td>#${r.id}</td>
              <td>${r.description}</td>
              <td>${r.priority}</td>
              <td><span class="status-badge badge-primary">${r.status}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  async function handleStockRequestSubmit(e) {
    e.preventDefault();
    const desc = document.getElementById('stock-desc').value.trim();
    const priority = document.getElementById('stock-priority').value;

    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          subject: 'Stock Request',
          description: desc,
          priority: priority === 'express' ? 'high' : 'medium',
          status: 'open'
        });

      if (error) throw error;
      showToast("Stock replenishment request registered! Logistics has been informed.");
      document.getElementById('stock-request-form').reset();
      await loadDealerStockRequests();
    } catch (err) {
      showToast("Request failed.", "error");
    }
  }

  // ══════════════════════════════════════
  // VENDOR FUNCTIONS
  // ══════════════════════════════════════

  async function loadVendorPurchaseOrders() {
    const { data: pos } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('assigned_employee_id', user.id) // vendors see tickets assigned to them as POs
      .order('created_at', { ascending: false });

    const container = document.getElementById('vendor-orders-container');
    if (!pos || pos.length === 0) return;

    container.innerHTML = `
      <table class="dash-table">
        <thead>
          <tr>
            <th>PO ID</th>
            <th>Material Supply Requirements</th>
            <th>Priority</th>
            <th>Action Required</th>
          </tr>
        </thead>
        <tbody>
          ${pos.map(po => `
            <tr>
              <td>#${po.id}</td>
              <td>${po.description}</td>
              <td><span class="status-badge badge-warning">${po.priority}</span></td>
              <td>
                <button class="btn btn-secondary" onclick="alert('Uploading supply contract invoice to vendor DB...')">Submit Invoice</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  // ══════════════════════════════════════
  // NOTIFICATIONS / ALERTS
  // ══════════════════════════════════════

  async function loadAlerts() {
    const { data: alerts } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const container = document.getElementById('notifications-list-container');
    if (!alerts || alerts.length === 0) return;

    container.innerHTML = alerts.map(a => `
      <div class="attend-box" style="margin-bottom:12px; border-left: 4px solid var(--accent);">
        <div>
          <strong style="color:white; font-size:0.95rem;">${a.title}</strong>
          <p style="font-size:0.85rem; color:rgba(255,255,255,0.6); margin-top:4px;">${a.message}</p>
          <span style="font-size:0.75rem; color:rgba(255,255,255,0.4); display:block; margin-top:6px;">${formatDateTime(a.created_at)}</span>
        </div>
      </div>
    `).join('');
  }

});
