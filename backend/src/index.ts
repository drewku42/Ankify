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

app.use("/auth", authRoutes);
app.use("/decks", deckRoutes);
app.use("/decks", cardRoutes);
app.use("/generate", generateRoutes);

app.listen(config.port, () => {
  console.log(`Ankify backend running on http://localhost:${config.port}`);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
