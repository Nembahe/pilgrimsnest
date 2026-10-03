# MiniMax H3 hero clip — Pilgrim's Nest

Prepared per the `minimax-h3-prompting` skill (single-clip, eight blocks, Case B audio).
Brand values below are taken from the site's own `styles.css` tokens, not invented.

> **STATUS 2026-10-03: this prompt produced a clip with a real defect, but the
> defect is salvageable at the treatment level.** The generation was technically clean
> (2560×1440, 10.125s, H.264, no people, no text, correct palette), but **the stone ring
> around the fire pit melts from ~4.0s onward** — confirmed by three `videos_understand`
> passes and a live visual capture at t=6.86s.
>
> **Salvage:** played as a 3.0s loop at `opacity: .38` under the site scrim, the cut is
> visually invisible and the melting never becomes legible. Verified: 3 clean cycles, no
> artifact. This is why the clip is shippable without regenerating.
> **If you want a brighter hero video**, do not just raise the opacity — that brings the
> artifact straight back. Regenerate using the fixes below instead.

## If you regenerate — use the poster as the FIRST FRAME, not a fresh text prompt

`ai-video-generation` names image-to-video as the **recommended starting point for
consistency**. H3 supports it directly: `input_image` (a URL) + `reference_type: "first_frame"`.
That anchors frame 1 to a known-good still, so the model interpolates from a crisp
scene instead of inventing geometry from scratch — which is exactly what failed here.

**The anchor already exists and is already paid for:**
`output/pilgrims-nest-hero-poster.jpg` — 2752×1536, generated from the *same* `[STYLE]`
and `[LOCATION]` prose, with crisp individual stones around the hearth.

