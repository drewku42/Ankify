# 07-06-2026 (session 2) — Fixed the AI-server OOM at the cause; started ADRs

Continues the morning outage log (`07-06-2026-prod-down-oom-outage.md`). This session:
brought prod fully back, then fixed the *root cause* of the outage in code, TDD-style.

## Prod restore (finished the morning's cliffhanger)
- SSH'd in; box had held its reboot (11h uptime, RAM healthy, but **Swap still 0**).
- `pm2 start ecosystem.config.cjs` → both `ankify-backend` (:3000) and `ankify-ai` (:8000)
  online. External check: `api.ankify.io/health` → 200, frontend → 200. **502 gone, login
  works again. Prod is UP.**
- `pm2 save` done. `pm2 startup` (systemd unit so PM2 survives reboots) — **NOT yet run.**
  Drew paused me here (see below). Still a gap: a reboot right now would 502 again.

## Pivot: Drew wants to be guided, not spectated
Mid-`sudo pm2 startup` Drew stopped me: **"from here on out guide me through so I understand
what we are doing."** Saved as a feedback memory (`guide-me-through-ops`). For ops/infra work:
explain each command + why before running, let him follow/approve. This is skill-building, not
just getting prod green. I shifted to teaching mode for the rest of the session and it went well
— he asked sharp questions (below).

## Redundancy discussion (his call, well-reasoned)
Drew asked if we should make prod more redundant. Landed on the right distinction:
**redundancy (2nd server/LB/HA) = premature at zero users** (the comfort-zone trap); what he
actually wants is **self-healing on the one box** (cheap). Three cheap fixes identified: swap,
CloudWatch→EC2 auto-recovery, and the pm2 startup unit. He then asked the sharper question:
*scale up RAM vs optimize the code?* Nailed the key insight himself once I framed it — the memory
was **unbounded** (grows with deck size × concurrency), so scaling just **moves the cliff**;
optimizing **removes** it. He chose: **optimize.**

## What we shipped (in the `ankify` repo, not tracker)
1. **`adrs/` + `adrs/AGENTS.md`** — Drew's idea: a home for Architecture Decision Records so we
   "learn from it." AGENTS.md explains purpose/format (never delete/renumber; supersede instead).
2. **`adrs/0001-stream-pdf-rendering-to-bound-ai-server-memory.md`** — the full decision record,
   incl. alternatives rejected (scale-up, swap-only, full generator, per-page subprocess) and
   measured results.
3. **The actual fix** (`ai-server/app/services/pdf_processor.py`): render the PDF once to a temp
   folder with `paths_only=True`, then open→encode→free **one page at a time**, instead of
   `convert_from_path()` loading the whole deck into RAM at once.

### Corrected Drew's mental model (important)
He thought the OpenAI calls happen one slide at a time and the fix was "only process the first
image." Reading the code: OpenAI is **already batched 10 slides/request** (`card_generator.py`,
`BATCH_SIZE=10`) and we're **not** touching that. The bug was purely in the **rasterization**
step holding all decoded pages in RAM. Fix = don't hold them all at once; still process every page.

## TDD receipt (did it properly)
- Wrote a failing test first — since output doesn't change, the driver asserts **peak memory
  doesn't scale with page count** (subprocess ru_maxrss).
- **RED:** old code grew **+1217 MB** going 2→36 pages. Reproduced the outage in miniature.
- **GREEN:** after the fix, peak is **bounded ~200–220 MB from 24 to 160 pages** (probed the
  curve to confirm it's a flat plateau, not still-linear — and corrected the test to compare two
  sizes past the ~20-page startup knee so it measures real scaling).
- **Equivalence proof:** streamed JPEGs are **byte-identical (same MD5)** to the old render on
  real 50-page and 1-page lecture PDFs → cards guaranteed unchanged, no OpenAI spend needed.
- Lint clean on touched code. (2 pre-existing E501s in an untouched function left alone.)
- Also stood up the first real pytest suite + config for the ai-server (there was none).

## Update (same session, later) — memory fix deployed + host hardened
- **Memory fix deployed:** committed `149d051`, pushed, ran `deploy/deploy.sh` on the box.
  Prod now on the streaming renderer; health 200, both pm2 apps online.
- **Reboot gap CLOSED (ADR-0002 + `deploy/harden-host.sh`):** wrote an idempotent host-hardening
  script, tested it on prod, committed `9482460`, pushed, re-deployed. Applied + verified on the
  box: **4 GB swap active + in fstab** (swappiness=10), **`pm2-ubuntu` systemd unit enabled on
  boot** + `pm2 save` dump written. A reboot should no longer 502 prod, and a spike now has a
  cushion. (Not proven by an actual reboot — didn't bounce prod.)
- Two ADRs now live in `ankify/adrs/`: 0001 (bound memory) and 0002 (self-healing single host).
- Clarified for Drew: `deploy.sh` is code-only; host hardening is its own script — re-running
  deploy doesn't create swap/boot units. He got that.

## Open threads / next
- **Only remaining resilience follow-up:** CloudWatch alarm → EC2 auto-recovery (AWS-side, not a
  host command) + a swap/low-mem alarm. Documented in ADR-0002 follow-ups. Not urgent.
- **Verify the memory fix under real load** when convenient: upload a fat lecture PDF, watch
  `ankify-ai` mem stay flat in `pm2 monit` (structurally proven byte-identical + bounded in tests,
  but never watched on the box under a real upload).
- Naming: still "Ankify" in repo; Drew said "Oncify" verbally once. Unconfirmed.
- **The actual mission still waits:** cheap-model swap (1-line-ish, same file we were just in) →
  then distribution (10 med students, ask 3 for $10). The fire is fully out now — infra is in a
  genuinely good place. Watch the gravity toward yet more infra/tests vs. the uncomfortable
  selling work, which is the real skill unlock.

## How Drew was
Sharp and engaged. Asked genuinely good questions (why render at all, scale-vs-optimize, batch
overhead) and wanted to *understand* rather than just get it done — the guide-me ask is a good
sign of ownership. Good session.
