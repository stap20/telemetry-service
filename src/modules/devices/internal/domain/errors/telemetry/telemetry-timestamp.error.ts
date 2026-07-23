// cypod-telemetry
import { DomainError } from 'src/shared/domain/errors/domain.error';

export class InvalidTelemetryTimestampError extends DomainError {
    constructor() {
        super(
            'Telemetry timestamp must be a valid date',
            'devices.telemetry_timestamp_invalid',
        );
    }
}

// note: a reading dated in the future is rejected rather than clamped — it usually means a broken
// device clock, and silently accepting it would corrupt the "latest state" ordering for that device.
// A small skew window is allowed because device clocks drift slightly against the server.
export class TelemetryTimestampInFutureError extends DomainError {
    constructor(skewSeconds: number) {
        super(
            `Telemetry timestamp cannot be more than ${skewSeconds} seconds in the future`,
            'devices.telemetry_timestamp_in_future',
            { skewSeconds },
        );
    }
}
