/**
 * Pilgrim's Nest — Official Interactive Script
 * Domain: pilgrimsnest.org
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeroVideo();
  initParticles();
  initWaitlist();
  initReflections();
  initReleases();
  initHome();
  initAlbums();
  initLyrics();
  initBrandEmblem();
  initAccordion();
  initContactModal();
  initHeroLogoParallax();
});

/* ==========================================================================
   0. Hero Ambient Video
   ========================================================================== */function initHeroVideo() {
  const video = document.getElementById('heroVideo');
  if (!video) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    // Do not autoplay for reduced-motion visitors. Remove the source so the
    // browser never fetches the 718 KB asset for them at all.
    video.removeAttribute('autoplay');
    video.removeAttribute('src');
    video.load();
    return;
  }

  // The first play() is often refused: it can run before the browser has
  // decided the page may autoplay. The old code gave up after that one try,
  // which left the loop frozen on its first frame. Keep asking instead, at
  // each moment the browser is likely to say yes.
  video.muted = true;
  video.loop = true;

  const tryPlay = () => {
    if (!video.paused) return;
    const attempt = video.play();
    if (attempt && typeof attempt.catch === 'function') attempt.catch(() => {});
  };

  tryPlay();
  video.addEventListener('canplay', tryPlay);
  window.addEventListener('load', tryPlay);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') tryPlay();
  });
  ['pointerdown', 'touchstart', 'keydown', 'scroll'].forEach((type) => {
    window.addEventListener(type, tryPlay, { once: true, passive: true });
  });

  // Belt and braces for browsers that ignore the loop attribute
  video.addEventListener('ended', () => {
    video.currentTime = 0;
    tryPlay();
  });
}

/* ==========================================================================
   1. Ambient Starlight & Floating Embers Canvas
   ========================================================================== */
function initParticles() {
  const canvas = document.getElementById('starCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resize);
  resize();

  // Generate particle mix: celestial stars + warm hearth embers
  const count = window.innerWidth < 768 ? 45 : 90;
  for (let i = 0; i < count; i++) {
    const isEmber = Math.random() > 0.65;
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: isEmber ? Math.random() * 2.2 + 0.8 : Math.random() * 1.5 + 0.5,
      speedX: (Math.random() - 0.5) * (isEmber ? 0.3 : 0.1),
      speedY: isEmber ? -(Math.random() * 0.4 + 0.15) : (Math.random() - 0.5) * 0.1,
      alpha: Math.random() * 0.7 + 0.2,
      maxAlpha: isEmber ? 0.85 : 0.75,
      pulseSpeed: Math.random() * 0.02 + 0.005,
      pulseDir: 1,
      type: isEmber ? 'ember' : 'star',
      color: isEmber ? 'rgba(245, 158, 11,' : 'rgba(254, 243, 199,'
    });
  }

  // Mouse interaction
  let mouse = { x: -1000, y: -1000, active: false };
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  });
  window.addEventListener('mouseleave', () => {
    mouse.active = false;
  });

  function render() {
    ctx.clearRect(0, 0, width, height);

    for (let p of particles) {
      // Pulse brightness
      p.alpha += p.pulseSpeed * p.pulseDir;
      if (p.alpha > p.maxAlpha) {
        p.alpha = p.maxAlpha;
        p.pulseDir = -1;
      } else if (p.alpha < 0.15) {
        p.alpha = 0.15;
        p.pulseDir = 1;
      }

      if (!prefersReducedMotion) {
        p.x += p.speedX;
        p.y += p.speedY;

        // Wrap around borders
        if (p.y < 0) {
          p.y = height;
          p.x = Math.random() * width;
        } else if (p.y > height) {
          p.y = 0;
        }

        if (p.x < 0) p.x = width;
        else if (p.x > width) p.x = 0;

        // Gentle mouse avoidance
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            p.x += (dx / dist) * 1.5;
            p.y += (dy / dist) * 1.5;
          }
        }
      }

      // Draw particle with glow
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `${p.color} ${p.alpha})`;
      ctx.shadowBlur = p.type === 'ember' ? 8 : 4;
      ctx.shadowColor = p.type === 'ember' ? '#F59E0B' : '#FEF3C7';
      ctx.fill();
    }

    requestAnimationFrame(render);
  }

  render();
}

