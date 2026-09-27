import "server-only";
import postgres from "postgres";

declare global {
  var __sql: ReturnType<typeof postgres> | undefined;
}

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set.");
  }
  // Neon (and most hosted Postgres) require SSL; local Docker Postgres doesn't.
  return postgres(url, { ssl: url.includes("localhost") ? false : "require" });
}

// Reuse the client across hot reloads in dev to avoid exhausting connections.
export const sql = globalThis.__sql ?? createClient();
if (process.env.NODE_ENV !== "production") {
  globalThis.__sql = sql;
}
