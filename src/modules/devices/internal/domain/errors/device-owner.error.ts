// cypod-telemetry
import { DomainError } from 'src/shared/domain/errors/domain.error';

// note: the owner id is never client-supplied — it comes from the verified JWT. These guards are a
// defense-in-depth invariant of the aggregate: a Device can only ever exist owned by a real user id.
export class EmptyDeviceOwnerIdError extends DomainError {
    constructor() {
        super('Device owner id cannot be empty', 'devices.device_owner_empty');
    }
}

export class InvalidDeviceOwnerIdFormatError extends DomainError {
    constructor() {
        super(
            'Device owner id must be a valid UUID',
            'devices.device_owner_invalid_format',
        );
    }
}