/* ==========================================================================
   3. Founding Wayfarers Waitlist Form
   ========================================================================== */
function initWaitlist() {
  const form = document.getElementById('waitlistForm');
  const emailInput = document.getElementById('waitlistEmail');
  const submitBtn = document.getElementById('waitlistSubmit');

  if (!form || !emailInput || !submitBtn) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();

    if (!validateEmail(email)) {
      showToast('⚠️ Please provide a valid email address.', 'warning');
      emailInput.focus();
      return;
    }

    // Button loading state
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Sending...</span>`;

    // No backend is connected yet, so nothing is submitted or stored.
    // Say so plainly instead of reporting a success that did not happen.
    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;

      showToast('The Founding Circle list is not connected yet, so your address was not saved. Please return once we announce the opening.', 'warning');
    }, 700);
  });
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ==========================================================================
   4. Wayfarer's Contemplations & Wisdom Rotator
   ========================================================================== */
const reflections = [
  {
    quote: "Sanctuary is not merely a destination at the road's end; it is the stillness we bring into each step of the journey.",
    author: "Wayfarer's Rule"
  },
  {
    quote: "In every walk with nature, one receives far more than he seeks.",
    author: "John Muir"
  },
  {
    quote: "Silence is the language of God, all else is poor translation.",
    author: "Rumi"
  },
  {
    quote: "A journey of a thousand miles begins beneath the sole of a single shoe.",
    author: "Lao Tzu"
  },
  {
    quote: "Tell me, what is it you plan to do with your one wild and precious life?",
    author: "Mary Oliver"
  },
  {
    quote: "It is not the mountain we conquer, but ourselves.",
    author: "Sir Edmund Hillary"
  },
  {
    quote: "The hearth fire warms not only the traveler’s hands, but kindles the kinship of the soul.",
    author: "Pilgrim's Nest Ledger"
  }
];

let currentReflectionIndex = 0;

function initReflections() {
  const textEl = document.getElementById('reflectionText');
  const authorEl = document.getElementById('reflectionAuthor');
  const btn = document.getElementById('reflectBtn');

  if (!textEl || !authorEl || !btn) return;

  btn.addEventListener('click', () => {
    // Fade out
    textEl.style.opacity = '0';
    textEl.style.transform = 'translateY(8px)';
    authorEl.style.opacity = '0';

    setTimeout(() => {
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * reflections.length);
      } while (nextIndex === currentReflectionIndex && reflections.length > 1);

      currentReflectionIndex = nextIndex;
      const ref = reflections[currentReflectionIndex];

      textEl.textContent = `“${ref.quote}”`;
      authorEl.textContent = `— ${ref.author}`;

      // Fade in
      textEl.style.opacity = '1';
      textEl.style.transform = 'translateY(0)';
      authorEl.style.opacity = '1';
    }, 350);
  });
}

/* ==========================================================================
   5. FAQ Accordion
   ========================================================================== */
function initAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    const answerEl = item.querySelector('.faq-answer');

    if (!questionBtn || !answerEl) return;

    questionBtn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Close all other items
      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('open');
          const otherAnswer = otherItem.querySelector('.faq-answer');
          if (otherAnswer) otherAnswer.style.maxHeight = null;
        }
      });

      // Toggle current
      if (isOpen) {
        item.classList.remove('open');
        answerEl.style.maxHeight = null;
      } else {
        item.classList.add('open');
        answerEl.style.maxHeight = answerEl.scrollHeight + 'px';
      }
    });
  });
}

/* ==========================================================================
   6. Contact Modal
   ========================================================================== */
function initContactModal() {
  const modal = document.getElementById('contactModal');
  const openBtns = document.querySelectorAll('[data-open-modal="contactModal"]');
  const closeBtn = document.getElementById('closeModalBtn');
  const form = document.getElementById('contactForm');

  if (!modal) return;

  function openModal() {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  openBtns.forEach(btn => btn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  }));

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  // Click outside to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // ESC key to close
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      // No backend is connected yet. Keep the visitor's message in the form so
      // nothing they typed is silently thrown away, and do not claim delivery.
      showToast('Messaging is not connected yet, so your message was not sent. It is still here in the form if you would like to keep a copy.', 'warning');
    });
  }
}

/* ==========================================================================
   7. Toast Notification Utility
   ========================================================================== */
function showToast(message, type = 'info') {
  let toast = document.getElementById('siteToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'siteToast';
    toast.className = 'toast-msg';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<span>${message}</span>`;
  toast.classList.add('show');

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, 4500);
}

