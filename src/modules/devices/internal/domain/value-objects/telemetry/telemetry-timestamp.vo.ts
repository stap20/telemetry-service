// cypod-telemetry
import { ValueObject } from 'src/shared/domain/value-objects/value-object';
import { ValueValidator } from 'src/shared/domain/value-objects/value-validator';
import {
    InvalidTelemetryTimestampError,
    TelemetryTimestampInFutureError,
} from '../../errors/telemetry/telemetry-timestamp.error';

export class TelemetryTimestamp extends ValueObject<Date> {
    // note: devices drift against the server clock, so a small forward skew is tolerated rather than
    // rejecting otherwise-good readings. Anything beyond it is treated as a broken clock.
    public static readonly MAX_FUTURE_SKEW_SECONDS = 300;

    private constructor(value: Date) {
        super(value);
    }

    public static of(recordedAt: Date): TelemetryTimestamp {
        this.validate(recordedAt);
        return new TelemetryTimestamp(recordedAt);
    }

    private static validate(recordedAt: Date): void {
        if (!ValueValidator.isValidDate(recordedAt)) {
            throw new InvalidTelemetryTimestampError();
        }

        const latestAcceptable = new Date(
            Date.now() + this.MAX_FUTURE_SKEW_SECONDS * 1000,
        );

        if (recordedAt > latestAcceptable) {
            throw new TelemetryTimestampInFutureError(
                this.MAX_FUTURE_SKEW_SECONDS,
            );
        }
    }
}
