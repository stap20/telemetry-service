// cypod-telemetry
import { ValueObject } from 'src/shared/domain/value-objects/value-object';
import { ValueValidator } from 'src/shared/domain/value-objects/value-validator';
import {
    EmptyDeviceOwnerIdError,
    InvalidDeviceOwnerIdFormatError,
} from '../errors/device-owner.error';

export class DeviceOwnerId extends ValueObject<string> {
    private constructor(value: string) {
        super(value);
    }

    public static create(ownerId: string): DeviceOwnerId {
        this.validate(ownerId);
        return new DeviceOwnerId(ownerId);
    }

    private static validate(ownerId: string): void {
        if (ValueValidator.isEmpty(ownerId)) {
            throw new EmptyDeviceOwnerIdError();
        }

        if (!ValueValidator.isValidUUID(ownerId)) {
            throw new InvalidDeviceOwnerIdFormatError();
        }
    }
}
