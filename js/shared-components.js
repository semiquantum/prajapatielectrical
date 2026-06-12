/* ============================================
   PRAJAPATI ELECTRICAL — Shared Components
   Mega-menu navigation, footer, toasts, modals
   ============================================ */

// ── Navigation HTML Generator ──
function generateNavigation(activePage = '') {
  return `
  <header>
    <nav class="navbar" id="navbar" role="navigation" aria-label="Main Navigation">
      <div class="nav-container">
        <a href="index.html" class="nav-logo" aria-label="Prajapati Electrical Home">
          <img src="images/logo.png" alt="Prajapati Electrical Logo" width="44" height="44">
          <span>Prajapati Electrical</span>
        </a>

        <div class="nav-links" id="nav-links">
          <a href="index.html" class="${activePage === 'home' ? 'active' : ''}">Home</a>
          
          <div class="nav-dropdown">
            <a href="about.html" class="nav-dropdown-trigger ${activePage === 'about' ? 'active' : ''}">
              About <i class="fas fa-chevron-down"></i>
            </a>
            <div class="nav-dropdown-menu">
              <a href="about.html#our-story"><i class="fas fa-book-open"></i> Our Story</a>
              <a href="about.html#vision-mission"><i class="fas fa-bullseye"></i> Vision & Mission</a>
              <a href="about.html#core-values"><i class="fas fa-gem"></i> Core Values</a>
              <a href="about.html#founder"><i class="fas fa-user-tie"></i> Founder Message</a>
              <a href="about.html#leadership"><i class="fas fa-users"></i> Leadership Team</a>
              <a href="about.html#infrastructure"><i class="fas fa-building"></i> Infrastructure</a>
              <a href="about.html#certifications"><i class="fas fa-certificate"></i> Certifications</a>
              <a href="about.html#csr"><i class="fas fa-hand-holding-heart"></i> CSR Activities</a>
            </div>
          </div>

          <div class="nav-dropdown">
            <a href="services.html" class="nav-dropdown-trigger ${activePage === 'services' ? 'active' : ''}">
              Services <i class="fas fa-chevron-down"></i>
            </a>
            <div class="nav-dropdown-menu nav-dropdown-mega">
              <div class="mega-col">
                <h4>Our Services</h4>
                <a href="services.html#electrical-installation"><i class="fas fa-tools"></i> Electrical Installation</a>
                <a href="services.html#home-wiring"><i class="fas fa-house-signal"></i> Home Wiring</a>
                <a href="services.html#commercial-wiring"><i class="fas fa-building"></i> Commercial Wiring</a>
                <a href="services.html#industrial-wiring"><i class="fas fa-industry"></i> Industrial Wiring</a>
                <a href="services.html#electrical-repair"><i class="fas fa-wrench"></i> Electrical Repair</a>
              </div>
              <div class="mega-col">
                <h4>Specialized</h4>
                <a href="services.html#amc-services"><i class="fas fa-file-contract"></i> AMC Services</a>
                <a href="services.html#solar-solutions"><i class="fas fa-solar-panel"></i> Solar Solutions</a>
                <a href="services.html#emergency"><i class="fas fa-truck-medical"></i> Emergency Services</a>
                <a href="services.html#inspection"><i class="fas fa-clipboard-check"></i> Electrical Inspection</a>
                <a href="services.html#smart-solutions"><i class="fas fa-network-wired"></i> Smart Solutions</a>
              </div>
            </div>
          </div>

          <div class="nav-dropdown">
            <a href="products.html" class="nav-dropdown-trigger ${activePage === 'products' ? 'active' : ''}">
              Products <i class="fas fa-chevron-down"></i>
            </a>
            <div class="nav-dropdown-menu">
              <a href="products.html"><i class="fas fa-th-large"></i> All Products</a>
              <a href="products.html#categories"><i class="fas fa-tags"></i> Categories</a>
              <a href="products.html#search"><i class="fas fa-search"></i> Search Products</a>
              <a href="products.html#compare"><i class="fas fa-balance-scale"></i> Compare Products</a>
              <a href="products.html#catalogue"><i class="fas fa-file-pdf"></i> Download Catalogue</a>
            </div>
          </div>

          <div class="nav-dropdown">
            <a href="network.html" class="nav-dropdown-trigger ${activePage === 'network' ? 'active' : ''}">
              Network <i class="fas fa-chevron-down"></i>
            </a>
            <div class="nav-dropdown-menu">
              <a href="network.html#distributor"><i class="fas fa-truck"></i> Become Distributor</a>
              <a href="network.html#dealer"><i class="fas fa-store"></i> Become Dealer</a>
              <a href="network.html#retailer"><i class="fas fa-shop"></i> Become Retailer</a>
              <a href="network.html#franchise"><i class="fas fa-handshake"></i> Franchise Partner</a>
              <a href="network.html#vendor"><i class="fas fa-boxes-stacked"></i> Become Vendor</a>
              <a href="network.html#corporate"><i class="fas fa-building-columns"></i> Corporate Partner</a>
              <a href="network.html#territory"><i class="fas fa-map"></i> Territory Map</a>
            </div>
          </div>

          <div class="nav-dropdown">
            <a href="resources.html" class="nav-dropdown-trigger ${activePage === 'resources' ? 'active' : ''}">
              Resources <i class="fas fa-chevron-down"></i>
            </a>
            <div class="nav-dropdown-menu">
              <a href="resources.html#blog"><i class="fas fa-blog"></i> Blog</a>
              <a href="resources.html#news"><i class="fas fa-newspaper"></i> News</a>
              <a href="resources.html#guides"><i class="fas fa-book"></i> Electrical Guides</a>
              <a href="resources.html#safety"><i class="fas fa-shield-halved"></i> Safety Tips</a>
              <a href="resources.html#faq"><i class="fas fa-circle-question"></i> FAQ</a>
              <a href="resources.html#downloads"><i class="fas fa-download"></i> Download Center</a>
            </div>
          </div>

          <a href="careers.html" class="${activePage === 'careers' ? 'active' : ''}">Careers</a>

          <div class="nav-dropdown">
            <a href="contact.html" class="nav-dropdown-trigger ${activePage === 'contact' ? 'active' : ''}">
              Contact <i class="fas fa-chevron-down"></i>
            </a>
            <div class="nav-dropdown-menu">
              <a href="contact.html"><i class="fas fa-envelope"></i> Contact Us</a>
              <a href="contact.html#branch-locator"><i class="fas fa-map-pin"></i> Branch Locator</a>
              <a href="contact.html#dealer-locator"><i class="fas fa-location-dot"></i> Dealer Locator</a>
              <a href="contact.html#callback"><i class="fas fa-phone-volume"></i> Request Callback</a>
              <a href="contact.html#quotation"><i class="fas fa-file-invoice"></i> Request Quotation</a>
            </div>
          </div>

          <!-- Mobile-only auth link -->
          <a href="auth.html" class="mobile-nav-cta" id="mobile-nav-auth">
            <i class="fas fa-sign-in-alt"></i> Login / Sign Up
          </a>
        </div>

        <div class="nav-actions">
          <button class="theme-toggle" id="theme-toggle" aria-label="Toggle Dark Mode">
            <i class="fas fa-moon"></i>
          </button>

          <div id="nav-auth-buttons" style="display:flex;gap:8px;">
            <a href="auth.html" class="nav-cta desktop-only">
              <i class="fas fa-sign-in-alt"></i> Login
            </a>
          </div>

          <div id="nav-user-menu" style="display:none;align-items:center;gap:8px;">
            <a href="dashboard.html" class="nav-cta desktop-only">
              <i class="fas fa-user"></i> <span class="user-name">Dashboard</span>
            </a>
          </div>

          <button class="hamburger" id="hamburger" aria-label="Open Menu">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </nav>
  </header>
  <div id="nav-overlay"></div>`;
}

