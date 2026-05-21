import { registerAs } from "@nestjs/config";

export default registerAs("database", () => ({
  type: "postgres" as const,
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? "postgres",
  password: process.env.DB_PASSWORD ?? "postgres",
  database: process.env.DB_NAME ?? "srs",
  url: process.env.DATABASE_URL,
  synchronize: process.env.DB_SYNCHRONIZE === "true",
  logging: process.env.DB_LOGGING === "true",
  ssl: process.env.DB_SSL === "true",
  poolMax: Number(process.env.DB_POOL_MAX ?? 20),
  poolMin: Number(process.env.DB_POOL_MIN ?? 0),
  poolIdleTimeoutMillis: Number(process.env.DB_POOL_IDLE_TIMEOUT_MS ?? 30000),
  poolConnectionTimeoutMillis: Number(
    process.env.DB_POOL_CONNECTION_TIMEOUT_MS ?? 5000,
  ),
}));
