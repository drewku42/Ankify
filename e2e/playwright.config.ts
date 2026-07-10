import { defineConfig } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const DATABASE_URL = "mysql://ankify:ankify_dev@localhost:3306/ankify";
const JWT_SECRET = "e2e-test-secret";
const AI_SERVER_URL = "http://localhost:8099";
const CORS_ORIGIN = "http://localhost:5173";

export default defineConfig({
  testDir: "./tests",
  // Ensures MySQL is reachable (starting the local docker compose service if
  // needed) before any webServer — in particular before the backend runs
  // `prisma migrate deploy` — starts. See global-setup.ts.
  globalSetup: "./global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  webServer: [
    {
      // Mock AI server — stands in for the real FastAPI ai-server (Task 4).
      command: "node e2e/mock-ai/server.mjs",
      cwd: repoRoot,
      url: "http://localhost:8099/health",
      env: { PORT: "8099" },
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      // Backend — runs migrations once, then starts the dev server. Env is
      // supplied inline (no .env files in a fresh worktree/CI checkout).
      command:
        "npx prisma generate && npx prisma migrate deploy && npm run dev",
      cwd: path.join(repoRoot, "backend"),
      url: "http://localhost:3000/health",
      env: {
        DATABASE_URL,
        NODE_ENV: "development",
        AI_SERVER_URL,
        PORT: "3000",
        JWT_SECRET,
        CORS_ORIGIN,
      },
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      // Frontend — Vite dev server; vite.config.ts already proxies /api -> :3000.
      command: "yarn dev",
      cwd: path.join(repoRoot, "frontend"),
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
});
