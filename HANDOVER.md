# Handover — Pilgrim's Nest

**Written:** 2026-10-06 · **Repo state at handover:** `main` @ `2928b9b`, clean tree, `local == origin/main`

Everything below was checked against the live site on 2026-10-06, not copied from notes.

---

## 1. What this is

A static GitHub Pages site for **Pilgrim's Nest** on `pilgrimsnest.org`, plus a separate
music catalogue built from Jayden's own AI-music library.

| | |
|---|---|
| Live URL | `https://pilgrimsnest.org` |
| Repo | `Z:\AgentsWorkspace\pilgrimsnest` |
| Remote | `https://github.com/Nembahe/pilgrimsnest.git` |
| Branch | `main` |
| Email on git | `mishumo@gmail.com` |
| Deploy | GitHub Pages, served straight from `main` (no `.github` workflow, no build step) |
| Domain email | **Live** — MX `smtp.google.com` (Google Workspace). Never treat a deploy as cosmetic |
| CDN | Fastly, `Cache-Control: max-age=600` |

### Pages

| Path | Purpose |
|---|---|
| `/` (`index.html`) | Landing page: hero, About, milestones, pillars, contemplations, founding circle, FAQ |
| `/music.html` | The 7 released singles, rendered from `releases.json` |
| `/google-sites-embed.html` | **Separate 195 KB self-contained copy** for pasting into Google Sites |

---

## 2. Live status — checked 2026-10-06

All of these returned `True` against the production HTML/CSS:

- About section and its copy ("conscious creators")
- Founding-circle button reads **"Try the Founding Circle List"**
- Opening date **8 October 2026**, countdown live
- Contrast fix `#74839A`, `:focus-visible` ring, `prefers-reduced-motion` block
- Hero video `assets/hero-loop.mp4` deployed and visible
- Pillar labels Rest / Nourish / Walk / Gather

Files all serving 200: `/`, `/music.html`, `/styles.css`, `/script.js`, `/releases.json`,
`/assets/hero-loop.mp4`, `/google-sites-embed.html`.

**The opening date is 8 October — two days out.** Check whether the countdown's
post-opening state is what you want (it renders "The Gates Are Open" with the digit grid
hidden, per the fix in `89428a6`).

---

## 3. What is in the repo

### Site files — never edit without reading this first

| File | Note |
|---|---|
| `index.html` | Landing page |
| `music.html` | Music catalogue page |
| `script.js` | Shared by both pages. `initReleases()` returns early off the music page |
| `styles.css` | All styling, ~40 KB |
| `releases.json` | The 7 singles. **Add releases here**, not in `music.html` |
| `assets/hero-loop.mp4` | 718 KB H.264, 2560×1440, 3.00s, no audio track |

### Documents

| File | What it holds |
|---|---|
| `TRACK-READINESS-AUDIT.md` | Which `Awakened` masters are publishable, **with the in-folder corrections**. Has tick boxes |
| `CONTENT-PLAN-MUSIC.md` | Phased plan for the music catalogue, with measured size constraints |
| `GENERATION-BUDGET.md` | Spend rules and rates |
| `H3-HERO-PROMPT.md` | The H3 prompt plus a ready-to-paste regeneration path |
| `PLANFORGE-H3-REVAMP-2026-10-03.md` | The full planforge review, 20 findings |
| `jev-track-readiness.json` | Typed Jev request — edit the `state` and re-send to re-run |
| `DOMAIN_SETUP_GUIDE.md` | Domain/DNS setup |
| `dns-rollback-snapshot-2026-09-13.md` | **Read before any DNS change** |
| `README.md` | Project readme |

`.gitignore` excludes `output/` (generated media and Playwright screenshots). A stray
`git add -A` cannot bloat history.

---

## 4. Traps in this repo

Read these before you change anything. Each one cost time.

