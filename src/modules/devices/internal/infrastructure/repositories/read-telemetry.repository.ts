// cypod-telemetry
// src/modules/devices/internal/infrastructure/repositories/read-telemetry.repository.ts
import { Injectable, Inject } from '@nestjs/common';
import { IDevicesPrismaClient } from '../database/devices.prisma.client.interface';
import { TelemetryEventEntity } from '../database/entities/telemetry-event.entity';

export interface TelemetryHistoryFilter {
    deviceId: string;
    offset: number;
    limit: number;
    from?: Date;
    to?: Date;
}

export interface TelemetryHistoryPage {
    rows: TelemetryEventEntity[];
    total: number;
}

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

    // note: the page and the count run inside one $transaction so they see the same snapshot.
    // Firing them separately would let a reading land between the two and produce a total that
    // does not match the page just returned — pagination that drifts under a live ingest stream.
    // This is exactly the endpoint where that happens, since devices report continuously.
    async searchHistory(
        filter: TelemetryHistoryFilter,
    ): Promise<TelemetryHistoryPage> {
        const where = this.buildWhere(filter);

        const [rows, total] = await this.prisma.$transaction([
            this.prisma.telemetryEvent.findMany({
                where,
                // note: newest first — history is read to answer "what has this device been doing
                // lately", so the useful end of the log is page one.
                orderBy: { recordedAt: 'desc' },
                skip: filter.offset,
                take: filter.limit,
            }),
            this.prisma.telemetryEvent.count({ where }),
        ]);

        return {
            rows: rows.map((row) => new TelemetryEventEntity(row)),
            total,
        };
    }

    // note: the range is built only from the bounds that were actually supplied. Defaulting a
    // missing `from` to the epoch would look equivalent but quietly forces the planner to evaluate
    // a range predicate on every row instead of skipping the column entirely.
    private buildWhere(filter: TelemetryHistoryFilter) {
        const recordedAt: { gte?: Date; lte?: Date } = {};

        if (filter.from) {
            recordedAt.gte = filter.from;
        }

        if (filter.to) {
            recordedAt.lte = filter.to;
        }

        return {
            deviceId: filter.deviceId,
            ...(filter.from || filter.to ? { recordedAt } : {}),
        };
    }
}