H3 `input_image` limits: one image by URL, `.jpg/.jpeg/.png/.webp/.heic/.heif`,
≤ 30 MB, 256-5760 px per side, aspect ratio 0.4-2.5. The poster passes all of these
(1.79:1 vs the clip's 1.78:1).

**How to submit it** (the image must be a URL, not a local path):
```
mcode-tools upload_temp_url output/pilgrims-nest-hero-poster.jpg
mcode-tools connector call connector__matrix__submit_video_generation --args-file args.json
```
with:
```json
{
  "model": "MiniMax-H3",
  "prompt": "<same eight blocks, but CAMERA block should now describe motion FROM the anchored first frame>",
  "input_image": "<temp_url>",
  "reference_type": "first_frame",
  "duration": 10,
  "ratio": "16:9",
  "resolution": "2K"
}
```

Do **not** use `last_frame_image` here. That mode anchors *both* ends, and the whole
problem in this session was a model anchoring the ending and melting into it.

**Prompt adjustment for image-to-video:** treat the poster as the visual first frame and
describe mainly *motion, camera movement and temporal change* — do not restate pixels
that are already in the image. Keep `[STYLE]`, `[LOCATION]` and the no-people
`[CHARACTER]` line, and change only the `[CAMERA]`/`[ACTION]` blocks to describe
movement away from the anchored frame.

## If you regenerate with plain text-to-video instead

1. **Drop the close stone ring.** Replace it with a small, distant fire so there is
   no hard-edged stone geometry in the foreground to melt.
2. **Hold the camera static.** Remove the slow push-in. Moving the camera re-samples
   the fire pit every frame and gives the model more opportunity to drift.
3. **Move the visual interest to what was stable** — drifting mist, rising embers,
   canopy sway. Those survived the full 10s intact.
4. **Consider a shorter duration** (5-6s) to reduce the number of frames the artifact
   can accumulate over.

## Verification gate — do not skip this

A single clean frame proves nothing. This clip looked perfect at frame 0 and at t=5s
and still failed. Before approving any regenerated clip:

- Run **two differently-phrased** `videos_understand` passes on the full file.
- Ask specifically: *"at which precise timestamp does degradation first become
  visible, and what is the last clean second?"* — not just "does it look good".
- Confirm visually with a **live-playing** capture: set `currentTime`, call
  `play()`, sleep, then **read `currentTime` back** to confirm which frame you got.
  A screenshot taken right after setting `currentTime` (without `play()`) silently
  returns frame 0.
- **If the clean window is under ~4s, reject it.** A 3s loop reads as a jump-cut.

## Submission parameters

| Field | Value | Why |
|---|---|---|
| `model` | `MiniMax-H3` | 2K + native audio; the only H3 variant that does 2K here |
| `resolution` | `2K` | Native, not upscaled |
| `ratio` | `16:9` | Site is desktop-first; user's standing default |
| `duration` | `10` | Long enough to read as atmosphere, short enough to loop cleanly |
| `reference_type` | *(omit)* | Pure text-to-video; no logo lock needed on an abstract plate |

## The prompt — paste verbatim

```
[STYLE]
Cinematic realism, no text or lettering anywhere in frame. Deep night palette
locked to near-black indigo (#070A12) and midnight navy (#0A0F1D), with warm
amber hearth light (#F59E0B) and soft gold bloom (#FDE68A) as the only warm
accents, and a faint sage green (#34D399) deep in the foliage. 35mm film grain,
motivated practical lighting, controlled depth of field, restrained grade with
cool shadows and warm highlights. Movement carries real weight; no synthetic
gloss, no lens flare, no heavy vignette. Maintain this exact medium throughout.

[CHARACTER]
None. No people, no faces, no figures, no silhouettes. This is an environment
plate. Keep the frame free of any human presence.

[LOCATION]
The edge of a quiet forest clearing at night, in the first hour before dawn.
Rough timber shelter beams frame the far edge, half-lost in shadow. A low stone
hearth sits at the centre-left, its embers the only warm light source. Tall
dark tree trunks rise on both sides, catching faint rim light. Low ground mist
drifts across the grass. The sky is deep indigo with a thin scatter of stars,
no moon disc. Distant hills read as soft dark shapes on the horizon.

[ACTION]
Embers lift slowly from the hearth and drift upward through the frame, thinning
as they rise and fading out before they reach the top. Mist creeps slowly across
the grass from left to right. The tree canopy sways gently in a light breeze.
Stars hold steady with a faint, slow twinkle. The overall tempo stays calm and
unhurried, with every element moving at its own natural pace.

[CAMERA]
Wide establishing shot, eye-level height, 47 degree field of view. A very slow
push in toward the hearth, barely perceptible across the whole clip. The hearth
stays at centre-left throughout. Focus holds on the hearth and the nearest
ground, with the treeline and hills falling softly out of focus.

[EDIT]
Single continuous shot, no internal cuts. Subtle handheld micro-movement
allowed. 35mm film grain, faint chromatic aberration on the highest-contrast
edges.

[AUDIO]
Sound consists only of the natural scene sounds implied by the visual: a low
crackle and occasional soft pop from the hearth embers, a distant owl, a faint
wind moving through high branches, and soft night insects. Quiet, sparse, and
mostly silence. NO MUSIC / NO BGM: no score, soundtrack, background music (BGM),
ambient music, musical bed, tonal pad, beat-synced music, or song audio.

[FORMAT]
10-second 16:9 2K video.
```

## Poster frame

Run the same `[STYLE]` + `[LOCATION]` prose as a still image via
`connector__matrix__generate_image` with `aspect_ratio: "16:9"`, `resolution: "2K"`.
That gives a poster that matches the clip instead of a black box before load.

## Non-negotiables carried from the skill

- **H3 always renders a native audio track** (confirmed in the connector description).
  The prompt asks for ambience only, and the integration ships `muted playsinline`,
  so the track is discarded by design. Do not try to "fix" the audio later — there is
  no ffmpeg on this machine.
- **No `[TYPOGRAPHY]` block.** The site supplies its own text; burnt-in lettering
  would fight the hero headline.
- **No `[CHARACTER]` content** beyond the explicit no-people line — including a
  character block with real content is the classic cause of a model inventing a person.
- **Regeneration cost:** each submission spends account credits (not Token Plan
  allowance). Re-paste the prompt byte-identically if retrying, so the visual target
  does not move.
