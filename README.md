# Seven Gates

Find out what is blocking an EPF withdrawal **before** filing, not after being rejected.

EPFO settles over five crore claims a year and rejects roughly one in five, most often
because a name is spelled differently across records that were never built to match.
This puts all seven blocking conditions on one page, in dependency order, and says who
has to act on each one — you, your employer, or EPFO.

## Running it

```bash
npm install
npm run dev
```

Needs `.env` with `DATABASE_URL`, `GROQ_API_KEY` and `SARVAM_API_KEY`. See `.env.example`.

## Useful scripts

| Command | What it does |
|---|---|
| `npm run db:seed` | Seed the six demo members from `fixtures/data/*.json` |
| `npm run db:dump` | Print every table's contents |
| `npm run spec:publish` | Write the current gate spec into the `gate_specs` table |
| `npm run spine` | Render the gate spine for each member in the terminal |
| `npm run fixtures:build` | Regenerate the synthetic document PNGs |
| `npm test` | Gate resolver and matcher unit tests |

## How it is put together

- `lib/gates/spec.ts` — the seven gates as **data**, with a small JSON-serialisable
  predicate language. Adding a gate is a config change, not a release.
- `lib/gates/resolve.ts` — pure resolver: facts in, ordered gates and a day count out,
  computed along the critical path through the dependency graph.
- `lib/epfo-screens.ts` — the real EPFO screens, field for field, with an honest note
  on every step we substitute.

Nothing here talks to EPFO. See `/whats-mocked` for exactly what is real and what is not.
