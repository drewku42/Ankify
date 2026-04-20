# Tickets

Lightweight ticket tracker for Ankify. One markdown file per ticket.

## Naming convention

```
ANKIFY-<number>-<short-slug>.md
```

Numbers are sequential. Never reuse a number.

## Statuses


| Status        | Meaning                               |
| ------------- | ------------------------------------- |
| `open`        | Triaged, not yet started              |
| `in-progress` | Actively being worked on              |
| `shipped`     | Merged and deployed                   |
| `wont-do`     | Intentionally closed without shipping |


## Priority tags

`urgent` · `high` · `medium` · `low`

## Creating a new ticket

Copy `_TEMPLATE.md` and fill it in. The template is intentionally minimal — add sections only when they earn their keep.