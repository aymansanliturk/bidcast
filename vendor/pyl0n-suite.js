/* pyl0n-suite.js — shared SuiteManager for the PYL0N suite
   Central synchronisation utility: manages bidcast_suite_sync (project
   meta, phases, team) and bidcast_logo / bidcast_customer_logo.
   Included in every tool via <script src="vendor/pyl0n-suite.js">.
*/
const SuiteManager = (() => {
  const SYNC_KEY          = 'bidcast_suite_sync';
  const LOGO_KEY          = 'bidcast_logo';
  const CUSTOMER_LOGO_KEY = 'bidcast_customer_logo';
  const BANNER_ID         = 'pyl0n-quota-banner';
  const QUOTA_WARN_BYTES  = 4.5 * 1024 * 1024; // 4.5 MB

  /* ── Storage quota banner ─────────────────────────────────────────────── */

  function checkStorageQuota(error) {
    const isQuotaError = !!error && (
      error.code === 22 ||
      error.code === 1014 ||
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    );

    let total = 0;
    try {
      for (let x in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, x)) {
          total += (localStorage[x].length + x.length) * 2;
        }
      }
    } catch (_e) { /* noop if storage inaccessible */ }

    const nearLimit = total > QUOTA_WARN_BYTES;

    if (!isQuotaError && !nearLimit) return;

    // Don't inject twice
    if (document.getElementById(BANNER_ID)) return;

    const msg = isQuotaError
      ? '⚠️ STORAGE CRITICALLY FULL: Your last change could not be saved! Export your data to JSON immediately to prevent data loss, then clear your browser data.'
      : '⚠️ Storage limit approaching (Over 4.5MB used). Export older projects to JSON and delete them to free up space.';

    const banner = document.createElement('div');
    banner.id = BANNER_ID;
    banner.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'width:100%',
      'background:#c0392b', 'color:#fff', 'text-align:center',
      'padding:10px 44px 10px 12px',
      "font-family:'DM Sans',sans-serif", 'font-size:13px', 'font-weight:600',
      'z-index:9999', 'box-shadow:0 2px 10px rgba(0,0,0,0.2)', 'box-sizing:border-box',
      'line-height:1.4',
    ].join(';');
    banner.textContent = msg;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.setAttribute('aria-label', 'Dismiss storage warning');
    closeBtn.style.cssText = [
      'position:absolute', 'right:12px', 'top:50%', 'transform:translateY(-50%)',
      'background:none', 'border:none', 'color:#fff', 'font-size:16px',
      'cursor:pointer', 'padding:0 4px', 'line-height:1', 'opacity:0.85',
    ].join(';');
    closeBtn.onmouseover = () => { closeBtn.style.opacity = '1'; };
    closeBtn.onmouseout  = () => { closeBtn.style.opacity = '0.85'; };
    closeBtn.onclick     = () => { banner.remove(); };
    banner.appendChild(closeBtn);

    if (document.body) {
      document.body.insertBefore(banner, document.body.firstChild);
    } else {
      document.addEventListener('DOMContentLoaded', function onReady() {
        document.body.insertBefore(banner, document.body.firstChild);
        document.removeEventListener('DOMContentLoaded', onReady);
      });
    }
  }

  /* ── Suite sync ───────────────────────────────────────────────────────── */

  function read() {
    try { return JSON.parse(localStorage.getItem(SYNC_KEY) || '{}'); }
    catch { return {}; }
  }

  function write(patch, source) {
    try {
      const next = { ...read(), ...patch, _ts: Date.now(), _src: source };
      localStorage.setItem(SYNC_KEY, JSON.stringify(next));
      return next;
    } catch (err) {
      checkStorageQuota(err);
      console.error('SuiteManager.write failed:', err);
      return {};
    }
  }

  /* ── Logo helpers ─────────────────────────────────────────────────────── */

  function getLogo()         { return localStorage.getItem(LOGO_KEY)          || null; }
  function getCustomerLogo() { return localStorage.getItem(CUSTOMER_LOGO_KEY) || null; }

  function setLogo(dataUrl) {
    try {
      localStorage.setItem(LOGO_KEY, dataUrl);
    } catch (err) {
      checkStorageQuota(err);
      console.error('SuiteManager.setLogo failed:', err);
    }
    write({ _logoTs: Date.now() }, 'logo');
  }
  function setCustomerLogo(dataUrl) {
    try {
      localStorage.setItem(CUSTOMER_LOGO_KEY, dataUrl);
    } catch (err) {
      checkStorageQuota(err);
      console.error('SuiteManager.setCustomerLogo failed:', err);
    }
    write({ _logoTs: Date.now() }, 'logo');
  }

  function removeLogo() {
    localStorage.removeItem(LOGO_KEY);
    write({ _logoTs: Date.now() }, 'logo');
  }
  function removeCustomerLogo() {
    localStorage.removeItem(CUSTOMER_LOGO_KEY);
    write({ _logoTs: Date.now() }, 'logo');
  }

  /* ── Cross-tab sync ───────────────────────────────────────────────────── */

  function onUpdate(cb) {
    window.addEventListener('storage', e => {
      if (e.key === SYNC_KEY || e.key === LOGO_KEY || e.key === CUSTOMER_LOGO_KEY) cb(read(), e.key);
    });
  }

  function updateBadge(el) {
    if (!el) return;
    const sync = read();
    if (sync._ts) {
      const s = Math.round((Date.now() - sync._ts) / 1000);
      el.textContent = '↻ Synced ' + (s < 5 ? 'just now' : s < 60 ? s + 's ago' : Math.round(s / 60) + 'm ago');
      el.style.display = 'inline';
    }
  }

  /* ── Migration (pyl0n_ → bidcast_) ───────────────────────────────────── */

  function migrate() {
    const toMove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('pyl0n_')) toMove.push(k);
    }
    toMove.forEach(k => {
      const newKey = 'bidcast_' + k.slice('pyl0n_'.length);
      if (!localStorage.getItem(newKey)) localStorage.setItem(newKey, localStorage.getItem(k));
      localStorage.removeItem(k);
    });
  }

  /* ── Proactive quota check on every page load ─────────────────────────── */

  document.addEventListener('DOMContentLoaded', function () {
    checkStorageQuota();
  });

  return {
    read, write,
    getLogo, setLogo, removeLogo,
    getCustomerLogo, setCustomerLogo, removeCustomerLogo,
    onUpdate, updateBadge, migrate,
    checkStorageQuota,
  };
})();

/* ── PWA Service Worker registration ─────────────────────────────────── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('./sw.js').catch(function (err) {
      console.warn('PYL0N SW registration failed:', err);
    });
  });
}
