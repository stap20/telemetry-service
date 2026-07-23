// cypod-telemetry
// src/modules/devices/internal/domain/entities/device.aggregate.ts
import { AggregateRoot } from 'src/shared/domain/aggregate-root';
import { DeviceId } from '../value-objects/device-id.vo';
import { DeviceName } from '../value-objects/device-name.vo';
import { DeviceOwnerId } from '../value-objects/device-owner-id.vo';

export interface RegisterDeviceParams {
    id: string;
    name: string;
    ownerId: string;
}

export interface DevicePersistenceParams {
    id: string;
    name: string;
    ownerId: string;
}

export class Device extends AggregateRoot<DeviceId> {
    private name: DeviceName;
    private ownerId: DeviceOwnerId;

    private constructor(id: DeviceId, name: DeviceName, ownerId: DeviceOwnerId) {
        super(id);
        this.name = name;
        this.ownerId = ownerId;
    }

    // note: behavioral name (`register`) over a generic `create` — the business action is registering
    // a physical device. No domain event is emitted: nothing in this task reacts to a registration.
    // When telemetry ingestion arrives it can subscribe to a DeviceRegisteredEvent added here — the
    // aggregate is the right place to raise it, so leaving the seam is intentional, not an oversight.
    public static register(params: RegisterDeviceParams): Device {
        const id = DeviceId.create(params.id);
        const name = DeviceName.create(params.name);
        const ownerId = DeviceOwnerId.create(params.ownerId);

        return new Device(id, name, ownerId);
    }

    public static fromPersistence(params: DevicePersistenceParams): Device {
        const id = DeviceId.create(params.id);
        const name = DeviceName.create(params.name);
        const ownerId = DeviceOwnerId.create(params.ownerId);

        return new Device(id, name, ownerId);
    }

    public getName(): DeviceName {
        return this.name;
    }

    public getOwnerId(): DeviceOwnerId {
        return this.ownerId;
    }

    public isOwnedBy(userId: string): boolean {
        return this.ownerId.value === userId;
    }

    public equals(other: Device): boolean {
        if (!(other instanceof Device)) {
            return false;
        }
        return this.id.equals(other.id);
    }
}
