import 'dotenv/config';
import pg from 'pg';
pg.types.setTypeParser(1082, (v) => v);
const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
await c.query('delete from events'); await c.query('delete from gate_states'); await c.query('delete from cases');
const m = (await c.query(`select id from members where slug='ravi'`)).rows[0];
const cs = (await c.query(`insert into cases (member_id,intake,facts,spec_version) values ($1,'{}','{"a":1}','v') returning id`, [m.id])).rows[0];
await c.query(`insert into events (case_id,type,payload,days_remaining) values ($1,'case_opened','{}',27)`, [cs.id]);
try {
  const r = await c.query(
    `select c.facts, to_jsonb(m.*) as member,
            coalesce((
              select json_agg(json_build_object(
                       'type', e.type, 'payload', e.payload,
                       'days_remaining', e.days_remaining, 'at', e.at)
                     order by e.id desc)
                from (select id, type, payload, days_remaining, at
                        from events where case_id = c.id
                       order by id desc limit 12) e
            ), '[]'::json) as history
       from cases c join members m on m.id = c.member_id where c.id = $1`, [cs.id]);
  console.log('OK. history:', JSON.stringify(r.rows[0].history));
} catch (e) { console.error('STILL FAILING:', e.message); }
await c.query('delete from events'); await c.query('delete from cases');
await c.end();
