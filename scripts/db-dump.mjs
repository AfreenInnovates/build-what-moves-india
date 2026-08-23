import 'dotenv/config';
import pg from 'pg';
pg.types.setTypeParser(1082, (v) => v);
const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
for (const t of ['members','cases','gate_states','events','service_history','documents','field_comparisons','artifacts','gate_specs']) {
  const { rows } = await c.query(`select count(*)::int n from ${t}`);
  console.log(`${t.padEnd(20)} ${rows[0].n} rows`);
}
console.log('\n--- cases ---');
console.table((await c.query(`select c.id, m.display_name, c.spec_version, c.facts->>'blockingMismatches' mism, c.updated_at from cases c join members m on m.id=c.member_id`)).rows);
console.log('\n--- gate_states for the live case ---');
console.table((await c.query(`select gate_id, status, actor, latency_days, resolved_at is not null done from gate_states order by case_id, gate_id`)).rows);
console.log('\n--- events (newest first) ---');
console.table((await c.query(`select type, payload->>'label' label, payload->>'saved' saved, days_remaining, at from events order by id desc limit 10`)).rows);
await c.end();
