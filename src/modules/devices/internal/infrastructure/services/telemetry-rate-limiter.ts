// cypod-telemetry
// src/modules/devices/internal/infrastructure/services/telemetry-rate-limiter.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisConnection } from 'src/shared/infrastructure/cache/redis.connection';
import { ILogger } from 'src/shared/domain/contracts/logger.interface';
import { NestLogger } from 'src/shared/infrastructure/logger/nest-logger';
import {
    ITelemetryRateLimiter,
    RateLimitDecision,
    RateLimitScope,
} from '../../application/contracts/telemetry-rate-limiter.interface';

// note: Redis rather than an in-process counter because the limit is a property of the DEVICE, not
// of the server that happened to answer. Two instances behind a load balancer each keeping their own
// tally would let a flooding device through at twice the configured rate, and the limit would
// silently weaken every time the service was scaled out.
@Injectable()
export class TelemetryRateLimiter implements ITelemetryRateLimiter {
    // note: the task's number. It is the density of readings a healthy device can legitimately
    // produce for any single minute of real time.
    private static readonly DEFAULT_PER_RECORDED_MINUTE = 10;

    // note: deliberately far above any sane device. This one is not the task's rate limit — it is
    // the backstop for the hole the primary rule leaves open, since a compromised device could
    // otherwise spread fabricated timestamps across thousands of distinct minutes and never trip a
    // per-minute density check. It bounds request volume; it is not meant to bound normal traffic,
    // and a legitimate offline flush of a few hundred readings still fits comfortably underneath.
    private static readonly DEFAULT_PER_ARRIVAL_MINUTE = 600;

    private static readonly ONE_MINUTE_SECONDS = 60;

    // note: the recorded-minute counter has to outlive the minute it counts, or a device could wait
    // 61 seconds and post another 10 readings for the same historical minute. A day covers any
    // plausible offline period in this fleet without letting keys accumulate forever.
    private static readonly RECORDED_WINDOW_TTL_SECONDS = 86400;

    private readonly logger: ILogger = new NestLogger();

    constructor(
        private readonly redis: RedisConnection,
        private readonly configService: ConfigService,
    ) {}

    async consume(
        deviceId: string,
        recordedAt: Date,
    ): Promise<RateLimitDecision> {
        try {
            const arrival = await this.hit(
                `telemetry:rate:arrival:${deviceId}:${this.minuteOf(new Date())}`,
                TelemetryRateLimiter.ONE_MINUTE_SECONDS,
            );

            if (arrival > this.arrivalLimit()) {
                return this.refuse(
                    RateLimitScope.ARRIVAL,
                    this.arrivalLimit(),
                    deviceId,
                );
            }

            const recorded = await this.hit(
                `telemetry:rate:recorded:${deviceId}:${this.minuteOf(recordedAt)}`,
                TelemetryRateLimiter.RECORDED_WINDOW_TTL_SECONDS,
            );

            if (recorded > this.recordedLimit()) {
                return this.refuse(
                    RateLimitScope.RECORDED_MINUTE,
                    this.recordedLimit(),
                    deviceId,
                );
            }

            return { allowed: true };
        } catch (error) {
            // note: FAIL OPEN. If Redis is unreachable the choice is between dropping readings from
            // healthy devices and briefly not throttling a sick one. Telemetry that is never sent
            // again is gone for good, while an unthrottled minute costs some rows in an append-only
            // table — so the cache outage must not become data loss. A system where the rate limit
            // is a security boundary rather than a hygiene measure would have to fail closed, and
            // that is the trade being made here, not an oversight.
            this.logger.error(
                'Telemetry rate limiter unavailable; allowing the reading',
                error as Error,
                { deviceId },
            );

            return { allowed: true };
        }
    }

    // note: INCR then EXPIRE, and the TTL is set on every hit rather than only on the first. Setting
    // it once via a "did INCR return 1" check leaves a key immortal whenever the process dies
    // between the two commands — a device would then be locked out of that minute for ever.
    private async hit(key: string, ttlSeconds: number): Promise<number> {
        const [count] = (await this.redis.client
            .multi()
            .incr(key)
            .expire(key, ttlSeconds)
            .exec()) as [[Error | null, number], [Error | null, number]];

        return count[1];
    }

    private minuteOf(moment: Date): string {
        return moment.toISOString().slice(0, 16);
    }

    private refuse(
        scope: RateLimitScope,
        limit: number,
        deviceId: string,
    ): RateLimitDecision {
        this.logger.warn('Telemetry rate limit exceeded', {
            deviceId,
            scope,
            limit,
        });

        return {
            allowed: false,
            scope,
            limit,
            retryAfterSeconds: TelemetryRateLimiter.ONE_MINUTE_SECONDS,
        };
    }

    private recordedLimit(): number {
        return this.numberOrDefault(
            'TELEMETRY_MAX_READINGS_PER_MINUTE',
            TelemetryRateLimiter.DEFAULT_PER_RECORDED_MINUTE,
        );
    }

    private arrivalLimit(): number {
        return this.numberOrDefault(
            'TELEMETRY_MAX_REQUESTS_PER_MINUTE',
            TelemetryRateLimiter.DEFAULT_PER_ARRIVAL_MINUTE,
        );
    }

    private numberOrDefault(key: string, fallback: number): number {
        const raw = this.configService.get<string>(key);

        if (raw === undefined || raw === null || `${raw}`.trim() === '') {
            return fallback;
        }

        const parsed = Number(raw);

        return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
    }
}
