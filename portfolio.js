document.addEventListener('DOMContentLoaded', () => {
  initFilmStillFallback();
  initAmbientBackground();
  initBrandEmblem();
  initContactEmail();
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('primary-nav');
  if (toggle && nav) {
    toggle.hidden = false;
    const headerInner = toggle.closest('.header-inner') || nav;
    const closeNav = (restoreFocus = false) => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation');
      if (restoreFocus) toggle.focus();
    };
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(expanded));
      toggle.setAttribute('aria-label', expanded ? 'Close navigation' : 'Open navigation');
      nav.classList.toggle('is-open', expanded);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) closeNav(true);
    });
    document.addEventListener('click', event => {
      if (nav.classList.contains('is-open') && !headerInner.contains(event.target)) closeNav(false);
    });
    nav.addEventListener('click', event => {
      if (event.target.closest('a') && nav.classList.contains('is-open')) closeNav(false);
    });
  }
  // Keep shared links to the former music homepage useful.
  const routeLegacyMusic = () => {
    if (document.querySelector('.portal-hero') && ['#latest', '#album', '#singles', '#releases'].includes(location.hash)) {
      location.replace('music.html' + (location.hash === '#releases' ? '#singles' : location.hash));
    }
  };
  routeLegacyMusic();
  window.addEventListener('hashchange', routeLegacyMusic);
  const controls = document.querySelector('.film-controls');
  if (!controls) return;
  const cards = [...document.querySelectorAll('.film-card')];
  const count = document.querySelector('.film-count');
  const initialCountText = count.textContent;
  const buttons = [...controls.querySelectorAll('button[data-account]')];
  const applyFilter = (account, updateUrl = false) => {
    const button = buttons.find(item => item.dataset.account === account) || buttons[0];
    if (!button) return;
    const activeAccount = button.dataset.account;
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    cards.forEach(card => { card.hidden = activeAccount !== 'all' && card.dataset.account !== activeAccount; });
    if (activeAccount === 'all') {
      count.textContent = initialCountText;
    } else {
      const visible = cards.filter(card => !card.hidden).length;
      count.textContent = `${visible} videos · ${button.textContent.trim()} · verified ${count.dataset.verifiedLabel}`;
    }
    if (updateUrl) {
      try {
        const url = new URL(location.href);
        if (activeAccount === 'all') url.searchParams.delete('account');
        else url.searchParams.set('account', activeAccount);
        history.replaceState(null, '', url);
      } catch { /* Ignore history errors in restricted contexts. */ }
    }
  };
  controls.hidden = false;
  controls.addEventListener('click', event => {
    const button = event.target.closest('button[data-account]');
    if (!button) return;
    applyFilter(button.dataset.account, true);
  });
  try {
    const requested = new URLSearchParams(location.search).get('account');
    if (requested && buttons.some(item => item.dataset.account === requested && requested !== 'all')) {
      applyFilter(requested, false);
    }
  } catch { /* Ignore URLSearchParams errors. */ }
});

function initFilmStillFallback() {
  document.addEventListener('error', event => {
    const target = event.target;
    if (target && target.classList && (target.classList.contains('film-still-image') || target.classList.contains('film-still-backdrop'))) {
      target.hidden = true;
    }
  }, true);
}

