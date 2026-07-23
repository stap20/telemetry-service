// cypod-telemetry
// src/modules/devices/internal/infrastructure/repositories/telemetry-event.repository.ts
import { Injectable, Inject } from '@nestjs/common';
import {
    ITelemetryEventRepository,
    TelemetryWriteOutcome,
    TelemetryWriteResult,
} from '../../domain/repositories/telemetry-event.repo.interface';
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
    // fact — a device reporting a LATER reading is a new row, never an edit of the previous one.
    // Upserting on the id would silently overwrite history and destroy the event log this feature
    // exists to build. The deviation from the house save() pattern is the point, not an oversight.
    //
    // note: the duplicate is detected by letting the write fail rather than by checking first. A
    // SELECT-then-INSERT looks more obvious and is wrong under concurrency — two identical readings
    // arriving together both see "not there yet" and both insert. Here the database is the only
    // arbiter, so the loser of the race gets P2002 and is recognised as the duplicate it is.
    async save(reading: TelemetryReading): Promise<TelemetryWriteResult> {
        const readingData = this.telemetryEventMapper.toPersistence(reading);

        try {
            const stored = await this.prisma.telemetryEvent.create({
                data: readingData,
                select: { id: true },
            });

            return { id: stored.id, outcome: TelemetryWriteOutcome.STORED };
        } catch (error) {
            if (!this.isUniqueViolation(error)) {
                throw error;
            }

            return {
                id: await this.existingIdFor(reading),
                outcome: TelemetryWriteOutcome.DUPLICATE,
            };
        }
    }

    // note: matched on the error CODE, not the message. Prisma's wording is not a stable contract
    // and changes between releases; P2002 is the documented identifier for a unique violation.
    private isUniqueViolation(error: unknown): boolean {
        return (
            typeof error === 'object' &&
            error !== null &&
            (error as { code?: string }).code === 'P2002'
        );
    }

    private async existingIdFor(reading: TelemetryReading): Promise<string> {
        const existing = await this.prisma.telemetryEvent.findUnique({
            where: {
                deviceId_recordedAt: {
                    deviceId: reading.getDeviceId().value,
                    recordedAt: reading.getRecordedAt().value,
                },
            },
            select: { id: true },
        });

        // note: the row that just caused the conflict can be gone by the time we look for it if
        // something deleted it in between. Falling back to the reading's own id keeps the response
        // shaped correctly instead of throwing on a path that is already the unusual one.
        return existing?.id ?? reading.getId().value;
    }
}
