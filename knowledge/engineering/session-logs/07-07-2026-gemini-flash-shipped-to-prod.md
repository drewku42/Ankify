# 07-07-2026 (session close) — Gemini 2.5 Flash shipped to prod; the cost cut is live

Session-close/handoff log. The detailed investigation (why gpt-4o-mini was rejected, all the
measurements) lives in `07-07-2026-gpt4o-mini-is-a-vision-cost-trap.md` — read that for the
"why." This file is the **current state + pick-up-here**.

## What shipped today
The cost mission from the strategy is **done and in production.** Swapped the ai-server's
vision model from GPT-4o to **Gemini 2.5 Flash** behind a provider switch.

- **Code:** commit `6119993` "Add pluggable vision-LLM provider (OpenAI / Google Gemini)".
  `_build_llm()` in `ai-server/app/services/card_generator.py` selects by
  `settings.llm_provider` (`"openai"` | `"google"`). Added `langchain-google-genai`; config
  gained `llm_provider` / `google_api_key` / `gemini_model` (`gemini-2.5-flash`). Default is
  still `openai`/gpt-4o in code — prod runs Gemini via env, not by changing the default.
- **Deployed:** Drew pushed, set `GOOGLE_API_KEY` + `LLM_PROVIDER=google` in the ai-server
  `.env` on EC2, installed the new dep and restarted. Vercel frontend deployment is up.
- **Result (measured, full 50-slide deck):** gpt-4o $0.188/deck → **Gemini $0.046/deck =
  ~4.1× cheaper** (~8× per card; Gemini generates ~2× the cards). Quality validated on 2
  decks (CS lecture + derm milia): comparable-to-richer than the 4o baseline.

## Deployment gotcha (learned this session)
Adding a Python dep means a **bare `pm2 restart` is NOT enough** — the box needs
`poetry install --no-root` first, or generation crashes with `ModuleNotFoundError` (the Gemini
import is lazy inside `_build_llm()`). The full `deploy/deploy.sh` handles this
(`poetry install` + `pm2 restart all --update-env`); the lean path is just those two ai-server
steps since there were no backend/schema changes.

## PINNED — pick up here next session
1. **Landing page redesign (Drew is starting this NOW):** current page "looks pretty basic."
   See the `ankify-design-landing-backlog` note — component lib, theme/palette, **Drew likes
   serif fonts**. This is the active next thread.
2. **Prompt tuning (quality polish):** Gemini over-decomposes occasionally into trivial cards
   (derm run produced "Milia: plural form? → Milia" / "singular form? → Milium", 2/15 junk;
   CS deck collapsed one 2-part trend card to 1). Strengthen the "avoid trivial cards" rule in
   `SYSTEM_PROMPT`. Not blocking — model choice is settled.
3. **Eval harness** (LLM-judge + manual spot-check) so future prompt/model changes are
   measurable, then **distribution** (10 med students, ask 3 for $10).

## Gotchas / references
- Gemini billing: fresh Google projects have small prepay credits that a couple of full decks
  will deplete (`429 prepayment credits depleted`) — billing is now enabled.
- Local test artifacts under `example-slides/` are **gitignored** (Gemini `*.cards.json`,
  `*.apkg` stay local).
- VM terminal fix (came up today): `export TERM=xterm-256color` on the box if `nano`/`clear`
  error with `xterm-ghostty` (the VM lacks Ghostty's terminfo entry).

## How Drew is
Great session — shipped the whole cost cut end-to-end (reject mini → wire Gemini → measure →
commit → deploy) and it's live, then pivoted straight to the next real problem (landing page
polish) without lingering. Fast, decisive, product-minded. Momentum is on making Ankify
sellable; next is making it *look* worth paying for.
