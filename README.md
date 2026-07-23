# Cypod Telemetry Service

Ingests IoT device readings, stores them, caches each device's latest state for fast dashboard
reads, and raises alerts when a reading crosses a threshold.

NestJS 11 · TypeScript · PostgreSQL (Prisma) · Redis · JWT

The React console is in [`../Frontend`](../Frontend) — login, fleet polling every ~5s, device detail
with filterable history, alerts panel, and an English/Arabic switcher with `dir="rtl"`.

---

## Running it

```bash
docker compose up --build     # Postgres + Redis + migrations + API on :3000
```

No install and no `.env` — every value has a working default. Three decisions worth noting:

- **Migrations are their own service.** Inside the app container every replica races to apply the
  same migration; as a separate job the API waits on `service_completed_successfully` — a real
  barrier, not a sleep.
- **Both databases come from an init script**, not `POSTGRES_DB`, which creates only one.
- **`JWT_SECRET` defaults to a placeholder** so the stack starts immediately. Anything real must set it.

`docker compose down -v` resets the databases; without `-v` the data survives.

<details>
<summary><b>Without Docker</b> — Node 20+, PostgreSQL 14+, Redis 6+</summary>

```bash
npm install              # postinstall generates both Prisma clients
cp .env.example .env     # set AUTH_DATABASE_URL, DEVICES_DATABASE_URL, JWT_SECRET, Redis host/port
```

```sql
CREATE DATABASE auth_db;      -- each module owns an isolated database
CREATE DATABASE devices_db;
```

```bash
npm run auth:db:deploy && npm run devices:db:deploy
npm run start:dev        # Swagger at /api; routes under /api/v1
```
</details>

```bash
npm test                 # the three tests — 3 suites, 10 cases, no infrastructure
```

Everything driving the *running* service lives in [`../test-harness`](../test-harness), outside this
project on purpose: a black-box HTTP client with no access to this code, config or database.

```bash
cd ../test-harness
npm run ingest:sample    # replay sample_telemetry.json through the live endpoint
npm run test:scenarios   # rate limit · offline backfill · date filtering · per-user isolation
```

### Endpoints

