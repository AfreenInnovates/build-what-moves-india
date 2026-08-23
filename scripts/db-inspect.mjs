import 'dotenv/config';
import pg from 'pg';
const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
const t = await c.query(`select table_name from information_schema.tables where table_schema='public' order by 1`);
console.log('TABLES:', t.rows.map(r => r.table_name).join(', ') || '(none)');
for (const tbl of ['members', 'service_history', 'cases']) {
  try {
    const r = await c.query(`select * from ${tbl}`);
    console.log(`\n${tbl} (${r.rowCount} rows):`);
    console.log(JSON.stringify(r.rows, null, 1));
  } catch (e) { console.log(`\n${tbl}: ${e.message}`); }
}
await c.end();
