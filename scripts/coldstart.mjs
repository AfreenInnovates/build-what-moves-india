import 'dotenv/config';
import pg from 'pg';

const one = async (label) => {
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
  const t0 = Date.now(); await c.connect(); const conn = Date.now() - t0;
  const t1 = Date.now(); await c.query('select 1'); const q = Date.now() - t1;
  await c.end();
  console.log(`${label.padEnd(30)} connect ${String(conn).padStart(5)}ms   query ${String(q).padStart(4)}ms`);
};

await one('1st connection');
await one('2nd, immediately after');
await one('3rd, immediately after');
console.log('\n(waiting is what triggers Neon to suspend the compute; that is the variance)');
