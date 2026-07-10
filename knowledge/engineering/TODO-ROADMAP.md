# Ankify — Roadmap & follow-ups

Handoff notes for the next session. Last updated when picking up after shipping v1.

**Technical onboarding (env, architecture, gotchas):** [`AGENT.md`](AGENT.md).

**v1 generation scope:** Shipped product generates **basic (front/back) cards only**. Cloze, image-heavy card types, and user-tunable “basic vs cloze mix” are **post-v1** until we intentionally expand the pipeline (see [`BUSINESS_CONTEXT.md`](../business/BUSINESS_CONTEXT.md), ANKIFY-004 notes).

---

## Product backlog (from earlier planning)

### High impact next

1. **Slide skip / select UI** — Preview PDF slide thumbnails before generation; deselect title slides, credits, appendix, etc. Saves API cost and latency on large decks.
2. **Card format preferences** — _Post-v1._ Let users describe or exemplify preferred card style (length, tone, density). **v1 stays basic-only;** a future iteration could add cloze/mix options once those card types are supported again in product and schema.

### Deferred until signal

1. **Prompt / quality iteration** — Tune prompts from real user feedback; optional “regenerate with stricter rules” per deck.

### From original product notes (longer horizon)

- **Annotation-aware cards** (possible paid tier) — detect highlights/ink on slides; higher complexity.
- **Streaming / partial results** — Show cards as they’re generated; more UX/engineering.
- **Mobile browser** — Polish when desktop experience is solid.

---

## Pricing & economics (vision / multimodal cost)

**Rough cost anchor (order of magnitude):** ~**$0.30 per ~50 slides** processed through the pipeline (validate against real usage).

**Usage sketch:**

- ~**20–25 generations/week** (weekday-heavy) → ~**$26–32 / user / month** API cost at that rate.
- **4–5 generations every day** → ~**$36–45 / user / month**.

**Implication:** A flat **$20/mo unlimited** vision-heavy usage is **tight vs API cost**; **power users** can dominate spend.

**Directions to explore:**

- **$20/mo** as a **bundle** that covers a **defined allowance** (slide pages or generations) that fits “typical” med/PA student load.
- **Soft warnings** near limit; **hard cap** or **overage** (e.g. per extra 50-slide batch) so bills stay predictable.
- **Higher tier** (e.g. $35–45) for heavier caps, or same entry price with **transparent overages**.
- **Value** that doesn’t scale API cost: deck org, search/tags, export polish, Anki workflow, slide picker, editing — so **$20 feels worth it** beyond raw generation volume.

Revisit numbers against **actual** OpenAI usage logs before locking price.

---

## Ops / tech reminders (production)

- EC2: **PM2** `save` + `startup`; **Certbot** renew dry-run periodically.
- **Nginx** `proxy_read_timeout` for long AI calls; backend `**AI_SERVER_URL=http://127.0.0.1:8000`** (avoid localhost IPv6 quirk).
- AI **CORS** in `.env` is **comma-separated URLs** (not JSON list).
- Deploy **backend** after pulling so routes like `/health/ai` exist if you add them.

---

## When you resume

1. Pick one backlog item (slide skip vs format prefs).
2. Re-validate **cost per deck** from production logs.
3. Sketch **pricing + caps** against real usage distribution (light vs power users).
