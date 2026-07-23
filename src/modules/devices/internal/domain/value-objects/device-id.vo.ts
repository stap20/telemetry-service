// cypod-telemetry
import { ValueObject } from 'src/shared/domain/value-objects/value-object';
import { ValueValidator } from 'src/shared/domain/value-objects/value-validator';
import {
    EmptyDeviceIdError,
    InvalidDeviceIdFormatError,
} from '../errors/device-id.error';

export class DeviceId extends ValueObject<string> {
    private constructor(value: string) {
        super(value);
    }

    public static create(id: string): DeviceId {
        this.validate(id);
        return new DeviceId(id);
    }

    private static validate(id: string): void {
        if (ValueValidator.isEmpty(id)) {
            throw new EmptyDeviceIdError();
        }

        if (!ValueValidator.isValidDeviceId(id)) {
            throw new InvalidDeviceIdFormatError();
        }
    }
}
