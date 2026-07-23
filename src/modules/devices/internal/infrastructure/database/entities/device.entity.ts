// cypod-telemetry
// src/modules/devices/internal/infrastructure/database/entities/device.entity.ts
export class DeviceEntity {
    id: string;
    name: string;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;

    constructor(data: Partial<DeviceEntity>) {
        Object.assign(this, data);
    }
}