function initAmbientBackground() {
  const canvas = document.getElementById('ambientSparks');
  const button = document.getElementById('ambientToggle');
  const status = document.getElementById('ambientStatus');
  if (!canvas || !button || !status) return;
  const ctx = canvas.getContext('2d');
  const video = document.body.dataset.ambient === 'fire' ? document.getElementById('ambientFireVideo') : null;
  const fire = document.querySelector('.ambient-fire');
  const hero = document.querySelector('.portal-hero');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const storageKey = 'nest-background-paused';
  let userPaused = false;
  try { userPaused = sessionStorage.getItem(storageKey) === 'true'; } catch { /* Storage may be blocked. */ }
  let frame = null;
  let previousTime = null;
  let width = 0;
  let height = 0;
  let lastWidth = 0;
  let sparks = [];
  let fireVisible = true;
  let playPending = false;
  let autoplayBlocked = false;
  let fireFailed = false;

  const createGlowSprites = () => {
    if (!ctx || typeof document.createElement !== 'function' || typeof ctx.drawImage !== 'function') return null;
    const makeSprite = (rgb) => {
      const sprite = document.createElement('canvas');
      sprite.width = 24;
      sprite.height = 24;
      const sctx = sprite.getContext('2d');
      if (!sctx) return null;
      const grad = sctx.createRadialGradient(12, 12, 0, 12, 12, 12);
      grad.addColorStop(0, `rgba(${rgb},0.55)`);
      grad.addColorStop(0.4, `rgba(${rgb},0.18)`);
      grad.addColorStop(1, `rgba(${rgb},0)`);
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, 24, 24);
      return sprite;
    };
    const soft = makeSprite('255,226,161');
    const warm = makeSprite('255,179,75');
    return soft && warm ? { '#ffe2a1': soft, '#ffb34b': warm } : null;
  };
  const glowSprites = createGlowSprites();

  const enabled = () => !userPaused && !reducedMotion.matches && !autoplayBlocked;
  const shouldPlayFire = () => enabled() && !document.hidden && fireVisible && !fireFailed;

  function draw(delta) {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    for (const spark of sparks) {
      spark.y -= spark.speed * delta;
      spark.phase += delta * spark.drift;
      spark.x += (Math.sin(spark.phase) * 12 + spark.wind) * delta;
      if (spark.y < -12) { spark.y = height + 12; spark.x = Math.random() * width; }
      if (spark.x < -12) spark.x = width + 12;
      if (spark.x > width + 12) spark.x = -12;
      ctx.globalAlpha = spark.alpha * (0.85 + Math.sin(spark.phase) * 0.15);
      const glow = glowSprites && glowSprites[spark.color];
      if (glow) ctx.drawImage(glow, spark.x - 10, spark.y + spark.length * 0.5 - 10, 20, 20);
      ctx.strokeStyle = spark.color;
      ctx.lineWidth = spark.size;
      ctx.beginPath();
      ctx.moveTo(spark.x, spark.y);
      ctx.lineTo(spark.x - 1.5, spark.y + spark.length);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function render(time) {
    const delta = previousTime === null ? 0 : Math.min((time - previousTime) / 1000, 0.05);
    previousTime = time;
    draw(delta);
    frame = requestAnimationFrame(render);
  }

  function positionFire() {
    if (!fire || !hero) return;
    const bounds = hero.getBoundingClientRect();
    fire.style.top = `${bounds.top + window.scrollY}px`;
    fire.style.height = `${bounds.height}px`;
  }

  function resize(force = false) {
    const nextWidth = window.innerWidth;
    const nextHeight = window.innerHeight;
    if (!force && lastWidth !== 0 && nextWidth === lastWidth && Math.abs(nextHeight - height) < 160) {
      positionFire();
      return;
    }
    lastWidth = nextWidth;
    width = nextWidth;
    height = nextHeight;
    const scale = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    if (ctx) ctx.setTransform(scale, 0, 0, scale, 0, 0);
    sparks = Array.from({ length: width < 600 ? 32 : 72 }, () => ({
      x: Math.random() * width, y: Math.random() * height,
      speed: 28 + Math.random() * 46, wind: 4 + Math.random() * 10,
      phase: Math.random() * Math.PI * 2, drift: 0.8 + Math.random(),
      size: 0.8 + Math.random() * 1.2, length: 2 + Math.random() * 4,
      alpha: 0.35 + Math.random() * 0.5,
      color: Math.random() > 0.7 ? '#ffe2a1' : '#ffb34b'
    }));
    if (enabled() && !document.hidden) draw(0);
    positionFire();
  }

  function sync() {
    const running = enabled() && !document.hidden;
    if (ctx && running && frame === null) frame = requestAnimationFrame(render);
    if (!running && frame !== null) {
      cancelAnimationFrame(frame);
      frame = null;
      previousTime = null;
    }
    if (reducedMotion.matches && ctx) ctx.clearRect(0, 0, width, height);
    canvas.dataset.motion = running && ctx ? 'running' : 'paused';
    button.hidden = !ctx && (!video || fireFailed);
    button.disabled = reducedMotion.matches;
    button.textContent = reducedMotion.matches ? 'Motion reduced' : enabled() ? 'Pause background' : 'Play background';
    button.title = reducedMotion.matches ? 'Background animation is off for reduced motion.' : '';
    button.setAttribute('aria-pressed', String(enabled()));
    status.textContent = autoplayBlocked ? 'Automatic playback was blocked. Press Play background to start.'
      : fireFailed ? 'Fire background unavailable. Sparks can still be played or paused.' : '';
    if (!video) return;
    if (!shouldPlayFire()) { video.pause(); return; }
    if (!video.paused || playPending) return;
    if (!video.getAttribute('src')) video.setAttribute('src', video.dataset.src);
    video.muted = true;
    playPending = true;
    video.play().then(() => {
      playPending = false;
      if (!shouldPlayFire()) video.pause();
    }).catch(error => {
      playPending = false;
      if (!shouldPlayFire() || error.name === 'AbortError') return;
      if (error.name === 'NotAllowedError') autoplayBlocked = true;
      else fireFailed = true;
      sync();
    });
  }

  button.addEventListener('click', () => {
    if (reducedMotion.matches) return;
    userPaused = enabled();
    autoplayBlocked = false;
    try { sessionStorage.setItem(storageKey, String(userPaused)); } catch { /* Keep the control usable without storage. */ }
    sync();
  });
  if (video) video.addEventListener('error', () => { fireFailed = true; sync(); });
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', () => {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    previousTime = null;
    if (video) video.pause();
  });
  window.addEventListener('pageshow', sync);
  reducedMotion.addEventListener('change', () => { resize(true); sync(); });
  window.addEventListener('resize', () => resize());
  if (video && hero && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      fireVisible = entries[0].isIntersecting;
      sync();
    });
    observer.observe(hero);
  }
  if (video && hero && 'ResizeObserver' in window) {
    new ResizeObserver(positionFire).observe(hero);
    new ResizeObserver(positionFire).observe(document.querySelector('.portfolio-header'));
  }
  resize(true);
  sync();
}

