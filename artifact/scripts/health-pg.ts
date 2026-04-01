import { sql } from "bun";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

try {
  const rows = await sql`SELECT 1 AS ok`;
  const row = rows[0] as { ok: number };
  if (row?.ok !== 1) {
    console.error("Unexpected result:", row);
    process.exit(1);
  }
  console.log("ok: connected to PostgreSQL");
  process.exit(0);
} catch (err) {
  console.error("PostgreSQL health check failed:", err);
  process.exit(1);
}
