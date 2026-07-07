# Landing Page Redesign — Design Spec

**Date:** 2026-07-07
**Status:** Approved (design), pending implementation plan

## Problem

Ankify has no real landing page. The unauthenticated entry point is
`frontend/src/pages/LoginPage.tsx` (route `/login`): an "Ankify" title, a one-line
subtitle, and a "Sign in with Google" button. It tells a first-time visitor nothing
about what the product does or why they'd want it.

## Goal

Replace the bare login screen with a landing page that clearly and confidently sells
the product's single real capability today: **take PDF lecture slides → generate
atomic Anki cards → export them.** No overpromising features that don't exist yet
(a "card studio" is planned but out of scope here). The design should leave obvious
room to grow into that studio later.

## Audience & Positioning

- **Primary audience:** power users / the existing Anki + spaced-repetition crowd.
  They already know what atomic cards are; the design can be denser, sharper, and
  more technical than a mainstream app. They value efficiency and credibility.
- **Desired feel:** sharp, capable, design-forward, opinionated. Not generic SaaS,
  not a template.

## Aesthetic Direction — "Editorial Bold"

Chosen after exploring several directions (clean-SaaS, terminal, editorial-serif,
card-motif, jewel-tone duotone). Editorial Bold won: it keeps the polish of a clean
layout but earns distinctiveness from oversized grotesk typography and a high-contrast
ink + chartreuse/emerald palette. Explicitly **not** a warm paper + serif look (too
close to Anthropic's identity) and **not** dark-by-default (light theme is the default).

### Design tokens (landing-scoped)

Scope these to the landing page for now; do **not** globally rewrite the authed app's
existing Notion-ish tokens in `global.scss`.

| Token | Value | Use |
|-------|-------|-----|
| Ink (text / dark surfaces) | `#12140f` | Headlines, primary button, dark card faces |
| Off-white (page bg) | `#f4f5f0` | Landing background |
| Emerald (accent) | `#0f7a52` | Labels, arrow, links, small accents |
| Chartreuse (highlight) | `#c6f26b` | Highlighter mark on key words, card Q labels |
| Muted ink (body) | `#4a4d43` | Subcopy / body text |
| Panel border | `#d9ddd0` | Card / page-mock borders |
| Display type | Grotesk — `'Helvetica Neue', ui-sans-serif, system-ui`, weight 800, tight tracking (`-0.035em`) | Headlines |
| Mono label type | `ui-monospace` | Numbered kickers (e.g. `01 — LECTURE PDF → ANKI`) |

### Signature hero visual

A left-copy / right-visual hero:

- **Copy (left):** mono kicker (`01 — LECTURE PDF → ANKI`), oversized grotesk headline
  ("Stop making cards by hand. **Ankify it.**" with a chartreuse highlighter mark on
  "Ankify it."), a one-line subcopy, then the CTA row: an ink "Continue with Google"
  button plus an emerald "✓ Exports to **.apkg**" callout.
- **Visual (right):** the transformation, shown literally:
  **a fanned stack of PDF pages** (poker-hand style, with a green **PDF** tag on the
  top page) → **green arrow →** **a fanned stack of generated Anki cards** (ink card
  faces, chartreuse `Q ·` labels, sample bio Q/A content).

This visual doubles as a wordless explainer of what the app does.

## Shared Content Blocks

All three variations draw from the same block library (built once, reused):

1. **Hero** — as described above.
2. **How it works** — three steps: (1) Upload your lecture slides (PDF), (2) Ankify
   writes clean, atomic flashcards, (3) Export straight to Anki (`.apkg`).
3. **Sample-card showcase** — one or more beautifully typeset generated cards,
   demonstrating card craft/atomicity.
4. **Footer CTA** — repeat "Continue with Google" + `.apkg` export callout.

No pricing block, testimonials, or example-deck gallery in this iteration (can be
added later). The generation-is-paid / studio-is-free model is **not** surfaced yet.

## The Three Worktree Variations

Same Editorial-Bold aesthetic and shared blocks; they differ only in **layout /
composition**, so we can compare and pick a winner.

1. **Minimal** — Hero + sign-in, essentially one screen. The safe option: a polished,
   modern evolution of today's login page. Fastest path if we want to ship something
   strong immediately.
2. **Standard landing** — Hero → How it works (3 steps) → Sample-card showcase →
   Footer CTA. The conventional, complete SaaS landing.
3. **Long editorial scroll** — A narrative, section-by-section story with big type
   moments; the PDF → cards transformation revealed/animated as the user scrolls,
   ending in the CTA. The most experimental, design-forward swing.

## Architecture & Integration

- **Stack:** React 19 + Vite + TypeScript + **SCSS** (BEM-style class names, CSS custom
  properties as tokens). No Tailwind. Router is react-router-dom v7; the landing
  currently lives at `/login`.
- **Auth wiring is unchanged.** The existing `handleGoogleLogin` (redirect to
  `${API_URL}/auth/google`) and the DEV-only dev-login button must be preserved in
  whatever component renders the CTA. The redesign is purely presentational over the
  same auth flow.
- **Component boundaries:** build the shared landing pieces as small, focused,
  independently understandable components (e.g. `LandingHero`, `HowItWorks`,
  `SampleCard`, `SignInCTA`, plus the `PdfToCardsVisual`). Each variation is a thin
  page that composes these blocks in a different order/density. Landing styles live in
  their own SCSS partial(s) (e.g. `styles/landing.scss`), scoped so they don't leak
  into the authed app.
- **Worktree strategy:** each of the three variations is developed in its own git
  worktree so they can be built and compared in parallel without stepping on each
  other. All three branch from the same baseline that contains this spec and the
  shared block library.

## Out of Scope

- The card studio / review environment (future work).
- Pricing / paywall UI.
- Any change to the authenticated app's existing theme or the auth backend.

## Success Criteria

- A first-time visitor immediately understands: it turns lecture PDFs into Anki cards
  you can export.
- The page reads as sharp and intentional to a power user — not a generic template.
- Google sign-in (and DEV dev-login) work exactly as before.
- Three comparable variations exist as separate worktrees, all sharing the
  Editorial-Bold system, for a final pick.
