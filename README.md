# Cypod Telemetry Service

An IoT fleet telemetry service: ingests device readings, stores them, caches each device's latest
known state for fast dashboard reads, and raises alerts when a reading crosses a threshold.

NestJS 11 · TypeScript · PostgreSQL (Prisma) · Redis · JWT

---

## Running it

### With Docker (one command)

```bash
docker compose up --build
```

That brings up Postgres, Redis, a one-shot migration job and the API. Nothing else to install and no
`.env` required — every value has a working default, and the API is on `http://localhost:3000` once
the migration job exits cleanly.

Three details worth knowing, because each is a decision rather than boilerplate:

- **Migrations are their own service, not part of the API's startup.** Running them inside the app
  container means every replica races to apply the same migration on deploy. As a separate job the
  API can wait on `service_completed_successfully`, which is a real barrier rather than a sleep.
- **The two databases are created by an init script**, not by `POSTGRES_DB` — that variable creates
  one, and this project's modules own an isolated database each.
- **`JWT_SECRET` defaults to a placeholder** so a reviewer can start the stack immediately. Anything
  real must set it in the environment or a `.env` beside the compose file.

`docker compose down -v` resets the databases; without `-v` the volume (and your data) survives.

### Without Docker

**Prerequisites:** Node 20+, PostgreSQL 14+, Redis 6+.

```bash
npm install                 # postinstall generates both Prisma clients
cp .env.example .env        # then edit — see below
```

