// cypod-telemetry
// src/modules/devices/internal/infrastructure/repositories/device.repository.ts
import { Injectable, Inject } from '@nestjs/common';
import { IDeviceRepository } from '../../domain/repositories/device.repo.interface';
import { Device } from '../../domain/entities/device.aggregate';
import { DeviceId } from '../../domain/value-objects/device-id.vo';
import { IDevicesPrismaClient } from '../database/devices.prisma.client.interface';
import { DeviceMapper } from '../database/mappers/device.mapper';

@Injectable()
export class DeviceRepository implements IDeviceRepository {
    constructor(
        @Inject(IDevicesPrismaClient)
        private readonly prisma: IDevicesPrismaClient,
        private readonly deviceMapper: DeviceMapper,
    ) {}

    async getById(id: DeviceId): Promise<Device | null> {
        const deviceEntity = await this.prisma.device.findUnique({
            where: { id: id.value },
        });

        if (!deviceEntity) {
            return null;
        }

        return this.deviceMapper.toDomain(deviceEntity);
    }

    async save(device: Device): Promise<void> {
        const deviceData = this.deviceMapper.toPersistence(device);

        await this.prisma.device.upsert({
            where: { id: deviceData.id },
            update: {
                name: deviceData.name,
                ownerId: deviceData.ownerId,
                updatedAt: new Date(),
            },
            create: deviceData,
        });
    }
}
