# Pilgrim’s Nest

Static music and film portfolio for **pilgrimsnest.org**. No framework, installation or paid widget is needed.

- `index.html`: Music and Short AI Films paths, latest work and About.
- `music.html`: latest single, I AM album, seven earlier singles and lyrics. All eight singles and eighteen album tracks remain in `releases.json`.
- `films.html`: every public video link from both accounts — 227 in total, 44 from Gentile Nembahe and 183 from Pilgrim’s Nest — with All / Pilgrim’s Nest / Gentile Nembahe filters. Every link is available without JavaScript.
- `films.json`: verified public metadata. Verified 28 October 2026. Accounts: `@truepilgrimm` and `@thetruegentile`. The `boundaryEvidence` block is historical: it records the original 11 October 2026 twenty-per-account snapshot and no longer bounds the catalogue.
- `portfolio.css` / `portfolio.js`: shared navigation, portal design and filters. `styles.css` / `script.js` retain music and lyrics behavior.
- `assets/`: original single cover, decorative generated mountain/projector/filmstrip artwork, local fonts and existing brand/video assets. Cinema artwork represents the collection; it is not a listed film still.

## Preview and validate

From this directory:

```powershell
python -m http.server 8080 --bind 127.0.0.1
```

Open `http://127.0.0.1:8080`. Use HTTP because music and lyrics fetch local files. The Music background starts only after pressing **Play background**, and can be paused.

```powershell
python scripts/test-site.py
node --check portfolio.js
node --check script.js
```

Inspect both pages on phone and desktop. Verify lyrics open, Escape closes them and focus returns. Filter counts must match `films.json` — currently 227 / 44 / 183. Both homepage actions must be visible at 375 × 812.

## Refresh videos

The catalogue is **append-only**. Add new posts; never remove or displace an existing entry to make room. The old twenty-per-account limit was only how the site was first seeded on 11 October 2026 and no longer applies, so per-account counts differ.

Verify each candidate independently from its own public video document: `statusCode` 0, `privateItem` false, and the author's `uniqueId` matching the expected account. Use actual publication dates. Exclude private, draft, repost-only and photo posts. Insert newest first.

For the still, prefer `cover`, then `dynamicCover`, then `originCover`, and skip any frame that is effectively blank. This matters: `originCover` is the video's first frame, and many of these videos fade in from black — preferring it produced one identical black still for 33 videos before `scripts/test-site.py` caught it as placeholder reuse. `dynamicCover` is a nine-frame animated WebP, so seek through its frames rather than reading only frame 0. Do not choose the frame with a numeric threshold; render the frames and look at them.

Note that profile-grid scraping is unreliable: five public posts never appear on their own grid, so the dependable route is a link supplied directly.

Update `films.json`, including `verifiedAt`, verification flags and boundaries. Never store credentials, cookies, signed media URLs or owner-only content. Regenerate the HTML from that same manifest:

```powershell
python scripts/build-films.py
python scripts/test-site.py
```

The generator refuses shortfalls or unverified records and updates the cards and verification label. Review additions/removals before publication. TikTok controls playback, availability and sign-in requirements. The site opens canonical post links and loads no TikTok embeds or tracking scripts.

For music releases, update `releases.json` and the static latest-release/cover fallbacks in `index.html` and `music.html`. Use original artwork. Old homepage `#latest`, `#album` and `#singles` links route to Music; without JavaScript they offer an onward link.

## Publication

Local edits do not publish the site. Review the rendered candidate and verify current Pages configuration before an approved deployment. Preserve `CNAME` and DNS. Recovery copies and QA evidence are in ignored `output/website-films-plan-2026-10-11/`; do not deploy them.

Old retreat/countdown/waitlist documentation does not describe this portfolio. The legacy `google-sites-embed.html` edition was removed on 30 October 2026; it remains in git history.

Fonts: Cinzel, Cormorant Garamond and Plus Jakarta Sans, distributed through Google Fonts under the SIL Open Font License; local Latin variable subsets. Original cover source is recorded in `releases.json`.
