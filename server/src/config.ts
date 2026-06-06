import "dotenv/config";

export const config = {
  port: Number(process.env.PORT ?? 4000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  redisUrl: process.env.REDIS_URL ?? null,
  dataFile: process.env.DATA_FILE ?? "./data/db.json",
  tokenTtl: "7d",
};
