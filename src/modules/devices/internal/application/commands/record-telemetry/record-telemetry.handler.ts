// cypod-telemetry
// src/modules/devices/internal/application/commands/record-telemetry/record-telemetry.handler.ts
import { Injectable, Inject } from '@nestjs/common';
import { CommandHandlerBase } from 'src/shared/application/command.handler.base';
import { IEventBus } from 'src/shared/domain/contracts/event-bus.interface';
import { IDeviceRepository } from '../../../domain/repositories/device.repo.interface';
import {
    ITelemetryEventRepository,
    TelemetryWriteOutcome,
} from '../../../domain/repositories/telemetry-event.repo.interface';
import { TelemetryReading } from '../../../domain/entities/telemetry-reading.aggregate';
import { TelemetryThresholdBreachedEvent } from '../../../domain/events/telemetry-threshold-breached.event';
import { DeviceId } from '../../../domain/value-objects/device-id.vo';
import { DeviceNotFoundError } from '../../errors/device-not-found.error';
import { IDeviceStateCache } from '../../contracts/device-state-cache.interface';
import { ITelemetryThresholdsProvider } from '../../contracts/telemetry-thresholds.provider.interface';
import { ITelemetryRateLimiter } from '../../contracts/telemetry-rate-limiter.interface';
import { TelemetryRateLimitExceededError } from '../../errors/telemetry-rate-limit-exceeded.error';
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
        @Inject(ITelemetryRateLimiter)
        private readonly rateLimiter: ITelemetryRateLimiter,
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

        // note: throttled AFTER ownership is proven, never before. The budget belongs to the device,
        // so spending it on behalf of a caller who does not own the device would turn the rate limit
        // into a way to silence someone else's hardware — a denial of service delivered through the
        // very feature meant to prevent one.
        await this.enforceRateLimit(command);

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

        const write = await this.telemetryEventRepository.save(reading);

        // note: a duplicate stops here deliberately. Re-publishing the verdicts would raise a second
        // alert for a breach already recorded, and re-touching the cache would extend the TTL of a
        // state on the strength of a reading that told us nothing new. Idempotent has to mean the
        // whole side-effect chain runs once, not just that the row is written once.
        if (write.outcome === TelemetryWriteOutcome.DUPLICATE) {
            this.logger.info('Duplicate telemetry ignored', {
                id: write.id,
                deviceId: reading.getDeviceId().value,
                recordedAt: reading.getRecordedAt().value.toISOString(),
            });

            return new RecordTelemetryResponse(
                write.id,
                reading.getDeviceId().value,
                reading.getRecordedAt().value,
                0,
                true,
            );
        }

        await this.refreshLatestState(reading);

        // note: the reading now emits a verdict per threshold, breached or cleared, so the event
        // count is no longer the alert count — every reading publishes one event per rule. The
        // response still means "how many alerts did THIS reading raise", so breaches are counted
        // explicitly rather than inferred from the size of the batch.
        const verdicts = reading.getDomainEventsToPublish();
        await this.eventBus.publishAll(verdicts);

        const alertsRaised = verdicts.filter(
            (verdict) => verdict instanceof TelemetryThresholdBreachedEvent,
        ).length;

        this.logger.info('Telemetry recorded', {
            id: reading.getId().value,
            deviceId: reading.getDeviceId().value,
            alertsRaised,
        });

        return new RecordTelemetryResponse(
            write.id,
            reading.getDeviceId().value,
            reading.getRecordedAt().value,
            alertsRaised,
            false,
        );
    }

    // note: the budget is spent before we know whether the reading is a duplicate, so replaying the
    // same batch over and over does eventually get throttled. That is intended: one replay is a
    // device recovering, ten replays of the same minute is a device malfunctioning, and the limiter
    // cannot tell the difference from any single request — only from how many of them there are.
    private async enforceRateLimit(
        command: RecordTelemetryCommand,
    ): Promise<void> {
        const decision = await this.rateLimiter.consume(
            command.deviceId,
            command.timestamp,
        );

        if (!decision.allowed) {
            throw new TelemetryRateLimitExceededError(decision.limit ?? 0);
        }
    }

    // note: the cache is a derived read optimisation, not the source of truth. The reading is
    // already durably stored by this point, so a Redis hiccup must not turn a successfully ingested
    // reading into a 500 and make the device retry a write we already accepted. The failure is
    // logged loudly instead — a stale "latest state" self-heals on the next reading, and it expires
    // on its own thanks to the TTL.
    private async refreshLatestState(reading: TelemetryReading): Promise<void> {
        try {
            // note: "latest" means latest by recordedAt, not last received. A device that buffered
            // readings while offline replays them out of order, and writing each one as it arrives
            // would leave the cache holding an older state than the database — so a cache hit and a
            // cache miss would answer the same question differently, which is the one thing a
            // read-through cache must never do. Superseded readings are still stored; they just do
            // not get to claim the title.
            if (await this.isSupersededBy(reading)) {
                return;
            }

            await this.deviceStateCache.saveLatest({
                deviceId: reading.getDeviceId().value,
                battery: reading.getBattery().value,
                temperature: reading.getTemperature().value,
                lat: reading.getLocation()?.latitude ?? null,
                lng: reading.getLocation()?.longitude ?? null,
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

    // note: a read-modify-write, so two readings for the same device landing at once can still
    // interleave and let the older one win. That is tolerable precisely because the cache is not
    // the source of truth — the TTL expires the wrong answer and the next reading corrects it,
    // while the database stays right the whole time. Closing the race properly needs a compare-
    // and-set in the cache itself, which is the trade this comment exists to make visible rather
    // than to hide.
    private async isSupersededBy(reading: TelemetryReading): Promise<boolean> {
        const cached = await this.deviceStateCache.findLatest(
            reading.getDeviceId().value,
        );

        if (!cached) {
            return false;
        }

        return (
            new Date(cached.recordedAt) >= reading.getRecordedAt().value
        );
    }
}
