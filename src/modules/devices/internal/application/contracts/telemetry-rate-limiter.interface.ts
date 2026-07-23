// cypod-telemetry
// src/modules/devices/internal/application/contracts/telemetry-rate-limiter.interface.ts

export enum RateLimitScope {
    // note: too many readings claiming to describe the SAME minute of real time.
    RECORDED_MINUTE = 'RECORDED_MINUTE',
    // note: too many requests arriving in one wall-clock minute, whatever they claim to describe.
    ARRIVAL = 'ARRIVAL',
}

export interface RateLimitDecision {
    allowed: boolean;
    scope?: RateLimitScope;
    limit?: number;
    retryAfterSeconds?: number;
}

// note: the limiter is asked about a reading, not about a request, and that is the whole design.
// The task requires two things that look contradictory — cap a device at 10 readings per minute,
// and never lose the readings a device buffered while it was offline, which arrive as one burst.
// They only conflict if "per minute" is read as arrival time. Measured against the minute the
// reading DESCRIBES, a 40-reading flush covering 40 minutes of history is one reading per minute
// and passes untouched, while a device inventing 40 readings for the same minute is stopped at 10.
// A malfunctioning device floods the clock it is living in; a recovering device does not.
export interface ITelemetryRateLimiter {
    consume(deviceId: string, recordedAt: Date): Promise<RateLimitDecision>;
}

export const ITelemetryRateLimiter = Symbol('ITelemetryRateLimiter');