/* ==========================================================================
   12. Header Emblem - spins, and shows the next image each time round
   ========================================================================== */
function initBrandEmblem() {
  const emblem = document.querySelector('.brand-emblem');
  if (!emblem) return;

  const faces = emblem.querySelectorAll('.brand-face');
  if (faces.length < 2) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const canvas = document.getElementById('ambientSparks');
  const isPaused = () => document.hidden || reducedMotion.matches || (canvas && canvas.dataset.motion === 'paused');

  let current = 0;

  emblem.addEventListener('animationend', () => emblem.classList.remove('is-spinning'));

  setInterval(() => {
    if (isPaused()) return;
    emblem.classList.add('is-spinning');
    // The spin is one second and linear, so at a quarter of the way round the
    // emblem is edge-on: swap the image there, where the change cannot be seen.
    setTimeout(() => {
      if (isPaused()) {
        emblem.classList.remove('is-spinning');
        return;
      }
      faces[current].classList.remove('is-active');
      current = (current + 1) % faces.length;
      faces[current].classList.add('is-active');
    }, 250);
  }, 4000);
}

/* The contact address is stored split across data attributes and assembled here, so the
   literal string never appears in the served HTML. This stops naive regex harvesters only
   — a scraper that runs JavaScript still sees it. The <noscript> block beside the link
   carries a readable fallback, because this site works without JavaScript. */
function initContactEmail() {
  const line = document.getElementById('contactJs');
  if (!line) return;
  const link = line.querySelector('a.contact-email');
  if (!link) return;
  const user = link.dataset.u;
  const domain = link.dataset.d;
  if (!user || !domain) return;
  const address = user + String.fromCharCode(64) + domain;
  link.href = 'mailto:' + address;
  link.textContent = address;
  line.hidden = false;
}
