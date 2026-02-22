// ════════════════════════════════════════════════════════════════════════
//  lang.js – Sprachumschalter, Burger-Menü, CountUp, Experience-Bars
//  Wird von index.html, impressum.html und datenschutz.html eingebunden.
//  Voraussetzung: i18n.js muss zuerst geladen sein (liefert window.T).
// ════════════════════════════════════════════════════════════════════════

// ── Sprachumschalter ─────────────────────────────────────────────────────
let currentLang = 'de';

function setLang(lang) {
  if (!T[lang]) return;
  const t = T[lang];
  currentLang = lang;

  // HTML lang-Attribut
  const htmlRoot = document.getElementById('htmlRoot');
  if (htmlRoot) htmlRoot.lang = t.htmlLang;

  // Seitentitel & Meta-Description
  if (t['page.title'])  document.title = t['page.title'];
  if (t['imp.page.title'] && document.body.dataset.page === 'impressum')
    document.title = t['imp.page.title'];
  if (t['dse.page.title'] && document.body.dataset.page === 'datenschutz')
    document.title = t['dse.page.title'];

  const metaEl = document.getElementById('metaDesc');
  if (metaEl) {
    const metaKey = document.body.dataset.page === 'impressum' ? 'imp.page.meta'
                  : document.body.dataset.page === 'datenschutz' ? 'dse.page.meta'
                  : 'page.meta';
    if (t[metaKey]) metaEl.setAttribute('content', t[metaKey]);
  }

  // Alle data-i18n Elemente
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key] !== undefined) el.innerHTML = t[key];
  });

  // Alle data-i18n-href Links (z.B. mailto mit übersetztem Subject)
  document.querySelectorAll('[data-i18n-href]').forEach(el => {
    const key = el.getAttribute('data-i18n-href');
    if (t[key] !== undefined) el.href = t[key];
  });

  // Burger aria-label
  const burgerBtn = document.getElementById('burgerBtn');
  if (burgerBtn && t['burger.aria'])
    burgerBtn.setAttribute('aria-label', t['burger.aria']);

  // Footer-Links: Impressum ↔ Imprint / Datenschutz ↔ Privacy Policy
  // (schon über data-i18n abgedeckt, aber href zur richtigen Seite zeigen)
  // Kein Seitenwechsel nötig – localStorage sorgt dafür, dass
  // impressum.html / datenschutz.html direkt in der richtigen Sprache laden.

  // Alle Sprachbuttons aktualisieren (Desktop + Mobile)
  document.querySelectorAll('.lang-btn, .mobile-lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  // Präferenz speichern
  try { localStorage.setItem('cpq-lang', lang); } catch (e) {}
}

// ── Burger-Menü ──────────────────────────────────────────────────────────
(function () {
  const burgerBtn = document.getElementById('burgerBtn');
  const mobileNav = document.getElementById('mobileNav');
  if (!burgerBtn || !mobileNav) return;

  burgerBtn.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('open');
    burgerBtn.classList.toggle('open', isOpen);
    burgerBtn.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Klick auf Hintergrund schließt Overlay
  mobileNav.addEventListener('click', e => {
    if (e.target === mobileNav) closeMobileNav();
  });
})();

function closeMobileNav() {
  const burgerBtn = document.getElementById('burgerBtn');
  const mobileNav = document.getElementById('mobileNav');
  if (!mobileNav) return;
  mobileNav.classList.remove('open');
  if (burgerBtn) {
    burgerBtn.classList.remove('open');
    burgerBtn.setAttribute('aria-expanded', 'false');
  }
  document.body.style.overflow = '';
}

// ── CountUp-Animation (Stats) ────────────────────────────────────────────
(function () {
  if (!document.querySelector('.stat-num[data-target]')) return;

  function animateCount(el, target, suffix, duration) {
    const startTime = performance.now();
    function update(now) {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease     = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(ease * target) + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        animateCount(el, parseFloat(el.dataset.target), el.dataset.suffix || '', 3000);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.stat-num[data-target]').forEach(el => observer.observe(el));
})();

// ── Experience-Bars ──────────────────────────────────────────────────────
(function () {
  if (!document.querySelector('.exp-bar')) return;

  const barObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      entry.target.querySelectorAll('.exp-bar').forEach(bar => {
        bar.style.setProperty('--bar-w', '0%');
        if (entry.isIntersecting) {
          requestAnimationFrame(() => requestAnimationFrame(() => {
            bar.style.setProperty('--bar-w', bar.dataset.width + '%');
          }));
        }
      });
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.exp-chart').forEach(el => barObserver.observe(el));
})();

// ── Jahreszahl im Footer ─────────────────────────────────────────────────
const yearEl = document.getElementById('y');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ── Init: gespeicherte Sprache laden ────────────────────────────────────
(function () {
  try {
    const saved = localStorage.getItem('cpq-lang');
    if (saved && T[saved]) setLang(saved);
  } catch (e) {}
})();
