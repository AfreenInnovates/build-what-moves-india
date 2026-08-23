import 'dotenv/config';
import pg from 'pg';
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5, idleTimeoutMillis: 600000, keepAlive: true,
});
const q = async (label) => {
  const t = Date.now();
  await pool.query('select count(*) from members');
  console.log(`${label.padEnd(34)} ${String(Date.now() - t).padStart(5)}ms`);
};
await q('first query (opens connection)');
for (let i = 2; i <= 5; i++) await q(`query ${i} (reuses connection)`);
await new Promise((r) => setTimeout(r, 3000));
await q('after 3s pause');
await pool.end();