// ── Footer HTML Generator ──
function generateFooter() {
  const year = new Date().getFullYear();
  return `
  <footer class="footer" role="contentinfo">
    <div class="footer-grid">
      <!-- About Column -->
      <div class="footer-about">
        <div class="footer-logo">
          <img src="images/logo.png" alt="Prajapati Electrical" width="44" height="44">
          <span>Prajapati Electrical</span>
        </div>
        <p>Your trusted partner for all electrical repair services and wholesale electrical materials in Rampur Bujurg, Deoria, and nearby areas. Quality work at affordable prices.</p>
        <p class="footer-tagline">⚡ सही काम, उचित दाम, पक्का समाधान</p>
        <div class="footer-social">
          <a href="tel:+917250191427" aria-label="Call"><i class="fas fa-phone"></i></a>
          <a href="https://wa.me/917250191427" target="_blank" rel="noopener" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a>
          <a href="#" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
          <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
          <a href="#" aria-label="YouTube"><i class="fab fa-youtube"></i></a>
        </div>
      </div>

      <!-- Quick Links -->
      <div>
        <h4>Quick Links</h4>
        <ul class="footer-links">
          <li><a href="index.html"><i class="fas fa-chevron-right"></i> Home</a></li>
          <li><a href="about.html"><i class="fas fa-chevron-right"></i> About Us</a></li>
          <li><a href="services.html"><i class="fas fa-chevron-right"></i> Services</a></li>
          <li><a href="products.html"><i class="fas fa-chevron-right"></i> Products</a></li>
          <li><a href="careers.html"><i class="fas fa-chevron-right"></i> Careers</a></li>
          <li><a href="contact.html"><i class="fas fa-chevron-right"></i> Contact Us</a></li>
        </ul>
      </div>

      <!-- Services -->
      <div>
        <h4>Our Services</h4>
        <ul class="footer-links">
          <li><a href="services.html#home-wiring"><i class="fas fa-chevron-right"></i> Home Wiring</a></li>
          <li><a href="services.html#electrical-repair"><i class="fas fa-chevron-right"></i> Electrical Repair</a></li>
          <li><a href="services.html#commercial-wiring"><i class="fas fa-chevron-right"></i> Commercial Wiring</a></li>
          <li><a href="services.html#solar-solutions"><i class="fas fa-chevron-right"></i> Solar Solutions</a></li>
          <li><a href="services.html#amc-services"><i class="fas fa-chevron-right"></i> AMC Services</a></li>
          <li><a href="services.html#emergency"><i class="fas fa-chevron-right"></i> Emergency Services</a></li>
        </ul>
      </div>

      <!-- Business -->
      <div>
        <h4>Business</h4>
        <ul class="footer-links">
          <li><a href="network.html#distributor"><i class="fas fa-chevron-right"></i> Become Distributor</a></li>
          <li><a href="network.html#dealer"><i class="fas fa-chevron-right"></i> Become Dealer</a></li>
          <li><a href="network.html#franchise"><i class="fas fa-chevron-right"></i> Franchise Partner</a></li>
          <li><a href="support.html"><i class="fas fa-chevron-right"></i> Support</a></li>
          <li><a href="resources.html#blog"><i class="fas fa-chevron-right"></i> Blog</a></li>
          <li><a href="resources.html#faq"><i class="fas fa-chevron-right"></i> FAQ</a></li>
        </ul>
      </div>

      <!-- Contact -->
      <div>
        <h4>Contact Info</h4>
        <ul class="footer-contact">
          <li><i class="fas fa-map-marker-alt"></i> Main Road, Rampur Bujurg,<br>Deoria, Uttar Pradesh 274404</li>
          <li><a href="tel:+917250191427"><i class="fas fa-phone"></i> +91 7250191427</a></li>
          <li><a href="tel:+918999644939"><i class="fas fa-phone"></i> +91 8999644939</a></li>
          <li><a href="mailto:prajapatielectrical01@gmail.com"><i class="fas fa-envelope"></i> prajapatielectrical01@gmail.com</a></li>
          <li><i class="fas fa-clock"></i> Mon-Sat: 8AM-8PM<br>Sun: 9AM-2PM</li>
        </ul>
      </div>
    </div>

    <!-- Footer Bottom -->
    <div class="footer-bottom">
      <div class="footer-bottom-inner">
        <p>&copy; ${year} Prajapati Electrical. All Rights Reserved. ⚡ Powering Your World</p>
        <div class="footer-legal-links">
          <a href="privacy-policy.html">Privacy Policy</a>
          <a href="terms.html">Terms & Conditions</a>
          <a href="refund-policy.html">Refund Policy</a>
          <a href="cookie-policy.html">Cookie Policy</a>
          <a href="disclaimer.html">Disclaimer</a>
        </div>
      </div>
    </div>
  </footer>`;
}

