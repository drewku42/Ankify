import net from "node:net";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const MYSQL_HOST = "localhost";
const MYSQL_PORT = 3306;
const READY_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 1_000;

function isPortReachable(
  host: string,
  port: number,
  timeoutMs = 2_000,
): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const onDone = (result: boolean) => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => onDone(true));
    socket.once("timeout", () => onDone(false));
    socket.once("error", () => onDone(false));
    socket.connect(port, host);
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Ensures MySQL is reachable on localhost:3306 before any webServer starts
 * (in particular, before the backend runs `prisma migrate deploy`).
 *
 * In CI, MySQL is provided as a service container that's already listening
 * on 3306 by the time tests run — in that case this is a fast no-op.
 *
 * Locally, if nothing is listening, it brings up the `mysql` service from
 * the repo-root docker-compose.yml and waits for it to become reachable.
 */
export default async function globalSetup(): Promise<void> {
  if (await isPortReachable(MYSQL_HOST, MYSQL_PORT)) {
    return;
  }

  console.log(
    `[global-setup] MySQL not reachable on ${MYSQL_HOST}:${MYSQL_PORT} — starting docker compose 'mysql' service...`,
  );

  await execFileAsync("docker", ["compose", "up", "-d", "mysql"], {
    cwd: repoRoot,
  });

  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await isPortReachable(MYSQL_HOST, MYSQL_PORT)) {
      console.log("[global-setup] MySQL is reachable.");
      return;
    }
    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(
    `[global-setup] Timed out after ${READY_TIMEOUT_MS}ms waiting for MySQL to become reachable on ${MYSQL_HOST}:${MYSQL_PORT}.`,
  );
}
