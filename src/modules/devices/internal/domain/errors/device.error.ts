// cypod-telemetry
import { DomainError } from 'src/shared/domain/errors/domain.error';

// note: mirrors auth's UserAlreadyExistsError — a client-supplied id that is already registered is a
// business-rule conflict (409), rendered here as a domain error so the message localizes like the rest.
export class DeviceAlreadyExistsError extends DomainError {
    constructor(id: string) {
        super(`Device with id ${id} is already registered`, 'devices.device_already_exists', {
            id,
        });
    }
}