// ── Page Hero Banner Generator ──
function generatePageHero(title, subtitle, breadcrumbs = []) {
  let breadcrumbHtml = '<a href="index.html">Home</a>';
  breadcrumbs.forEach(b => {
    if (b.link) {
      breadcrumbHtml += ` <i class="fas fa-chevron-right"></i> <a href="${b.link}">${b.text}</a>`;
    } else {
      breadcrumbHtml += ` <i class="fas fa-chevron-right"></i> <span>${b.text}</span>`;
    }
  });

  return `
  <section class="page-hero">
    <div class="page-hero-bg">
      <div class="page-hero-glow"></div>
      <div class="page-hero-glow page-hero-glow-2"></div>
      <div class="page-hero-circuit"></div>
    </div>
    <div class="page-hero-content">
      <div class="page-hero-badge"><i class="fas fa-bolt"></i> Prajapati Electrical</div>
      <h1>${title}</h1>
      <p>${subtitle}</p>
      <div class="breadcrumb">${breadcrumbHtml}</div>
    </div>
  </section>`;
}

// ── Toast Notification System ──
const PEToast = {
  container: null,
  
  init() {
    if (this.container) return;
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    this.container.id = 'toast-container';
    document.body.appendChild(this.container);
  },

  show(message, type = 'info', duration = 4000) {
    this.init();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    
    toast.innerHTML = `
      <i class="fas ${icons[type] || icons.info}"></i>
      <span>${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
    `;
    
    this.container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  success(msg, dur) { this.show(msg, 'success', dur); },
  error(msg, dur) { this.show(msg, 'error', dur); },
  warning(msg, dur) { this.show(msg, 'warning', dur); },
  info(msg, dur) { this.show(msg, 'info', dur); }
};

// ── Modal System ──
const PEModal = {
  show(options = {}) {
    const { title = '', content = '', size = 'md', onClose = null, showClose = true } = options;
    
    const overlay = document.createElement('div');
    overlay.className = 'pe-modal-overlay';
    overlay.innerHTML = `
      <div class="pe-modal pe-modal-${size}">
        <div class="pe-modal-header">
          <h3>${title}</h3>
          ${showClose ? '<button class="pe-modal-close" aria-label="Close"><i class="fas fa-times"></i></button>' : ''}
        </div>
        <div class="pe-modal-body">${content}</div>
      </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('open'));

    const closeModal = () => {
      overlay.classList.remove('open');
      setTimeout(() => { overlay.remove(); if (onClose) onClose(); }, 300);
    };

    overlay.querySelector('.pe-modal-close')?.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    
    return { close: closeModal, overlay };
  },

  confirm(message, onConfirm, onCancel) {
    return this.show({
      title: 'Confirm Action',
      content: `
        <p style="margin-bottom:24px;">${message}</p>
        <div style="display:flex;gap:12px;justify-content:flex-end;">
          <button class="btn btn-secondary pe-modal-cancel-btn">Cancel</button>
          <button class="btn btn-primary pe-modal-confirm-btn">Confirm</button>
        </div>
      `,
      size: 'sm',
      showClose: false,
      onClose: onCancel
    });
  }
};

// ── Data Table Component ──
function createDataTable(containerId, options = {}) {
  const { columns = [], data = [], pageSize = 10, searchable = true, sortable = true } = options;
  const container = document.getElementById(containerId);
  if (!container) return;

  let currentPage = 1;
  let filteredData = [...data];
  let sortCol = null;
  let sortDir = 'asc';

  function render() {
    const start = (currentPage - 1) * pageSize;
    const pageData = filteredData.slice(start, start + pageSize);
    const totalPages = Math.ceil(filteredData.length / pageSize);

    let html = '';
    if (searchable) {
      html += `<div class="dt-toolbar">
        <div class="dt-search">
          <i class="fas fa-search"></i>
          <input type="text" placeholder="Search..." class="dt-search-input" id="${containerId}-search">
        </div>
        <span class="dt-info">Showing ${start + 1}-${Math.min(start + pageSize, filteredData.length)} of ${filteredData.length}</span>
      </div>`;
    }

    html += '<div class="dt-table-wrap"><table class="dt-table"><thead><tr>';
    columns.forEach((col, i) => {
      const sortIcon = sortCol === i ? (sortDir === 'asc' ? ' <i class="fas fa-sort-up"></i>' : ' <i class="fas fa-sort-down"></i>') : ' <i class="fas fa-sort" style="opacity:0.3"></i>';
      html += `<th data-col="${i}" class="${sortable ? 'dt-sortable' : ''}">${col.label}${sortable ? sortIcon : ''}</th>`;
    });
    html += '</tr></thead><tbody>';

    if (pageData.length === 0) {
      html += `<tr><td colspan="${columns.length}" class="dt-empty">No records found</td></tr>`;
    } else {
      pageData.forEach(row => {
        html += '<tr>';
        columns.forEach(col => {
          const val = col.render ? col.render(row[col.key], row) : (row[col.key] ?? '');
          html += `<td>${val}</td>`;
        });
        html += '</tr>';
      });
    }

    html += '</tbody></table></div>';

    if (totalPages > 1) {
      html += '<div class="dt-pagination">';
      html += `<button class="dt-page-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}"><i class="fas fa-chevron-left"></i></button>`;
      for (let i = 1; i <= totalPages; i++) {
        if (totalPages > 7 && Math.abs(i - currentPage) > 2 && i !== 1 && i !== totalPages) {
          if (i === currentPage - 3 || i === currentPage + 3) html += '<span class="dt-dots">...</span>';
          continue;
        }
        html += `<button class="dt-page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
      }
      html += `<button class="dt-page-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}"><i class="fas fa-chevron-right"></i></button>`;
      html += '</div>';
    }

    container.innerHTML = html;

    // Bind events
    const searchInput = container.querySelector(`#${containerId}-search`);
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        filteredData = data.filter(row => columns.some(col => String(row[col.key] ?? '').toLowerCase().includes(q)));
        currentPage = 1;
        render();
      });
    }

    container.querySelectorAll('.dt-page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentPage = parseInt(btn.dataset.page);
        render();
      });
    });

    if (sortable) {
      container.querySelectorAll('.dt-sortable').forEach(th => {
        th.addEventListener('click', () => {
          const col = parseInt(th.dataset.col);
          if (sortCol === col) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
          else { sortCol = col; sortDir = 'asc'; }
          const key = columns[col].key;
          filteredData.sort((a, b) => {
            const va = a[key] ?? '', vb = b[key] ?? '';
            const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
            return sortDir === 'asc' ? cmp : -cmp;
          });
          render();
        });
      });
    }
  }

  render();
  return {
    refresh(newData) { data.length = 0; data.push(...newData); filteredData = [...data]; currentPage = 1; render(); }
  };
}

