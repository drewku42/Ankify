# ADR-0001: Stream PDF page rendering to disk to bound AI-server memory

- **Status:** Accepted
- **Date:** 2026-07-06
- **Deciders:** Drew

## Context

The `ai-server` turns uploaded lecture PDFs into Anki cards. Because GPT-4o **Vision**
consumes images (not PDFs), the server must first **rasterize** every PDF page into a
bitmap before it can call OpenAI. That rasterization happens on our box; only the
inference happens on OpenAI's side.

Today `pdf_to_slides` (`app/services/pdf_processor.py`) does this:

```python
images = convert_from_path(str(path), dpi=200)   # renders ALL pages into RAM at once
for image in images:
    slides.append(SlideInput(image_base64=base64(_optimize_image(image)), ...))
```

Two problems compound:

1. `convert_from_path(dpi=200)` returns **every** page decoded in memory
   simultaneously (~9 MB per page raw → ~1.8 GB for a 200-slide deck).
2. It then builds a **second** full copy as a list of base64 strings.

Memory is therefore **unbounded** — it grows with `deck size × concurrency`. On the prod
box (t2.medium, 3.8 GB RAM, **0 swap**, co-resident MySQL + Node), a large med-lecture
upload drove the process to ~3 GB → the kernel OOM-killer fired → with no swap for
headroom the OS wedged → **prod outage on 2026-07-06** (login hung; box `impaired` for
6+ hours until a manual reboot).

Important scope note: OpenAI is _already_ called in **batches of 10 slides** per request
(`card_generator.py`, `BATCH_SIZE = 10`) for context-window and quality reasons. That
batching is correct and **out of scope** here. The bug is purely in the rasterization
stage holding the whole deck in RAM at once — it is _not_ "process fewer slides."

## Decision

Change `pdf_to_slides` to render with Poppler's `output_folder` (a temp directory) so
decoded page bitmaps **spill to disk** instead of all living in RAM, then load → encode →
release **one page at a time**. Peak memory drops from "all decoded pages at once" to
"~one decoded page + the compressed base64 list."

Every page is still processed and every OpenAI batch is still sent — output is identical.
The only change is that we never hold all decoded pages in memory simultaneously. It stays
a single Poppler render pass, so there is no meaningful speed cost (only trivial temp-file
disk I/O).

We keep the `list[SlideInput]` return type so the change does not ripple into the async
batch consumer (`generate_cards`).

## Alternatives considered

- **Scale up the instance (more RAM).** Rejected as the _primary_ fix. The memory pattern
  is unbounded, so more RAM just **moves the cliff** — a big enough deck or enough
  concurrent uploads blows past any fixed ceiling. It also adds ~$30/mo ongoing to a
  zero-revenue app, cutting against the very unit-economics concern that motivates the
  product plan. Scale for real throughput later, not to hide a bug.
- **Add swap only.** A swapfile is a **safety net for spikes, not a cause fix** — it keeps
  the box alive during a burst but leaves the unbounded pattern in place. Still worth
  adding separately as belt-and-suspenders, but it does not replace this change.
- **Full streaming generator** (`yield` one slide at a time; refactor `generate_cards` to
  pull batches from an iterator). This is the "purest" flat-memory design, but it ripples
  into async batching logic for marginal gain — the base64 list is only tens of MB. Deferred
  until decks get much larger or concurrency rises; revisit then.
- **Per-page subprocess** (`convert_from_path(first_page=i, last_page=i)` in a loop).
  Rejected: spawns one Poppler process **per page** and re-parses the whole PDF each time —
  real, avoidable overhead on large decks. The single-pass `output_folder` approach avoids it.

## Consequences

**Better**

- The OOM failure mode is removed **at the cause**: memory is bounded regardless of deck size.
- Same render pass → no meaningful latency change.
- The fix lives in the same file we'll touch next for the cheap-model swap — one trip.

**Worse / neutral**

- Relies on temp disk space during a render (trivial on this box).
- The base64 slide list is still fully materialized — acceptable at current deck sizes
  (tens of MB); it's the trigger to revisit the full-streaming generator if decks or
  concurrency grow.

**Follow-ups (tracked separately, not part of this ADR)**

- Add a 4 GB swapfile as a spike safety net.
- CloudWatch alarm → EC2 auto-recovery, and the PM2 systemd startup unit, so a wedged box
  self-heals instead of needing a manual 6am reboot.
- Consider DPI 200 → 150 if card quality holds (roughly halves render memory again).

## Verification (measured 2026-07-06)

Reproduced and fixed under test (`ai-server/tests/test_pdf_processor.py`):

- **Before:** a 36-page deck peaked at ~1.4 GB, growing ~11 MB/page — i.e. a
  ~160-page lecture would have hit ~6 GB and OOM-killed the 3.8 GB box. This is the
  outage, reproduced in miniature.
- **After:** peak is **bounded** at ~200–220 MB _regardless of deck size_ (measured
  flat from 24 to 160 pages).
- **Output unchanged:** the streamed JPEGs are **byte-identical** (matching MD5) to the
  old all-at-once render on real lecture PDFs (a 50-page and a 1-page deck), so the cards
  GPT-4o produces are guaranteed identical.

## Lesson

The instinct "just give it more memory" treats a symptom. The real question was _why does
memory grow without limit_ — and the answer was holding the whole deck in RAM at once, not
the amount of RAM. Bounding the resource beats raising the ceiling.
