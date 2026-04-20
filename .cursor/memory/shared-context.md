# Shared Context — Cross-Team Memory

> This file is the shared brain for all agent personas. Any decision that affects
> more than one role gets recorded here. All agents read this at task start.
> Append-only.

---

## [INIT] — Team scaffold created
- **What**: Multi-agent team structure established with three personas
- **Roles**: Jordan (frontend), Alex (backend), Sam (product lead)
- **CEO**: The user — makes final calls, invokes agents, sets priorities
- **Protocol**: All agents read their memory + this file before every task
- **Contracts**: No API contracts defined yet — will be populated as features are built
- **Tech Stack**: Not yet determined — will be locked in during first feature work

---

## Conventions (to be filled in as the project evolves)

### API Contracts
<!-- When frontend and backend agree on an endpoint shape, document it here -->

### Data Models
<!-- Shared type definitions and schema decisions -->

### Architecture Decisions

ADRs live in `knowledge/engineering/adr/`. Use the template at `knowledge/engineering/adr/_TEMPLATE.md`. Current ADRs:
- **ADR-001** — v1 production architecture (Vercel + single EC2 + MySQL + local filesystem)

---

## [2026-04-19] — Ticket and ADR systems established

### Ticket System (`knowledge/engineering/tickets/`)
- One markdown file per ticket, named `ANKIFY-<number>-<slug>.md`
- Template: `knowledge/engineering/tickets/_TEMPLATE.md`
- Statuses: `open` → `in-progress` → `shipped` (or `wont-do`)
- Current open tickets: ANKIFY-001 through ANKIFY-004 (Sprint 0 urgent fixes)
- **Convention**: Every feature or bug fix gets a ticket *before* work starts. When shipped, update the ticket status and `Shipped` date.

### ADR System (`knowledge/engineering/adr/`)
- One markdown file per decision, named `ADR-<number>-<slug>.md`
- Template: `knowledge/engineering/adr/_TEMPLATE.md`
- Statuses: `proposed` → `accepted` (or `superseded` by a later ADR)
- **Convention**: Any decision that changes how the system is built, hosted, or structured gets an ADR. Don't edit old ADRs — supersede them.

---

## [2026-04-19] — Knowledge base restructure

- **What**: Renamed `docs/` → `knowledge/` as the organizational "second brain". Moved `BUSINESS_CONTEXT.md` from repo root into `knowledge/business/`.
- **Structure**: `knowledge/business/` (C-suite docs) + `knowledge/engineering/` (tickets, ADRs, anki reference, agent onboarding, roadmap)
- **Index**: `knowledge/INDEX.md` is the master table of contents
- **Agent entry point**: `AGENTS.md` at repo root — the canonical "start here" for any AI agent
- **All paths updated** across README, memory files, and internal docs