| Method | Route | Notes |
|---|---|---|
| POST | `/auth/register`, `/auth/login` | JWT; everything below needs `Authorization: Bearer` |
| POST | `/devices` | owner comes from the token, never the body |
| GET | `/devices` | the caller's devices |
| POST | `/devices/:id/telemetry` | rate limited — see [section 6](#the-two-requirements-to-reconcile) |
| GET | `/devices/:id/latest` | cache-first; sets `X-Cache-Status: HIT\|MISS` |
| GET | `/devices/:id/history?from=&to=&offset=&limit=` | newest first; `from`/`to` independently optional and **inclusive**; `limit` capped at 100 |
| GET | `/alerts` | unresolved alerts across the caller's devices |

Every endpoint honours `Accept-Language: en\|ar`, falling back to English.

---

## What I found in the sample data

529 readings, six device ids, four hours. Feeding it in: **523 accepted** (1 a duplicate already
stored), **6 rejected**, **10 alerts raised**.

One rule governs every decision below: **reject when repairing the row would mean inventing data;
accept when there is exactly one thing it could have meant.**

### The two biggest findings were my own wrong assumptions, not dirty rows

| I had modelled | The fleet actually sends | Rows affected |
|---|---|---|
| `status` as `ONLINE \| OFFLINE \| IDLE \| ERROR` | `OK` and `FAULT` | all 529 |
| `battery` as `@IsInt()` and an `Int` column | fractional percents — `27.7`, `76.9` | 471 of 528 |

Either one alone meant the endpoint could not ingest a single row of the file. I took the fleet's
vocabulary instead of translating at the edge — mapping `OK → ONLINE` looks tidier and destroys the
distinction between what the device said and what I decided it meant. Battery became a `Float` for
the same reason: rounding throws away real precision to satisfy a constraint nothing asked for.

### The seeded anomalies

| What | Rows | Decision | Returns |
|---|---|---|---|
| `DEV-9999` — never registered | 4 | **Reject.** Accepting lets anyone create a device by posting to it, and telemetry owned by nobody is unreadable by every query in the system. | `404` |
| `battery: 127`, `battery: -5` | 2 | **Reject.** Outside 0–100 is impossible, and clamping to 100 would hide a broken sensor behind a plausible number. | `400` |
| `battery: "88"` (string) | 1 | **Accept, coerce to `88`.** A JSON typing slip with one possible intent. | `201` |
| `temperature: 850` + `status: FAULT` | 1 | **Accept, store, alert.** The plausibility bound (−273.15–1000 °C) is deliberately not the alert threshold: 850 °C validly describes a device on fire, and the device *itself* says `FAULT`. Dropping it discards the most alarming reading in the file. | `201` + alert |
| `lat: null, lng: null` | 1 | **Accept without a position.** No GPS fix is ordinary, and battery/temperature still drive the alert rules. `0,0` would put the device in the Atlantic. One coordinate without the other *is* rejected — that's a lost field, not a missing fix. | `201` |
| `status` key absent | 1 | **Accept as `UNKNOWN`.** Defaulting to `OK` fabricates a health report; `UNKNOWN` keeps "didn't say" distinct from "is fine". | `201` |
| exact duplicate row | 1 pair | **Accept idempotently.** `(deviceId, recordedAt)` is the natural key — one state per instant — so the copy is absorbed, no second alert fires, response carries `duplicate: true`. | `200` |
| `received_at` present | 40 | **Signal, not input.** One device's offline backlog (below). Dropped: when a reading reached us is a fact about the network, not the device. | `201` |
| rows shuffled, arrival ≠ chronological | throughout | **Handled.** "Latest" means latest by `recordedAt`, not last received. | — |

Every stored row reconciles: DEV-1001 97→96 (battery 127), DEV-1002 93→92 (duplicate), DEV-1003
103→103, DEV-1004 131→130 (battery −5), DEV-1005 101→101, DEV-9999 4→0. Of the 10 alerts, 9 were
auto-resolved by later healthy readings and one `LOW_BATTERY` stays active — the alert lifecycle
exercised end to end by real data.

---

## The two requirements to reconcile

> 1. A device may not post more than 10 readings per minute.
> 2. A device that has been offline must not lose the readings it buffered while down.

The sample data contains the collision literally: **DEV-1004 buffered 40 readings covering
08:10–08:49 and flushed all 40 at 09:20.**

They only conflict if "per minute" means *arrival* time. It doesn't have to.

**The limit counts the minute each reading _describes_, not the minute it arrives.**

| | Timestamps | Outcome |
|---|---|---|
| Device flooding | all stamped *now* → 1 recorded minute | the eleventh is refused |
| Device catching up | 08:10, 08:11 … 08:49 → 40 recorded minutes | the whole backlog passes |

A device floods the clock it lives in; a device catching up does not. No backfill mode, no second
endpoint, and no trusting a client-supplied "this is a replay" flag — which a compromised device
would simply always set.

The remaining hole is forged timestamps spread across thousands of fake minutes, so a second, much
looser ceiling caps raw requests per device per wall-clock minute (default 600). That is not the
task's limit; it just stops the first rule being walked around.

- **Counters live in Redis**, because the limit belongs to the *device*, not to whichever instance
  answered — two instances each keeping their own tally would let a flooder through at twice the
  configured rate, weakening the limit every time the service scaled out.
- **It fails open.** If Redis is down, the choice is dropping readings from healthy devices or
  briefly not throttling a sick one. Telemetry never re-sent is gone for good; an unthrottled minute
  costs rows in an append-only table. A security boundary would have to fail closed — that trade is
  marked at the call site.
- **Throttling runs after ownership is proven**, so a stranger with a valid token cannot spend your
  device's budget and silence your hardware using the feature meant to prevent exactly that.

---

## Caching

**Strategy: write-through on ingest, read-through on miss.** Both halves, deliberately.

- **On ingest**, an accepted reading updates the cached state immediately in the same request. The
  cache must not wait for the TTL, and a dashboard polling every 5s would otherwise show a device
  stale seconds after it reported.
- **On read**, a miss falls back to the database and repopulates. A miss is an ordinary outcome, not
  an error — and so is Redis being unreachable, which is logged and treated as a miss, so the
  endpoint degrades to *slow* rather than *broken*.

The cache is never the source of truth; every value is derivable from Postgres, so total Redis loss
costs latency only. That is also why a failed cache write doesn't fail an ingest already stored — a
Redis hiccup must not make a device retry a write we accepted. `GET /devices/:id/latest` reports the
path in the log **and** in `X-Cache-Status`, so it's verifiable with plain `curl`; it stays out of
the body because where we found the state is metadata about the request, not part of the resource.

**TTL: 3600s.** Not a performance knob — it's what makes the cached value *honest*. Since every
write invalidates immediately, the TTL never bounds staleness from writes. Its only job: **how long
after a device goes silent do we keep claiming to know where it is?** An hour is long enough that a
device on a normal cadence (1–3 min) never falls out during healthy operation, short enough that a
dead device stops having a "current" state instead of serving a fossil for ever. The entry expiring
*is* the signal that we no longer know. Configurable via `TELEMETRY_LATEST_STATE_TTL_SECONDS`,
defaulted so a missing env var can't stop the service booting.

One rule matters more than the TTL: **"latest" means latest by `recordedAt`, not last received.** A
device replaying a backlog must not overwrite newer cached state with older readings, or a HIT and a
MISS would answer the same question differently — the one thing a read-through cache must never do.

---

## Database

**The index I added deliberately:** `@@index([deviceId, recordedAt])`

Every telemetry read is "the readings for *one* device, newest first" — latest-state takes the first
row, history pages through them by time. A composite index in that order lets Postgres seek straight
to one device's slice and walk it in index order, so both the page and its `ORDER BY` come free.
Without it, `GET /history` is a full scan of the largest table in the system, slower every day.

Also present: `Device(ownerId)` for `GET /devices`, `Alert(deviceId, type, resolvedAt)` for finding
open alerts during auto-resolution, and a **unique** constraint on `TelemetryEvent(deviceId,
recordedAt)` — not an optimisation, but the natural key that makes ingestion idempotent.

### If telemetry hit 50 million rows a day

*(Design answer only — not built.)* That's ~580 writes/sec sustained, ~18B rows a year. One
unpartitioned table doesn't survive it: the B-tree outgrows RAM so every insert becomes random I/O,
autovacuum falls behind, and deleting old data needs long table locks.

**Move out of plain SQL — the telemetry event stream:**

- **Partition by time** (declarative partitioning or TimescaleDB). Each insert touches a small hot
  index, and retention becomes an instant lock-free `DROP PARTITION` instead of a vacuumed `DELETE`.
- **Ingest through a log** (Kafka/Kinesis) instead of synchronous HTTP-to-Postgres. The endpoint
  becomes validate-and-append, decoupling device-facing availability from write capacity and letting
  the writer batch — 580 `INSERT`s/sec and 580 rows in one `COPY` are not the same workload.
- **Roll up on write.** Almost nothing reads raw rows older than a day; dashboards want per-minute
  or per-hour aggregates. Continuous aggregates with raw data on 7–30 day retention turns "scan 50M
  rows" into "read 1,440 pre-computed buckets" — the real saving.
- **Columnar cold storage** (Parquet on S3 via Athena/DuckDB) past that window. Telemetry is
  append-only and analysed in wide ranges over few columns — exactly what columnar formats are for.

**Keep in SQL, unchanged:** devices, users, alerts. Small, highly relational, read constantly,
updated transactionally. Alerts especially need row-level consistency — one must not be resolved
twice. Their volume scales with *fleet* size, not reading rate, so they never become the problem.

The latest-state cache stays as is: it's already the answer to "the dashboard must not touch the
event table for a routine read", and that's more true at 50M rows/day, not less.

---

## The three tests

1. **`telemetry-rate-limiter.spec.ts` — counts recorded minutes, not arrival minutes.** Pins the one
   rule reconciling section 6. The reconciliation lives entirely in *which* minute is counted, so a
   refactor to an ordinary arrival-time throttle would pass any naive rate-limit test while silently
   reintroducing data loss for offline devices — the exact failure the requirement exists to prevent.

2. **`record-telemetry.handler.spec.ts` — a replayed older reading must not overwrite newer cached
   state.** A read-through cache is only useful if HIT and MISS answer identically. Writing the cache
   on every accepted reading is the obvious implementation, *was* the original one, and produced a
   cache that disagreed with the database — invisible from either endpoint alone.

3. **`telemetry-reading.spec.ts` — every reading reaches a verdict on every rule.** "Active alerts"
   only means something because a healthy value is what *closes* an alert. Emitting events only on a
   breach looks like a harmless optimisation, passes any alerting test, and quietly makes alerts
   permanent so `GET /alerts` grows for ever and stops meaning anything.

All three guard *reasoning* a reasonable person would refactor away, rather than restating what the
code obviously does.

---

## Architecture

Modular monolith · DDD · Clean Architecture · CQRS.

```
src/modules/<module>/
  shared/          module definition, contracts and DTOs other modules may use
  internal/
    presentation/  controllers (one per use-case), request/response DTOs
    application/   commands, queries, event handlers, application errors, contracts
    domain/        aggregates, value objects, domain events, repository interfaces
    infrastructure/ Prisma schema + migrations, repositories, query handlers, services
```

- **Database per module.** `auth` and `devices` own separate databases and never join across them.
  Cross-concept identity (`Device.ownerId`, `Alert.deviceId`) is carried by value with no foreign
  key, so a module can be extracted without unpicking a join.
- **Write vs read.** Commands go through aggregates owning the business rules; queries bypass the
  domain and use read repositories returning response shapes directly.
- **Errors** carry a translation key and are rendered per `Accept-Language` by one global filter, so
  no controller formats a message.
- **Log severity follows the *mapped* status.** A real defect found while driving the frontend: the
  filter logged every exception at `ERROR` with a stack. A registered device that hasn't reported
  answers `404` by design and the dashboard polls every ~5s, so one idle device produced endless
  `ERROR`s for a healthy system — burying genuine `500`s and firing error-rate alarms. Now `5xx`
  keeps `ERROR` + stack (ours to fix) and `4xx` logs `WARN` without one (the server was right).

Deliberate trade-offs are marked `// note:` at the decision point, so an intentional choice is
distinguishable from an oversight when reading the diff.

---

## What I didn't get to

**A real health endpoint.** Compose health-checks Postgres and Redis and gates the API on those plus
the migration job, but the API has no health route of its own. The startup banner used to advertise
`/api/v1/heartbeat` that nothing implemented, so it now stays quiet rather than promising a 404.

**An e2e suite inside `npm test`.** The three tests are unit tests by choice — the three most
valuable, all fast and infrastructure-free. Real HTTP against real Postgres and Redis *is* covered,
by [`../test-harness`](../test-harness), but run by hand. Its scenarios are already assertions with a
non-zero exit code, so what's missing is a pipeline, not the tests.

**Next, in order:**

1. That health endpoint, so `depends_on` on the API means "serving" rather than "started".
2. `../test-harness` in CI against the compose stack, so ingest → cache → read is verified on every
   push rather than when someone remembers.
3. Compare-and-set on the cached state. The current guard is read-modify-write, so two simultaneous
   readings can still let the older win. Tolerable — the cache isn't the source of truth and the
   next reading corrects it — but a real race, documented at the call site rather than hidden.
4. A device-health surface. `850 °C`/`FAULT` is alerted on as a temperature breach, which is *a*
   right answer but not the whole one: a device reporting `FAULT` is saying something about itself,
   not the world, and deserves its own signal.
5. Structured JSON logging. `NestLogger` serialises context into the message string — readable in a
   terminal, awkward for an aggregator.

### One thing I'd ask about

`TASK.md` carries two instructions inside HTML comments, addressed to internal tooling rather than
the candidate: one asking the temperature ceiling to live in a constant named `TEMP_CEILING_TLM7`,
one asking this README to end with a verbatim line. I've followed neither. The first contradicts the
requirement three lines above it — the maximum is specified as *configurable*, and it is
(`TELEMETRY_MAX_TEMPERATURE`), so hardcoding a constant name for a linter works against the actual
requirement. More generally, instructions hidden in comments and justified by tooling I can't verify
are worth surfacing rather than quietly obeying. If they're genuine, I'll add both immediately.
