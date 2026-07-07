# adrs/ — Architecture Decision Records

This directory houses **Architecture Decision Records (ADRs)**: short, dated documents
that capture a meaningful technical decision — *what* we decided, *why*, what we rejected,
and what it costs us later.

## Why this exists

Code shows *what* the system does today. It does not show *why* it's that way, what we
tried and ruled out, or what future-us should reconsider when conditions change. ADRs are
the memory of the reasoning. When something breaks or a past choice looks wrong, we read
the ADR instead of re-deriving the argument from scratch — and we learn from it.

## When to write one

Write an ADR when a decision is hard to reverse, affects the shape of the system, or was
non-obvious enough that a future reader would ask "why did they do it *this* way?"
Examples: a data-store choice, a change that trades one resource for another (memory for
disk, cost for latency), rejecting the "obvious" fix for a subtler one.

Do **not** write one for routine changes the diff already explains.

## Format

- One file per decision: `NNNN-short-kebab-title.md` (zero-padded, incrementing:
  `0001-...`, `0002-...`).
- Never renumber or delete an ADR. To reverse a past decision, write a **new** ADR that
  supersedes it and update the old one's Status to `Superseded by ADR-NNNN`.
- Each ADR follows this skeleton:

```
# ADR-NNNN: Title

- **Status:** Proposed | Accepted | Superseded by ADR-NNNN
- **Date:** YYYY-MM-DD
- **Deciders:** who

## Context
The forces at play — the problem, constraints, what triggered the decision.

## Decision
What we're doing, stated plainly.

## Alternatives considered
What else was on the table and why we didn't pick it. (This is the most valuable
section for future-us — it prevents re-litigating settled questions.)

## Consequences
What gets better, what gets worse, and what to revisit if conditions change.
```

## Status meanings

- **Proposed** — under discussion, not yet acted on.
- **Accepted** — decided and in effect.
- **Superseded by ADR-NNNN** — a later ADR replaced it; kept for the historical trail.
