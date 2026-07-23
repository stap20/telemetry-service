// cypod-telemetry
import { NotFoundError } from 'src/shared/application/errors/notfound.error';

// note: this is thrown BOTH when the device does not exist and when it belongs to someone else.
// Answering "403 forbidden" for the second case would confirm that a device id exists on the
// platform, letting anyone enumerate the fleet by probing ids. One indistinguishable 404 keeps
// other tenants' devices invisible — the ownership check is a security boundary, not a lookup.
export class DeviceNotFoundError extends NotFoundError {
    constructor(id: string) {
        super(`Device with id ${id} was not found`, 'devices.device_not_found', {
            id,
        });
    }
}
