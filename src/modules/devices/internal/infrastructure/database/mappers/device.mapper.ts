// cypod-telemetry
// src/modules/devices/internal/infrastructure/database/mappers/device.mapper.ts
import { Injectable } from '@nestjs/common';
import { Device } from '../../../domain/entities/device.aggregate';
import { DeviceEntity } from '../entities/device.entity';

@Injectable()
export class DeviceMapper {
    toDomain(deviceEntity: DeviceEntity): Device {
        return Device.fromPersistence({
            id: deviceEntity.id,
            name: deviceEntity.name,
            ownerId: deviceEntity.ownerId,
        });
    }

    toPersistence(device: Device): Omit<DeviceEntity, 'createdAt' | 'updatedAt'> {
        return {
            id: device.getId().value,
            name: device.getName().value,
            ownerId: device.getOwnerId().value,
        };
    }
}
