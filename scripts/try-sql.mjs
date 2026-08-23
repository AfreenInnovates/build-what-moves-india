import 'dotenv/config';
import pg from 'pg';
pg.types.setTypeParser(1082, (v) => v);
const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
try {
  const r = await c.query(
    `select to_jsonb(m.*) as member,
            (select c.id from cases c where c.member_id = m.id
              order by c.created_at desc limit 1) as existing_case,
            coalesce((
              select json_agg(json_build_object(
                'uan', s.uan, 'from_date', s.from_date,
                'to_date', s.to_date, 'eps_months', s.eps_months))
                from service_history s where s.member_id = m.id), '[]'::json) as service
       from members m where m.slug = $1`, ['ravi']);
  console.log('rows:', r.rowCount);
  console.log('member.slug:', r.rows[0]?.member?.slug, '| balance_paise type:', typeof r.rows[0]?.member?.balance_paise);
  console.log('service:', JSON.stringify(r.rows[0]?.service));
  console.log('existing_case:', r.rows[0]?.existing_case);
} catch (e) { console.error('QUERY FAILED:', e.message); }
await c.end();
