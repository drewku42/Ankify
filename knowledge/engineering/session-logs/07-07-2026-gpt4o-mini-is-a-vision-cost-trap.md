# 07-07-2026 — gpt-4o-mini is a vision cost trap; pivot to Gemini 2.5 Flash

Picked up from `07-06-2026-cheap-model-swap-and-evals` (pinned step: point ai-server at
`gpt-4o-mini`, regenerate the CS example deck, A/B-read vs the April GPT-4o baseline).
Executed the swap test. **Result: gpt-4o-mini is the wrong move — it's more expensive than
GPT-4o for our workload, not cheaper.** The premise of the whole swap was wrong for vision.

## What happened
- Ran the pipeline (`ai-server/test_pipeline.py`) with `OPENAI_MODEL=gpt-4o-mini` on
  `example-slides/1_ExampleLecture_CS.pdf`. Every real run failed with a frozen
  `429 ... TPM Limit 200000, Used 200000` — identical across a 90s idle wait and single-call
  retries. Tiny text probes to mini succeeded; the full 5-slide batch never did.
- The frozen 429 wasn't a transient burst or an external consumer (checked `ps` — nothing
  local; prod uses the same key but wasn't the cause). It was **structural**: one high-detail
  5-slide batch on mini is ~180k tokens, which brushes the **Tier-1 200k TPM** ceiling.

## The real finding (measured, ground truth)
Ran one slide (page 3) through each model via the Responses API and read reported
`input_tokens`:

| Model         | input_tokens / high-detail slide | $ per slide |
|---------------|----------------------------------|-------------|
| gpt-4o        | 1,116                            | $0.00279    |
| gpt-4o-mini   | 36,846                           | $0.00553    |

**gpt-4o-mini bills images at a ~33× token multiplier.** Cheap per-token price ($0.15 vs
$2.50 /1M) does NOT offset 33× more tokens → mini is **~2× more expensive per image** than
4o. Lecture slides must be `detail: high` to stay legible, so there's no way to dodge the
multiplier. Net: the "15–20× cost cut" hypothesis is dead for vision.

Re-derived the real anchor: GPT-4o ≈ **$0.29 / 50 slides** (matches the old ~$0.30 estimate).

## Decision
- **Do NOT swap to gpt-4o-mini.** Do NOT bump the OpenAI tier for it — that would only let a
  *more*-expensive path run. Tier bump is irrelevant to the economics.
- **Pivot to Gemini 2.5 Flash** — cheap image handling, realistically $0.30 → ~$0.03–0.05 /
  50 slides (~6–10× cut). This was already the fallback in the prior note. (Claude Haiku 4.5
  considered but its image tokens ≈ gpt-4o → only a modest cut; not the pick.)

## DONE this session (all of the above executed)
- **Provider factory shipped** — commit `6119993` "Add pluggable vision-LLM provider
  (OpenAI / Google Gemini)". `_build_llm()` in `card_generator.py` selects by
  `settings.llm_provider` (`"openai"` | `"google"`); added `langchain-google-genai` dep and
  `llm_provider` / `google_api_key` / `gemini_model` (`gemini-2.5-flash`) to `config.py`.
  **Default stays `openai`/gpt-4o → prod unchanged until an env var flips it.**
- **Drew enabled the Google key + billing** (starter prepay credits got depleted by the first
  50-page run; billing now on).
- **Cost confirmed (measured, full 50-slide deck, both models via batched pipeline):**
  - gpt-4o: 60,830 in / 3,572 out, 64 cards → **$0.188 / deck**
  - gemini-2.5-flash: 18,400 in / 16,257 out, 129 cards → **$0.046 / deck**
  - **~4.1× cheaper per deck; ~8× cheaper per card** (Gemini generates ~2× the cards).
  - Isolated single-slide input tokens are near-identical (~1,100 each) — the win is price
    ($0.30 vs $2.50 /1M in; $2.50 vs $10 /1M out), not fewer tokens.
- **Quality read (2 decks):** comparable-to-richer than the 4o baseline, correct atomic
  format, catches handwritten slide annotations + clinical pearls. Minor issues, all
  prompt-tunable not model-fatal: occasional over-decomposition into trivial cards (derm run
  made "Milia: plural form? → Milia" / "singular form? → Milium" — 2/15 junk), and one
  collapsed trend card on the CS deck.

## PINNED — pick up here next session
1. **Ship to prod (Drew's action on EC2):** set `GOOGLE_API_KEY` + `LLM_PROVIDER=google` in
   the ai-server `.env` on the box, redeploy/restart PM2 `ankify-ai`. Code already supports it;
   this is the only remaining step to realize the cost cut in prod. (Consider a quick prod
   smoke-gen after flipping.)
2. **Prompt tuning (quality polish, not blocking):** strengthen the "avoid trivial cards"
   guardrail in `SYSTEM_PROMPT` to kill over-decomposition (plural/singular vocab cards, etc.).
   Re-spot-check after.
3. **Eval harness** (LLM-judge + manual spot-check) so future prompt/model changes are
   measurable. Then **distribution** (10 med students, ask 3 for $10).

## Notes / gotchas
- **Baseline file:** `example-slides/1_ExampleLecture_CS.cards.json` is the April GPT-4o
  baseline — but it used the *old* prompt (full-sentence fronts, `<ul>`). Prompt was later
  rewritten to atomic-recall style (`Topic: aspect? (N)`, `<ol>`). So compare on **fact
  coverage/accuracy**, not format. `test_pipeline.py` OVERWRITES this file on success — back
  it up before any successful run.
- **Mini API-key quirk:** this `sk-proj-...` key is a restricted project key. It works on the
  **Responses API** (what the pipeline uses via `use_responses_api=True`) but returns
  `401 missing scope model.request` on plain `chat.completions`. Not a blocker; just don't
  probe via chat.completions.
- **Gemini prepay/billing:** first 50-page run depleted starter credits (`429 prepayment
  credits depleted`); Drew enabled billing. Watch for this on any fresh Google project.
- **Gemini image-token efficiency in batches:** solo single-slide input ≈ 1,087 tok, but in
  batches of 10 the per-slide input is much lower (~368) — Gemini tokenizes multi-image
  batches more efficiently than the solo probe implied. Trust the batched full-deck numbers.
- Local test artifacts live under `example-slides/` which is **gitignored** — Gemini outputs
  (`*.cards.gemini-flash.json`, `Milia_*.apkg`, etc.) stay local, never committed.
- `.gitignore` has an unrelated uncommitted `.superpowers/` line (not mine) — left unstaged.

## How Drew is
Sharp product instinct and moves fast. When mini turned out to be a cost trap he immediately
picked the right pivot (Gemini Flash), provisioned the key + billing properly (local + prod),
and chose "commit + spot-check before flipping prod" — measured, not reckless. Cost mission is
essentially solved (4.1× cut, code committed); just the prod env flip + optional prompt polish
remain before distribution.