/* ==========================================================================
   8. Hero Logo Interactive 3D Perspective Tilt
   ========================================================================== */
function initHeroLogoParallax() {
  const logo = document.querySelector('.hero-logo-img');
  const wrap = document.querySelector('.hero-emblem-wrap');
  if (!logo || !wrap) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  wrap.addEventListener('mousemove', (e) => {
    const rect = wrap.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateX = (-y / (rect.height / 2)) * 14;
    const rotateY = (x / (rect.width / 2)) * 14;
    logo.style.transform = `perspective(800px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale(1.05)`;
  });

  wrap.addEventListener('mouseleave', () => {
    logo.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)';
  });
}

/* ==========================================================================
   8. Music Page - Release List
   ========================================================================== */
function formatReleaseDate(iso) {
  const d = new Date(iso + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'long' });
}

// releases.json is the single source of truth for both pages. Newest first,
// so the order never depends on where an entry was pasted into the file.
// One link per platform a release is actually on. A missing URL in
// releases.json simply produces no link, so nothing dead is ever shipped.
function platformLinks(rel, cls) {
  const esc = (u) => String(u).replace(/&/g, '&amp;');
  return [['appleUrl', 'Apple Music'], ['spotifyUrl', 'Spotify'], ['youtubeUrl', 'YouTube']]
    .filter(([key]) => rel[key])
    .map(([key, label]) => `<a class="${cls}" href="${esc(rel[key])}" target="_blank" rel="noopener noreferrer" aria-label="${rel.title} on ${label}">${label}</a>`)
    .join('') + lyricsButton(rel);
}

// Lyrics exist only for releases that name a text file in releases.json.
function lyricsButton(rel) {
  if (!rel.lyrics) return '';
  return `<button type="button" class="release-link lyrics-btn" data-lyrics="${rel.lyrics}" data-lyrics-title="${rel.title}">Lyrics</button>`;
}

// A release that is not on Apple Music yet still needs its cover art on screen,
// so the cover only becomes a link when there is a real URL behind it. Without
// this, a release missing appleUrl renders href="undefined" and ships a dead
// link on the most prominent card on the page.
function coverImage(rel, cls, width, height, lazy) {
  const esc = (u) => String(u).replace(/&/g, '&amp;');
  const img = `<img class="${cls}"${lazy ? ' loading="lazy" decoding="async"' : ''}` +
    ` width="${width}" height="${height}" src="${esc(rel.cover)}" alt="${rel.title} cover art">`;
  if (!rel.appleUrl) return img;
  return `<a class="${cls}-link" href="${esc(rel.appleUrl)}" target="_blank" rel="noopener noreferrer"` +
    ` aria-label="Listen to ${rel.title} on Apple Music">${img}</a>`;
}

/* ==========================================================================
   11. Lyrics Dialog (both pages)
   ========================================================================== */
