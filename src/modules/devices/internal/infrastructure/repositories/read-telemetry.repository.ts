// cypod-telemetry
// src/modules/devices/internal/infrastructure/repositories/read-telemetry.repository.ts
import { Injectable, Inject } from '@nestjs/common';
import { IDevicesPrismaClient } from '../database/devices.prisma.client.interface';
import { TelemetryEventEntity } from '../database/entities/telemetry-event.entity';

// note: separate from TelemetryEventRepository on purpose. That one writes aggregates and knows
// about the domain; this one only reads flat rows for query handlers and never builds a
// TelemetryReading. Rebuilding an aggregate — running every value object's validation — just to
// flatten it back into a JSON response would be pure waste on a paginated history endpoint.
@Injectable()
export class ReadTelemetryRepository {
    constructor(
        @Inject(IDevicesPrismaClient)
        private readonly prisma: IDevicesPrismaClient,
    ) {}

    // note: "latest" is by recordedAt, the time the device says the reading was taken, not by
    // createdAt, the time we happened to receive it. A device replaying buffered readings after
    // reconnecting would otherwise make a stale reading the newest one.
    async findLatestByDeviceId(
        deviceId: string,
    ): Promise<TelemetryEventEntity | null> {
        const row = await this.prisma.telemetryEvent.findFirst({
            where: { deviceId },
            orderBy: { recordedAt: 'desc' },
        });

        return row ? new TelemetryEventEntity(row) : null;
    }
}
