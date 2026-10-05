# Content Plan — music on pilgrimsnest.org

**Prepared:** 2026-10-05 · **Status: PLAN ONLY — nothing has been built, moved, or published.**
**Source library:** `C:\Users\mishu\Music`

---

## Objective

Turn pilgrimsnest.org from a sanctuary-retreat landing page into the home of the music
brand: **AI music for the awakened mind** — tracks, lyrics, and CD cover art, playable
in the browser.

---

## What is actually in the library

Verified by inspection, not assumed.

| Folder | Contents |
|---|---|
| `Awakened\` | **106 files.** The album. Masters, per-track folders, CD covers, synced lyrics |
| `lyrics\` | 59 `.txt` lyric files |
| `I AM\` | 18 `.wav` + 1 cover |
| `Album Character Sheet\` | 10 `.png` |
| `Ozone\`, `Suno Styles\`, `VideoProc Converter AI\` | Style references and tooling notes |

**Library totals:** 51 `.wav`, 34 `.png`, 21 `.mp4`, 14 `.lrc`, 6 `.jpg`, 1 `.mp3`.

### The Awakened album, as it stands

Roughly **20 finished tracks**, each with a WAV master and a folder. Completed tracks
include *Tears in the Rain*, *The Games We Play as God*, *This Long Weekend*, *Magaraba*,
*Me Time*, *New View*, *A Fool and a Liar*, *An Artist*, *I Remember*, *Life Abundantly*,
*Light & Darkness*, *Light Behind My Eyes*, *Love Yourself*, *Me Time*, *Tears in the Rain*.

Per-track assets present: WAV master, cover art (`.png`), lyrics (`.txt`), and for
several, **synced lyrics (`.lrc`)** — which means a real karaoke-style lyric scroll is
possible, not just a static text block.

### Brand voice, from the lyrics

I read *Tears in the Rain* in full. The register is **introspective and searching, not
uplifting or devotional**: "I gave the world my best and felt the sting", "The cold is
where I feel the warm", "Truth be told I wrote this song in tears". Recurring motifs are
paradox, reversal, awakening, and a sense of reckoning.

**This matters for the design.** The existing site copy is warm, communal and
reassuring — "A Haven in the Making", "soft-opening retreat reservations". A catalogue
page written in that voice would misrepresent the work. The page should be quieter, more
direct, and let the lyrics carry the emotion rather than marketing around them.

---

## The constraint that decides the architecture

**A single WAV master is 66.5 MB. The entire live site today is 861 KB.**

Measured encodes of one 4:23 track (`Tears in the Rain`, 24-bit/44.1 kHz source):

| Encode | Size | × 20 tracks |
|---|---|---|
| WAV master (as-is) | 66.5 MB | 1.3 GB |
| MP3 192k | 6.0 MB | 120 MB |
| MP3 128k | 4.0 MB | 80 MB |
| MP3 96k | 3.0 MB | 60 MB |

Cover art, measured on `The Games We Play God\CD Cover.png`:

| Output | Size | Reduction |
|---|---|---|
| Source PNG | 14,251 KB | — |
| 1000px WebP q80 | **140 KB** | 100x |
| 1000px JPEG q4 | 229 KB | 62x |

**Conclusion: the WAV masters must never be committed to this repo.** Even at 128k the
audio alone would be 80 MB, and GitHub Pages warns at 1 GB with a 100 MB per-file cap.
One 66.5 MB WAV in git history is permanent — removing it later needs a history rewrite
on a domain that is already live.

---

## The plan

### Phase 1 — Prepare the assets (local only, no site change)

**Objective:** produce web-ready audio and art, outside the repo.

- Encode each finished track to **MP3 128k** (4 MB) and generate a **30s 96k preview**
  (~1 MB) so visitors can browse without downloading full tracks.
- Convert each CD cover to **1000px WebP q80** (~140 KB) plus a 400px thumbnail.
- Copy lyrics `.txt` and synced `.lrc` for any track that has them.
- Write a single `tracks.json` manifest: title, track number, duration, audio, preview,
  cover, lyrics, synced-lyrics flag.
- **Output to a staging folder outside the site**, e.g. `Z:\AgentsWorkspace\pilgrimsnest-build\`.
- **Budget: 0 credits.** Encoding local files costs nothing.

**Exit checks:** every manifest entry resolves to a file that exists; no file over
4 MB; total staged audio under ~25 MB.

### Phase 2 — Decide hosting before building anything

**Objective:** pick where the audio actually lives. This cannot be deferred — it
changes the markup, the loading strategy and the page weight.

| Option | Audio cost | Notes |
|---|---|---|
| **A. GitHub Pages** (repo) | 80 MB in git, permanent history | Simple, free. But 80 MB of binaries in a public repo is poor practice and the history can't be undone cheaply |
| **B. Bandcamp / SoundCloud embed** | 0 KB on this site | Artists' own hosting, real play/pause, and it gets you listeners. **Recommended for the full catalogue** |
| **C. Cloudflare R2 / S3** | 0 KB on this site, ~$0.015/GB/mo | Best if you want your own player. Needs a bucket and a public URL |
| **D. Hybrid** | ~5 MB | Featured track previews hosted here, full tracks on Bandcamp |

**I recommend D or B.** A 20-track player serving 80 MB from the same repo as a 23 KB
HTML file is the wrong shape. Previews can live on the site; full tracks belong on a
service built for audio.

**This is the one decision I need from you before Phase 3.**

### Phase 3 — Build the section (after Phase 2)

**Objective:** add the music to the site, on its own route, without disturbing the
existing landing page.

- New page `music.html` linked from the nav, leaving `index.html` as the landing page.
  *If you'd rather replace the landing page entirely, say so — the plan changes.*
- **Track list** — cover art, title, duration, play control, lyrics toggle.
- **Player** — one shared `<audio>` element, not twenty. Only the selected track loads.
  This is what keeps page weight at "one track at a time" instead of "the whole album".
- **Lyrics panel** — plain `.txt` by default; if a track has an `.lrc`, offer a
  timed, line-by-line scroll. Pure CSS/JS, no library.
- **Reduced motion** — the existing `prefers-reduced-motion` block must cover the
  lyrics scroll too.
- **Keyboard support** — space to play/pause, arrow keys to move between tracks,
  visible focus on every control. The focus ring already exists from the last fix, so
  this is consistent rather than new work.
- **Covers lazy-loaded** (`loading="lazy"`) so the first paint doesn't wait on 20 images.

### Phase 4 — Verify, then publish

- Test at 390px and 1440px, same bounding-box sweep as the responsive pass.
- Confirm the page adds no more than ~1 MB to first paint, and that selecting a track
  fetches one file, not twenty.
- Commit, push, then verify live.

---

## What I need from you

1. **Hosting** — options B/D (recommended) or A/C above. This blocks Phase 3.
2. **New page or replace the landing page?** `music.html` alongside, or take over the
   front page?
3. **Which tracks are finished** — there are ~20 WAV masters, and several are clearly
   mid-work (duplicates like `New View (even master).wav`, `New View (intro lift).wav`).
   I won't guess which are release-ready.

---

## Risks

- **[P0] Committing WAV masters would put 1.3 GB in git history.** Mitigated by Phase 1
  encoding before anything touches the repo, and by the Phase 2 hosting decision.
- **[P1] Shipping 80 MB of audio from the page repo makes every visitor's first load
  heavy.** Mitigated by a single shared player that fetches one track on demand.
- **[P1] Publishing unfinished work.** Several tracks have obvious work-in-progress
  duplicates. Needs your list, not my judgement.
- **[P2] The brand voice in the lyrics is more introspective than the site's current
  copy.** The page design should follow the music, not the old sanctuary language.
- **[P2] 21 `.mp4` music videos and 3 `.html` files exist in the library** — not in
  scope here, but available later.
