import pg from 'pg';

// DATE columns must stay strings. Left as Date objects, node-postgres hands back
// a local-midnight timestamp, so an exit date of 2026-05-31 reads as 30 May in
// IST — and every day this product counts would be off by one.
pg.types.setTypeParser(1082, (v) => v);
// BIGINT -> number; balances here are paise and nowhere near 2^53.
pg.types.setTypeParser(20, (v) => Number(v));

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: pg.Pool | undefined;
}

// Next's dev server re-evaluates modules on every edit; without this the pool
// leaks a connection per hot reload until Neon starts refusing them.
export const pool =
  globalThis.__pgPool ??
  new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30_000,
  });

if (process.env.NODE_ENV !== 'production') globalThis.__pgPool = pool;

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const r = await pool.query<T>(text, params);
  return r.rows;
}

export async function one<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
