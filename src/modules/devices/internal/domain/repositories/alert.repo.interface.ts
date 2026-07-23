// cypod-telemetry
import { Alert } from '../entities/alert.aggregate';
import { DeviceId } from '../value-objects/device-id.vo';
import { AlertType } from '../value-objects/alert/alert-type.vo';

export interface IAlertRepository {
    generateId(): string;
    save(alert: Alert): Promise<void>;
    // note: `raisedNotAfter` is the clearing reading's own timestamp, and it exists because
    // telemetry does not arrive in order — a device that buffered readings while offline replays
    // them late. Without it, an old healthy reading uploaded after a fresh breach would resolve an
    // alert that is still live. An alert can only be closed by a reading taken after it was raised.
    findActive(
        deviceId: DeviceId,
        type: AlertType,
        raisedNotAfter: Date,
    ): Promise<Alert[]>;
}

export const IAlertRepository = Symbol('IAlertRepository');