**1. Deploy lag gives a false negative.** GitHub Pages takes **2–5 minutes** to rebuild.
Right after a push the live site still serves the *previous* build, and it can arrive as
an `X-Cache: MISS` — a MISS does not mean fresh. If a fix seems absent, compare the served
bytes against `git show origin/main:<path>` before assuming the push failed. **Do not
re-push.** This has happened three times here.

**2. Three copies of the site exist.** `google-sites-embed.html` is a **separate** copy, not
a build artifact. Text and JS changes should be mirrored into it. **But never mirror an
asset path into it** — its contract is "100% self-contained", so a relative path has no
base URL when pasted into Google Sites and 404s. This was done once by mistake and had to
be reverted.

**3. `git status` cannot prove a surgical edit.** `core.autocrlf=true`. Check
`git diff --stat` and review the hunks.

**4. Protected files.** These must never appear in a diff:
`DOMAIN_SETUP_GUIDE.md`, `dns-rollback-snapshot-2026-09-13.md`, `logo.png`,
`logo-512.png`, `favicon.png`, `favicon.svg`, `CNAME`.

**5. Never use a raw string replace on `index.html`.** Doing so inlined the entire
stylesheet into the `<head>` and was only caught by checking the file size. Use the edit
tool, and verify the byte count afterwards.

**6. `about.txt` has been deleted** (Jayden, 2026-10-06). The About copy it held is live in
`index.html` and `music.html`, so nothing was lost — but the editable source is gone. If you
want to change the About wording, edit the HTML, or restore a copy file and commit it.

---

## 5. Open decisions

### Music catalogue

| Question | Status |
|---|---|
| Which tracks are publishable? | **Waiting on Jayden.** Tick boxes in `TRACK-READINESS-AUDIT.md` |
| Spotify / YouTube artist URLs | **Not verified.** Shown as inert placeholders on `music.html` — never ship a guessed link. Drop real URLs into the `platform-btn` `href`s |
| Bandcamp | Not created. Recommended later as a tip jar, not as the catalogue home |
| Lyrics on the page | Not built. 4 tracks have synced `.lrc`. Jev rated the feature "clear value" but at only 0.31 confidence — don't build it alone |
| `Tears in the Rain` — which version? | **Needs a human ear.** Folder master is 4:24, root is 4:59. Which one was released? |

### Still unfixed, deliberately

**Mobile header overflow (F14).** Pre-existing, independent of the video work. A bounding-box
sweep at 390px found `.nav-actions` reaching **424px in a 390px viewport**, clipping
"Contact Us" by 34px. A `min-width: 0` / flex-wrap fix on the header resolves it. Left
alone because it was outside the approved scope — but it is a real bug.

---

## 6. Generation budget — hard rule

**5,000 credits is a TOTAL ceiling, not per-task.** Confirmed by Jayden 2026-10-05.

- Credits **do not refill monthly**. The remaining balance *is* the budget.
- **If the Credits balance ever reads 5,000, generation stops entirely.**
- Never submit a generation without stating its cost first.
- No batch retries, no "one more attempt" loops.

Rates (from `platform.minimax.io/docs/pricing/overview`):

| Model | Resolution | Rate | 10s clip |
|---|---|---|---|
| MiniMax-H3 | 2K | $0.13/sec | **$1.30** |
| MiniMax-H3 | 768P | $0.08/sec | $0.80 |
| H3-Max | 480P | $0.0553/sec | $0.55 |
| Images | any | $0.0035 | — |

**Spent so far: one 2K/10s generation, $1.30.** Prefer 768P for iteration.

**Reuse before regenerating.** `assets/hero-loop.mp4` and the poster at
`C:\Users\mishu\Music\output\pilgrims-nest-hero-poster.jpg` are already paid for. The
poster is the intended first-frame anchor for any regeneration — see `H3-HERO-PROMPT.md`.

The agent **cannot read the credit balance**: there is no usage or billing tool in the
`mcode-tools` connector catalog. Check `platform.minimax.io/user-center/payment/balance`.

---

## 7. Music library — where things are

Source: `C:\Users\mishu\Music`

