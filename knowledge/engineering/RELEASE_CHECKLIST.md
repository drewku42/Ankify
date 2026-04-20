# Release checklist — ship without breaking prod

Local dev proves **logic**; production proves **deploy**. Most regressions we have seen were **not** “bad TypeScript,” they were **mismatches** between:

- `schema.prisma` ↔ MySQL (migrations applied or not)
- `schema.prisma` ↔ generated `@prisma/client` (`prisma generate`)
- `backend/src/*.ts` ↔ `**dist/`** (`npm run build` on the server)
- **Which Node process** is running (PM2 **cluster**: every worker must restart)

Use this checklist whenever a ticket touches **backend schema**, **backend routes**, **Prisma**, or **shared API contracts**.

---

## 1. Before you merge (author)

- **Ticket** updated (scope, out of scope).
- **Migrations** — if `schema.prisma` changed data shape:
  - New migration committed; **review SQL** (destructive columns, backfills).
  - **Local:** `npx prisma migrate dev` (or apply SQL manually in dev) and smoke-test.
- **API contract** — if response shape changed, **frontend** types / callers updated in the same PR or a coordinated PR.
- **Lockfiles committed** — `backend/package-lock.json` if `package.json` changed (EC2 `npm ci` needs it).

---

## 2. EC2 deploy (operator)

Preferred: run the repo script (pull, migrate, generate, compile, restart):

```bash
bash /home/ubuntu/Ankify/deploy/deploy.sh
```

What it does today: `git pull` → `backend/` `**npm ci**` → `**prisma migrate deploy**` → `**prisma generate**` → `**npm run build**` → `ai-server/` `**poetry install --no-root**` → `**pm2 restart all --update-env**`.

If you **cannot** use the script, run the same steps **in that order** — do not skip `**prisma generate**` or `**npm run build**`.

### After any Prisma schema change


| Step                        | Why                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| `npx prisma migrate deploy` | DB columns match migration history.                                                         |
| `npx prisma generate`       | Node uses a client that matches the **current** schema (not an old `node_modules/.prisma`). |
| `npm run build`             | `dist/` matches `**src/**` (e.g. `createMany` must not reference removed fields).           |
| `pm2 restart …`             | Running processes load the new `dist/` + new client.                                        |


### Symptom → likely cause


| Symptom                                                             | Likely cause                                                                           |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `The column … does not exist in the current database`               | Client **newer** than DB → run **migrations** (or DB out of date).                     |
| `Unknown argument \`fieldName`on`create`/`createMany`               | Client **newer** than `**dist/`** — `**npm run build`** not run, or old process.       |
| `The column … does not exist` but column was **dropped** on purpose | Client **older** than DB — `**prisma generate`** not run, or PM2 worker not restarted. |
| `unhandledRejection` + Prisma                                       | Fix the underlying error; ensure route uses `**asyncHandler`** / proper `catch`.       |


---

## 3. Frontend (Vercel)

- `**VITE_API_URL`** points at production API (no accidental local proxy).
- **New npm deps** — `package.json` / lockfile updated (Vercel install must see new packages).
- After deploy: smoke **login**, **list decks**, **open deck**, **generate** (or your ticket’s path).

---

## 4. AI server (PM2)

- `**poetry install --no-root`** if packaging still references a missing `README.md` on the server.
- `**AI_SERVER_URL`** on backend uses `**127.0.0.1`** on Linux, not `localhost`, if both services are on the same host.

---

## 5. Post-deploy verification (5 minutes)

Run on EC2 or against public API:

```bash
# DB connectivity + schema (from backend dir)
npx prisma db execute --stdin --schema=./prisma/schema.prisma <<< "SELECT 1"

# API (replace token and id)
curl -sS -w "\nHTTP:%{http_code}\n" -H "Authorization: Bearer TOKEN" \
  "http://127.0.0.1:3000/decks"
curl -sS -w "\nHTTP:%{http_code}\n" -H "Authorization: Bearer TOKEN" \
  "http://127.0.0.1:3000/decks/DECK_UUID"
```

Expect **HTTP 200** and JSON bodies. If **500**, check `**pm2 logs`** immediately — do not assume “Vercel is wrong.”

---

## 6. Mental model

- **Migrations** change **MySQL**.
- `**prisma generate`** changes **generated client** in `node_modules`.
- `**npm run build`** changes `**dist/`** from `**src/`**.
- **PM2** must restart to load new `**dist/`** and pick up a regenerated client reliably (especially in **cluster** mode).

Skipping any one of these after a schema + code change is how **local works** (your laptop ran generate/build) and **prod breaks** (server only restarted old `dist/`).

---

## Related docs

- `[AGENT.md](AGENT.md)` — architecture, env vars, Nginx timeouts, PM2.
- `[deploy/deploy.sh](../../deploy/deploy.sh)` — automated EC2 steps.
- Tickets — mark **shipped** and note any **deploy gotchas** in the ticket **Notes** section.

