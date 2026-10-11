# Pilgrim’s Nest

Static music and film portfolio for **pilgrimsnest.org**. No framework, installation or paid widget is needed.

- `index.html`: Music and Short AI Films paths, latest work and About.
- `music.html`: latest single, I AM album, seven earlier singles and lyrics. All eight singles and eighteen album tracks remain in `releases.json`.
- `films.html`: forty public video links, twenty per account, with All / Pilgrim’s Nest / Gentile Nembahe filters. Every link is available without JavaScript.
- `films.json`: verified public metadata and selection boundaries. Snapshot: 11 October 2026. Accounts: `@truepilgrimm` and `@thetruegentile`.
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

Inspect both pages on phone and desktop. Verify lyrics open, Escape closes them and focus returns. Filter counts must be 40 / 20 / 20. Both homepage actions must be visible at 375 × 812.

## Refresh videos

Verify candidates independently as public videos owned by the right account, using actual publication dates. Exclude private, draft, repost-only and photo posts. Sort pinned posts by date. Check an older post beyond each twentieth-video boundary. Include commentary and other videos when they fall within the latest twenty; the gallery describes the content mix.

Update `films.json`, including `verifiedAt`, verification flags and boundaries. Never store credentials, cookies, signed media URLs or owner-only content. Regenerate the HTML from that same manifest:

```powershell
python scripts/build-films.py
python scripts/test-site.py
```

The generator refuses shortfalls or unverified records and updates the cards and verification label. Review additions/removals before publication. TikTok controls playback, availability and sign-in requirements. The site opens canonical post links and loads no TikTok embeds or tracking scripts.

For music releases, update `releases.json` and the static latest-release/cover fallbacks in `index.html` and `music.html`. Use original artwork. Old homepage `#latest`, `#album` and `#singles` links route to Music; without JavaScript they offer an onward link.

## Publication and legacy edition

Local edits do not publish the site. Review the rendered candidate and verify current Pages configuration before an approved deployment. Preserve `CNAME` and DNS. Recovery copies and QA evidence are in ignored `output/website-films-plan-2026-10-11/`; do not deploy them.

`google-sites-embed.html` is a separate legacy edition and is intentionally unchanged. Old retreat/countdown/waitlist documentation does not describe this portfolio.

Fonts: Cinzel, Cormorant Garamond and Plus Jakarta Sans, distributed through Google Fonts under the SIL Open Font License; local Latin variable subsets. Original cover source is recorded in `releases.json`.
