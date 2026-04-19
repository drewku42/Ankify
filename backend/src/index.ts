import express from "express";
import cors from "cors";
import helmet from "helmet";
import passport from "passport";
import { config } from "./config";
import { prisma } from "./lib/prisma";

import authRoutes from "./routes/auth";
import deckRoutes from "./routes/decks";
import cardRoutes from "./routes/cards";
import generateRoutes from "./routes/generate";

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());
app.use(passport.initialize());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "ankify-backend" });
});

/** Checks that the Node process can reach the AI server (same checks as /generate). */
app.get("/health/ai", async (_req, res) => {
  const base = config.aiServer.url.replace(/\/$/, "");
  try {
    const r = await fetch(`${base}/openapi.json`, { method: "GET" });
    const ok = r.ok;
    res.status(ok ? 200 : 502).json({
      status: ok ? "ok" : "error",
      aiServerUrl: base,
      aiHttpStatus: r.status,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const cause =
      err instanceof Error && err.cause != null ? String(err.cause) : "";
    res.status(502).json({
      status: "error",
      aiServerUrl: base,
      error: message,
      cause: cause || undefined,
    });
  }
});

app.use("/auth", authRoutes);
app.use("/decks", deckRoutes);
app.use("/decks", cardRoutes);
app.use("/generate", generateRoutes);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    const status = "status" in err ? (err as { status: number }).status : 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
);

app.listen(config.port, () => {
  console.log(`Ankify backend running on http://localhost:${config.port}`);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
