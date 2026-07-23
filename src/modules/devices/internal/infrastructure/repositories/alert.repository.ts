// cypod-telemetry
// src/modules/devices/internal/infrastructure/repositories/alert.repository.ts
import { Injectable, Inject } from '@nestjs/common';
import { IAlertRepository } from '../../domain/repositories/alert.repo.interface';
import { Alert } from '../../domain/entities/alert.aggregate';
import { IIdGenerator } from 'src/shared/domain/contracts/id-generator.interface';
import { IDevicesPrismaClient } from '../database/devices.prisma.client.interface';
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

    // note: append-only for the same reason as telemetry events — each breach is its own record.
    async save(alert: Alert): Promise<void> {
        const alertData = this.alertMapper.toPersistence(alert);

        await this.prisma.alert.create({ data: alertData });
    }
}