// ── Form Validation Framework ──
const PEForm = {
  validate(formEl) {
    let valid = true;
    const errors = [];
    
    formEl.querySelectorAll('[required]').forEach(input => {
      input.classList.remove('input-error');
      if (!input.value.trim()) {
        input.classList.add('input-error');
        valid = false;
        errors.push(`${input.getAttribute('aria-label') || input.name || 'Field'} is required`);
      }
    });

    formEl.querySelectorAll('[type="email"]').forEach(input => {
      if (input.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
        input.classList.add('input-error');
        valid = false;
        errors.push('Invalid email address');
      }
    });

    formEl.querySelectorAll('[type="tel"]').forEach(input => {
      if (input.value && !/^[6-9]\d{9}$/.test(input.value.replace(/\D/g, '').slice(-10))) {
        input.classList.add('input-error');
        valid = false;
        errors.push('Invalid phone number');
      }
    });

    return { valid, errors };
  },

  async submitToSupabase(formEl, tableName, extraData = {}) {
    const { valid, errors } = this.validate(formEl);
    if (!valid) {
      PEToast.error(errors[0]);
      return { success: false, errors };
    }

    const formData = new FormData(formEl);
    const data = { ...Object.fromEntries(formData), ...extraData };

    try {
      const { error } = await supabase.from(tableName).insert(data);
      if (error) throw error;
      PEToast.success('Submitted successfully!');
      formEl.reset();
      return { success: true };
    } catch (err) {
      PEToast.error('Submission failed. Please try again.');
      console.error('Form submission error:', err);
      return { success: false, error: err };
    }
  }
};

