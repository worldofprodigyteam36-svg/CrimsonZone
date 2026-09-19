/**
 * CrimsonZone — app.js
 * Handles section switching, content loading, modal, proxy, cloak, recents.
 */
(function () {
  'use strict';

  // ── Section metadata ──────────────────────────────────
  const SECTIONS = {
    games: {
      label: 'Games',
      api: '/api/games',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="4"/><path d="M7 9v6"/><path d="M4 12h6"/><path d="M17.5 10.5h.01"/><path d="M20.5 13.5h.01"/></svg>`,
    },
    apps: {
      label: 'Apps',
      api: '/api/apps',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>`,
    },
    tools: {
      label: 'Tools',
      api: '/api/tools',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
    },
    proxy: {
      label: 'Proxy',
      api: null,
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    },
  };

  // ── State ─────────────────────────────────────────────
  let currentSection = 'games';
  let allItems = [];

  // ── DOM refs ──────────────────────────────────────────
  const $ = id => document.getElementById(id);
  const grid          = $('itemGrid');
  const sectionTitle  = $('sectionTitle');
  const sectionCount  = $('sectionCount');
  const sectionHeader = $('mainSectionHeader');
  const searchInput   = $('searchInput');
  const emptyState    = $('emptyState');
  const emptyQuery    = $('emptyQuery');
  const errorState    = $('errorState');
  const proxySection  = $('proxySection');
  const modalOverlay  = $('modalOverlay');
  const gameFrame     = $('gameFrame');
  const modalName     = $('modalName');
  const modalIcon     = $('modalIcon');
  const modalNewTab   = $('modalNewTab');
  const modalClose    = $('modalClose');

  // ── Init ──────────────────────────────────────────────
  function init() {
    // Tab clicks — desktop
    document.querySelectorAll('.nav-tab').forEach(btn => {
      btn.addEventListener('click', () => switchSection(btn.dataset.section));
    });

    // Tab clicks — mobile
    document.querySelectorAll('.mobile-tab').forEach(btn => {
      btn.addEventListener('click', () => switchSection(btn.dataset.section));
    });

    // Search
    searchInput.addEventListener('input', debounce(handleSearch, 180));

    // Global keyboard shortcuts
    document.addEventListener('keydown', e => {
      // ⌘K / Ctrl+K → focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
        return;
      }

      // Escape → close modal
      if (e.key === 'Escape') {
        if (modalOverlay.classList.contains('open')) closeModal();
        return;
      }
    });

    // Modal controls
    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', e => {
      if (e.target === modalOverlay) closeModal();
    });
    modalNewTab.addEventListener('click', () => {
      if (gameFrame.src && gameFrame.src !== window.location.href) {
        window.open(gameFrame.src, '_blank');
      }
    });

    // Proxy enter key
    const proxyInput = $('proxyUrl');
    if (proxyInput) {
      proxyInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') goProxy();
      });
    }

    // Navbar scroll shadow
    window.addEventListener('scroll', () => {
      document.getElementById('navbar').style.boxShadow =
        window.scrollY > 8 ? '0 1px 24px rgba(0,0,0,0.5)' : '';
    }, { passive: true });

    // Close dropdown menus when clicking outside
    document.addEventListener('click', e => {
      if (!e.target.closest('#cloakWrap')) {
        const m = $('cloakMenu');
        if (m) m.classList.remove('open');
      }
      if (!e.target.closest('#settingsWrap') && !e.target.closest('#settingsMenu')) {
        const s = $('settingsMenu');
        if (s) s.classList.remove('open');
      }
    });

    // Restore cloak
    restoreCloak();

    // Render recents strip
    renderRecent();

    // Load default section
    loadSection('games');
  }

  // ── Section switching ─────────────────────────────────
  function switchSection(section) {
    if (section === currentSection) return;
    currentSection = section;
    searchInput.value = '';

    document.querySelectorAll('.nav-tab, .mobile-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.section === section);
    });

    if (section === 'proxy') {
      showProxy();
    } else {
      hideProxy();
      loadSection(section);
    }
  }

  // ── Proxy ─────────────────────────────────────────────
  function showProxy() {
    console.log('[DEBUG] showProxy called');
    proxySection.style.display = 'block';
    grid.style.display = 'none';
    sectionHeader.style.display = 'none';
    emptyState.style.display = 'none';
    errorState.style.display = 'none';
  }

  function hideProxy() {
    proxySection.style.display = 'none';
    grid.style.display = 'grid';
    sectionHeader.style.display = 'flex';
  }

  window.goProxy = function () {
    let raw = ($('proxyUrl').value || '').trim();
    if (!raw) return;
    if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
      raw = raw.includes('.') && !raw.includes(' ')
        ? 'https://' + raw
        : 'https://duckduckgo.com/?q=' + encodeURIComponent(raw);
    }
    launchProxy(raw);
  };

  window.quickProxy = function (url) {
    $('proxyUrl').value = url;
    launchProxy(url);
  };

  function waitForActiveServiceWorker(registration) {
    if (registration.active) {
      return Promise.resolve(registration);
    }

    return new Promise((resolve, reject) => {
      let worker = registration.installing || registration.waiting;
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Ultraviolet service worker activation timed out.'));
      }, 15000);

      const interval = setInterval(checkRegistration, 100);

      function cleanup() {
        clearTimeout(timeout);
        clearInterval(interval);
        registration.removeEventListener('updatefound', onUpdateFound);
        if (worker) worker.removeEventListener('statechange', checkRegistration);
      }

      function setWorker(nextWorker) {
        if (worker === nextWorker) return;
        if (worker) worker.removeEventListener('statechange', checkRegistration);
        worker = nextWorker;
        if (worker) worker.addEventListener('statechange', checkRegistration);
      }

      function checkRegistration() {
        if (registration.active) {
          cleanup();
          resolve(registration);
          return;
        }

        setWorker(registration.installing || registration.waiting);
        if (worker && worker.state === 'activated') {
          cleanup();
          resolve(registration);
        }
      }

      function onUpdateFound() {
        setWorker(registration.installing || registration.waiting);
        checkRegistration();
      }

      registration.addEventListener('updatefound', onUpdateFound);
      if (worker) worker.addEventListener('statechange', checkRegistration);
      checkRegistration();
    });
  }

  async function ensureServiceWorkerReady() {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker is not supported by this browser.');
    }

    const serviceWorkerUrl = '/uv/sw.js';
    const serviceWorkerScope = '/';
    const expectedWorkerUrl = new URL(serviceWorkerUrl, window.location.href).href;
    const legacyRegistration = await navigator.serviceWorker.getRegistration('/uv/');
    if (legacyRegistration) {
      await legacyRegistration.unregister();
    }

    let registration = await navigator.serviceWorker.getRegistration(serviceWorkerScope);
    const existingWorker = registration && (registration.active || registration.waiting || registration.installing);
    if (existingWorker && existingWorker.scriptURL !== expectedWorkerUrl) {
      await registration.unregister();
      registration = null;
    }

    if (!registration) {
      registration = await navigator.serviceWorker.register(serviceWorkerUrl, { scope: serviceWorkerScope });
    }

    registration = await waitForActiveServiceWorker(registration);

    if (!navigator.serviceWorker.controller) {
      const reloadKey = 'cz_uv_controller_reload';
      if (!sessionStorage.getItem(reloadKey)) {
        sessionStorage.setItem(reloadKey, '1');
        location.reload();
        throw new Error('Reloading once so the proxy service worker can control this page.');
      }
    } else {
      sessionStorage.removeItem('cz_uv_controller_reload');
    }

    return registration;
  }

  function launchProxy(url) {
    const wrap     = $('proxyFrameWrap');
    const frame    = $('proxyFrame');
    const urlLabel = $('proxyFrameUrl');
    const status   = $('proxyStatus');

    console.log('[DEBUG] launchProxy called with:', url);
    console.log('[DEBUG] __uv$config available:', typeof __uv$config !== 'undefined');
    console.log('[DEBUG] Ultraviolet available:', typeof Ultraviolet !== 'undefined');

    if (!wrap || !frame) {
      console.error('[ERROR] Proxy frame elements are missing.');
      return;
    }

    if (urlLabel) urlLabel.textContent = url;
    if (status) {
      status.textContent = 'Starting proxy...';
      status.style.display = 'block';
      status.style.color = '';
    }
    wrap.style.display = 'block';
    wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });

    ensureServiceWorkerReady().then(() => {
      console.log('[DEBUG] Service Worker ready');
      if (typeof __uv$config === 'undefined') {
        console.error('[ERROR] __uv$config not defined!');
        if (status) {
          status.textContent = 'Error: Ultraviolet config not loaded.';
          status.style.display = 'block';
          status.style.color = '#ff6b6b';
        }
        return;
      }
      const encoded = '/uv/service/' + __uv$config.encodeUrl(url);
      console.log('[DEBUG] Encoded URL:', encoded);
      frame.removeAttribute('srcdoc');
      frame.src = encoded;
      if (status) status.style.display = 'none';
    }).catch(err => {
      console.error('[ERROR] Service Worker not ready:', err);
      if (status) {
        status.textContent = 'Error: Service Worker failed to load. Try refreshing the page once.';
        status.style.display = 'block';
        status.style.color = '#ff6b6b';
      }
    });
  }

  window.closeProxy = function () {
    $('proxyFrame').src = '';
    $('proxyFrame').srcdoc = '';
    $('proxyFrameWrap').style.display = 'none';
  };

  // ── Fullscreen ────────────────────────────────────────────
  window.toggleFullscreen = function (frameId, btnId) {
    const frame = document.getElementById(frameId);
    const btn   = document.getElementById(btnId);

    const expandIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`;
    const shrinkIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/></svg>`;

    if (!document.fullscreenElement) {
      frame.requestFullscreen().then(() => {
        if (btn) btn.innerHTML = shrinkIcon;
      }).catch(err => {
        console.warn('[Fullscreen] Failed:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        if (btn) btn.innerHTML = expandIcon;
      });
    }
  };

  // Keep button icon in sync if user presses Escape to exit fullscreen
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
      const expandIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`;
      ['proxyFullscreenBtn', 'modalFullscreenBtn'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.innerHTML = expandIcon;
      });
    }
  });
  
  // ── Load section data ─────────────────────────────────
  async function loadSection(section) {
    const meta = SECTIONS[section];
    sectionTitle.innerHTML = meta.icon + ' ' + meta.label;
    sectionCount.textContent = 'Loading...';
    showSkeletons();
    emptyState.style.display = 'none';
    errorState.style.display = 'none';

    try {
      const res = await fetch(meta.api);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      allItems = CZParser.parseDataArray(json.data || []);
      allItems.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      renderItems(allItems);
      sectionCount.textContent = allItems.length + ' items';
    } catch (err) {
      console.error('Load error:', err);
      grid.innerHTML = '';
      errorState.style.display = 'flex';
      sectionCount.textContent = 'Error';
    }
  }

  // ── Render grid ───────────────────────────────────────
  function renderItems(items) {
    grid.innerHTML = '';
    emptyState.style.display = 'none';
    errorState.style.display = 'none';

    if (!items.length) {
      emptyState.style.display = 'flex';
      emptyQuery.textContent = searchInput.value;
      return;
    }

    const frag = document.createDocumentFragment();
    items.forEach((item, i) => frag.appendChild(createCard(item, i)));
    grid.appendChild(frag);
  }

  function createCard(item, index) {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.animationDelay = Math.min(index * 35, 380) + 'ms';

    const nameSafe = esc(item.name);
    const iconSrc  = esc(item.icon || '');
    const thumbSrc = esc(item.thumbnail || '');
    const q = searchInput.value.trim();

    card.innerHTML = `
      <div class="card-thumb">
        <img
          src="${thumbSrc}"
          alt="${nameSafe}"
          loading="lazy"
          onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
        />
        <div class="thumb-placeholder">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="3"/>
            <circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
          </svg>
        </div>
        <div class="card-overlay"></div>
        <div class="card-play">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </div>
      </div>
      <div class="card-info">
        <img
          class="card-icon"
          src="${iconSrc}"
          alt=""
          loading="lazy"
          onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
        />
        <div class="card-icon-placeholder">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="6" width="20" height="12" rx="4"/>
          </svg>
        </div>
        <span class="card-name">${highlight(nameSafe, q)}</span>
      </div>
    `;

    card.addEventListener('click', () => openItem(item));
    return card;
  }

  // ── Open item in modal ────────────────────────────────
  window.openItem = function (item) {
    if (!item.file) return;

    modalName.textContent = item.name;
    modalIcon.src = item.icon || '';
    modalIcon.style.display = item.icon ? '' : 'none';
    gameFrame.src = item.file;

    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    modalNewTab.onclick = () => window.open(item.file, '_blank');

    addToRecent(item);
  };

  function closeModal() {
    modalOverlay.classList.remove('open');
    gameFrame.src = '';
    document.body.style.overflow = '';
  }

  // ── Search ────────────────────────────────────────────
  function handleSearch() {
    const q = searchInput.value.trim().toLowerCase();
    const filtered = q
      ? allItems.filter(item => (item.name || '').toLowerCase().includes(q))
      : allItems;
    renderItems(filtered);
    sectionCount.textContent = filtered.length + ' items';
  }

  window.clearSearch = function () {
    searchInput.value = '';
    handleSearch();
  };

  window.retryLoad = function () {
    hideProxy();
    loadSection(currentSection);
  };

  // ── Recently played ───────────────────────────────────
  const RECENT_KEY = 'cz_recent';
  const MAX_RECENT = 10;

  function addToRecent(item) {
    let list = getRecent().filter(r => r.name !== item.name);
    list.unshift({ name: item.name, icon: item.icon || '', file: item.file });
    if (list.length > MAX_RECENT) list = list.slice(0, MAX_RECENT);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch {}
    renderRecent();
  }

  function getRecent() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
  }

  function renderRecent() {
    const list    = getRecent();
    const section = $('recentSection');
    const strip   = $('recentStrip');
    if (!section || !strip) return;

    if (!list.length) { section.style.display = 'none'; return; }

    section.style.display = 'block';
    strip.innerHTML = list.map(r => `
      <div class="recent-chip" onclick='openItem(${JSON.stringify(r)})'>
        ${r.icon
          ? `<img src="${esc(r.icon)}" alt="" onerror="this.style.display='none'">`
          : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>`
        }
        ${esc(r.name)}
      </div>
    `).join('');
  }

  window.clearRecent = function () {
    try { localStorage.removeItem(RECENT_KEY); } catch {}
    renderRecent();
  };

  // ── Tab Cloak ─────────────────────────────────────────
  window.toggleCloakMenu = function () {
    $('cloakMenu').classList.toggle('open');
  };

  window.setCloak = function (id, title, favicon) {
    document.title = title;
    let link = document.querySelector("link[rel~='icon']");
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.href = favicon;
    try { localStorage.setItem('cz_cloak', JSON.stringify({ id, title, favicon })); } catch {}
    $('cloakMenu').classList.remove('open');
    showToast('Tab disguised as ' + title);
  };

  window.resetCloak = function () {
    document.title = 'CrimsonZone';
    let link = document.querySelector("link[rel~='icon']");
    if (link) link.href = '/assets/favicon.png';
    try { localStorage.removeItem('cz_cloak'); } catch {}
    $('cloakMenu').classList.remove('open');
    showToast('Tab restored');
  };

  function restoreCloak() {
    try {
      const saved = localStorage.getItem('cz_cloak');
      if (!saved) return;
      const { title, favicon } = JSON.parse(saved);
      document.title = title;
      let link = document.querySelector("link[rel~='icon']");
      if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
      link.href = favicon;
    } catch {}
  }

  // ── Toast ─────────────────────────────────────────────
  function showToast(msg) {
    const container = $('toastContainer');
    if (!container) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    container.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transition = 'opacity 0.3s';
      setTimeout(() => t.remove(), 300);
    }, 2200);
  }

  // ── Helpers ───────────────────────────────────────────
  function showSkeletons() {
    grid.style.display = 'grid';
    grid.innerHTML = Array(8).fill('<div class="card skeleton"></div>').join('');
  }

  function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function highlight(name, query) {
    if (!query) return name;
    const re = new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    return name.replace(re, '<mark>$1</mark>');
  }

  // ── Boot ──────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);
})();
