# Business Context: AnkiGen — AI-Powered Anki Deck Generator

**Date:** April 16, 2026 | **Author:** Drew Meyer | **Status:** Ready for Build

## What We're Building

A web app that converts PDF lecture slides into ready-to-import Anki flashcard decks using AI (GPT-4o). Medical and PA students upload a lecture PDF, the app extracts content via OCR, generates flashcards with appropriate card types (basic, cloze, image), and lets users review/edit cards before exporting a `.apkg` file they can import directly into Anki.

## Who Uses It & When

- **Primary users:** Medical students (MD/DO) and PA students
- **When:** Right after a lecture — converting material while it's fresh
- **Frequency:** Daily (after every lecture)
- **Time available:** Minutes — this replaces a ~2 hour manual process
- **Preceding action:** Just finished a lecture, have the PDF slides
- **Next action:** Download `.apkg`, import into Anki, start studying
- **Usage pattern:** One deck per lecture is the typical flow

## Core Workflow

1. User logs in (Google OAuth)
2. User uploads a PDF of lecture slides (up to 10 MB)
3. App extracts slide content via OCR
4. GPT-4o generates flashcards (basic, cloze deletion, image cards)
5. User reviews and edits cards in-app (Notion-clean UI, Anki-familiar patterns)
6. Cards are associated with their source PDF page
7. User exports deck as `.apkg` file
8. User imports into Anki and studies

**UX during generation:** Loading skeleton while cards are being generated (not streaming, not spinner).

## Data Flow

### Sources (data in)


| Data Element       | Source         | Notes                                       |
| ------------------ | -------------- | ------------------------------------------- |
| PDF lecture slides | User upload    | Clean/blank slides only for v1; up to 10 MB |
| Slide content      | OCR extraction | Text + images from PDF pages                |
| AI-generated cards | OpenAI GPT-4o  | Basic, cloze, and image card types          |
| User edits         | In-app editor  | Users review and modify generated cards     |
| User identity      | Google OAuth   | Authentication                              |


### Destinations (data out)


| Data Element             | Destination   | Format           | Notes                                 |
| ------------------------ | ------------- | ---------------- | ------------------------------------- |
| Uploaded PDFs            | AWS S3        | Binary           | Blob storage for source files         |
| User accounts            | Cloud DB      | Structured       | Persisted user profiles               |
| Decks & cards            | Cloud DB      | Structured       | Persisted between sessions            |
| Card ↔ source page links | Cloud DB      | Structured       | Associate each card with its PDF page |
| Exported decks           | User download | `.apkg` (SQLite) | Generated server-side                 |


## System Map


| System                  | Purpose                                                                                                           | Direction   |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------- |
| **Vercel**              | React + Vite frontend hosting                                                                                     | User-facing |
| **AWS ECS/Fargate**     | Backend API server (Node.js/TypeScript) — auth, CRUD, deck management                                             | In/Out      |
| **AWS Lambda**          | Python AI server (LangChain + structured outputs) — PDF → Vision → card generation + `.apkg` export via `genanki` | In → Out    |
| **AWS S3**              | PDF storage + generated `.apkg` file storage                                                                      | In/Out      |
| **MySQL (RDS)**         | User accounts, decks, cards, source page links                                                                    | In/Out      |
| **Google OAuth**        | Authentication                                                                                                    | In          |
| **OpenAI API (GPT-4o)** | Vision model for slide analysis and card generation                                                               | Out → In    |


## Where This Will Break

1. **AI cost scaling** — Medium severity. Free tool + organic sharing among med students = potentially rapid growth. No cost ceiling for now; add paid plan when costs become material.
2. **Card quality** — **High severity. This is the #1 failure mode.** If AI-generated cards are bad, users spend as long editing as they would creating from scratch, and the product is dead. Prompt engineering and card type selection logic are critical.
3. **PDF extraction quality** — Medium severity. Medical slides can be messy (images, tables, multi-column). Starting with clean/blank slides only; iterate from there.
4. **Processing time** — Medium severity. 100-slide deck through GPT-4o could take 30-60s+. Loading skeleton for v1; streaming cards individually is a future improvement.
5. **OpenAI downtime/latency spikes** — Low severity. Add fallback provider later; not expected to be frequent.
6. `**.apkg` generation reliability** — Medium severity. `.apkg` is a SQLite database with a specific schema. If export is broken, the entire value prop is broken. Needs thorough testing across Anki versions.
7. **Annotation detection (future)** — Deferred. Detecting user markup (circles, underlines, margin notes) is a future paid feature. V1 is clean slides only.

