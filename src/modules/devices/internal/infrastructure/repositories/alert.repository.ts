// cypod-telemetry
// src/modules/devices/internal/infrastructure/repositories/alert.repository.ts
import { Injectable, Inject } from '@nestjs/common';
import { IAlertRepository } from '../../domain/repositories/alert.repo.interface';
import { Alert } from '../../domain/entities/alert.aggregate';
import { DeviceId } from '../../domain/value-objects/device-id.vo';
import { AlertType } from '../../domain/value-objects/alert/alert-type.vo';
import { IIdGenerator } from 'src/shared/domain/contracts/id-generator.interface';
import { IDevicesPrismaClient } from '../database/devices.prisma.client.interface';
import { AlertEntity } from '../database/entities/alert.entity';
import { AlertMapper } from '../database/mappers/alert.mapper';

@Injectable()
export class AlertRepository implements IAlertRepository {
    constructor(
        @Inject(IDevicesPrismaClient)
        private readonly prisma: IDevicesPrismaClient,
        @Inject(IIdGenerator) private readonly idGenerator: IIdGenerator,
        private readonly alertMapper: AlertMapper,
    ) {}

    generateId(): string {
        return this.idGenerator.generate();
    }

    // note: upsert, unlike the telemetry event repo's create-only save. Alerts are still never
    // deleted — a breach that happened stays in the log — but they do have exactly one legitimate
    // mutation: resolving. Keeping that on the same save() means the aggregate is written back the
    // one way, whether it was just raised or just recovered.
    async save(alert: Alert): Promise<void> {
        const alertData = this.alertMapper.toPersistence(alert);

        await this.prisma.alert.upsert({
            where: { id: alertData.id },
            create: alertData,
            update: alertData,
        });
    }

    async findActive(
        deviceId: DeviceId,
        type: AlertType,
        raisedNotAfter: Date,
    ): Promise<Alert[]> {
        const rows = await this.prisma.alert.findMany({
            where: {
                deviceId: deviceId.value,
                type: type.value,
                resolvedAt: null,
                triggeredAt: { lte: raisedNotAfter },
            },
        });

        return rows.map((row) => this.alertMapper.toDomain(new AlertEntity(row)));
    }
}
