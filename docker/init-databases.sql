-- cypod-telemetry
-- Backend/docker/init-databases.sql
--
-- note: the Postgres image runs everything in /docker-entrypoint-initdb.d exactly once, on the
-- FIRST start of an empty data volume. Two databases are created rather than one because each
-- module owns an isolated one and they never join across the boundary — see the README. The
-- container's own POSTGRES_DB creates only a single database, which is why this file exists.
--
-- Re-running it is not needed and not possible: after the volume is initialised the entrypoint
-- skips this directory entirely. `docker compose down -v` is what resets it.

CREATE DATABASE auth_db;
CREATE DATABASE devices_db;
