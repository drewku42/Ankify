# Business Context: Ankify — AI-Powered Anki Deck Generator

**Date:** April 16, 2026 (updated post–v1 ship) | **Author:** Drew Meyer | **Status:** v1 shipped; iterating on quality and next features

## What We're Building

A web app that converts PDF lecture slides into ready-to-import Anki flashcard decks using AI (GPT-4o Vision). Medical and PA students upload a lecture PDF, the app renders slides to images, generates flashcards (basic, cloze, image) with structured outputs, and lets users review/edit cards before exporting a `.apkg` file they can import into Anki.

## Who Uses It & When

- **Primary users:** Medical students (MD/DO) and PA students
- **When:** Right after a lecture — converting material while it's fresh
- **Frequency:** Daily (after every lecture)
- **Time available:** Minutes — this replaces a ~2 hour manual process
- **Preceding action:** Just finished a lecture, have the PDF slides
- **Next action:** Download `.apkg`, import into Anki, start studying
- **Usage pattern:** One deck per lecture is the typical flow

## Core Workflow

1. User logs in (Google OAuth; dev login available locally)
2. User uploads a PDF of lecture slides
3. App renders slides and sends images to GPT-4o Vision (not plain-text OCR-only)
4. GPT-4o generates flashcards (basic, cloze deletion, image cards)
5. User reviews and edits cards in-app (Notion-clean UI, Anki-familiar patterns)
6. Cards are associated with their source PDF page
7. User exports deck as `.apkg` file
8. User imports into Anki and studies

**UX during generation:** Loading skeleton while cards are being generated (not streaming).

## Data Flow

### Sources (data in)

| Data Element       | Source         | Notes                                       |
| ------------------ | -------------- | ------------------------------------------- |
| PDF lecture slides | User upload    | Clean/blank slides for v1; no size limit  |
| Slide content      | Vision pipeline | Images per page → GPT-4o Vision             |
| AI-generated cards | OpenAI GPT-4o  | Basic, cloze, and image card types          |
| User edits         | In-app editor  | Users review and modify generated cards     |
| User identity      | Google OAuth   | Authentication                              |

### Destinations (data out)

| Data Element             | Destination   | Format           | Notes                                      |
| ------------------------ | ------------- | ---------------- | ------------------------------------------ |
| Uploaded PDFs            | Object storage or local disk | Binary | **Prod:** filesystem under `STORAGE_LOCAL_DIR`; **optional dev:** S3-compatible (LocalStack). AWS S3 path supported when `STORAGE_DRIVER=s3`. |
| User accounts            | MySQL         | Structured       | Persisted user profiles                    |
| Decks & cards            | MySQL         | Structured       | Persisted between sessions                 |
| Card ↔ source page links | MySQL         | Structured       | Associate each card with its PDF page      |
| Exported decks           | User download | `.apkg` (SQLite) | Generated server-side (genanki, AI server) |

## System Map (as shipped — v1)

| System                  | Purpose                                                                                                           | Direction   |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------- |
| **Vercel**              | React + Vite frontend (`ankify.io`)                                                                               | User-facing |
| **EC2**                 | Express backend (auth, CRUD, uploads, proxy to AI) + FastAPI AI server (PDF → cards → `.apkg`) + MySQL, behind Nginx (`api.ankify.io`) | In/Out      |
| **Local filesystem**    | PDF and intermediate storage on EC2 (`STORAGE_DRIVER=local`)                                                    | In/Out      |
| **Google OAuth**        | Authentication                                                                                                    | In          |
| **OpenAI API (GPT-4o)** | Vision for slide analysis and card generation                                                                     | Out → In    |

**Local development:** Docker Compose runs MySQL; optional **LocalStack** profile emulates S3 for parity with `STORAGE_DRIVER=s3`. **Local dev default** remains filesystem storage without LocalStack.

## Where This Will Break

1. **AI cost scaling** — Medium severity. Organic growth among students can raise spend; pricing and caps are a follow-on concern (see `docs/TODO-ROADMAP.md`).
2. **Card quality** — **High severity. This is the #1 failure mode.** If AI-generated cards are bad, users spend as long editing as they would creating from scratch, and the product is dead. Prompt engineering and card type selection logic are critical.
3. **PDF extraction quality** — Medium severity. Medical slides can be messy (images, tables, multi-column). v1 assumes clean slides; iterate from real usage.
4. **Processing time** — Medium severity. Large decks can take many minutes; loading skeleton in UI; Nginx/timeouts must allow long AI calls.
5. **OpenAI downtime/latency spikes** — Low severity. Add fallback provider later; not expected to be frequent.
6. **`.apkg` generation reliability** — Medium severity. `.apkg` is SQLite with a specific schema. If export is broken, the entire value prop is broken. Test across Anki versions.
7. **Annotation detection (future)** — Deferred. Detecting user markup is a future paid feature. v1 is clean slides only.

