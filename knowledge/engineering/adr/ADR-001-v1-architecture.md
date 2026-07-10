# ADR-001 — v1 production architecture

| Field          | Value      |
| -------------- | ---------- |
| **Status**     | `accepted` |
| **Date**       | 2026-04-16 |
| **Supersedes** | —          |

## Context

Ankify needed to ship v1 in roughly one week. The system has three distinct concerns: a user-facing SPA, a CRUD/auth API layer, and a compute-heavy AI pipeline (PDF rendering, GPT-4o Vision, `.apkg` generation). We needed a hosting strategy that was fast to deploy and cheap to run for an early-stage product with a handful of users.

## Decision

- **Frontend**: React + Vite SPA deployed on **Vercel** (`ankify.io`).
- **Backend**: Node.js / Express with Prisma ORM, running on a **single EC2 instance** behind Nginx with TLS (`api.ankify.io`).
- **AI server**: Python / FastAPI, co-located on the **same EC2 instance**, managed by PM2 on port 8000.
- **Database**: **MySQL** on the same EC2 instance, accessed via Prisma.
- **File storage**: Local filesystem on EC2 (`STORAGE_DRIVER=local`). S3 driver exists in code but is not used in production.
- **PDF processing**: `pdf2image` / poppler renders slides to images; images sent to GPT-4o Vision (not OCR).
- **Export**: `genanki` (Python) on the AI server generates `.apkg` files.
- **Local dev**: Docker Compose for MySQL; optional LocalStack profile for S3 parity.

## Alternatives considered

| Option                     | Why rejected                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------- |
| ECS / Lambda               | Over-engineered for one-week timeline and single-digit user count. Higher operational complexity. |
| Separate EC2 for AI server | Unnecessary cost; co-location is fine at current scale. Adds network hop.                         |
| PostgreSQL                 | No strong reason to prefer over MySQL for this schema. MySQL was familiar and fast to set up.     |
| OCR-only (no Vision)       | Loses visual context — diagrams, tables, layout. Vision is the core differentiator.               |
| S3 for prod storage        | Added AWS dependency with no immediate benefit. Local filesystem is simpler until multi-instance. |

## Consequences

- **Simple and fast to ship** — single server, minimal infra.
- **Vertical scaling only** — one EC2 instance means we scale up, not out. Fine for now, but will hit a ceiling.
- **Co-located services share resources** — a heavy AI generation could starve the API or DB. Acceptable at low volume.
- **No redundancy** — single point of failure. Acceptable for a pre-revenue product with a small user base.
- **Migration path is clear** — when we need to scale: split AI server to its own instance, move MySQL to RDS, move storage to S3. The code already supports the S3 driver.
