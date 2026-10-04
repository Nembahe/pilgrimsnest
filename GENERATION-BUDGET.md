# Generation budget — hard ceiling 5,000 credits

Set by Jayden, 2026-10-04. This is a **standing limit**, not a per-task estimate.

## Why this exists

MiniMax **H3 is excluded from the Plus Token Plan quota**, so every H3 generation
draws from the separate **Credits** balance. Jayden's panel at the time of setting
this showed 5 Hours 0%, Weekly 1%, **Credits 15,700** — so the plan windows are not
the thing being drained; Credits is.

## The rule

**Never submit a generation without stating its cost first.** If the cost would push
spend past 5,000 credits, do not submit — say so and work from assets already on disk.

No batch retries. No "one more attempt" loops. A failed generation is not charged, but
repeated failures still burn time.

## Authoritative rates

From `platform.minimax.io/docs/pricing/overview` (checked 2026-10-03):

| Model | Resolution | Rate | 10s clip |
|---|---|---|---|
| MiniMax-H3 | 2K | $0.13 / sec | **$1.30** |
| MiniMax-H3 | 768P | $0.08 / sec | $0.80 |
| MiniMax-H3-Max | 768P | $0.08 / sec | $0.80 |
| MiniMax-H3-Max | 480P | $0.0553 / sec | $0.55 |
| Images | any | $0.0035 / image | — |

H3 supports 4–15s (H3-Max 5–15s). Input images: first 5 free, then $0.04 each.

**Cheapest acceptable option is 768P at $0.80 for a 10s clip.** Prefer it for
iteration; only go 2K once a look is approved.

## What is already paid for — reuse before regenerating

- `assets/hero-loop.mp4` — 718 KB H.264, 2560×1440, 3.00s, no audio. **Shipped.**
  Trimmed from the original 4.51 MB generation; the trim is the reusable asset.
- `output/pilgrims-nest-hero-poster.jpg` — 2752×1536 still, usable as an
  `input_image` / `first_frame` anchor without generating a new one.
- `H3-HERO-PROMPT.md` — the full eight-block prompt, plus the image-to-video
  regeneration path. The anchor image for that path is already on disk.

**If a regeneration is ever authorised, use the poster as the first frame** rather
than re-running the text prompt. The original text-to-video run melted the fire-pit
geometry from ~4.0s; anchoring frame 1 attacks that root cause and costs one
generation, not two.

## Unverified — do not assert

Whether Jayden's **Credits** balance expires is **not established**. Several
third-party sites claim "credits never expire", but that is not MiniMax
documentation. The one hard rule from the official pricing page is that prepaid
**Video Packages** are valid 1 month and *"unused video points expire with the
package and do not roll over — your video point balance resets to zero"*. His panel
shows **Credits**, not a Video Package, so that rule does not directly apply.

Check the live balance at `platform.minimax.io/user-center/payment/balance`. There is
no usage or billing tool in the `mcode-tools` connector catalog, so the agent cannot
read it — Jayden must.
