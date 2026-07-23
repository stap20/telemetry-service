// cypod-telemetry
import { DomainError } from 'src/shared/domain/errors/domain.error';

export class EmptyTelemetryEventIdError extends DomainError {
    constructor() {
        super(
            'Telemetry event id cannot be empty',
            'devices.telemetry_event_id_empty',
        );
    }
}

export class InvalidTelemetryEventIdFormatError extends DomainError {
    constructor() {
        super(
            'Telemetry event id must be a valid UUID',
            'devices.telemetry_event_id_invalid_format',
        );
    }
}