## Architecture (shipped)

```
┌─────────────┐     ┌──────────────────────────────┐     ┌───────────────────────────┐
│  Frontend    │     │  Backend API (EC2)          │     │  AI server (same EC2)      │
│  React+Vite  │────▶│  Node.js / Express          │────▶│  Python / FastAPI          │
│  (Vercel)    │     │  Nginx TLS :443 → :3000     │     │  PM2 :8000                 │
└─────────────┘     │                             │     │                            │
                    │  - Google OAuth              │     │  - pdf → images → GPT-4o   │
                    │  - CRUD (decks/cards)        │     │  - genanki (.apkg)         │
                    │  - Uploads / storage         │     │                            │
                    └──────────┬──────────────────┘     └────────────────────────────┘
                               │
                    ┌──────────┴───────────┐     ┌────────────────────┐
                    │  MySQL               │     │  Local disk storage │
                    │  users, decks, cards │     │  (prod default)    │
                    └──────────────────────┘     └────────────────────┘
```

## Constraints (historical + current)

- **v1 timeline:** ~1 week build target (met for initial ship); ongoing iteration.
- **Platform:** Desktop web for v1; mobile polish later.
- **Auth:** Google OAuth (production); dev login in development.
- **AI provider:** OpenAI GPT-4o via LangChain with structured outputs.
- **AI server:** Python (FastAPI) — separate process from Node backend; co-located on EC2 in production.
- **PDF processing:** Vision (render slides as images → GPT-4o Vision).
- **PDF scope:** Clean lecture slides — no annotation detection in v1.
- **File size:** No enforced limit (cost scales with page count, not file size).
- **Export:** `.apkg` via genanki on the AI server.
- **Database:** MySQL — Prisma schema: users, decks, cards, etc.
- **Storage (prod):** Local filesystem on EC2 by default; S3 remains supported in code for future cloud storage.
- **UI:** Notion-inspired aesthetic with Anki-familiar workflow patterns.

## Resolved Technical Decisions

| Question               | Decision                                                                                                                                                           | Rationale                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| **Hosting (v1)**       | Vercel (frontend) + single EC2 (API + AI + MySQL) + Nginx                                                                                                          | Simplicity and speed to ship; not ECS/Lambda as originally sketched.                                      |
| **Database**           | MySQL                                                                                                                                                              | Relational model; files not stored in DB.                                                                 |
| **PDF processing**     | `pdf2image` / poppler → GPT-4o Vision                                                                                                                            | Preserves visual context (layout, diagrams).                                                              |
| **`.apkg` generation** | `genanki` (Python) on the AI server                                                                                                                              | Mature library; cloze + media + templates.                                                                |
| **Card generation**    | LangChain + structured outputs → typed card payloads                                                                                                             | Parseable, validated outputs.                                                                             |
| **Image handling**     | Images from slides packed into `.apkg` with media mapping                                                                                                        | Anki Legacy 2 expectations (see `docs/anki/`).                                                            |
| **Local S3 testing**   | LocalStack (optional Docker profile) + `STORAGE_DRIVER=s3`                                                                                                       | Parity with S3 API without AWS in dev.                                                                    |

## Open Questions (post–v1)

- **Prompt and card-type tuning** — Ongoing from real lecture PDFs and user feedback.
- **Pricing and usage caps** — See `docs/TODO-ROADMAP.md`; validate against OpenAI usage data.
- **Product backlog** — Slide picker / skip slides, card format preferences, etc.

## Success Criteria

- **Working:** Friends share it with classmates without being asked. Students stop making cards manually and use this daily.
- **Failing:** Card quality is so bad that users spend as long editing AI-generated cards as they would creating them from scratch. Users try it once and go back to manual.
- **v1 outcome:** End-to-end flow shipped (upload → generate → edit → export `.apkg`); production URL live; quality iteration continues.

## Not in v1 (still)

- Annotation detection (future paid feature)
- Streaming card generation (loading skeleton for now)
- Mobile browser support
- Multiple export formats
- Fallback AI provider
- Batch upload (multiple lectures at once)
