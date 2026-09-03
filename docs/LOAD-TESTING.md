### Load testing and the engine benchmark

Indian public-service portals can struggle under load, so **“does it scale?”** is a fair question to ask of Seven Gates. We answer it with measurements rather than adjectives.

Two measurements are deliberately kept separate:

1. **The engine benchmark** — how fast the pure core computes in isolation.
2. **The load test** — how the application behaves as request arrivals increase, and **what becomes the limiting factor first**.

---

### 1. The engine benchmark

The gate resolver, scheduling logic, and pension calculations are pure functions — no I/O, dates, randomness, database, or network calls. That means they can be benchmarked independently and the numbers describe the computation itself rather than the surrounding infrastructure.

```bash
npm run bench
```

Measured on Node 24, one core (2026-09-03):

| Function                                                    |         Throughput |    p50 |    p99 |
| ----------------------------------------------------------- | -----------------: | -----: | -----: |
| `resolve` (7 gates: topo sort + critical path)              | **~163,000 / sec** |  5.2µs | 21.5µs |
| `resolve` + `schedule` + `savings` (full dashboard compute) |      ~43,000 / sec | 18.6µs |  152µs |
| `pensionConsequence`                                        |   ~2,560,000 / sec |  0.4µs |  1.2µs |

**The headline:** the pure engine is extremely fast relative to the application load tested here. One core resolves roughly **163,000 cases per second** in the benchmark. The load test therefore gives us a way to examine the infrastructure around that computation — particularly database access and the application stack — rather than treating the engine itself as the obvious bottleneck.

---

### 2. The load test

`load/seven-gates.yml` is an [Artillery](https://www.artillery.io/) profile. It warms up and then increases request arrivals while walking the public journey a citizen actually takes: landing on `/`, reaching `/login` — which reads the demo members from Neon Postgres and runs the resolver for each card — followed by `/whats-mocked` and `/technology`.

#### Run it against a local production build — never the live site

```bash
npm run build && npm start     # terminal 1
npm run loadtest               # terminal 2
```

The dev server (`npm run dev`) uses Turbopack and is not representative of the production runtime. It is useful for development, but its latency should not be presented as a production benchmark. **Only `npm start` figures count.**

**Do not point the profile at `build-whatmovesindia.vercel.app`.** The purpose of the test is to find the limits of an environment you control, not to hammer the public deployment or risk exhausting shared database/serverless resources.

#### What to read in the output

* **`http.response_time` p95 / p99** — the tail matters more than the mean because it captures the experience of slower requests.
* **`http.codes` and `vusers.failed`** — these show where failures begin as arrival rate increases.
* **What binds first** — when failures appear, distinguish application/CPU pressure from database or network pressure rather than assuming the cause.

The application currently uses a small in-process PostgreSQL pool, while Neon is already using its managed pooled connection endpoint. That means **“turn on managed pooling” is not an unimplemented fix in the current deployment**; the Neon connection shown in the production configuration already uses the `-pooler` endpoint. The remaining question is whether the pool size, database compute, database location, query pattern, or another part of the request path is limiting throughput.

---

### Measured results

**Production build, one instance, load generated from the same laptop, 2026-09-03.**

The test concentrated on `/` and `/login`, with `/login` representing the heavier database-backed path because it reads the demo members from Neon and resolves each member.

| Sustained arrivals/sec | Requests served (200) |       Failures |      p95 |    p99 |
| ---------------------- | --------------------: | -------------: | -------: | -----: |
| 4 /sec                 |                   200 |          **0** | **26ms** |   35ms |
| 10 /sec                |                   600 | ~25% timed out |    37ms* |  89ms* |
| Ramp to 25 /sec        |                 1,720 | ~26% timed out |    66ms* | 107ms* |

*Latency is calculated from successful responses; timed-out requests are represented separately in the failure count.

Read these numbers honestly:

* **Successful requests remain fast.** Even at the highest tested rate, successful responses had a p95 of about 66ms.
* **The failures are not explained by the pure engine benchmark.** The resolver itself is orders of magnitude faster than the request-level latency being observed.
* **The results are consistent with pressure in the database/request path**, particularly connection availability and the remote database dependency, but this load test alone does not prove that PostgreSQL connection pooling is the sole bottleneck.
* The current Neon connection already uses **managed connection pooling**, so the next scaling step should be based on further measurement rather than claiming that simply enabling PgBouncer will solve the problem.

Two important caveats apply to these numbers. First, the load generator ran on the **same laptop** as the server, so the machine was simultaneously generating traffic and serving the application; a separate load-generating machine would produce a cleaner measurement. Second, `/login` repeatedly exercises the shared Neon database, which is exactly why pushing the test harder without first understanding the database limits is not useful.

The honest pitch, therefore, is not **“it handles thousands of users.”** It is:

> **Successful requests remained under ~70ms at the tested load, while failures began at single-digit to low-double-digit request arrivals on the database-heavy path. The pure engine is not the limiting computation: it resolves ~163,000 cases per second on one core. The next scaling work is therefore focused on the database/request path and validating whether horizontal application scaling actually increases sustainable throughput.**

---

### What these numbers do and do not prove

Held to the same standard as everything else in this project:

* They measure **one application instance** and its current database configuration. They do not simulate 34 crore members, and we do not claim that they do.
* The engine benchmark measures the performance of the **pure computation**. The load test measures the complete application path, including database and network dependencies.
* Dev-server numbers are not production numbers. **Only `npm start` figures count.**
* The current load test was generated from the **same laptop**, not a separate machine. A future AWS test should generate traffic externally so the load generator does not compete with the application for CPU and network resources.
* Neon is already using **managed connection pooling**, so pooling is not something that still needs to be enabled. The next experiment should measure whether changing the application topology, pool configuration, database compute, or database placement actually improves the observed ceiling.

### Scaling plan

The scaling plan follows what the measurements actually show rather than assuming that adding servers automatically solves the problem:

1. **Keep Neon managed connection pooling enabled.**
2. **Tune and measure the application-side PostgreSQL pool** rather than blindly increasing it.
3. **Deploy the stateless application horizontally** across two EC2 instances behind an Application Load Balancer.
4. Run the **same Artillery profile** against one instance and then two instances.
5. If two instances do not materially increase sustainable throughput, investigate the shared Neon/PostgreSQL layer rather than adding more application servers.
6. Add queues, shared rate-limit storage, and observability as the workload requires.
