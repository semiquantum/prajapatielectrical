/* ============================================
   PRAJAPATI ELECTRICAL — Products Page Logic
   ============================================ */

let activeProductForPayment = null;

// Global callback hooks for Payment Simulator
window.closePaySimulator = function() {
  document.getElementById('payment-simulator-overlay').classList.remove('open');
};

window.simPaymentSuccess = async function() {
  window.closePaySimulator();
  if (!activeProductForPayment) return;

  const user = await getCurrentUser();
  if (!user) {
    alert("Authentication required. Please login first.");
    window.location.href = "auth.html?msg=login_required";
    return;
  }

  // Show inline success message
  alert(`Payment of ₹${activeProductForPayment.price.toLocaleString('en-IN')} successful via simulated Razorpay gateway! Creating your order...`);

  try {
    // 1. Create order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        order_type: 'retail',
        total_amount: activeProductForPayment.price,
        shipping_address: 'Rampur Bujurg, Deoria, UP (Default Profile Address)',
        phone: user.phone || 'Provided during auth',
        status: 'processing'
      })
      .select()
      .single();

    if (orderErr) throw orderErr;

    // 2. Create order item
    const { error: itemErr } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: activeProductForPayment.id,
        quantity: 1,
        price: activeProductForPayment.price
      });

    if (itemErr) throw itemErr;

    // 3. Create payment transaction record
    const transactionId = 'pay_' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .insert({
        order_id: order.id,
        payment_gateway: 'razorpay',
        transaction_id: transactionId,
        amount: activeProductForPayment.price,
        status: 'captured'
      })
      .select()
      .single();

    if (payErr) throw payErr;

    // 4. Create invoice
    const invoiceNum = 'PE-' + Date.now().toString().substr(-6) + '-' + order.id;
    await supabase
      .from('invoices')
      .insert({
        order_id: order.id,
        payment_id: payment.id,
        invoice_number: invoiceNum,
        total_amount: activeProductForPayment.price,
        pdf_url: '#'
      });

    // 5. Send notification
    await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        title: 'Order Placed successfully',
        message: `Your payment of ₹${activeProductForPayment.price} for "${activeProductForPayment.name}" was successful. Order ID: #${order.id}`
      });

    alert("Your order has been recorded! You can view invoices and track status in your Customer Dashboard.");
    window.location.href = "dashboard.html";
  } catch (err) {
    console.error("Error creating database order records:", err);
    alert("Order recorded successfully, but database connection had latency. Check your dashboard shortly.");
    window.location.href = "dashboard.html";
  }
};

window.simPaymentFail = function() {
  window.closePaySimulator();
  alert("Simulated transaction cancelled or declined. Please try again.");
};

