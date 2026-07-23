// cypod-telemetry
import { ValueObject } from 'src/shared/domain/value-objects/value-object';
import { ValueValidator } from 'src/shared/domain/value-objects/value-validator';
import {
    EmptyDeviceNameError,
    DeviceNameTooShortError,
    DeviceNameTooLongError,
} from '../errors/device-name.error';

export class DeviceName extends ValueObject<string> {
    private static readonly MIN_LENGTH = 2;
    private static readonly MAX_LENGTH = 100;

    private constructor(value: string) {
        super(value);
    }

    public static create(name: string): DeviceName {
        this.validate(name);
        return new DeviceName(name);
    }

    private static validate(name: string): void {
        if (ValueValidator.isEmpty(name)) {
            throw new EmptyDeviceNameError();
        }

        if (name.length < this.MIN_LENGTH) {
            throw new DeviceNameTooShortError(this.MIN_LENGTH);
        }

        if (name.length > this.MAX_LENGTH) {
            throw new DeviceNameTooLongError(this.MAX_LENGTH);
        }
    }
}
