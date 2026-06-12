/* ============================================
   PRAJAPATI ELECTRICAL — Products Page Logic
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {

  // ── Update nav auth state ──
  updateNavAuth();

  // ── Set current year ──
  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ── Theme toggle ──
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = themeToggle ? themeToggle.querySelector('i') : null;

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pe-theme', theme);
    if (themeIcon) {
      themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
  }

  const savedTheme = localStorage.getItem('pe-theme');
  if (savedTheme) setTheme(savedTheme);
  else if (window.matchMedia('(prefers-color-scheme: dark)').matches) setTheme('dark');

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  // ── Sticky navbar ──
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
  if (navbar && window.scrollY > 60) navbar.classList.add('scrolled');

  // ── Mobile menu ──
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('open');
      document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // ── Back to top ──
  const backToTop = document.getElementById('back-to-top');
  window.addEventListener('scroll', () => {
    if (backToTop) backToTop.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
  if (backToTop) backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // ══════════════════════════════════════
  // LOAD DATA
  // ══════════════════════════════════════
  let allProducts = [];
  let allCategories = [];
  let activeCategory = '';

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

      return `
        <div class="product-card-pub">
          <div class="card-img-wrap">
            ${p.image_url
              ? `<img src="${p.image_url}" alt="${p.name}" loading="lazy">`
              : `<div class="card-img-placeholder"><i class="fas fa-image"></i></div>`
            }
            ${p.featured ? '<span class="card-featured"><i class="fas fa-star"></i> Featured</span>' : ''}
            <span class="card-stock-badge ${p.in_stock ? 'in-stock' : 'out-of-stock'}">
              ${p.in_stock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
          <div class="card-body">
            <div class="card-category">${p.categories?.name || 'General'}</div>
            <h3 class="card-name">${p.name}</h3>
            ${p.brand ? `<div class="card-brand">${p.brand}</div>` : ''}
            ${p.description ? `<p class="card-desc">${p.description}</p>` : ''}
            <div class="card-price-row">
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

  // ── Event Listeners ──
  searchInput.addEventListener('input', filterAndRender);
  catSelect.addEventListener('change', () => {
    activeCategory = catSelect.value;
    // Update chips active state
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
