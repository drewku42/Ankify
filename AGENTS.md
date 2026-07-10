# Ankify — Agent Entry Point

Web app that converts lecture PDFs into Anki flashcard decks using GPT-4o Vision. Built for medical and PA students. Product name is **Ankify** (repo folder may still be `card-generator`).

## Repo layout

| Path              | What                                                                | Package manager |
| ----------------- | ------------------------------------------------------------------- | --------------- |
| `frontend/`       | React + Vite SPA (TypeScript, SCSS, Redux Toolkit)                  | Yarn            |
| `backend/`        | Express API (Prisma, MySQL, JWT, multer)                            | npm             |
| `ai-server/`      | FastAPI AI pipeline (LangChain, pdf2image, genanki)                 | Poetry          |
| `deploy/`         | EC2 setup, Nginx config, PM2 ecosystem, env templates               | —               |
| `knowledge/`      | Organizational knowledge base — business, engineering, product docs | —               |
| `.cursor/memory/` | Agent memory files (persistent across sessions)                     | —               |
| `.cursor/rules/`  | Cursor-specific behavior rules                                      | —               |

## Where to find things

| Question                                                   | Go here                                                                                    |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Full product context, users, risks, constraints            | [`knowledge/business/BUSINESS_CONTEXT.md`](knowledge/business/BUSINESS_CONTEXT.md)         |
| All knowledge docs (master index)                          | [`knowledge/INDEX.md`](knowledge/INDEX.md)                                                 |
| Env vars, deploy, architecture, production gotchas         | [`knowledge/engineering/AGENT.md`](knowledge/engineering/AGENT.md)                         |
| **Release / prod deploy checklist** (Prisma, `dist/`, PM2) | [`knowledge/engineering/RELEASE_CHECKLIST.md`](knowledge/engineering/RELEASE_CHECKLIST.md) |
| Current tickets and sprint state                           | [`knowledge/engineering/tickets/`](knowledge/engineering/tickets/)                         |
| Architecture decision records                              | [`knowledge/engineering/adr/`](knowledge/engineering/adr/)                                 |
| Roadmap and backlog                                        | [`knowledge/engineering/TODO-ROADMAP.md`](knowledge/engineering/TODO-ROADMAP.md)           |
| Anki/.apkg technical reference                             | [`knowledge/engineering/anki/`](knowledge/engineering/anki/)                               |
| Live roadmap and priority state                            | [`.cursor/memory/product.md`](.cursor/memory/product.md)                                   |
| Cross-team decisions and contracts                         | [`.cursor/memory/shared-context.md`](.cursor/memory/shared-context.md)                     |

## Agent conventions

1. **Memory protocol** — Read your memory file + `shared-context.md` before starting any task. Write to them when done. Details in `.cursor/rules/memory-protocol.mdc`.
2. **Tickets** — Every bug or feature gets a ticket in `knowledge/engineering/tickets/` before code is written. Update status when shipped. Template: `_TEMPLATE.md`.
3. **ADRs** — Every architectural change gets a record in `knowledge/engineering/adr/`. Never edit old ADRs — write a new one that supersedes. Template: `_TEMPLATE.md`.
4. **Code standards** — TypeScript everywhere, explicit types, small files, comments for "why" not "what". Full details in `.cursor/rules/team-culture.mdc`.
