import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

export * from "./schema";

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url;
}

const globalForDb = globalThis as unknown as { pg?: ReturnType<typeof postgres> };

function getClient(): ReturnType<typeof postgres> {
  if (!globalForDb.pg) {
    globalForDb.pg = postgres(getDatabaseUrl(), { max: 10, prepare: false });
  }
  return globalForDb.pg;
}

export const db: PostgresJsDatabase<typeof schema> = drizzle(getClient(), { schema });

/** For scripts that must close the pool explicitly. */
export async function closeDb(): Promise<void> {
  if (globalForDb.pg) {
    await globalForDb.pg.end({ timeout: 5 });
    globalForDb.pg = undefined;
  }
}
