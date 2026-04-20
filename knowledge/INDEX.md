# Ankify Knowledge Base

The "second brain" for all organizational knowledge. If it's been decided, documented, or learned — it lives here.

---

## Business

| Document | What's in it |
|----------|-------------|
| [BUSINESS_CONTEXT.md](business/BUSINESS_CONTEXT.md) | Product vision, users, core workflow, data flow, system map, constraints, risks, success criteria |

## Engineering

| Document | What's in it |
|----------|-------------|
| [AGENT.md](engineering/AGENT.md) | Zero-context agent onboarding — architecture, env vars, deploy, production gotchas, local dev setup |
| [RELEASE_CHECKLIST.md](engineering/RELEASE_CHECKLIST.md) | **Feature release / prod deploy** — Prisma migrations, `prisma generate`, `npm run build`, PM2, verification |
| [TODO-ROADMAP.md](engineering/TODO-ROADMAP.md) | Product backlog, pricing/economics discussion, ops reminders |
| [NEXT_SESSION.md](engineering/NEXT_SESSION.md) | Handoff notes — overlaps with roadmap, kept for session continuity |

## Product — Tickets

Active work tracker. One markdown file per ticket. Convention: `ANKIFY-<number>-<slug>.md`.

| Ticket | Title | Status |
|--------|-------|--------|
| [ANKIFY-001](engineering/tickets/ANKIFY-001-error-feedback.md) | Surface error feedback to users | `shipped` |
| [ANKIFY-002](engineering/tickets/ANKIFY-002-duplicate-deck-names.md) | Prevent duplicate deck names | `shipped` |
| [ANKIFY-003](engineering/tickets/ANKIFY-003-upload-progress-flow.md) | Upload-to-complete progress flow | `shipped` |
| [ANKIFY-004](engineering/tickets/ANKIFY-004-image-cards-missing-images.md) | Image cards / card types (removed for v1) | `cancelled` |

Template: [tickets/_TEMPLATE.md](engineering/tickets/_TEMPLATE.md)

## Product — Architecture Decision Records

Immutable log of architectural choices. Convention: `ADR-<number>-<slug>.md`.

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-001](engineering/adr/ADR-001-v1-architecture.md) | v1 production architecture | `accepted` |

Template: [adr/_TEMPLATE.md](engineering/adr/_TEMPLATE.md)

## Reference — Anki / .apkg

Technical reference for the Anki ecosystem and `.apkg` file format.

| Document | What's in it |
|----------|-------------|
| [Overview](engineering/anki/overview.md) | Anki concepts and terminology |
| [.apkg file format](engineering/anki/apkg-file-format.md) | SQLite schema, media mapping |
| [Data model](engineering/anki/data-model.md) | Notes, cards, decks, models |
| [Cloze deletions](engineering/anki/cloze-deletions.md) | Cloze syntax and generation |
| [Templates and styling](engineering/anki/templates-and-styling.md) | Card templates, CSS |
| [Import/export](engineering/anki/import-export.md) | Import behavior, compatibility |
| [Libraries and tools](engineering/anki/libraries-and-tools.md) | genanki, py-anki, etc. |