function initLyrics() {
  if (typeof HTMLDialogElement === 'undefined') return;

  const dialog = document.createElement('dialog');
  dialog.className = 'lyrics-dialog';
  dialog.setAttribute('aria-labelledby', 'lyricsTitle');
  dialog.innerHTML = `
    <div class="lyrics-head">
      <h2 class="lyrics-title" id="lyricsTitle"></h2>
      <button type="button" class="lyrics-close" aria-label="Close lyrics">&times;</button>
    </div>
    <div class="lyrics-body" tabindex="0"></div>
  `;
  document.body.appendChild(dialog);

  const titleEl = dialog.querySelector('.lyrics-title');
  const bodyEl = dialog.querySelector('.lyrics-body');

  dialog.querySelector('.lyrics-close').addEventListener('click', () => dialog.close());
  // A click on the backdrop lands on the dialog element itself
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });

  // Delegated, so it also covers buttons rendered later from releases.json
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-lyrics]');
    if (!btn) return;

    titleEl.textContent = btn.dataset.lyricsTitle || 'Lyrics';
    bodyEl.textContent = 'Loading the lyrics…';
    dialog.showModal();
    bodyEl.scrollTop = 0;

    fetch(btn.dataset.lyrics)
      .then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then((text) => {
        bodyEl.textContent = text.trim();
      })
      .catch((err) => {
        console.error('Could not load lyrics:', err);
        bodyEl.textContent = 'The lyrics could not be loaded. Close this and try again.';
      });
  });
}

let cataloguePromise = null;