## Architecture

```
┌─────────────┐     ┌──────────────────────┐     ┌───────────────────────────┐
│  Frontend    │     │  Backend API          │     │  AI Server                │
│  React+Vite  │────▶│  Node.js/TypeScript   │────▶│  Python/LangChain         │
│  (Vercel)    │     │  (AWS ECS)            │     │  (AWS Lambda)             │
└─────────────┘     │                      │     │                           │
                    │  - Google OAuth       │     │  - pdf-to-img → GPT-4o   │
                    │  - CRUD (decks/cards) │     │    Vision (structured     │
                    │  - Deck management    │     │    outputs)               │
                    │  - Export triggers    │     │  - genanki (.apkg build)  │
                    │                      │     │  - S3 read/write          │
                    └──────────┬───────────┘     └───────────────────────────┘
                               │
                    ┌──────────┴───────────┐
                    │  MySQL (RDS)         │     ┌───────────┐
                    │  users, decks, cards │     │  AWS S3   │
                    │  card_media          │     │  PDFs     │
                    └──────────────────────┘     │  .apkg    │
                                                │  images   │
                                                └───────────┘
```

## Constraints

- **Timeline:** ~1 week, solo developer + AI coding assistants
- **Development approach:** Build end-to-end locally first, then deploy to cloud infrastructure
- **Platform:** Desktop web only for v1
- **Auth:** Google OAuth
- **AI provider:** OpenAI GPT-4o via LangChain with structured outputs (will experiment with other models)
- **AI server:** Python (LangChain) — separate from Node.js backend
- **PDF processing:** Vision-based (render slides as images → GPT-4o Vision) — not text extraction
- **PDF scope:** Clean/blank lecture slides only — no annotation detection in v1
- **File size:** 10 MB max upload
- **Export:** `.apkg` only via `genanki` (Python, server-side)
- **Database:** MySQL — schema: `users`, `decks`, `cards`, `card_media`
- **Storage:** AWS S3 for PDFs, images, and generated `.apkg` files
- **Budget:** No hard ceiling on AI costs for now; $100/mo OpenAI spend cap as safety net; paid plan if costs grow
- **UI:** Notion-inspired clean aesthetic with Anki-familiar workflow patterns

## Resolved Technical Decisions


| Question               | Decision                                                                                                                                                           | Rationale                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| **Database**           | MySQL (RDS)                                                                                                                                                        | Relational model (users → decks → cards). PDFs stored in S3, not DB.                                      |
| **OpenAI API key**     | GPT-4o access, $100/mo spend cap, env vars locally, Secrets Manager in prod                                                                                        | Safety net while free; upgrade tier as needed                                                             |
| **PDF processing**     | `pdf-to-img` to render pages as images → send to GPT-4o Vision                                                                                                     | Preserves visual context (layout, diagrams, emphasis); foundation for future annotation detection         |
| `**.apkg` generation** | `genanki` (Python) on the AI server                                                                                                                                | Most mature library (2.5k+ stars), handles cloze + media + custom templates; already on the Python server |
| **Card generation**    | LangChain + structured outputs → JSON per card with type, front, back, source page                                                                                 | Structured outputs ensure parseable results; prompt determines card type per slide                        |
| **Image handling**     | Images extracted from slides, stored in S3, packed as numbered media files in `.apkg` ZIP with JSON mapping; referenced in card HTML as `<img src="filename.jpg">` | Per Anki Legacy 2 format spec (see `docs/anki/apkg-file-format.md`)                                       |


## Open Questions

- **Card generation prompt design** — Exact prompt for instructing GPT-4o on when to use basic vs. cloze vs. image cards. Will iterate with real lecture PDFs. **Owner: Drew**
- **Image extraction from vision output** — How to capture/extract diagram images from slides when GPT-4o Vision identifies them as card-worthy. May need `pdf-to-img` crop or separate extraction pass. **Owner: Drew**

## Success Criteria

- **Working:** Friends share it with classmates without being asked. Students stop making cards manually and use this daily.
- **Failing:** Card quality is so bad that users spend as long editing AI-generated cards as they would creating them from scratch. Users try it once and go back to manual.
- **MVP scope:** Basic front/back cards only (no cloze, no image cards) if timeline gets tight. Upload → generate → download flow is the non-negotiable core.
- **Not in v1:**
  - Annotation detection (future paid feature)
  - Streaming card generation (loading skeleton for now)
  - Mobile browser support
  - Multiple export formats
  - Fallback AI provider
  - Batch upload (multiple lectures at once)

