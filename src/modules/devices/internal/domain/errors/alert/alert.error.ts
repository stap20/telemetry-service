// cypod-telemetry
import { DomainError } from 'src/shared/domain/errors/domain.error';
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

// note: NOT a ValidationDomainError — no client sends this. Alerts resolve themselves in reaction to
// a later reading, so hitting this means the same clearing reading was processed twice. It is the
// aggregate refusing to overwrite the recorded recovery time with a second, later one, which would
// quietly falsify how long the condition actually lasted. No translationKey: the resolve path is
// internal and this never reaches an HTTP response.
export class AlertAlreadyResolvedError extends DomainError {
    constructor(id: string) {
        super(`Alert ${id} is already resolved`);
    }
}
