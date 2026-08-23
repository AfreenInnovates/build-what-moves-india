import 'dotenv/config';
import pg from 'pg';
import { SPEC } from '../lib/gates/spec';

const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
await c.query(
  `insert into gate_specs (version, spec) values ($1,$2)
   on conflict (version) do update set spec = excluded.spec, published_at = now()`,
  [SPEC.version, JSON.stringify(SPEC)],
);
const { rows } = await c.query(
  `select version, published_at, jsonb_array_length(spec->'gates') gates,
          (spec->>'baselineSettlementDays')::int baseline from gate_specs order by published_at desc`,
);
console.table(rows);
await c.end();
