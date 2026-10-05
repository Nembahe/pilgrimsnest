# Awakened — track readiness audit

**Measured:** 2026-10-05 · 32 WAV files probed with ffprobe and ffmpeg `ebur128`.
**Nothing has been moved, renamed, encoded or uploaded.** This is a read-only report.

---

## How I judged "finished"

Three objective signals, not taste:

| Signal | Release-grade | Why |
|---|---|---|
| **Integrated loudness** | −14 to −9 LUFS | Streaming target. Below −16 usually means an unmastered mix |
| **True peak** | −1.0 to −1.5 dBTP | Mastered with headroom. **−4.2 or lower risks clipping** |
| **Companion assets** | cover + lyrics | A track with no cover or no lyrics isn't ready to publish |

---

## Tier 1 — Ready to publish as-is

Mastered, peaked, and have cover art **and** lyrics on disk.

| # | Track | LUFS | True peak | Cover | Lyrics | Synced |
|---|---|---|---|---|---|---|
| 1 | **Tears in the Rain** | −12.8 | −1.1 | yes | yes | **3 × .lrc** |
| 2 | **The Games We Play as God** | −12.2 | −1.0 | yes | yes (4 versions) | **3 × .lrc** |
| 3 | **This Long Weekend** | −15.1 | −1.5 | yes | yes | **5 × .lrc** |
| 4 | **Me Time** | −12.2 | −1.1 | yes | yes (3) | **2 × .lrc** |

These four are the strongest candidates. All have synced lyrics, so a timed lyric
scroll is possible on every one.

**Note on This Long Weekend:** −15.1 LUFS is *slightly* quiet versus the others
(−12.2 to −12.8). Not a defect, but it will sound noticeably lower than its
neighbours on the same page. Worth a +2 dB lift before release, or accept the
difference.

---

## Tier 2 — Mastered, but incomplete on assets

Audio is release-grade. Missing cover art, lyrics, or both.

| # | Track | LUFS | Peak | Missing |
|---|---|---|---|---|
| 5 | **New View** | −12.2 | −1.1 | cover exists, **no lyrics** |
| 6 | **A Fool and a Liar** | −10.3 | −1.1 | cover exists, **no lyrics** |
| 7 | **Magaraba** | −10.2 | −1.1 | cover exists (2), **no lyrics** |
| 8 | **I Remember** | −12.1 | −1.0 | **no cover, no lyrics** |
| 9 | **Life Abundantly** | −12.2 | −1.0 | **no cover, no lyrics** |
| 10 | **An Artist** | −12.3 | −1.0 | **no cover, no lyrics** |
| 11 | **Light & Darkness** | −12.0 | −1.0 | **no cover, no lyrics** |
| 12 | **Light Behind My Eyes** | — | — | **no cover, no lyrics** |
| 13 | **Love Yourself** | — | — | cover exists, **no lyrics** |

**A Fool and a Liar (−10.3) and Magaraba (−10.2) are louder than the rest.** Both
sit ~2 dB above the −12.2 pack. On a single track-list page, players will have to
reach for the volume between tracks. Normalising these to −12.2 would make the
page listen as one album.

**This is the most fixable gap in the whole library.** Eight of these are
audio-complete. Adding cover art and lyrics turns 13 publishable tracks into
17 — no re-recording required.

---

## Tier 3 — Do not publish without a decision

| Track | Issue |
|---|---|
| **This is Love** | **−4.2 dBTP true peak.** Well outside safe headroom; risks audible clipping on loud systems. Needs a limiter pass before it goes anywhere. |
| **All That Is** | 6:30, 131 MB, named `(Final remove reverb) (Vocals)` — this is a **stems/vocals file**, not a finished master. Its sibling `Playback.wav` is 7:31. No cover, no lyrics. |
| **A Fool and a Liar** (root) | 84.7 MB vs 98.9 MB inside its folder — the two differ. Confirm which is current. |
| **Happiness / I AM Happiness** | Byte-identical duplicates, both 95.9 MB. Pick one title. |
| **New View A/B exports** | `_AB finale (loud then evened).wav` and `_AB intro (original then fixed).wav` are 1:50 **segments**, not full tracks. Delete or archive. |

---

## Duplicate and work-in-progress files

**Byte-identical duplicates** (same file size, safe to remove one copy):

- `I AM Happiness.wav` ≡ `happy\Happiness.wav` — 95.9 MB
- `Magaraba.wav` ≡ `Magaraba\Magaraba.wav` — 79.7 MB
- Three New View variants, all 57.3 MB: `(-11 LUFS loud)`, `(even master)`, `(intro lift)`

**Abbreviation leftovers:**

- `mt.wav` — duplicate of `Me Time.wav` (5:05, 76.9 MB)
- `Luv Yourself.wav` — near-duplicate of `Love Yourself.wav`; also the only file peaking at **−3.0 dBTP**

**Naming inconsistency across the library:** `Love Yourself` vs `Luv Yourself`,
`Me Time` vs `mt`. Worth settling before anything is published, because these become
URLs.

---

## What I'd suggest

**Start with Tier 1's four tracks.** They are mastered, capped safely, and each has
synced lyrics — a complete, credible first release with no further work.

