import 'dotenv/config';
import pg from 'pg';
const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
await c.query(`alter table members add column if not exists slug text`);
await c.query(`alter table members add column if not exists headline text`);
await c.query(`alter table members add column if not exists documents jsonb`);

await c.query(`update members set slug = lower(split_part(display_name,' ',1)) where slug is null`);
await c.query(`create unique index if not exists members_slug_idx on members(slug)`);
// events already exist; make sure the case link is queryable
await c.query(`create index if not exists events_case_idx on events(case_id, id desc)`);
await c.query(`create index if not exists gate_states_case_idx on gate_states(case_id)`);
await c.query(`
  create table if not exists chat_messages (
    id bigserial primary key,
    case_id uuid not null references cases(id) on delete cascade,
    role text not null check (role in ('user','assistant')),
    content text not null,
    at timestamptz default now()
  )`);
await c.query(`create index if not exists chat_case_idx on chat_messages(case_id, id)`);

/**
 * Requests a member has sent to their old employer.
 *
 * The employer half of this journey is the half nobody builds, and it needs
 * state of its own: a member has to be able to see that the request is sitting
 * with somebody, that it was opened, and that it was acted on. One row per
 * member per step, so re-sending does not pile up duplicates.
 */
await c.query(`
  create table if not exists employer_requests (
    id bigserial primary key,
    case_id uuid not null references cases(id) on delete cascade,
    gate_id text not null,
    employer_name text not null,
    status text not null default 'pending' check (status in ('pending','viewed','done')),
    created_at timestamptz not null default now(),
    viewed_at timestamptz,
    done_at timestamptz,
    unique (case_id, gate_id)
  )`);
await c.query(`create index if not exists employer_req_name_idx on employer_requests(employer_name, status)`);
await c.query(`create index if not exists employer_req_case_idx on employer_requests(case_id)`);

/**
 * An opaque reference for each request, so a shared link never carries a case id.
 *
 * The employer link is passed around in email and WhatsApp. Putting the member's
 * case UUID in the path meant anyone forwarded that link learned an identifier
 * that opens the member's own dashboard - a much bigger key than the one job
 * they were being asked to do.
 */
await c.query(`alter table employer_requests add column if not exists ref text`);
await c.query(`update employer_requests set ref = replace(gen_random_uuid()::text, '-', '') where ref is null`);
await c.query(`create unique index if not exists employer_req_ref_idx on employer_requests(ref)`);

/**
 * Postgres indexes the column a foreign key POINTS AT, never the column holding
 * the key. Every lookup below walks a child table by its parent id, so without
 * these each one is a sequential scan. At six demo members that is free; at any
 * real number of members it is the first thing that falls over.
 */
await c.query(`create index if not exists cases_member_idx on cases(member_id, created_at desc)`);
await c.query(`create index if not exists service_member_idx on service_history(member_id)`);
await c.query(`create index if not exists documents_case_idx on documents(case_id)`);
await c.query(`create index if not exists artifacts_case_idx on artifacts(case_id)`);
await c.query(`create index if not exists comparisons_case_idx on field_comparisons(case_id)`);

const r = await c.query('select slug, display_name, uan from members order by slug');
console.table(r.rows);
await c.end();
