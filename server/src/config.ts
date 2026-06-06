import "dotenv/config";

const stripSlash = (s: string) => s.trim().replace(/\/+$/, "");

const rawOrigins = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
const clientOrigins = rawOrigins
  .split(",")
  .map(stripSlash)
  .filter(Boolean);

export const config = {
  port: Number(process.env.PORT ?? 4000),
  /** allowed CORS origins (comma-separated CLIENT_ORIGIN), trailing slashes stripped */
  clientOrigins,
  /** allow Vercel preview deployments (*.vercel.app) — set ALLOW_VERCEL_PREVIEWS=false to disable */
  allowVercelPreviews: (process.env.ALLOW_VERCEL_PREVIEWS ?? "true") !== "false",
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  redisUrl: process.env.REDIS_URL ?? null,
  dataFile: process.env.DATA_FILE ?? "./data/db.json",
  tokenTtl: "7d",
};

/** Whether a request Origin header is allowed by CORS. */
export function isAllowedOrigin(origin?: string): boolean {
  if (!origin) return true; // same-origin, curl, server-to-server
  const o = stripSlash(origin);
  if (config.clientOrigins.includes(o)) return true;
  if (config.allowVercelPreviews) {
    try {
      if (/\.vercel\.app$/i.test(new URL(o).hostname)) return true;
    } catch {
      /* ignore malformed origin */
    }
  }
  return false;
}
