// cypod-telemetry
// src/modules/devices/internal/infrastructure/services/telemetry-rate-limiter.spec.ts
import { ConfigService } from '@nestjs/config';
import { RedisConnection } from 'src/shared/infrastructure/cache/redis.connection';
import { TelemetryRateLimiter } from './telemetry-rate-limiter';
import { RateLimitScope } from '../../application/contracts/telemetry-rate-limiter.interface';

// WHY THIS TEST: it pins the one rule in the system that reconciles two requirements which look
// contradictory — cap a device at 10 readings per minute, and never lose the backlog an offline
// device flushes all at once. The reconciliation lives entirely in WHICH minute is counted, so a
// future refactor to an ordinary arrival-time throttle would still pass a naive rate-limit test
// while silently reintroducing data loss for exactly the devices that had been offline.

class FakeRedis {
    readonly counters = new Map<string, number>();
    failing = false;

    // note: models Redis only as far as this class actually uses it — INCR returning the new value
    // through a MULTI. A fuller fake would be more code testing itself rather than the limiter.
    readonly client = {
        multi: () => {
            const commands: string[] = [];

            const chain = {
                incr: (key: string) => {
                    commands.push(key);
                    return chain;
                },
                expire: () => chain,
                exec: () => {
                    if (this.failing) {
                        return Promise.reject(new Error('redis is down'));
                    }

                    const key = commands[0];
                    const next = (this.counters.get(key) ?? 0) + 1;
                    this.counters.set(key, next);

                    return Promise.resolve([
                        [null, next],
                        [null, 1],
                    ]);
                },
            };

            return chain;
        },
    };
}

describe('TelemetryRateLimiter', () => {
    let redis: FakeRedis;
    let limiter: TelemetryRateLimiter;

    beforeEach(() => {
        redis = new FakeRedis();
        limiter = new TelemetryRateLimiter(
            redis as unknown as RedisConnection,
            new ConfigService({}),
        );
    });

    it('stops a device flooding readings that all describe the same minute', async () => {
        const deviceId = 'DEV-1001';
        const minute = new Date('2026-07-10T07:00:00Z');

        const decisions = [];
        for (let i = 0; i < 12; i++) {
            // note: distinct seconds inside ONE minute — every reading is a different row, so this
            // is not deduplication doing the work. Only the density rule can stop these.
            const recordedAt = new Date(minute.getTime() + i * 1000);
            decisions.push(await limiter.consume(deviceId, recordedAt));
        }

        expect(decisions.filter((d) => d.allowed)).toHaveLength(10);
        expect(decisions[10].allowed).toBe(false);
        expect(decisions[10].scope).toBe(RateLimitScope.RECORDED_MINUTE);
        expect(decisions[10].limit).toBe(10);
    });

    it('lets an offline device flush a backlog spanning many minutes', async () => {
        const deviceId = 'DEV-1004';
        const start = new Date('2026-07-10T08:10:00Z');

        // note: the shape of the real backlog in sample_telemetry.json — 40 readings covering 40
        // minutes of history, all handed over in one burst when the device reconnected.
        const decisions = [];
        for (let i = 0; i < 40; i++) {
            const recordedAt = new Date(start.getTime() + i * 60_000);
            decisions.push(await limiter.consume(deviceId, recordedAt));
        }

        expect(decisions.every((d) => d.allowed)).toBe(true);
    });

    it('allows the reading through when Redis is unreachable', async () => {
        redis.failing = true;

        // note: asserts the deliberate fail-open trade. Telemetry refused here is gone for good,
        // while an unthrottled minute costs rows in an append-only table — if someone ever changes
        // this to fail closed, a Redis blip becomes permanent fleet-wide data loss.
        const decision = await limiter.consume(
            'DEV-1001',
            new Date('2026-07-10T07:00:00Z'),
        );

        expect(decision.allowed).toBe(true);
    });
});
