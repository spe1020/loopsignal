import postgres from "postgres";
import { CompanyError, type Actor } from "./types";
let pool: ReturnType<typeof postgres> | undefined;
export function database() {
  if (pool) return pool;
  const url = process.env.COMPANY_DATABASE_URL;
  if (!url)
    throw new CompanyError(
      503,
      "Company storage is unavailable. Your editor has not been saved.",
    );
  const parsed = new URL(url);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
  if (!local && parsed.searchParams.get("sslmode") !== "verify-full")
    throw new CompanyError(
      503,
      "Hosted database requires sslmode=verify-full.",
    );
  pool = postgres(url, {
    max: 8,
    prepare: false,
    connect_timeout: 8,
    idle_timeout: 20,
    ssl: local ? false : { rejectUnauthorized: true },
  });
  return pool;
}
export type Tx = postgres.TransactionSql;
export async function transaction<T>(
  actor: Actor,
  fn: (sql: Tx) => Promise<T>,
): Promise<T> {
  const result = await database().begin(async (sql) => {
    // Login must be loop_app (or a NOINHERIT login granted only loop_app).
    await sql`set local role loop_app`;
    await sql`select set_config('request.jwt.claim.sub',${actor.id},true)`;
    await sql`set local statement_timeout='20s'`;
    return fn(sql);
  });
  return result as T;
}
export async function closeDatabase() {
  if (pool) await pool.end();
  pool = undefined;
}
