// cypod-telemetry
// src/modules/devices/internal/application/commands/record-telemetry/record-telemetry.handler.spec.ts
import { RecordTelemetryHandler } from './record-telemetry.handler';
import { RecordTelemetryCommand } from './record-telemetry.command';
import {
    LatestDeviceState,
    IDeviceStateCache,
} from '../../contracts/device-state-cache.interface';
import { ITelemetryRateLimiter } from '../../contracts/telemetry-rate-limiter.interface';
import { ITelemetryThresholdsProvider } from '../../contracts/telemetry-thresholds.provider.interface';
import { IDeviceRepository } from '../../../domain/repositories/device.repo.interface';
import {
    ITelemetryEventRepository,
    TelemetryWriteOutcome,
} from '../../../domain/repositories/telemetry-event.repo.interface';
import { TelemetryThresholds } from '../../../domain/value-objects/telemetry/telemetry-thresholds.vo';
import { DeviceStatusValue } from '../../../domain/value-objects/telemetry/device-status.vo';
import { IEventBus } from 'src/shared/domain/contracts/event-bus.interface';

// WHY THIS TEST: a read-through cache is only useful if a HIT and a MISS answer the same question
// identically, and this is the one place that can break that. Devices replay buffered readings out
// of order, so "latest" has to mean latest by recordedAt rather than last received. Writing the
// cache unconditionally on every accepted reading is the obvious implementation, was the original
// implementation, and produced a cache that disagreed with the database — a bug invisible from
// either endpoint alone and only findable by comparing the two.

const CACHED_NEWER: LatestDeviceState = {
    deviceId: 'DEV-1004',
    battery: 90,
    temperature: 22,
    lat: 30.0444,
    lng: 31.2357,
    status: DeviceStatusValue.OK,
    recordedAt: '2026-07-10T08:49:00.000Z',
};

const commandRecordedAt = (recordedAt: string): RecordTelemetryCommand =>
    new RecordTelemetryCommand(
        'DEV-1004',
        'owner-1',
        55.5,
        25.5,
        30.0444,
        31.2357,
        DeviceStatusValue.OK,
        new Date(recordedAt),
    );

const buildHandler = (cached: LatestDeviceState | null) => {
    const saveLatest = jest.fn().mockResolvedValue(undefined);

    const deviceRepository = {
        getById: jest.fn().mockResolvedValue({ isOwnedBy: () => true }),
    } as unknown as IDeviceRepository;

    const telemetryEventRepository = {
        generateId: () => '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        save: jest.fn().mockResolvedValue({
            id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
            outcome: TelemetryWriteOutcome.STORED,
        }),
    } as unknown as ITelemetryEventRepository;

    const deviceStateCache = {
        findLatest: jest.fn().mockResolvedValue(cached),
        saveLatest,
    } as unknown as IDeviceStateCache;

    const thresholdsProvider = {
        current: () => TelemetryThresholds.of(15, 60),
    } as unknown as ITelemetryThresholdsProvider;

    const rateLimiter = {
        consume: jest.fn().mockResolvedValue({ allowed: true }),
    } as unknown as ITelemetryRateLimiter;

    const eventBus = {
        publishAll: jest.fn().mockResolvedValue(undefined),
    } as unknown as IEventBus;

    const handler = new RecordTelemetryHandler(
        deviceRepository,
        telemetryEventRepository,
        deviceStateCache,
        thresholdsProvider,
        rateLimiter,
        eventBus,
    );

    return { handler, saveLatest };
};

describe('RecordTelemetryHandler cached latest state', () => {
    it('does not let a replayed older reading overwrite a newer cached state', async () => {
        const { handler, saveLatest } = buildHandler(CACHED_NEWER);

        // note: recorded 39 minutes BEFORE what the cache already holds — the shape of a device
        // flushing a backlog after reconnecting.
        await handler.handle(commandRecordedAt('2026-07-10T08:10:00.000Z'));

        expect(saveLatest).not.toHaveBeenCalled();
    });

    it('still refreshes the cache for a genuinely newer reading', async () => {
        const { handler, saveLatest } = buildHandler(CACHED_NEWER);

        await handler.handle(commandRecordedAt('2026-07-10T09:00:00.000Z'));

        expect(saveLatest).toHaveBeenCalledTimes(1);
    });

    it('populates a cold cache', async () => {
        const { handler, saveLatest } = buildHandler(null);

        await handler.handle(commandRecordedAt('2026-07-10T08:10:00.000Z'));

        expect(saveLatest).toHaveBeenCalledTimes(1);
    });
});
