// cypod-telemetry
// src/modules/devices/internal/infrastructure/repositories/telemetry-event.repository.ts
import { Injectable, Inject } from '@nestjs/common';
import { ITelemetryEventRepository } from '../../domain/repositories/telemetry-event.repo.interface';
import { TelemetryReading } from '../../domain/entities/telemetry-reading.aggregate';
import { IIdGenerator } from 'src/shared/domain/contracts/id-generator.interface';
import { IDevicesPrismaClient } from '../database/devices.prisma.client.interface';
import { TelemetryEventMapper } from '../database/mappers/telemetry-event.mapper';

@Injectable()
export class TelemetryEventRepository implements ITelemetryEventRepository {
    constructor(
        @Inject(IDevicesPrismaClient)
        private readonly prisma: IDevicesPrismaClient,
        @Inject(IIdGenerator) private readonly idGenerator: IIdGenerator,
        private readonly telemetryEventMapper: TelemetryEventMapper,
    ) {}

    generateId(): string {
        return this.idGenerator.generate();
    }

    // note: `create`, not the `upsert` the other repos use. A reading is an immutable historical
    // fact — the same device reporting again is a NEW row, never an edit of the previous one.
    // Upserting here would silently overwrite history and destroy the event log this feature exists
    // to build. The deviation from the house save() pattern is the point, not an oversight.
    async save(reading: TelemetryReading): Promise<void> {
        const readingData = this.telemetryEventMapper.toPersistence(reading);

        await this.prisma.telemetryEvent.create({ data: readingData });
    }
}