```
Awakened\            106 files — the album. ~17 distinct songs
lyrics\              59 .txt
I AM\                18 .wav + 1 cover
Album Character Sheet\ 10 .png
```

51 WAVs, 34 PNGs, 21 MP4s, 14 synced `.lrc`, 6 JPGs.

**Masters live inside each single's folder, and those are the current ones.** The
album-root copies are older working files. `Tears in the Rain` differs by 35 seconds
between the two; `New View` differs by 8 LU. Always compare modification timestamps, never
filenames — `New View Final.wav` measures *quieter* than `New View.wav`.

**Never commit a WAV master to this repo.** One master is 66.5 MB; the album would be
1.3 GB. Even at 128k MP3 it is 80 MB. The site deliberately hosts no audio — every Listen
button goes to Apple Music, and cover art hot-links from Apple's CDN.

---

## 8. Verifying a change

After any edit, before pushing:

```powershell
cd Z:\AgentsWorkspace\pilgrimsnest
node --check .\script.js            # must print nothing
git diff --stat                     # confirm only intended files
git diff --name-only                # confirm no protected file appears
```

Then after pushing, **wait 2–5 minutes** and re-fetch. A correct check compares live
against origin:

```powershell
git show origin/main:styles.css | Select-String '#74839A'   # present in origin?
Invoke-WebRequest https://pilgrimsnest.org/styles.css        # present live?
```

If origin has it and live does not, it is deploy lag. Do not re-push.

For anything visual, serve the working tree and measure — do not read the CSS and assume:

- Element overflow: sweep `getBoundingClientRect().right > innerWidth` at **390px** and 1440px
- Touch targets: same sweep, flag anything under 44px
- Contrast: compute WCAG ratios numerically

`playwright-cli eval` takes a **single expression**, not a function body. Pass
`JSON.stringify(...)` yourself. PowerShell mangles quotes inside the argument — build
selectors with `String.fromCharCode(34)` if needed.

---

## 9. What was fixed, and why it matters

Full detail in `PLANFORGE-H3-REVAMP-2026-10-03.md`. The short version:

**Honesty** — the site showed a dead `00/00/00/00` countdown on a passed date, and three
forms reported success while sending nothing. Both fixed.

**Accessibility** — the site had **no keyboard focus indicator anywhere** (four
`outline: none` rules, nothing replacing them). The README claimed `prefers-reduced-motion`
compliance while the CSS had zero media queries for it. Both now real and checked.

**Contrast** — `--text-dim` measured 4.16:1, under WCAG AA. It carries the tagline, release
dates and privacy note, so it was not dismissible as decorative.

**Touch targets** — six controls sat at 41–43px. Two "fixes" read correctly in the CSS and
still measured 41px, because the modal card carries a `scale(0.94)`. They are now sized to
47px to clear 44px *after* the transform.

**Copy** — a duplicated "wholesome, wholesome"; `PILLAR 01-04` numbering that implied a
sequence the four pillars do not have, replaced with Rest / Nourish / Walk / Gather.

---

## 10. Method notes worth keeping

**A regex is a hypothesis, not evidence.** Three findings in this project came from a regex
and all three were wrong: the flat WAV listing, the "current master" detection, and the
label-presistence check. Every one was righted by inspecting the live DOM. Confirm in the
DOM before claiming a defect.

**`ffmpeg` and Python are installed.** An earlier plan assumed neither existed and built a
browser workaround. Toolchain findings go stale within days — re-probe before designing
around a missing tool.

**Measure a decorative asset's contribution, not just its presence.** The hero video first
shipped at 0.38 opacity, contributing 0.57 of 255 grey levels — effectively invisible,
while `exists: true, paused: false, readyState: 4` all reported success. Now 0.80
(contribution 3.75, loop seam 1.31).

**Test the past branch of a deadline.** The post-opening countdown state had never run. It
set the heading correctly and left four `00/00/00/00` boxes underneath — the exact dead
clock the fix was meant to remove.