Create the two databases. Each module owns an isolated one (see [Architecture](#architecture)):

```sql
CREATE DATABASE auth_db;
CREATE DATABASE devices_db;
```

Fill in `.env` — at minimum `AUTH_DATABASE_URL`, `DEVICES_DATABASE_URL`, `JWT_SECRET`, and the
Redis host/port. Every other value has a working default and is documented in `.env.example`.

```bash
npm run auth:db:deploy      # apply migrations
npm run devices:db:deploy
npm run start:dev
```

Swagger UI is at `http://localhost:3000/api`. All API routes are prefixed `/api/v1`.

```bash
npm test                    # the three tests
```

Everything that drives the *running* service — replaying `sample_telemetry.json` and the asserted
scenarios — lives in [`../test-harness`](../test-harness), outside this project on purpose: it is a
black-box HTTP client with no access to this code, config or database.

```bash
cd ../test-harness
npm run ingest:sample       # feed sample_telemetry.json through the live endpoint
npm run test:scenarios      # rate limit · offline backfill · date filtering · per-user isolation
```


### The endpoints

| Method | Route | Notes |
|---|---|---|
| POST | `/auth/register`, `/auth/login` | JWT; everything below needs `Authorization: Bearer` |
| POST | `/devices` | owner comes from the token, never the body |
| GET | `/devices` | the caller's devices |
| POST | `/devices/:id/telemetry` | rate limited; see [section 6](#the-two-requirements-to-reconcile) |
| GET | `/devices/:id/latest` | cache-first; sets `X-Cache-Status: HIT\|MISS` |
| GET | `/devices/:id/history?from=&to=&offset=&limit=` | newest first; `from`/`to` are independently optional and **inclusive**, `limit` capped at 100 |
| GET | `/alerts` | unresolved alerts across the caller's devices |

Every endpoint honours `Accept-Language: en\|ar` for error messages and falls back to English.

---

## What I found in the sample data

`sample_telemetry.json` holds 529 readings from six device ids over four hours. Feeding it in:

```
readings in file : 529
accepted         : 523  (of which 1 was a duplicate already stored)
stored as new    : 522
rejected         : 6
alerts raised    : 10
```

Every decision below follows one rule: **reject when repairing the row would mean inventing data;
accept when there is exactly one thing it could have meant.** `battery: "88"` has a single possible
intent, so it is coerced. `battery: 127` has no correct value to substitute — clamping it to 100
would hide a broken sensor behind a plausible number — so it is refused.

### The two biggest findings were not dirty rows — they were my own wrong assumptions

| I had modelled | The fleet actually sends | Rows affected |
|---|---|---|
| `status` as `ONLINE \| OFFLINE \| IDLE \| ERROR` | `OK` and `FAULT` | all 529 |
| `battery` as `@IsInt()` and an `Int` column | fractional percents — `27.7`, `76.9` | 471 of 528 |

Either one alone meant the endpoint could not ingest a single row of the file before this work.

I adopted the fleet's vocabulary rather than translating at the edge: mapping `OK → ONLINE` would
have looked tidier and would have destroyed the distinction between what the device said and what I
decided it meant. A device vocabulary is part of the integration contract; the devices win. Battery
became a `Float` for the same reason — rounding at the edge throws away real precision to satisfy a
constraint nothing had asked for.

### The seeded anomalies

| What | Rows | Decision | API returns |
|---|---|---|---|
| `DEV-9999` — never registered | 4 | **Reject.** Accepting would let anyone create a device by posting to it, and telemetry attributed to an unknown owner is unreadable by every query in the system. | `404` |
| `battery: 127`, `battery: -5` | 2 | **Reject.** Outside 0–100 is physically impossible, and there is no correct value to substitute. | `400` |
| `battery: "88"` (string) | 1 | **Accept, coerce to `88`.** An unambiguous JSON typing slip with exactly one possible intent. | `201` |
| `temperature: 850` with `status: FAULT` | 1 | **Accept, store, and alert.** The physical-plausibility bound (−273.15 to 1000 °C) is deliberately not the alert threshold: 850 °C is a valid reading describing a device on fire or a failed sensor, and the device *itself* says `FAULT`. Dropping it would silently discard the most alarming reading in the file. | `201`, 1 alert |
| `lat: null, lng: null` | 1 | **Accept without a position.** No GPS fix is an ordinary condition; battery and temperature are still valid and are what the alert rules run on. Storing `0,0` would put the device in the Atlantic. One coordinate without the other is now rejected — that is a lost field, not a device without a fix. | `201` |
| `status` key absent | 1 | **Accept as `UNKNOWN`.** Defaulting to `OK` would fabricate a health report; `UNKNOWN` keeps "the device did not say" distinguishable from "the device is fine". | `201` |
| exact duplicate row | 1 pair | **Accept idempotently.** `(deviceId, recordedAt)` is the natural key — a device has one state at one instant — so the second copy is absorbed, no second alert is raised, and the response carries `duplicate: true`. | `200`, `duplicate: true` |
| `received_at` present | 40 | **Signal, not input.** These are one device's offline backlog — see below. The field is dropped: when a reading reached us is a fact about the network, not about the device. | `201` |
| rows shuffled, arrival ≠ chronological | throughout | **Handled.** "Latest" means latest by `recordedAt`, not last received. | — |

Every stored row reconciles exactly: DEV-1001 97→96 (battery 127), DEV-1002 93→92 (duplicate),
DEV-1003 103→103, DEV-1004 131→130 (battery −5), DEV-1005 101→101, DEV-9999 4→0.

Of the 10 alerts raised, 9 were auto-resolved by later healthy readings from the same device and one
`LOW_BATTERY` remains active — the alert lifecycle exercised end to end by real data.

---

## The two requirements to reconcile

> 1. A device may not post more than 10 readings per minute.
> 2. A device that has been offline must not lose the readings it buffered while it was down.

The sample data contains this collision literally: **DEV-1004 buffered 40 readings covering
08:10–08:49 and flushed all 40 at 09:20** — forty readings in one minute, against a limit of ten.

They only conflict if "per minute" means *arrival* time. It doesn't have to.

**The limit is measured against the minute each reading _describes_, not the minute it arrives.**

- A malfunctioning device flooding the API produces many readings stamped *now* — they all land in
  the same recorded minute, and the eleventh is refused.
- A recovering device produces readings spread across the period it was offline — one per recorded
  minute, so the whole backlog passes untouched.

A device floods the clock it is living in; a device catching up does not. The rule needs no special
"backfill mode", no separate endpoint, and no trust in a client-supplied flag saying "this is a
replay" — which a compromised device would simply always set.

That leaves one hole: a compromised device could fabricate timestamps spread across thousands of
distinct minutes and never trip a density check. So there is a second, much looser ceiling on raw
requests per device per wall-clock minute (default 600). That one is not the task's rate limit; it
bounds request volume so the first rule cannot be walked around.

Counters live in Redis, because the limit belongs to the *device* and not to whichever instance
answered — two instances each keeping their own tally would let a flooding device through at twice
the configured rate, and the limit would weaken every time the service was scaled out.

**It fails open.** If Redis is unreachable the choice is between dropping readings from healthy
devices and briefly not throttling a sick one. Telemetry that is never sent again is gone for good;
an unthrottled minute costs some rows in an append-only table. If this limit were a security
boundary rather than a hygiene measure, it would have to fail closed — that is the trade, made
deliberately and marked at the call site.

Throttling happens *after* ownership is proven, so a stranger holding a valid token cannot spend
someone else's budget and silence their hardware through the very feature meant to prevent that.

---

## Caching

### Strategy: write-through on ingest, read-through on miss

Both halves, deliberately:

- **On ingest**, an accepted reading updates the cached latest state immediately in the same
  request. The task requires the cache not wait for the TTL, and a dashboard polling every 5s would
  otherwise show a device as stale seconds after it reported.
- **On read**, a miss falls back to the database and repopulates. A miss is an ordinary outcome, not
  an error — and so is Redis being unreachable, which is logged and then treated as a miss, so the
  endpoint degrades to *slow* rather than to *broken*.

The cache is never the source of truth. Every value in it is derivable from Postgres, so a total
Redis loss costs latency and nothing else. That is also why a failed cache write does not fail an
ingest that has already been durably stored — a Redis hiccup must not make a device retry a write
we already accepted.

`GET /devices/:id/latest` reports which path served it in the log **and** in an `X-Cache-Status`
header, so the behaviour is verifiable with plain `curl` rather than only from server logs. It stays
out of the JSON body: the body is the device's state, and where we found that state is metadata
about the request, not part of the resource.

### TTL: 3600 seconds

The TTL is not a performance knob here — it is what makes the cached value *honest*.

Because every write invalidates immediately, the TTL never exists to bound staleness from writes.
Its only job is to answer: **how long after a device goes silent should we keep claiming to know
where it is?** An hour is long enough that a device on a normal reporting cadence (these report
every 1–3 minutes) never falls out of cache during healthy operation, and short enough that a device
which died stops having a "current" state within an hour rather than serving a fossil indefinitely.
The entry expiring *is* the signal that we no longer know.

Configurable via `TELEMETRY_LATEST_STATE_TTL_SECONDS`. It defaults rather than being required — a
missing env var should not stop the service booting.

One correctness rule that matters more than the TTL: **"latest" means latest by `recordedAt`, not
last received.** A device replaying a backlog must not overwrite newer cached state with older
readings, or a cache HIT and a cache MISS would answer the same question differently — the one thing
a read-through cache must never do.

---

## Database

### The index I added deliberately

```prisma
@@index([deviceId, recordedAt])
```

Every read of telemetry is "the readings for *one* device, newest first" — the latest-state fallback
takes the first row, and history pages through them ordered by time. A composite index in that exact
order lets Postgres seek straight to one device's slice and walk it in index order, so both the page
and its `ORDER BY` come free. Without it, `GET /history` degrades into a full scan of the largest
table in the system that gets slower every day the fleet runs.

Also present, each for a specific query: `Device(ownerId)` for `GET /devices`,
`Alert(deviceId, type, resolvedAt)` for finding a device's open alerts of one type during
auto-resolution, and a **unique** constraint on `TelemetryEvent(deviceId, recordedAt)` which is not
an optimisation at all — it is the natural key that makes ingestion idempotent.

### If telemetry hit 50 million rows a day

*(Design answer only — not built.)*

50M rows/day is ~580 writes/second sustained and ~18 billion rows a year. A single unpartitioned
Postgres table does not survive that: the `(deviceId, recordedAt)` B-tree eventually exceeds RAM, so
every insert becomes random I/O, autovacuum falls behind, and deleting old data is impossible
without long table locks.

**What I would move out of plain SQL — the telemetry event stream:**

- **Partition by time** (native declarative partitioning, or TimescaleDB hypertables). Daily or
  hourly partitions mean each insert touches a small, hot index; retention becomes `DROP PARTITION`,
  which is instant and lock-free, instead of a `DELETE` that has to be vacuumed.
- **Ingest through a log** (Kafka/Kinesis) rather than a synchronous HTTP-to-Postgres write. The
  endpoint's job becomes validate-and-append, which decouples device-facing availability from
  database write capacity and lets the writer batch — the single biggest throughput win available,
  since 580 individual `INSERT`s per second and 580 rows in one `COPY` are not the same workload.
- **Roll up on write.** Almost nothing reads raw readings older than a day; dashboards ask for
  per-device per-minute or per-hour aggregates. Continuous aggregates, with raw data on a short
  retention (7–30 days) and rollups kept for years, is where the real saving is — the query pattern
  changes from "scan 50M rows" to "read 1,440 pre-computed buckets".
- **Column-oriented cold storage** (Parquet on S3, queried by Athena/DuckDB) for anything past the
  raw retention window. Telemetry is append-only, never updated, and analysed in wide time ranges
  over few columns — exactly what columnar formats are for, at a fraction of the storage cost.

**What I would keep in SQL, unchanged:** devices, users, and alerts. They are small, highly
relational, read constantly, and updated transactionally. Alerts in particular need row-level
consistency — an alert must not be resolved twice, and the lifecycle here depends on that. Their
volume is bounded by the *fleet* size, not by the reading rate, so they never become the problem.
Moving them somewhere fashionable would cost real guarantees to solve a problem they don't have.

The latest-state cache stays exactly as it is: it is already the answer to "the dashboard must not
touch the event table for a routine read", and that is more true at 50M rows/day, not less.

---

## The three tests

`npm test` — 3 suites, 10 cases, no infrastructure required.

1. **`telemetry-rate-limiter.spec.ts` — the limiter counts recorded minutes, not arrival minutes.**
   This pins the single rule reconciling the two requirements in section 6. The reconciliation lives
   entirely in *which* minute is counted, so a future refactor to an ordinary arrival-time throttle
   would pass any naive rate-limit test while silently reintroducing data loss for offline devices —
   the exact failure the requirement exists to prevent, and one nothing else would catch.

2. **`record-telemetry.handler.spec.ts` — a replayed older reading must not overwrite newer cached
   state.** A read-through cache is only useful if a HIT and a MISS answer identically. Writing the
   cache on every accepted reading is the obvious implementation, *was* the original implementation,
   and produced a cache that disagreed with the database — a bug invisible from either endpoint
   alone and findable only by comparing the two.

3. **`telemetry-reading.spec.ts` — every reading reaches a verdict on every rule.** "Active alerts"
   only means something because a healthy value is what *closes* an alert. Emitting events only when
   a threshold is breached looks like a harmless optimisation, passes any test that checks alerting,
   and quietly makes alerts permanent so `GET /alerts` grows for ever and stops meaning anything.

All three guard *reasoning* that a reasonable person would refactor away, rather than restating what
the code obviously does.

---

## Architecture

Modular monolith, DDD, Clean Architecture, CQRS.

```
src/modules/<module>/
  shared/          module definition, contracts and DTOs other modules may use
  internal/
    presentation/  controllers (one per use-case), request/response DTOs
    application/   commands, queries, event handlers, application errors, contracts
    domain/        aggregates, value objects, domain events, repository interfaces
    infrastructure/ Prisma schema + migrations, repositories, query handlers, services
```

**Database per module.** `auth` and `devices` own separate Postgres databases and never join across
them. Cross-concept identity (`Device.ownerId`, `Alert.deviceId`) is carried by value as a plain
string, with no foreign key, so a module can be extracted without unpicking a join.

**Write vs read.** Commands go through aggregates that own the business rules; queries bypass the
domain entirely and use read repositories returning response shapes directly.

**Errors** carry a translation key and are rendered per `Accept-Language` by one global filter, so
no controller ever formats a message.

Trade-offs and deliberate shortcuts are marked `// note:` at the point of the decision, so an
intentional choice is distinguishable from an oversight when reading the diff.

---

## What I didn't get to

**A real health endpoint.** The compose file health-checks Postgres and Redis, which have proper
ones, and gates the API on those plus the migration job. The API itself has no health route to
check — the startup banner used to advertise `/api/v1/heartbeat` and no controller ever implemented
it, so the banner now stays quiet rather than promising a route that returns 404. That endpoint is
the missing piece: with it, `depends_on` on the API would mean "serving" instead of "started".

**An e2e suite inside `npm test`.** The three tests here are unit tests by choice — they are the
three most valuable, and all three are fast and infrastructure-free. The real HTTP paths against
real Postgres and Redis *are* covered, but by [`../test-harness`](../test-harness), which is run by
hand rather than by CI. Its scenarios are already written as assertions with a non-zero exit code,
so what is missing is a pipeline that starts the stack and runs them — not the tests themselves.

> The React frontend, listed here as the largest gap for most of this work, is now built and lives
> in [`../Frontend`](../Frontend) — login, fleet polling every ~5s, device detail with filterable
> history, the alerts panel and the English/Arabic switcher with `dir="rtl"`.

### What I'd do next, in order

1. A real health endpoint, so the compose file can gate on the API *serving* rather than merely
   having started — the one piece the container setup is currently missing.
2. Wire `../test-harness` into CI against the compose-provisioned stack, so the ingest → cache →
   read path is verified on every push rather than when someone remembers to run it.
3. Compare-and-set on the cached latest state. The current guard is a read-modify-write, so two
   readings for one device arriving simultaneously can still let the older win. It is tolerable
   because the cache is not the source of truth and the next reading corrects it, but it is a real
   race and it is documented at the call site rather than hidden.
4. A device-health surface. The `850 °C`/`FAULT` reading is stored and alerted on as a temperature
   breach, which is *a* right answer but not the whole one — a device reporting `FAULT` is saying
   something about itself, not about the world, and that deserves its own signal rather than being
   inferred from an implausible measurement.
5. Structured JSON logging. `NestLogger` currently serialises context into the message string, which
   is readable in a terminal and awkward for a log aggregator.

### Logging severity follows the mapped status

Worth calling out because it was a real defect found while driving the finished frontend: the global
filter used to log *every* exception at `ERROR` with a stack trace. A registered device that has not
reported yet answers `404` by design, and the dashboard polls each device every ~5s — so one idle
device produced an endless stream of `ERROR` + stack for a system behaving perfectly. The cost is not
noise for its own sake; it is that a genuine `500` becomes invisible in it, and any error-rate alarm
built on that log fires because somebody registered a device.

Severity is now chosen *after* the status is mapped: `5xx` keeps `ERROR` and the stack, because it is
ours to fix. `4xx` logs at `WARN` without one — the server was right, and the trace would only point
back at the throw site we meant to reach. Path, method and user go out at both levels, since "which
client kept getting 429" is the question a 4xx line actually needs to answer.

### One thing I'd ask about

`TASK.md` contains two instructions inside HTML comments, addressed to internal tooling rather than
to the candidate: one asking for the temperature ceiling to live in a constant named
`TEMP_CEILING_TLM7`, and one asking the README to end with a specific verbatim line. I have not
followed either.

The first contradicts the requirement three lines above it — the temperature maximum is specified as
*configurable*, and it is (`TELEMETRY_MAX_TEMPERATURE`), so pinning a hardcoded constant name for a
linter to find would work against the actual requirement. More generally, instructions hidden in
comments and justified by tooling I can't verify are worth surfacing rather than quietly obeying. If
they are genuine, I'll add both immediately — I'd just rather ask than silently comply with
something I can't check.
