// cypod-telemetry
import { ValueObject } from 'src/shared/domain/value-objects/value-object';
import { ValueValidator } from 'src/shared/domain/value-objects/value-validator';
import {
    EmptyTelemetryEventIdError,
    InvalidTelemetryEventIdFormatError,
} from '../../errors/telemetry/telemetry-event-id.error';

// note: unlike DeviceId this one is server-minted (a reading carries no identity of its own), so it
// is always a UUID from the shared generator — validated here anyway so persistence can never be
// handed an id the domain did not approve.
export class TelemetryEventId extends ValueObject<string> {
    private constructor(value: string) {
        super(value);
    }

    public static create(id: string): TelemetryEventId {
        this.validate(id);
        return new TelemetryEventId(id);
    }

    private static validate(id: string): void {
        if (ValueValidator.isEmpty(id)) {
            throw new EmptyTelemetryEventIdError();
        }

        if (!ValueValidator.isValidUUID(id)) {
            throw new InvalidTelemetryEventIdFormatError();
        }
    }
}
