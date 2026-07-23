// cypod-telemetry
// src/modules/devices/internal/application/errors/telemetry-rate-limit-exceeded.error.ts
import { TooManyRequestsError } from 'src/shared/application/errors/too-many-requests.error';

// note: the message says how many are allowed but never how many have been used, and names no other
// device. A rate-limit response is reachable by anyone holding a token, so it must not become a way
// to measure how busy someone else's fleet is.
export class TelemetryRateLimitExceededError extends TooManyRequestsError {
    constructor(limit: number) {
        super(
            `Too many telemetry readings; the limit is ${limit} per minute`,
            'devices.telemetry_rate_limited',
            { limit },
        );
    }
}
