// cypod-telemetry
import { ValidationDomainError } from 'src/shared/domain/errors/validation.domain.error';

export class EmptyAlertIdError extends ValidationDomainError {
    constructor() {
        super('Alert id cannot be empty', 'devices.alert_id_empty');
    }
}

export class InvalidAlertIdFormatError extends ValidationDomainError {
    constructor() {
        super(
            'Alert id must be a valid UUID',
            'devices.alert_id_invalid_format',
        );
    }
}

export class InvalidAlertTypeError extends ValidationDomainError {
    constructor(allowed: string) {
        super(
            `Alert type must be one of: ${allowed}`,
            'devices.alert_type_invalid',
            { allowed },
        );
    }
}
