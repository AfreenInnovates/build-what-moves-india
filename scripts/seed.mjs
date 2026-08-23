import 'dotenv/config';
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';

const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
await c.connect();

// gates 1 and 3 need state the original DDL didn't carry
await c.query(`
  alter table members
    add column if not exists uan_active boolean default true,
    add column if not exists e_nomination_filed boolean default false,
    add column if not exists aadhaar_linked boolean default true
`);

const dir = 'fixtures/data';
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
  const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const m = d.member;

  const { rows } = await c.query(`
    insert into members (uan, demo_password, display_name, scenario, epfo_name, epfo_dob,
      epfo_father_name, date_of_joining, date_of_exit, employer_name, employer_responsive,
      eps_service_months, balance_paise, uan_active, e_nomination_filed, aadhaar_linked, headline)
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
    on conflict (uan) do update set
      display_name=excluded.display_name, scenario=excluded.scenario,
      epfo_name=excluded.epfo_name, epfo_dob=excluded.epfo_dob,
      epfo_father_name=excluded.epfo_father_name, date_of_exit=excluded.date_of_exit,
      employer_name=excluded.employer_name, eps_service_months=excluded.eps_service_months,
      balance_paise=excluded.balance_paise, e_nomination_filed=excluded.e_nomination_filed,
      uan_active=excluded.uan_active, aadhaar_linked=excluded.aadhaar_linked,
      employer_responsive=excluded.employer_responsive, headline=excluded.headline
    returning id`,
    [m.uan, m.demo_password, m.display_name, m.scenario, m.epfo_name, m.epfo_dob,
     m.epfo_father_name, m.date_of_joining, m.date_of_exit, m.employer_name,
     m.employer_responsive, m.eps_service_months, m.balance_paise,
     m.uan_active, m.e_nomination_filed, m.aadhaar_linked, m.headline]);

  const memberId = rows[0].id;

  await c.query('delete from service_history where member_id = $1', [memberId]);
  for (const s of d.service_history) {
    await c.query(`insert into service_history (member_id, uan, employer_name, from_date, to_date, eps_months)
                   values ($1,$2,$3,$4,$5,$6)`,
      [memberId, s.uan, s.employer_name, s.from_date, s.to_date, s.eps_months]);
  }

  const uans = new Set(d.service_history.map(s => s.uan));
  console.log(`seeded ${m.display_name.padEnd(20)} uan=${m.uan}  scenario=${m.scenario}  ` +
              `service=${d.service_history.length} rows  distinctUANs=${uans.size}`);
}

const t = await c.query('select display_name, uan, scenario, e_nomination_filed, date_of_exit from members order by uan');
console.log('\nmembers table:');
console.table(t.rows);
await c.end();
