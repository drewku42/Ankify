# Ankify — notes for next session

**Infra, env vars, and deploy gotchas:** see [`docs/AGENT.md`](AGENT.md) (zero-context agent onboarding). This file overlaps with [`TODO-ROADMAP.md`](TODO-ROADMAP.md); roadmap + ops live there in more detail.

## Post-v1 / roadmap features (from prior planning)

1. **Slide skip / select UI** — Preview slide thumbnails before generation; let users deselect title slides, credits, appendix, etc. Saves API cost and latency.
2. **Card format preferences** — Let users teach the AI their preferred card style (length, cloze vs basic, tone, examples); feed into prompt tuning.
3. **Prompt / quality iteration** — Deferred until real user feedback; now viable to iterate from production usage.
4. **Other product ideas (original scope)** — Annotation-aware cards (paid tier later); streaming/partial results; mobile polish; S3 for production storage vs local disk on EC2.

## Pricing & economics (discussion — not finalized)

- Rough **API cost** ballpark used in discussion: **~$0.30 per ~50 slides** (vision / multimodal pipeline).
- Usage assumptions discussed: **~20–25 generations/week** vs **4–5/day × 30 days** → on the order of **~$26–32/mo** vs **~$36–45/mo** per heavy user at that unit cost (depends on definition of “generation”).
- **$20/mo** as a student-friendly price is plausible if paired with **included usage** (slide or generation caps), **overage pricing**, and/or **Pro tier** for power users — **unlimited** vision-heavy usage at $20 is risky vs variable cost.
- **Value-add features** that improve willingness to pay without linear API cost: deck organization, search/tags, better export, slide picker, editing UX, integrations — justify price beyond raw token spend.

## Tech context (production)

- **Frontend:** Vercel (`ankify.io`), `VITE_API_URL=https://api.ankify.io`, `frontend/vercel.json` SPA rewrites for client routes (e.g. `/auth/callback`).
- **Backend + AI + MySQL:** Single EC2; PM2 runs `ankify-backend` and `ankify-ai`; Nginx TLS for `api.ankify.io`.
- **AI server `CORS_ORIGINS`:** Must be **comma-separated string** in `.env` (not JSON list) — see `ai-server/app/config.py` + `main.py`.
- **Backend → AI:** `AI_SERVER_URL=http://127.0.0.1:8000` (avoid `localhost` IPv6 issues on Linux).

## Card generation behavior (reference)

- **Sequential batches** of slides (batch size 10), one async LLM call per batch — not parallel batches. See `ai-server/app/services/card_generator.py`.

---

*Pick up here when continuing product or engineering work.*