function fetchCatalogue() {
  if (!cataloguePromise) {
    cataloguePromise = fetch('releases.json').then((r) => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }
  return cataloguePromise;
}

function fetchReleases() {
  return fetchCatalogue().then((data) => {
    const items = (data.releases || []).slice().sort(
      (a, b) => String(b.released).localeCompare(String(a.released))
    );
    if (!items.length) throw new Error('no releases');
    return items;
  });
}

/* ==========================================================================
   10. Albums - cover, facts and the full track list (both pages)
   ========================================================================== */
function formatTrackTime(seconds) {
  const s = Math.round(Number(seconds) || 0);
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

function initAlbums() {
  const wrap = document.getElementById('albumList');
  if (!wrap) return;

  fetchCatalogue()
    .then((data) => {
      const albums = data.albums || [];
      if (!albums.length) throw new Error('no albums');

      wrap.innerHTML = albums.map((album) => {
        const tracks = album.tracks || [];
        const minutes = Math.round(tracks.reduce((sum, t) => sum + (Number(t.seconds) || 0), 0) / 60);

        return `
          <article class="album">
            <div class="album-side">
              <a class="feature-cover-link" href="${album.appleUrl}"
                 target="_blank" rel="noopener noreferrer"
                 aria-label="Listen to ${album.title} on Apple Music">
                <img class="feature-cover" src="${album.cover}" alt="${album.title} album cover"
                     loading="lazy" decoding="async" width="600" height="600">
              </a>
              <h3 class="album-title">${album.title}</h3>
              <p class="album-facts">${tracks.length} tracks &bull; ${minutes} min &bull; ${formatReleaseDate(album.released)}</p>
              <div class="platform-links">${platformLinks(album, 'platform-btn')}</div>
            </div>
            <ol class="album-tracks">
              ${tracks.map((t) => `
                <li class="album-track">
                  <span class="album-track-title">${t.title}</span>
                  <span class="album-track-time">${formatTrackTime(t.seconds)}</span>
                </li>
              `).join('')}
            </ol>
          </article>
        `;
      }).join('');
    })
    .catch((err) => {
      console.error('Could not load the album from releases.json:', err);
      wrap.innerHTML = '<p class="release-error">The album could not be loaded. ' +
        'It is on <a href="https://music.apple.com/bw/album/i-am/1857644050" ' +
        'target="_blank" rel="noopener noreferrer">Apple Music</a>.</p>';
    });
}

/* ==========================================================================
   9. Home Page - Latest Single + Earlier Singles
   ========================================================================== */
function initHome() {
  const grid = document.getElementById('singlesGrid');
  if (!grid) return; // not on the home page

  const feature = document.getElementById('featuredRelease');

  fetchReleases()
    .then((items) => {
      const latest = items[0];
      const earlier = items.slice(1);

      // index.html ships the latest single as static markup so the hero works
      // without JavaScript. Only redraw it when releases.json has moved on.
      // The title is the fallback key because a release that is not on Apple
      // has no appleId, and "undefined" would never equal a stored string.
      const latestKey = latest.appleId || latest.title;
      if (feature && feature.dataset.releaseId !== latestKey) {
        feature.dataset.releaseId = latestKey;
        feature.innerHTML = `
          ${coverImage(latest, 'feature-cover', 600, 600, false)}
          <div class="feature-body">
            <div class="feature-meta">
              <span class="feature-label">Latest single</span>
              <h2 class="feature-title">${latest.title}</h2>
              <p class="feature-date">${formatReleaseDate(latest.released)}</p>
            </div>
            <div class="release-links">${platformLinks(latest, 'release-link')}</div>
          </div>
        `;
      }

      grid.innerHTML = earlier.map((rel) => `
        <article class="single-card">
          ${coverImage(rel, 'single-cover', 600, 600, true)}
          <div class="single-meta">
            <h3 class="single-title">${rel.title}</h3>
            <p class="single-date">${formatReleaseDate(rel.released)}</p>
          </div>
          <div class="release-links">${platformLinks(rel, 'release-link')}</div>
        </article>
      `).join('');
    })
    .catch((err) => {
      console.error('Could not load releases.json:', err);
      grid.innerHTML = '<p class="release-error">The singles could not be loaded. ' +
        'All of them are on <a href="https://music.apple.com/bw/artist/pilgrim/1857562164" ' +
        'target="_blank" rel="noopener noreferrer">Apple Music</a>.</p>';
    });
}

function initReleases() {
  const list = document.getElementById('releaseList');
  if (!list) return; // not on the music page

  fetchReleases()
    .then((items) => {
      list.innerHTML = items.map((rel) => `
        <article class="release-item">
          <img class="release-cover" src="${rel.cover}" alt="${rel.title} cover art"
               loading="lazy" decoding="async" width="84" height="84">
          <div class="release-meta">
            <h3 class="release-title">${rel.title}</h3>
            <p class="release-date">${formatReleaseDate(rel.released)}</p>
          </div>
          <div class="release-links">${platformLinks(rel, 'release-link')}</div>
        </article>
      `).join('');
    })
    .catch((err) => {
      console.error('Could not load releases.json:', err);
      list.innerHTML = '<p class="release-error">The release list could not be loaded. ' +
        'All singles are available on <a href="https://music.apple.com/bw/artist/pilgrim/1857562164" ' +
        'target="_blank" rel="noopener noreferrer">Apple Music</a>.</p>';
    });
}
/* ==========================================================================
   12. Header Emblem - spins, and shows the next image each time round
   ========================================================================== */
function initBrandEmblem() {
  const emblem = document.querySelector('.brand-emblem');
  if (!emblem) return;

  const faces = emblem.querySelectorAll('.brand-face');
  if (faces.length < 2) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let current = 0;

  emblem.addEventListener('animationend', () => emblem.classList.remove('is-spinning'));

  setInterval(() => {
    if (document.hidden) return;
    emblem.classList.add('is-spinning');
    // The spin is one second and linear, so at a quarter of the way round the
    // emblem is edge-on: swap the image there, where the change cannot be seen.
    setTimeout(() => {
      faces[current].classList.remove('is-active');
      current = (current + 1) % faces.length;
      faces[current].classList.add('is-active');
    }, 250);
  }, 4000);
}
