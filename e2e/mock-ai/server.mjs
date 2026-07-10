#!/usr/bin/env node
// e2e/mock-ai/server.mjs
//
// Deterministic mock of the real FastAPI ai-server (ai-server/app), used so
// backend E2E tests are fast, free, and reproducible. Point AI_SERVER_URL at
// this server's address (default http://127.0.0.1:8099) when running E2E.
//
// ── Discovered contract (backend -> ai-server) ──────────────────────────────
//
// 1) GET /openapi.json
//    - Called by: backend/src/index.ts:30 (`app.get("/health/ai", ...)`),
//      which does `fetch(`${base}/openapi.json`)` and only checks `r.ok`.
//    - Real server: FastAPI auto-serves this at /openapi.json (see
//      ai-server/app/main.py, which builds a FastAPI() app).
//    - Mock: any 200 JSON body satisfies the backend (it never parses it).
//
// 2) GET /health
//    - Real server: ai-server/app/main.py:32-34 defines
//      `@app.get("/health") -> {"status": "ok", "service": "ankify-ai-server"}`.
//    - Backend does not call this route directly (it calls /openapi.json
//      instead, see above), but it's mirrored here for completeness /
//      direct-hit health checks against the mock itself.
//
// 3) POST /generate/deck  (multipart/form-data)
//    - Called by: backend/src/routes/generate.ts:64
//      `fetch(`${config.aiServer.url}/generate/deck`, { method: "POST", body: formData })`
//      where formData has a `file` part (the PDF Blob) and an optional
//      `deck_name` text part (generate.ts:54-62).
//    - Real server route: ai-server/app/routes/generate.py:21-56
//      `@router.post("/deck", response_model=GenerateResponse)` under
//      `router = APIRouter(prefix="/generate", ...)` (generate.py:18), taking
//      `file: UploadFile = File(...)` and `deck_name: str | None = Form(...)`.
//    - Expected response shape (backend/src/routes/generate.ts:8-19 and
//      ai-server/app/models.py:60-65, GenerateResponse):
//        {
//          "deck": {
//            "cards": [
//              { "front": string, "back": string, "source_page": number, "tags": string[] },
//              ...
//            ],
//            "title_suggestion": string,   // GeneratedDeck field, models.py:16-25;
//            "summary": string             // not read by backend but present on the real model
//          },
//          "page_count": number,
//          "processing_time_seconds": number
//        }
//      Backend only reads `result.deck.cards`, `result.page_count`, and
//      `result.processing_time_seconds` (generate.ts:74-75,104-105), but the
//      mock returns the full shape (including title_suggestion/summary) to
//      stay byte-for-byte faithful to GenerateResponse.
//    - The backend then maps each card to
//      `{ front, back, sourcePageNum: card.source_page, sortOrder }`
//      (generate.ts:79-85) — i.e. `source_page` (snake_case) is REQUIRED,
//      not `sourcePageNum`.
//
// 4) POST /generate/export/download  (application/json)
//    - Called by: backend/src/routes/generate.ts:194-201
//      `fetch(`${config.aiServer.url}/generate/export/download`, { method: "POST",
//        headers: { "Content-Type": "application/json" },
//        body: JSON.stringify({ deck_name, cards: [{ front, back, source_page, tags }] }) })`
//    - Real server route: ai-server/app/routes/generate.py:81-98
//      `@router.post("/export/download")`, returns a `FileResponse` with
//      `media_type="application/octet-stream"` and
//      `filename=f"{safe_name}.apkg"` (generate.py:93-98).
//    - Backend reads the response as a raw arrayBuffer and streams it back to
//      the client unmodified (generate.ts:208-216) — it does NOT parse JSON.
//    - Mock: returns a small deterministic binary blob with
//      Content-Type: application/octet-stream and a Content-Disposition
//      header, matching the real behavior closely enough for E2E (E2E does
//      not need a real, openable .apkg/sqlite file — just bytes to save).
//
// Every request is logged to stderr as `[mock-ai] METHOD PATH` so E2E
// failures are debuggable.
//
// No dependencies: Node stdlib `http` only.

import http from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || "8099", 10);

const fixture = JSON.parse(
  readFileSync(path.join(__dirname, "fixtures", "cards.json"), "utf-8"),
);

function log(req) {
  process.stderr.write(`[mock-ai] ${req.method} ${req.url}\n`);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

const server = http.createServer(async (req, res) => {
  log(req);

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const { pathname } = url;

  try {
    // Drain the request body so clients using keep-alive don't hang,
    // regardless of whether the handler below needs it.
    await readBody(req);

    if (req.method === "GET" && pathname === "/openapi.json") {
      // Real server auto-generates a full OpenAPI schema; backend's
      // /health/ai only checks res.ok, so a minimal stub is sufficient.
      sendJson(res, 200, { openapi: "3.1.0", info: { title: "mock-ai" }, paths: {} });
      return;
    }

    if (req.method === "GET" && pathname === "/health") {
      sendJson(res, 200, { status: "ok", service: "ankify-ai-server" });
      return;
    }

    if (req.method === "POST" && pathname === "/generate/deck") {
      sendJson(res, 200, {
        deck: {
          cards: fixture.cards,
          title_suggestion: fixture.title_suggestion,
          summary: fixture.summary,
        },
        page_count: fixture.page_count,
        processing_time_seconds: fixture.processing_time_seconds,
      });
      return;
    }

    if (req.method === "POST" && pathname === "/generate/export/download") {
      const body = Buffer.from("MOCK_APKG_FIXTURE_BYTES", "utf-8");
      res.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": 'attachment; filename="mock_deck.apkg"',
        "Content-Length": body.length,
      });
      res.end(body);
      return;
    }

    sendJson(res, 404, { error: "Not found", code: "MOCK_AI_NOT_FOUND", path: pathname });
  } catch (err) {
    process.stderr.write(`[mock-ai] error handling ${req.method} ${pathname}: ${err.stack || err}\n`);
    sendJson(res, 500, { error: "Mock AI server error", code: "MOCK_AI_ERROR" });
  }
});

server.listen(PORT, () => {
  process.stderr.write(`[mock-ai] listening on http://127.0.0.1:${PORT}\n`);
});