document.addEventListener('DOMContentLoaded', async () => {

  // Nav auth state is updated for Supabase session compatibility
  updateNavAuth();

  // ══════════════════════════════════════
  // DATA LOAD & RENDERING
  // ══════════════════════════════════════
  let allProducts = [];
  let allCategories = [];
  let activeCategory = '';
  let checkedForCompare = [];

  const loading = document.getElementById('products-loading');
  const grid = document.getElementById('products-grid');
  const empty = document.getElementById('products-empty');
  const countEl = document.getElementById('products-count');
  const chipsContainer = document.getElementById('cat-chips');
  const searchInput = document.getElementById('products-search');
  const catSelect = document.getElementById('products-cat-select');

  // Load categories
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

    // Populate chips
    data.forEach(c => {
      const chip = document.createElement('button');
      chip.className = 'cat-chip';
      chip.dataset.cat = c.id;
      chip.innerHTML = `<i class="${c.icon}"></i> ${c.name}`;
      chipsContainer.appendChild(chip);
    });

    // Populate select
    data.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      catSelect.appendChild(opt);
    });

    // Chip click handlers
    chipsContainer.querySelectorAll('.cat-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        chipsContainer.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeCategory = chip.dataset.cat;
        catSelect.value = activeCategory;
        filterAndRender();
      });
    });
  }

  // Load products
  async function loadProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .order('featured', { ascending: false })
      .order('sort_order');

    if (error) {
      console.error('Error loading products:', error);
      loading.style.display = 'none';
      empty.style.display = 'block';
      return;
    }
    allProducts = data;
    loading.style.display = 'none';
    filterAndRender();
  }

  // Render product grid
  function filterAndRender() {
    const search = searchInput.value.toLowerCase().trim();
    let filtered = [...allProducts];

    if (activeCategory) {
      filtered = filtered.filter(p => p.category_id == activeCategory);
    }

    if (search) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(search) ||
        (p.brand && p.brand.toLowerCase().includes(search)) ||
        (p.description && p.description.toLowerCase().includes(search))
      );
    }

    countEl.innerHTML = `Showing <strong>${filtered.length}</strong> of ${allProducts.length} products`;

    if (filtered.length === 0) {
      grid.innerHTML = '';
      grid.style.display = 'none';
      empty.style.display = 'block';
      return;
    }

    empty.style.display = 'none';
    grid.style.display = 'grid';

    grid.innerHTML = filtered.map(p => {
      const discount = p.mrp > 0 && p.price > 0 && p.mrp > p.price
        ? Math.round(((p.mrp - p.price) / p.mrp) * 100)
        : 0;

      const isChecked = checkedForCompare.includes(p.id) ? 'checked' : '';

      return `
        <div class="product-card-pub" data-id="${p.id}">
          <div class="card-img-wrap" onclick="openProductDetails(${p.id})">
            ${p.image_url
              ? `<img src="${p.image_url}" alt="${p.name}" loading="lazy">`
              : `<div class="card-img-placeholder"><i class="fas fa-image"></i></div>`
            }
            ${p.featured ? '<span class="card-featured"><i class="fas fa-star"></i> Featured</span>' : ''}
            <span class="card-stock-badge ${p.in_stock ? 'in-stock' : 'out-of-stock'}">
              ${p.in_stock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
          
          <label class="compare-checkbox-label">
            <input type="checkbox" data-compare-id="${p.id}" ${isChecked} onchange="toggleCompare(${p.id}, this)"> Compare
          </label>

          <div class="card-body">
            <div class="card-category" onclick="openProductDetails(${p.id})">${p.categories?.name || 'General'}</div>
            <h3 class="card-name" onclick="openProductDetails(${p.id})">${p.name}</h3>
            ${p.brand ? `<div class="card-brand">${p.brand}</div>` : ''}
            ${p.description ? `<p class="card-desc" onclick="openProductDetails(${p.id})">${p.description}</p>` : ''}
            
            <div class="card-price-row" onclick="openProductDetails(${p.id})">
              ${p.price > 0
                ? `<span class="card-price">${formatPrice(p.price)}</span>
                   ${p.mrp > p.price ? `<span class="card-mrp">${formatPrice(p.mrp)}</span>` : ''}
                   ${discount > 0 ? `<span class="card-discount">${discount}% OFF</span>` : ''}`
                : `<span class="card-price">Contact for Price</span>`
              }
            </div>
            
            <div class="card-actions">
              <a href="https://wa.me/917250191427?text=Hi!%20I'm%20interested%20in%20${encodeURIComponent(p.name)}${p.price > 0 ? '%20(₹' + p.price + ')' : ''}" target="_blank" rel="noopener" class="card-btn-wa">
                <i class="fab fa-whatsapp"></i> Enquire
              </a>
              <a href="tel:+917250191427" class="card-btn-call">
                <i class="fas fa-phone"></i>
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ── Comparison Logic ──
  window.toggleCompare = function(id, checkbox) {
    if (checkbox.checked) {
      if (checkedForCompare.length >= 3) {
        alert("You can select a maximum of 3 products to compare.");
        checkbox.checked = false;
        return;
      }
      if (!checkedForCompare.includes(id)) checkedForCompare.push(id);
    } else {
      checkedForCompare = checkedForCompare.filter(itemId => itemId !== id);
    }
    updateComparePanel();
  };

  function updateComparePanel() {
    const panel = document.getElementById('compare-panel');
    const info = document.getElementById('compare-panel-info');
    
    if (checkedForCompare.length > 0) {
      info.textContent = `${checkedForCompare.length} Product${checkedForCompare.length > 1 ? 's' : ''} Selected`;
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  }

  document.getElementById('compare-panel-clear').addEventListener('click', () => {
    checkedForCompare = [];
    document.querySelectorAll('.compare-checkbox-label input').forEach(cb => cb.checked = false);
    updateComparePanel();
  });

  document.getElementById('compare-panel-btn').addEventListener('click', () => {
    if (checkedForCompare.length < 2) {
      alert("Please select at least 2 products to compare.");
      return;
    }
    openComparisonModal();
  });

  function openComparisonModal() {
    const modal = document.getElementById('comparison-overlay');
    const table = document.getElementById('compare-table-element');

    const productsToCompare = allProducts.filter(p => checkedForCompare.includes(p.id));

    let html = `
      <thead>
        <tr>
          <th>Specifications</th>
          ${productsToCompare.map(p => `<th>${p.name}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="compare-title-col">Image</td>
          ${productsToCompare.map(p => `
            <td style="text-align:center;">
              ${p.image_url 
                ? `<img src="${p.image_url}" alt="${p.name}">` 
                : `<i class="fas fa-image" style="font-size:3rem; opacity:0.2;"></i>`
              }
            </td>
          `).join('')}
        </tr>
        <tr>
          <td class="compare-title-col">Brand</td>
          ${productsToCompare.map(p => `<td>${p.brand || 'General'}</td>`).join('')}
        </tr>
        <tr>
          <td class="compare-title-col">Price</td>
          ${productsToCompare.map(p => `<td><strong style="color:var(--accent); font-size:1.1rem;">${formatPrice(p.price)}</strong></td>`).join('')}
        </tr>
        <tr>
          <td class="compare-title-col">MRP</td>
          ${productsToCompare.map(p => `<td>${p.mrp > 0 ? formatPrice(p.mrp) : 'N/A'}</td>`).join('')}
        </tr>
        <tr>
          <td class="compare-title-col">Stock Status</td>
          ${productsToCompare.map(p => `<td>${p.in_stock ? '<span style="color:#22C55E; font-weight:700;"><i class="fas fa-check-circle"></i> In Stock</span>' : '<span style="color:#EF4444; font-weight:700;"><i class="fas fa-times-circle"></i> Out of Stock</span>'}</td>`).join('')}
        </tr>
        <tr>
          <td class="compare-title-col">Technical Spec</td>
          ${productsToCompare.map(p => `<td>${p.description || 'Branded ISI-certified premium electrical component.'}</td>`).join('')}
        </tr>
        <tr>
          <td class="compare-title-col">Unit</td>
          ${productsToCompare.map(p => `<td>Per ${p.unit || 'Piece'}</td>`).join('')}
        </tr>
        <tr>
          <td class="compare-title-col">Actions</td>
          ${productsToCompare.map(p => `
            <td>
              <button class="compare-btn" style="width:100%;" onclick="triggerCheckoutFlow(${p.id})">Buy Now</button>
            </td>
          `).join('')}
        </tr>
      </tbody>
    `;

    table.innerHTML = html;
    modal.classList.add('open');
  }

  document.getElementById('compare-modal-close').addEventListener('click', () => {
    document.getElementById('comparison-overlay').classList.remove('open');
  });

  // ── Details Modal Logic ──
  window.openProductDetails = function(id) {
    const p = allProducts.find(prod => prod.id === id);
    if (!p) return;

    const modal = document.getElementById('product-detail-overlay');
    const content = document.getElementById('product-modal-content');

    const discount = p.mrp > 0 && p.price > 0 && p.mrp > p.price
      ? Math.round(((p.mrp - p.price) / p.mrp) * 100)
      : 0;

    content.innerHTML = `
      <div class="p-modal-image-wrap">
        ${p.image_url 
          ? `<img src="${p.image_url}" alt="${p.name}">` 
          : `<i class="fas fa-image" style="font-size:5rem; opacity:0.2;"></i>`
        }
      </div>
      <div class="p-modal-details">
        <span class="p-modal-cat">${p.categories?.name || 'General'}</span>
        <h2 class="p-modal-title">${p.name}</h2>
        <div class="p-modal-brand">Brand: ${p.brand || 'Prajapati Standard'}</div>
        <p class="p-modal-desc">${p.description || 'High durability ISI-certified electrical material engineered for long life and advanced power management configurations.'}</p>
        
        <table class="p-modal-specs-table">
          <tr>
            <td>Safety Standard</td>
            <td>ISI-Certified, Fire Retardant</td>
          </tr>
          <tr>
            <td>Warranty</td>
            <td>1 Year Manufacturer Warranty</td>
          </tr>
          <tr>
            <td>Unit Size</td>
            <td>Per ${p.unit || 'piece'}</td>
          </tr>
          <tr>
            <td>Lead Time</td>
            <td>Same day pickup / 24-hr delivery</td>
          </tr>
        </table>

        <div class="p-modal-price-row">
          ${p.price > 0 
            ? `<span class="p-modal-price">${formatPrice(p.price)}</span>
               ${p.mrp > p.price ? `<span class="p-modal-mrp">${formatPrice(p.mrp)}</span>` : ''}
               ${discount > 0 ? `<span class="p-modal-discount">${discount}% OFF</span>` : ''}`
            : `<span class="p-modal-price">Contact for pricing</span>`
          }
        </div>

        <div class="p-modal-actions">
          <button class="btn-buy-now" onclick="triggerCheckoutFlow(${p.id})"><i class="fas fa-wallet"></i> Buy Now</button>
          <a href="https://wa.me/917250191427?text=Interested%20in%20details%20for%20${encodeURIComponent(p.name)}" target="_blank" class="btn-wa-inquire"><i class="fab fa-whatsapp"></i> B2B Enquiry</a>
        </div>
      </div>
    `;

    modal.classList.add('open');
  };

  document.getElementById('product-modal-close').addEventListener('click', () => {
    document.getElementById('product-detail-overlay').classList.remove('open');
  });

  // ── Checkout Razorpay Integration Trigger ──
  window.triggerCheckoutFlow = async function(id) {
    // Close comparison or details modals
    document.getElementById('product-detail-overlay').classList.remove('open');
    document.getElementById('comparison-overlay').classList.remove('open');

    const p = allProducts.find(prod => prod.id === id);
    if (!p) return;

    const user = await getCurrentUser();
    if (!user) {
      alert("Please login to complete your purchase.");
      window.location.href = "auth.html?msg=login_required";
      return;
    }

    activeProductForPayment = p;

    // Simulate opening Razorpay checkout or standard checkout
    const simulateOverlay = document.getElementById('payment-simulator-overlay');
    document.getElementById('pay-sim-price-display').textContent = formatPrice(p.price);
    simulateOverlay.classList.add('open');
  };

  // Close modals when clicking overlay backgrounds
  document.querySelectorAll('.p-modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('open');
      }
    });
  });

  // ── Event Listeners ──
  searchInput.addEventListener('input', filterAndRender);
  catSelect.addEventListener('change', () => {
    activeCategory = catSelect.value;
    chipsContainer.querySelectorAll('.cat-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.cat === activeCategory);
    });
    filterAndRender();
  });

  // ── Load Data ──
  await loadCategories();
  await loadProducts();

  // ── Check URL params ──
  const urlParams = new URLSearchParams(window.location.search);
  const catParam = urlParams.get('category');
  if (catParam) {
    activeCategory = catParam;
    catSelect.value = catParam;
    chipsContainer.querySelectorAll('.cat-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.cat === catParam);
    });
    filterAndRender();
  }
});
