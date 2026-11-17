/**
 * Pilgrim's Nest — Official Interactive Script
 * Domain: pilgrimsnest.org
 */

document.addEventListener('DOMContentLoaded', () => {
  initHome();
  initAlbums();
  initLyrics();
});

/* ==========================================================================
   Music Page - Release List & Albums
   ========================================================================== */
function formatReleaseDate(iso) {
  const d = new Date(iso + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'long' });
}

// Every value from releases.json goes through this before it reaches
// innerHTML, so a stray quote or angle bracket in a title can never
// break the markup or inject an element.
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

// releases.json is the single source of truth for both pages. Newest first,
// so the order never depends on where an entry was pasted into the file.
// One link per platform a release is actually on. A missing URL in
// releases.json simply produces no link, so nothing dead is ever shipped.
function platformLinks(rel, cls) {
  const title = escapeHtml(rel.title);
  return [['appleUrl', 'Apple Music'], ['spotifyUrl', 'Spotify'], ['youtubeUrl', 'YouTube']]
    .filter(([key]) => rel[key])
    .map(([key, label]) => `<a class="${cls}" href="${escapeHtml(rel[key])}" target="_blank" rel="noopener noreferrer" aria-label="${title} on ${label}">${label}</a>`)
    .join('') + lyricsButton(rel);
}

// Lyrics exist only for releases that name a text file in releases.json.
function lyricsButton(rel) {
  if (!rel.lyrics) return '';
  return `<button type="button" class="release-link lyrics-btn" data-lyrics="${escapeHtml(rel.lyrics)}" data-lyrics-title="${escapeHtml(rel.title)}">Lyrics</button>`;
}

// A release that is not on Apple Music yet still needs its cover art on screen,
// so the cover only becomes a link when there is a real URL behind it. Without
// this, a release missing appleUrl renders href="undefined" and ships a dead
// link on the most prominent card on the page.
function coverImage(rel, cls, width, height, lazy) {
  const title = escapeHtml(rel.title);
  const img = `<img class="${cls}"${lazy ? ' loading="lazy" decoding="async"' : ' fetchpriority="high"'}` +
    ` width="${width}" height="${height}" src="${escapeHtml(rel.cover)}" alt="${title} cover art">`;
  if (!rel.appleUrl) return img;
  return `<a class="${cls}-link" href="${escapeHtml(rel.appleUrl)}" target="_blank" rel="noopener noreferrer"` +
    ` aria-label="Listen to ${title} on Apple Music">${img}</a>`;
}

/* ==========================================================================
   11. Lyrics Dialog (both pages)
   ========================================================================== */
function initLyrics() {
  if (typeof HTMLDialogElement === 'undefined') return;

  const dialog = document.createElement('dialog');
  dialog.id = 'lyricsDialog';
  dialog.className = 'lyrics-dialog';
  dialog.setAttribute('closedby', 'any');
  dialog.setAttribute('aria-labelledby', 'lyricsTitle');
  dialog.innerHTML = `
    <div class="lyrics-head">
      <h2 class="lyrics-title" id="lyricsTitle">Lyrics</h2>
      <form method="dialog">
        <button type="submit" class="lyrics-close" commandfor="lyricsDialog" command="close" autofocus aria-label="Close lyrics">&times;</button>
      </form>
    </div>
    <div class="lyrics-body" tabindex="0"></div>
  `;
  document.body.appendChild(dialog);

  const titleEl = dialog.querySelector('.lyrics-title');
  const bodyEl = dialog.querySelector('.lyrics-body');

  // Fallback for browsers without <dialog closedby="any"> (e.g. Safari)
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    const outside = (e, d) => {
      const r = d.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    let pressedOutside = false;
    dialog.addEventListener('pointerdown', (e) => { pressedOutside = outside(e, dialog); });
    dialog.addEventListener('pointerup', (e) => { if (pressedOutside && outside(e, dialog)) dialog.close(); });
  }

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

function albumTrackTitle(track) {
  const title = escapeHtml(track.title);
  let url;
  try {
    url = new URL(track.youtubeUrl);
  } catch {
    return `<span class="album-track-title">${title}</span>`;
  }
  if (url.protocol !== 'https:' || url.hostname !== 'www.youtube.com' ||
      url.pathname !== '/watch' || url.username || url.password || url.port ||
      !/^[\w-]{11}$/.test(url.searchParams.get('v') || '')) {
    return `<span class="album-track-title">${title}</span>`;
  }
  return `<a class="album-track-title album-track-link" href="${escapeHtml(url.href)}"
    target="_blank" rel="noopener noreferrer" aria-label="Listen to ${title} on YouTube (opens in a new tab)">${title}<span class="album-track-cue" aria-hidden="true"> ↗</span></a>`;
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
              <a class="feature-cover-link" href="${escapeHtml(album.appleUrl)}"
                 target="_blank" rel="noopener noreferrer"
                 aria-label="Listen to ${escapeHtml(album.title)} on Apple Music">
                <img class="feature-cover" src="${escapeHtml(album.cover)}" alt="${escapeHtml(album.title)} album cover"
                     loading="lazy" decoding="async" width="600" height="600">
              </a>
              <h3 class="album-title">${escapeHtml(album.title)}</h3>
              <p class="album-facts">${tracks.length} tracks &bull; ${minutes} min &bull; ${formatReleaseDate(album.released)}</p>
              <div class="platform-links">${platformLinks(album, 'platform-btn')}</div>
            </div>
            <ol class="album-tracks">
              ${tracks.map((t) => `
                <li class="album-track">
                  ${albumTrackTitle(t)}
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
        'target="_blank" rel="noopener noreferrer">Apple Music</a> or ' +
        '<a href="https://www.youtube.com/watch?v=Tq-izfJzmK4&amp;list=OLAK5uy_lKT7jF2ScNqMVjfTpFOFi8JCnpUzofYpA" ' +
        'target="_blank" rel="noopener noreferrer">YouTube</a>.</p>';
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
              <h2 class="feature-title">${escapeHtml(latest.title)}</h2>
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
            <h3 class="single-title">${escapeHtml(rel.title)}</h3>
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
