# Product Memory — Sam

> This file is Sam's (product lead) persistent brain. Append-only.
> Read this at the start of every task. Write to it at the end.

---

## [INIT] — Memory initialized
- **What**: Memory file created for the product lead persona
- **Status**: No prior context. Awaiting first task from CEO.
- **Roadmap**: Empty — no features planned yet
- **Priorities**: Not yet set
- **Open**: What is the product vision? Need CEO input on first run.

---

## [2026-04-19 — Roadmap intake & priority triage]
- **What**: CEO provided full roadmap dump (4 urgent jank items, 6 features, 3 epics). Triaged and sequenced.
- **Rationale**: v1 is shipped but core UX is broken — users can't tell when generation finishes, duplicate names corrupt state, errors are silent, image cards are empty. These must be fixed before any new features.
- **Impact**: Frontend (Jordan) and Backend (Alex) both needed for urgent fixes. No new feature work until stabilization is done.

### Sprint 0: Stabilization (URGENT — do first)
| ID | Issue | Touches |
|----|-------|---------|
| U1 | No error feedback on frontend — users see nothing when things fail | Frontend + Backend (error responses) |
| U2 | Duplicate deck names → broken backend state (possible timeouts) | Backend (validation/constraint) + Frontend (guard) |
| U3 | Upload-to-complete flow has no status/progress indication | Frontend (progress states) + Backend (status tracking) |
| U4 | Image cards don't actually include images | AI server + Backend (media handling) + Frontend (render) |

### Feature Backlog (parked — sequence after stabilization)
| Priority | Feature | Notes |
|----------|---------|-------|
| Medium | Streaming card generation | Loading skeleton exists; real streaming or progress is the upgrade |
| Medium | Card generation audit (card vs source slide comparison) | Directly addresses #1 failure mode (card quality) |
| Low | Fallback AI provider | Resilience; not urgent given OpenAI reliability |
| Low | Mobile browser support | Desktop-first for now |
| Low | Annotation detection | Needs validation — may not differ from normal generation |
| Low | Multiple export formats | Quizlet-style Word/Excel/Docs import |

### Epics (longer horizon)
- Note storage (GoodNotes/Notability-like)
- Batch upload (multiple lectures)
- Practice question generation

### Also in backlog (from knowledge/engineering/TODO-ROADMAP.md, pre-existing)
- Slide skip/select UI (high impact — saves cost and latency)
- Card format preferences (user-defined style)
- Pricing & usage caps (needs real usage data)

- **Next**: CEO to greenlight Sprint 0 specs. Sam will write detailed specs for U1–U4 and hand off to Jordan/Alex.
- **Open**: None — CEO aligned on "urgent first, features later."

---

## [2026-04-19 — Ticket + ADR systems created]
- **What**: Created two structured tracking systems per CEO request:
  1. **Ticket system** (`knowledge/engineering/tickets/`) — lightweight markdown tickets with template, README, and naming convention (`ANKIFY-NNN-slug.md`). Seeded with ANKIFY-001 through ANKIFY-004 for the four urgent fixes.
  2. **ADR system** (`knowledge/engineering/adr/`) — architecture decision records with template, README. Seeded with ADR-001 (v1 architecture) capturing all decisions from BUSINESS_CONTEXT.md so we have a baseline.
- **Rationale**: CEO wants a paper trail for product decisions and architectural choices. Keeps the team aligned as the product evolves — no more "why did we do it this way?" moments.
- **Impact**: All personas. Convention: every feature/bug gets a ticket before work starts; every architectural change gets an ADR.
- **Next**: Sprint 0 tickets are written and ready. CEO to greenlight work.
- **Open**: None.

---

## [2026-04-19 / 20 — Sprint 0 closed; v1 scope narrowed]

- **Shipped:** ANKIFY-001 (toasts / errors), ANKIFY-002 (unique deck names), ANKIFY-003 (upload → deck page + polling + status UX).
- **Cancelled / re-scoped:** ANKIFY-004 — image (and cloze) card types **removed for v1**; product is **basic cards only** until a future epic covers PDF image extraction + media + Anki media map. Ticket documents rationale and future options.
- **Documentation added:** `knowledge/engineering/RELEASE_CHECKLIST.md` — Prisma + `dist/` + PM2 order so prod matches local.
- **BUSINESS_CONTEXT** updated so v1 promise matches shipped product (no “three card types” in live scope).
- **Next product focus:** backlog features from roadmap (streaming, audit trail, slide picker, pricing caps) — **stabilization sprint done**; prioritize by user feedback and cost.
- **Open:** Consider **ADR-002** (“v1 basic-only cards”) if we want an immutable architecture/product record; optional.
