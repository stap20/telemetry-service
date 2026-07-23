// cypod-telemetry
import { ValueObject } from 'src/shared/domain/value-objects/value-object';
import { ValueValidator } from 'src/shared/domain/value-objects/value-validator';
import {
    EmptyDeviceStatusError,
    InvalidDeviceStatusError,
} from '../../errors/telemetry/device-status.error';

// note: this vocabulary comes from the fleet, not from us. The first version of this enum was
// ONLINE/OFFLINE/IDLE/ERROR — invented before the sample data was read — and not one of the 529
// readings used any of those words: the hardware emits OK and FAULT. A device vocabulary is part of
// the integration contract, so the devices win and we speak their language rather than translating
// at the edge. Mapping OK->ONLINE would have looked tidier and quietly destroyed the distinction
// between what the device said and what we decided it meant.
export enum DeviceStatusValue {
    OK = 'OK',
    FAULT = 'FAULT',
    UNKNOWN = 'UNKNOWN',
}

// note: status is a closed set, not a free string. An unknown status would silently pollute the
// stored history and any future filtering, so it is rejected at the edge of the domain instead.
// UNKNOWN is the one value no device ever sends — it is what WE record when a payload omits the
// field, so "the device did not say" stays distinguishable from "the device said it was fine".
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
