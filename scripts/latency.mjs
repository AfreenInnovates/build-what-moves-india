import 'dotenv/config';
import pg from 'pg';
const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
const t0 = Date.now(); await c.connect();
console.log('connect (incl. any cold start):', Date.now() - t0, 'ms');

const time = async (label, sql, params = []) => {
  const t = Date.now(); await c.query(sql, params);
  console.log(label.padEnd(34), Date.now() - t, 'ms');
};
await time('single trivial query', 'select 1');
await time('select members', 'select * from members');
const t1 = Date.now();
for (let i = 0; i < 7; i++) await c.query('select 1');
console.log('7 sequential round-trips'.padEnd(34), Date.now() - t1, 'ms  <- what persistGateStates does');
const t2 = Date.now();
await Promise.all(Array.from({length:7},()=>c.query('select 1')));
console.log('7 pipelined'.padEnd(34), Date.now() - t2, 'ms');
await c.end();