// ── Loading Skeleton ──
function showSkeleton(container, count = 3, type = 'card') {
  let html = '';
  for (let i = 0; i < count; i++) {
    if (type === 'card') {
      html += `<div class="skeleton-card"><div class="skeleton skeleton-img"></div><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text short"></div></div>`;
    } else if (type === 'row') {
      html += `<div class="skeleton-row"><div class="skeleton skeleton-avatar"></div><div class="skeleton-col"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text"></div></div></div>`;
    }
  }
  if (typeof container === 'string') container = document.getElementById(container);
  if (container) container.innerHTML = html;
}

// ── Back to Top Button ──
function initBackToTop() {
  const btn = document.createElement('button');
  btn.className = 'back-to-top';
  btn.id = 'back-to-top';
  btn.setAttribute('aria-label', 'Back to Top');
  btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ── WhatsApp Floating Button ──
function initWhatsAppFloat() {
  const wa = document.createElement('a');
  wa.className = 'whatsapp-float';
  wa.href = 'https://wa.me/917250191427?text=Hello%20Prajapati%20Electrical!%20I%20need%20help.';
  wa.target = '_blank';
  wa.rel = 'noopener';
  wa.setAttribute('aria-label', 'Chat on WhatsApp');
  wa.innerHTML = '<i class="fab fa-whatsapp"></i>';
  document.body.appendChild(wa);
}

// ── Cookie Consent ──
function initCookieConsent() {
  if (localStorage.getItem('pe-cookie-consent')) return;
  const bar = document.createElement('div');
  bar.className = 'cookie-bar';
  bar.innerHTML = `
    <div class="cookie-bar-inner">
      <p><i class="fas fa-cookie-bite"></i> We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies. <a href="cookie-policy.html">Learn more</a></p>
      <button class="btn btn-primary cookie-accept-btn" id="cookie-accept">Accept</button>
    </div>
  `;
  document.body.appendChild(bar);
  requestAnimationFrame(() => bar.classList.add('show'));
  document.getElementById('cookie-accept').addEventListener('click', () => {
    localStorage.setItem('pe-cookie-consent', 'true');
    bar.classList.remove('show');
    setTimeout(() => bar.remove(), 400);
  });
}

// ── Initialize Page ──
function initPage(activePage = '') {
  // Inject nav (only if not already present — some pages may have inline nav)
  const existingNav = document.querySelector('.navbar');
  if (!existingNav) {
    const navTarget = document.getElementById('pe-nav') || document.body.firstChild;
    const navWrapper = document.createElement('div');
    navWrapper.innerHTML = generateNavigation(activePage);
    if (document.getElementById('pe-nav')) {
      document.getElementById('pe-nav').innerHTML = generateNavigation(activePage);
    } else {
      document.body.insertBefore(navWrapper, document.body.firstChild);
    }
  }

  // Inject footer (only if not already present)
  const existingFooter = document.querySelector('footer.footer');
  if (!existingFooter) {
    const footerTarget = document.getElementById('pe-footer');
    if (footerTarget) {
      footerTarget.innerHTML = generateFooter();
    } else {
      const footerWrapper = document.createElement('div');
      footerWrapper.innerHTML = generateFooter();
      document.body.appendChild(footerWrapper.firstElementChild);
    }
  }

  // Init utilities
  initBackToTop();
  initWhatsAppFloat();
  initCookieConsent();
}
