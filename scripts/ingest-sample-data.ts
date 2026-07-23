// cypod-telemetry
// scripts/ingest-sample-data.ts
//
// Feeds sample_telemetry.json through the real HTTP endpoint, exactly as a fleet would.
//
// note: this posts over HTTP instead of writing to the database directly, which is slower and the
// entire point. The task asks whether the INGESTION ENDPOINT survives the file, and a script that
// inserted rows itself would prove only that Postgres accepts data — bypassing the validation, the
// rate limiter, the alerting and the cache invalidation that are the things actually under test.
//
//   npm run ingest:sample                     # against a locally running service
//   npm run ingest:sample -- --file ../x.json --base http://host/api/v1

interface SampleReading {
    device_id?: string;
    battery?: unknown;
    temperature?: unknown;
    lat?: unknown;
    lng?: unknown;
    status?: unknown;
    timestamp?: unknown;
    received_at?: unknown;
}

interface Outcome {
    status: number;
    message: string;
    duplicate: boolean;
    alertsRaised: number;
}

const args = process.argv.slice(2);
const argValue = (name: string, fallback: string): string => {
    const index = args.indexOf(`--${name}`);
    return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const BASE = argValue('base', 'http://localhost:3000/api/v1');
// note: the sample file ships beside the repo rather than inside it, so the default path climbs out
// of Backend/. Override with --file when it lives somewhere else.
const FILE = argValue('file', '../../sample_telemetry.json');

// note: the fleet in the file is fixed and known, and DEV-9999 is deliberately NOT in it. Registering
// every device id the file mentions would quietly make the unknown-device case disappear, which is
// exactly the case worth demonstrating — telemetry for an unregistered device must be refused.
const KNOWN_FLEET = ['DEV-1001', 'DEV-1002', 'DEV-1003', 'DEV-1004', 'DEV-1005'];

async function call(
    path: string,
    init: RequestInit = {},
): Promise<{ status: number; body: any }> {
    const response = await fetch(`${BASE}${path}`, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...((init.headers as Record<string, string>) ?? {}),
        },
    });

    let body: any = null;
    try {
        body = await response.json();
    } catch {
        body = null;
    }

    return { status: response.status, body };
}

async function authenticate(): Promise<string> {
    const email = `fleet-operator-${Date.now()}@cypod.test`;
    const password = 'S4mpleData!ngest';

    await call('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
            email,
            password,
            firstName: 'Fleet',
            lastName: 'Operator',
        }),
    });

    const login = await call('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });

    const token = login.body?.accessToken ?? login.body?.token;

    if (!token) {
        throw new Error(
            `Could not authenticate against ${BASE}: ${JSON.stringify(login.body)}`,
        );
    }

    console.log(`Authenticated as ${email}`);

    return token;
}

async function registerFleet(token: string): Promise<void> {
    for (const id of KNOWN_FLEET) {
        const result = await call('/devices', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify({ id, name: `Field Sensor ${id}` }),
        });

        console.log(`  ${id}: ${result.status === 201 ? 'registered' : `${result.status} ${result.body?.message ?? ''}`}`);
    }
}

// note: `device_id` moves into the URL and `received_at` is dropped on purpose. The endpoint keys
// everything off `timestamp` — when the reading was TAKEN — because when it happened to reach us is
// a fact about the network, not about the device. `received_at` is the file telling us which rows
// were a backlog flush; it is evidence for the reader, not an input to the domain.
function toPayload(reading: SampleReading): Record<string, unknown> {
    const { device_id, received_at, ...rest } = reading;
    void device_id;
    void received_at;

    return rest;
}

async function ingest(): Promise<void> {
    const path = require('path');
    const fs = require('fs');
    const resolved = path.resolve(__dirname, FILE);
    const readings: SampleReading[] = JSON.parse(
        fs.readFileSync(resolved, 'utf8'),
    );

    console.log(`\nRead ${readings.length} readings from ${resolved}`);

    const token = await authenticate();
    console.log('\nRegistering the known fleet:');
    await registerFleet(token);

    console.log('\nIngesting...');

    const outcomes: Outcome[] = [];
    let alerts = 0;
    let duplicates = 0;

    for (const reading of readings) {
        const deviceId = reading.device_id ?? '(missing)';
        const result = await call(
            `/devices/${encodeURIComponent(deviceId)}/telemetry`,
            {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: JSON.stringify(toPayload(reading)),
            },
        );

        const duplicate = result.body?.duplicate === true;
        const alertsRaised = result.body?.alertsRaised ?? 0;

        alerts += alertsRaised;
        duplicates += duplicate ? 1 : 0;

        outcomes.push({
            status: result.status,
            message: result.body?.message ?? '',
            duplicate,
            alertsRaised,
        });
    }

    report(readings, outcomes, alerts, duplicates);
}

function report(
    readings: SampleReading[],
    outcomes: Outcome[],
    alerts: number,
    duplicates: number,
): void {
    const accepted = outcomes.filter((o) => o.status < 300).length;
    const rejected = outcomes.length - accepted;

    console.log('\n===== INGESTION REPORT =====');
    console.log(`readings in file : ${readings.length}`);
    console.log(`accepted         : ${accepted}  (of which ${duplicates} were duplicates already stored)`);
    console.log(`stored as new    : ${accepted - duplicates}`);
    console.log(`rejected         : ${rejected}`);
    console.log(`alerts raised    : ${alerts}`);

    const reasons = new Map<string, { count: number; example: string }>();

    outcomes.forEach((outcome, index) => {
        if (outcome.status < 300) {
            return;
        }

        const key = `${outcome.status} ${outcome.message}`;
        const existing = reasons.get(key);

        if (existing) {
            existing.count += 1;
            return;
        }

        reasons.set(key, {
            count: 1,
            example: JSON.stringify(readings[index]),
        });
    });

    if (reasons.size === 0) {
        console.log('\nNothing was rejected.');
        return;
    }

    console.log('\n----- rejections -----');
    for (const [reason, detail] of [...reasons].sort((a, b) => b[1].count - a[1].count)) {
        console.log(`\n[${detail.count}] ${reason}`);
        console.log(`      e.g. ${detail.example}`);
    }
}

ingest().catch((error: Error) => {
    console.error(`\nIngestion failed: ${error.message}`);
    process.exit(1);
});
