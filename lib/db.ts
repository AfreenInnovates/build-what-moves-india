import pg from 'pg';

// DATE columns must stay strings. Left as Date objects, node-postgres hands back
// a local-midnight timestamp, so an exit date of 2026-05-31 reads as 30 May in
// IST - and every day this product counts would be off by one.
pg.types.setTypeParser(1082, (v) => v);
// BIGINT -> number; balances here are paise and nowhere near 2^53.
pg.types.setTypeParser(20, (v) => Number(v));

declare global {
  var __pgPool: pg.Pool | undefined;
}

// Next's dev server re-evaluates modules on every edit; without this the pool
// leaks a connection per hot reload until Neon starts refusing them.
export const pool =
  globalThis.__pgPool ??
  new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    // The measured ceiling of this app is DB connections, not CPU, so this is
    // the number that moves throughput. Overridable per instance because the
    // right value depends on what is in front of Neon and how many instances
    // share it - behind a load balancer, every instance opens its own poolful.
    max: Number(process.env.PG_POOL_MAX ?? 10),
    // Opening a connection costs ~1.9s from India: TCP, then a TLS handshake,
    // then SCRAM auth, each a ~235ms round trip to us-east-2. A query on an
    // already-open connection costs one round trip. So the single most valuable
    // thing this pool does is not close connections - a 30s idle timeout meant
    // any pause longer than half a minute made the next page load pay the full
    // handshake again.
    // ...but not longer than Neon's own idle cutoff. Holding a client for ten
    // minutes meant Neon's pooler closed it first, and a server-closed client is
    // exactly the "Connection terminated unexpectedly" that used to take the
    // process down. Four minutes keeps the handshake saving and lets us be the
    // one who closes.
    idleTimeoutMillis: Number(process.env.PG_IDLE_MS ?? 4 * 60_000),
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
  });

/**
 * A pool with no error listener is a process with a fuse in it.
 *
 * node-postgres emits 'error' on the Pool when an IDLE client dies - Neon
 * recycling a connection, a network blip, a deploy on their side. Node's rule
 * for EventEmitters is that an unhandled 'error' event is thrown, so a dropped
 * idle connection surfaced as `uncaughtException: Connection terminated
 * unexpectedly` and killed the server while it was otherwise perfectly healthy.
 * Nothing is broken when this fires: the client is already gone, the pool will
 * open another on demand. It just has to be heard.
 */
pool.on('error', (err) => {
  console.error('[db] idle client error, pool will recover:', err.message);
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