**Then fix Tier 2 before adding it**, because it is cheap: normalise *A Fool and a
Liar* and *Magaraba* to −12.2 LUFS, and source cover art and lyrics for the eight
bare tracks. That takes you from 4 to 17 tracks.

**Hold Tier 3.** *This is Love* needs a limiter, *All That Is* is a stems file, and
the A/B exports and duplicate WAVs should be cleaned up regardless.

---

## Jev's read on the catalogue scope (2026-10-05)

I put the measured data to Jev (`jev-track-readiness.json`, model `imajev-2b`) rather than
guessing. Its answers, with probabilities:

| Question | Answer | Confidence |
|---|---|---|
| Catalogue scope | **`released_plus_measured`** (68.7%) over `released_only` (28.1%) | 0.58 |
| Loudness normalisation needed? | **Yes, 0.61** | — |
| Clipping blocker present? | **No, 0.42** — it did *not* flag a blocker | — |
| Value of a synced lyric scroll | **1.53 / 3 — "clear value"** (54% at level 2) | 0.31 (low) |
| Does this need the artist's own judgment? | **Yes, 0.97** | — |

**The last row is the one that matters.** Jev is near-certain that loudness and true-peak
measurements *cannot* tell us what you intend to publish. Technical readiness is not
artistic intent. So the measurement can narrow the field to a shortlist, but the final
call is yours — which is why the list above needs your tick marks rather than my verdict.

Two notes on the weaker signals:
- **Clipping: 0.42, not a blocker.** I disagree on the specifics — *This is Love* at
  −4.2 dBTP is objectively outside a safe master. Treat that row as a soft opinion.
- **Lyric scroll: 0.31 confidence, 21% unknown.** Directionally "clear value", but the
  low confidence and high unknown mass mean this shouldn't justify building it alone. If
  we do it, it should ride along with adding lyrics to the Tier 2 tracks.

## CORRECTION (2026-10-05) — the in-folder WAVs were missed

A second pass, after being asked whether I had checked the WAV **inside each single's
folder**, found that the first pass under-reported. Four tracks have a master in the
folder that differs from the one sitting at the album root:

| Track | In folder | At root | Folder is newer? |
|---|---|---|---|
| **Tears in the Rain** | **4:24 · −12.8 LUFS · −1.1 dBTP** | 4:59 · −12.6 LUFS · −1.0 dBTP | **yes** (23 Sep vs 25 Apr) |
| **Me Time** | **5:05 · −12.2 LUFS** | 5:05 · −12.2 LUFS | **yes** (21 Jun vs 24 Apr) |
| **New View** | **3:47 · −12.2 LUFS** | 3:48 · **−15.0 LUFS** | **yes** (14 Jun vs 25 Apr) |
| **Magaraba** | 5:16 · −10.2 LUFS | 5:16 · −10.2 LUFS | identical timestamp |

**The in-folder master is the current one in every case.** The root-level copies are older
working files that were never cleaned up.

**This changes a conclusion.** My first pass reported *New View* at **−12.2 LUFS**, and I
listed it as a healthy Tier 2 track. The in-folder master confirms −12.2, so that one
stands. But the root copy at −15.0 LUFS is the outlier, and **Tears in the Rain** has a
35-second difference between the two versions (4:24 vs 4:59) — so the *released* track may
not be the folder master, or vice versa. **That one needs your ear, not a measurement.**

**Rule this exposed:** `Get-ChildItem -Recurse` finds every WAV, but a flat list hides
*which version of a track is current*. For a library with duplicates, the per-folder
master plus its timestamp is the authoritative answer, and a flat file listing is not.

Also found in the same pass, and not in the first report:

- **`This Long Weekend (Single Release) (Vocals).wav`** — 4:34, **−19.4 LUFS, −6.0 dBTP**.
  Both figures are far outside a safe master. This is a stems/vocals export, consistent
  with its filename. The real master beside it is 4:36 at −15.1 LUFS / −1.5 dBTP.
- **`New View Final.wav`** is *not* louder than `New View.wav` despite the name:
  −12.8 vs −12.2 LUFS. The name is misleading; neither is the "even master".

**Corrected Tier 1 measurements** (from the in-folder masters, which are the current ones):

| # | Track | LUFS | True peak | Duration |
|---|---|---|---|---|
| 1 | **Tears in the Rain** | −12.8 | −1.1 | 4:24 |
| 2 | **The Games We Play as God** | −12.2 | −1.0 | 5:08 |
| 3 | **Me Time** | −12.2 | −1.1 | 5:05 |
| 4 | **New View** | −12.2 | −1.1 | 3:47 |

*This Long Weekend* stays in Tier 1 at −15.1 LUFS, but the note about it sounding quiet
now has a second cause: there is a **−19.4 LUFS** stems export sitting next to the real
master, which is an easy mistake to make when picking a file.

## Your call

Mark the list for me and I'll proceed:

- [ ] Tier 1 — all four
- [ ] Any specific Tier 2 tracks
- [ ] Any Tier 3 you want rescued
- [ ] Anything above I have wrong

Once you confirm, the next step is **Phase 1 of the content plan**: encode the chosen
tracks to MP3, convert their covers to WebP, and build the manifest — all local, all
**0 credits** against your 5,000 ceiling, nothing uploaded until you say so.
