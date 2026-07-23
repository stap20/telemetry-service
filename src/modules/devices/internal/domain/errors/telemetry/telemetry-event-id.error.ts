// cypod-telemetry
import { ValidationDomainError } from 'src/shared/domain/errors/validation.domain.error';

export class EmptyTelemetryEventIdError extends ValidationDomainError {
    constructor() {
        super(
            'Telemetry event id cannot be empty',
            'devices.telemetry_event_id_empty',
        );
    }
}

export class InvalidTelemetryEventIdFormatError extends ValidationDomainError {
    constructor() {
        super(
            'Telemetry event id must be a valid UUID',
            'devices.telemetry_event_id_invalid_format',
        );
    }
}
