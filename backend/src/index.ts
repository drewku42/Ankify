import express from "express";
import cors from "cors";
import helmet from "helmet";
import passport from "passport";
import { MulterError } from "multer";
import { config } from "./config";
import { prisma } from "./lib/prisma";
import { AppError } from "./lib/errors";

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
    _next: express.NextFunction,
  ) => {
    const isDev = process.env.NODE_ENV === "development";

    if (err instanceof MulterError) {
      const multerMessages: Record<string, { msg: string; code: string }> = {
        LIMIT_FILE_SIZE: { msg: "File is too large", code: "FILE_TOO_LARGE" },
        LIMIT_UNEXPECTED_FILE: { msg: "Unexpected file field", code: "INVALID_FILE_TYPE" },
      };
      const mapped = multerMessages[err.code] ?? { msg: err.message, code: err.code };
      res.status(400).json({ error: mapped.msg, code: mapped.code });
      return;
    }

    if (err.message === "Only PDF files are allowed") {
      res.status(400).json({ error: err.message, code: "INVALID_FILE_TYPE" });
      return;
    }

    if (err instanceof AppError) {
      res.status(err.status).json({
        error: err.message,
        ...(err.code && { code: err.code }),
      });
      return;
    }

    console.error("Unhandled error:", err);
    res.status(500).json({
      error: "Internal server error",
      ...(isDev && { detail: err.message, stack: err.stack }),
    });
  },
);

app.listen(config.port, () => {
  console.log(`Ankify backend running on http://localhost:${config.port}`);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
