// cypod-telemetry
import { ValidationDomainError } from 'src/shared/domain/errors/validation.domain.error';

export class EmptyDeviceIdError extends ValidationDomainError {
    constructor() {
        super('Device id cannot be empty', 'devices.device_id_empty');
    }
}

export class InvalidDeviceIdFormatError extends ValidationDomainError {
    constructor() {
        super(
            'Device id must be 3-100 characters and contain only letters, digits, dot, dash or underscore',
            'devices.device_id_invalid_format',
        );
    }
}
