# 07-06-2026 (session 3) — Back to the mission: cheap vision-model swap + card-quality evals

The infra fire is fully out (see `07-06-2026-prod-down-oom-outage` and
`07-06-2026-ai-server-memory-fix-and-adrs` — prod up, memory bounded, host self-healing,
two ADRs). Drew chose to **stop hardening and start the actual money work**. Good call —
that's the whole point per the Ankify strategy: cut the model cost, then go get users.

## The mission (from `ankify-monetization` / the strategy log)
1. **Swap the ai-server's vision model** from GPT-4o (frontier overkill for slide→card,
   ~$0.20–1.00/generation) to a cheap mini/flash-tier vision model → target a 5–20x cost
   cut so the unit economics work and Drew can test pricing without bleeding.
2. **Then distribution:** 10 med students, ask 3 for $10. (Not this session.)

## This session's goal
- Decide **which cheap vision model** performs well enough for lecture-slide → Anki cards.
- Figure out **how to evaluate an Anki deck's quality** (Drew's open question — he floated
  just reading outputs himself; likely want an LLM-as-judge + manual spot-check).
- Stand up a small **eval harness** so model swaps become measurable, not vibes.
- Do the actual swap (it's ~a 1-line change: `settings.openai_model` in ai-server config,
  though a provider switch touches the LangChain `ChatOpenAI` init in `card_generator.py`).

## Approach
Kicking off with `/deep-research` on (a) best cheap vision model for slide→flashcard and
(b) eval methodology for flashcard quality. Scoping questions asked first so the research
is actionable, not generic.

## My going-in hypothesis (to be tested, NOT from authority)
The candidates are the mini/flash vision tiers of the three big providers — an
OpenAI mini vision model, Google Gemini Flash, Anthropic Claude Haiku. The research will
pin down which wins on quality-per-dollar for *this* task, confirm vision support, and get
current pricing. Since the code is on LangChain, switching providers is cheap.

## What we did this session
- Scoped the model/eval question with Drew: **compare all 3 providers**, optimize for
  **max cost cut where quality holds**, evaluate via **LLM-as-judge + manual spot-check**.
- Launched `/deep-research` on model choice + flashcard-eval methodology, then **Drew called
  it off early** ("that is enough research") — he wants to act, not analyze. Fine.
- **Mapped the swap surface** (small, as hoped):
  - `ai-server/app/config.py:6` — `openai_model = "gpt-4o"`. Staying on OpenAI = a `.env`
    change (`OPENAI_MODEL=...`), zero code.
  - `ai-server/app/services/card_generator.py:105` — `ChatOpenAI(model=settings.openai_model)`.
    A provider switch (Gemini/Claude) = a small factory + one LangChain dep; all three support
    `.with_structured_output()`, and LangChain normalizes the base64 `image_url` blocks, so
    `_build_slide_content` likely needs little/no change.
- Parked a longer-term item to memory: **new landing page + design system** (component lib,
  theme/palette, Drew likes **serif fonts**) — see `ankify-design-landing-backlog`. Not now.

## PINNED — pick up here next session
Concrete, no-more-research next step (agreed direction, not yet executed):
1. Point ai-server at **`gpt-4o-mini`** (drop-in, no new dep — the cheapest first try).
2. Regenerate cards for `example-slides/1_ExampleLecture_CS.pdf`.
3. **A/B read** the mini output against the existing GPT-4o baseline already on disk:
   `example-slides/1_ExampleLecture_CS.cards.json` (April, GPT-4o). Do the cards hold up for a
   med student? Holds → ship the ~15–20x cost cut. Doesn't → try Gemini Flash / Claude Haiku.
   (Uses Drew's OpenAI key; ~cents.)
Then: build the small eval harness (LLM-judge + manual spot-check), then distribution.

## How Drew is
Energized to start the real work after a heavy infra day, and moving fast — scoped the
research, then cut it short to get to action, then pinned it for later. Good instinct to not
over-analyze; the risk is stopping before the concrete swap actually ships. Next session:
push gently to *execute* the gpt-4o-mini A/B rather than re-open the research. He's aiming at
the right (uncomfortable, sellable) target.
