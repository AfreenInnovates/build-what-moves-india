import 'dotenv/config';
import pg from 'pg';
const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
await c.query(`alter table members add column if not exists slug text`);
await c.query(`alter table members add column if not exists headline text`);
await c.query(`update members set slug = lower(split_part(display_name,' ',1)) where slug is null`);
await c.query(`create unique index if not exists members_slug_idx on members(slug)`);
// events already exist; make sure the case link is queryable
await c.query(`create index if not exists events_case_idx on events(case_id, id desc)`);
await c.query(`create index if not exists gate_states_case_idx on gate_states(case_id)`);
const r = await c.query('select slug, display_name, uan from members order by slug');
console.table(r.rows);
await c.end();
