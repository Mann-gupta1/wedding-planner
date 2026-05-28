/**
 * Run: node scripts/migrate.mjs
 * Requires DATABASE_URL in .env (Supabase → Settings → Database → Connection string → URI)
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import pg from "pg";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: resolve(root, ".env.local") });
config({ path: resolve(root, ".env") });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error(`
Missing DATABASE_URL in .env

Add your Postgres connection string from Supabase:
  Settings → Database → Connection string → URI

Example:
  DATABASE_URL=postgresql://postgres.[ref]:[YOUR-DB-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres

Then run: node scripts/migrate.mjs
`);
  process.exit(1);
}

const sql = readFileSync(resolve(root, "supabase/migrations/001_initial.sql"), "utf8");

const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  console.log("Connected. Running migration...");
  await client.query(sql);
  console.log("Migration completed successfully.");

  const tables = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name IN ('intakes', 'recommendations', 'payments')
    ORDER BY table_name
  `);
  console.log("Tables:", tables.rows.map((r) => r.table_name).join(", "));
} catch (err) {
  if (err.code === "42P07") {
    console.log("Tables already exist — migration was likely applied before.");
    process.exit(0);
  }
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
