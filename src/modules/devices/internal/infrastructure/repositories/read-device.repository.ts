// cypod-telemetry
// src/modules/devices/internal/infrastructure/repositories/read-device.repository.ts
import { Injectable, Inject } from '@nestjs/common';
import { IDevicesPrismaClient } from '../database/devices.prisma.client.interface';
import { DeviceEntity } from '../database/entities/device.entity';

// note: read side of CQRS — used only by query handlers in this same infra layer, so it is a plain
// provider (no interface token, no domain objects). It returns flat persistence rows; shaping into a
// response is the query handler's job.
@Injectable()
export class ReadDeviceRepository {
    constructor(
        @Inject(IDevicesPrismaClient)
        private readonly prisma: IDevicesPrismaClient,
    ) {}

    async findByOwnerId(ownerId: string): Promise<DeviceEntity[]> {
        const rows = await this.prisma.device.findMany({
            where: { ownerId },
            orderBy: { createdAt: 'desc' },
        });

        return rows.map((row) => new DeviceEntity(row));
    }

    // note: ownership is part of the WHERE clause, not a check the caller performs afterwards. A
    // `findById` that returned the row and trusted every call site to compare ownerId would work
    // until the one place that forgot — this shape makes "not mine" and "not there" the same
    // null, so the leak is impossible to write rather than merely avoided.
    async findOwnedById(
        id: string,
        ownerId: string,
    ): Promise<DeviceEntity | null> {
        const row = await this.prisma.device.findFirst({
            where: { id, ownerId },
        });

        return row ? new DeviceEntity(row) : null;
    }
}
