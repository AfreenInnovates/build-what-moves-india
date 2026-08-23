import 'dotenv/config';
import pg from 'pg';
const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
const r = await c.query(`select count(*)::int n from chat_messages`);
console.log('stored chat messages:', r.rows[0].n);
await c.end();
