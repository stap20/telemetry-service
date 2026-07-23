// cypod-telemetry
// src/modules/devices/internal/infrastructure/repositories/read-alert.repository.ts
import { Injectable, Inject } from '@nestjs/common';
import { IDevicesPrismaClient } from '../database/devices.prisma.client.interface';
import { AlertEntity } from '../database/entities/alert.entity';

@Injectable()
export class ReadAlertRepository {
    constructor(
        @Inject(IDevicesPrismaClient)
        private readonly prisma: IDevicesPrismaClient,
    ) {}

    // note: takes device ids rather than an ownerId, because alerts genuinely do not know who owns
    // them — there is no ownerId column and no foreign key to Device, by the same modular-monolith
    // rule that keeps every cross-concept link a plain value. Resolving owner to devices is the
    // caller's job, which keeps this repository honest about what it can actually answer.
    //
    // Denormalising ownerId onto the alert row would collapse this into one query, and the reason
    // not to is correctness rather than purity: ownership lives on the device and can change, so a
    // copy on the alert is a second truth that goes stale the first time a device is reassigned.
    async findActiveByDeviceIds(deviceIds: string[]): Promise<AlertEntity[]> {
        if (deviceIds.length === 0) {
            return [];
        }

        const rows = await this.prisma.alert.findMany({
            where: { deviceId: { in: deviceIds }, resolvedAt: null },
            orderBy: { triggeredAt: 'desc' },
        });

        return rows.map((row) => new AlertEntity(row));
    }
}
