import { sql } from "drizzle-orm";

import { closeDb, db } from "../lib/db";

try {
  await db.execute(sql`select 1 as ok`);
  console.log("ok: connected to PostgreSQL (Drizzle + postgres.js)");
} catch (err) {
  console.error("PostgreSQL health check failed:", err);
  process.exitCode = 1;
} finally {
  await closeDb();
}

process.exit(process.exitCode ?? 0);
