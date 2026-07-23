// cypod-telemetry
// src/modules/devices/internal/application/commands/record-telemetry/record-telemetry.handler.ts
import { Injectable, Inject } from '@nestjs/common';
import { CommandHandlerBase } from 'src/shared/application/command.handler.base';
import { IEventBus } from 'src/shared/domain/contracts/event-bus.interface';
import { IDeviceRepository } from '../../../domain/repositories/device.repo.interface';
import { ITelemetryEventRepository } from '../../../domain/repositories/telemetry-event.repo.interface';
import { TelemetryReading } from '../../../domain/entities/telemetry-reading.aggregate';
import { DeviceId } from '../../../domain/value-objects/device-id.vo';
import { DeviceNotFoundError } from '../../errors/device-not-found.error';
import { IDeviceStateCache } from '../../contracts/device-state-cache.interface';
import { ITelemetryThresholdsProvider } from '../../contracts/telemetry-thresholds.provider.interface';
import { RecordTelemetryCommand } from './record-telemetry.command';
import { RecordTelemetryResponse } from './record-telemetry.response';

@Injectable()
export class RecordTelemetryHandler extends CommandHandlerBase<
    RecordTelemetryCommand,
    RecordTelemetryResponse
> {
    constructor(
        @Inject(IDeviceRepository)
        private readonly deviceRepository: IDeviceRepository,
        @Inject(ITelemetryEventRepository)
        private readonly telemetryEventRepository: ITelemetryEventRepository,
        @Inject(IDeviceStateCache)
        private readonly deviceStateCache: IDeviceStateCache,
        @Inject(ITelemetryThresholdsProvider)
        private readonly thresholdsProvider: ITelemetryThresholdsProvider,
        @Inject(IEventBus) private readonly eventBus: IEventBus,
    ) {
        super();
    }

    async handle(
        command: RecordTelemetryCommand,
    ): Promise<RecordTelemetryResponse> {
        this.logger.info('Recording telemetry', {
            deviceId: command.deviceId,
            ownerId: command.ownerId,
        });

        const device = await this.deviceRepository.getById(
            DeviceId.create(command.deviceId),
        );

        // note: missing and not-mine collapse into the same 404 on purpose — see DeviceNotFoundError.
        if (!device || !device.isOwnedBy(command.ownerId)) {
            throw new DeviceNotFoundError(command.deviceId);
        }

        // note: the aggregate validates every field and evaluates the thresholds as one step, so
        // nothing reaches the database until the whole payload is known to be good.
        const reading = TelemetryReading.record(
            {
                id: this.telemetryEventRepository.generateId(),
                deviceId: command.deviceId,
                battery: command.battery,
                temperature: command.temperature,
                lat: command.lat,
                lng: command.lng,
                status: command.status,
                recordedAt: command.timestamp,
            },
            this.thresholdsProvider.current(),
        );

        await this.telemetryEventRepository.save(reading);

        await this.refreshLatestState(reading);

        const breaches = reading.getDomainEventsToPublish();
        await this.eventBus.publishAll(breaches);

        this.logger.info('Telemetry recorded', {
            id: reading.getId().value,
            deviceId: reading.getDeviceId().value,
            alertsRaised: breaches.length,
        });

        return new RecordTelemetryResponse(
            reading.getId().value,
            reading.getDeviceId().value,
            reading.getRecordedAt().value,
            breaches.length,
        );
    }

    // note: the cache is a derived read optimisation, not the source of truth. The reading is
    // already durably stored by this point, so a Redis hiccup must not turn a successfully ingested
    // reading into a 500 and make the device retry a write we already accepted. The failure is
    // logged loudly instead — a stale "latest state" self-heals on the next reading, and it expires
    // on its own thanks to the TTL.
    private async refreshLatestState(reading: TelemetryReading): Promise<void> {
        try {
            await this.deviceStateCache.saveLatest({
                deviceId: reading.getDeviceId().value,
                battery: reading.getBattery().value,
                temperature: reading.getTemperature().value,
                lat: reading.getLocation().latitude,
                lng: reading.getLocation().longitude,
                status: reading.getStatus().value,
                recordedAt: reading.getRecordedAt().value.toISOString(),
            });
        } catch (error) {
            this.logger.error(
                'Failed to refresh cached latest device state',
                error as Error,
                { deviceId: reading.getDeviceId().value },
            );
        }
    }
}
