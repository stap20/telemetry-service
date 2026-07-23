// cypod-telemetry
import { NotFoundError } from 'src/shared/application/errors/notfound.error';

// note: distinct from DeviceNotFoundError, and deliberately more informative. That error hides
// whether a device exists at all, because the caller has not proven they own it. By the time this
// one is thrown ownership is already established, so there is nothing left to leak — the caller
// owns the device and is simply being told it has never reported. Collapsing the two would make a
// brand-new device indistinguishable from someone else's, which is a confusing lie to tell an
// owner about their own hardware.
export class LatestStateUnavailableError extends NotFoundError {
    constructor(deviceId: string) {
        super(
            `Device ${deviceId} has not reported any telemetry yet`,
            'devices.latest_state_unavailable',
            { deviceId },
        );
    }
}
