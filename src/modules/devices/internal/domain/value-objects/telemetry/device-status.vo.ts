// cypod-telemetry
import { ValueObject } from 'src/shared/domain/value-objects/value-object';
import { ValueValidator } from 'src/shared/domain/value-objects/value-validator';
import {
    EmptyDeviceStatusError,
    InvalidDeviceStatusError,
} from '../../errors/telemetry/device-status.error';

export enum DeviceStatusValue {
    ONLINE = 'ONLINE',
    OFFLINE = 'OFFLINE',
    IDLE = 'IDLE',
    ERROR = 'ERROR',
}

// note: status is a closed set, not a free string. An unknown status would silently pollute the
// stored history and any future filtering, so it is rejected at the edge of the domain instead.
export class DeviceStatus extends ValueObject<DeviceStatusValue> {
    private constructor(value: DeviceStatusValue) {
        super(value);
    }

    public static of(status: string): DeviceStatus {
        this.validate(status);
        return new DeviceStatus(status as DeviceStatusValue);
    }

    private static validate(status: string): void {
        if (ValueValidator.isEmpty(status)) {
            throw new EmptyDeviceStatusError();
        }

        if (!this.allowedValues().includes(status)) {
            throw new InvalidDeviceStatusError(this.allowedValues().join(', '));
        }
    }

    private static allowedValues(): string[] {
        return Object.values(DeviceStatusValue);
    }
}
