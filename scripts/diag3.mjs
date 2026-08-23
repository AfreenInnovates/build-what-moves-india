import 'dotenv/config';
import pg from 'pg';
import { chromium } from 'playwright';
const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
const m = await c.query(`select id from members where slug='ravi'`);
const r = await c.query(
  `insert into cases (member_id, intake, facts, spec_version)
   values ($1,'{}'::jsonb, (select facts from cases limit 1), '2026.08.1')
   on conflict do nothing returning id`, [m.rows[0].id]).catch(() => ({ rows: [] }));
let id = r.rows[0]?.id;
if (!id) {
  const e = await c.query(`select id from cases where member_id=$1 limit 1`, [m.rows[0].id]);
  id = e.rows[0]?.id;
}
await c.end();
console.log('case id:', id);

const b = await chromium.launch();
const ctx = await b.newContext();
await ctx.addCookies([{ name: 'case_id', value: id, domain: 'localhost', path: '/' }]);
const p = await ctx.newPage();
const res = await p.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded' });
console.log('status:', res.status(), 'url:', p.url());
console.log((await p.innerText('body')).slice(0, 1200));
await b.close();
