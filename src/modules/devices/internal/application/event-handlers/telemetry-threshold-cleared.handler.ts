// cypod-telemetry
// src/modules/devices/internal/application/event-handlers/telemetry-threshold-cleared.handler.ts
import { Injectable, Inject } from '@nestjs/common';
import { EventHandlerBase } from 'src/shared/application/event-handler.base';
import { IEventBus } from 'src/shared/domain/contracts/event-bus.interface';
import { IAlertRepository } from '../../domain/repositories/alert.repo.interface';
import { DeviceId } from '../../domain/value-objects/device-id.vo';
import { AlertType } from '../../domain/value-objects/alert/alert-type.vo';
import { TelemetryThresholdClearedEvent } from '../../domain/events/telemetry-threshold-cleared.event';

// note: the counterpart to TelemetryThresholdBreachedHandler and, deliberately, its mirror image —
// one handler opens alerts, one closes them, and neither knows the other exists. Both hang off the
// bus rather than off ingestion, so the recovery path costs the POST nothing.
@Injectable()
export class TelemetryThresholdClearedHandler extends EventHandlerBase<TelemetryThresholdClearedEvent> {
    constructor(
        @Inject(IEventBus) eventBus: IEventBus,
        @Inject(IAlertRepository)
        private readonly alertRepository: IAlertRepository,
    ) {
        super(eventBus, TelemetryThresholdClearedEvent.name);
    }

    // note: the common case is zero open alerts — most readings are healthy and clear a rule that
    // was never breached — so this is a single indexed lookup that finds nothing and stops. Alerts
    // are loaded and resolved through the aggregate rather than closed with one bulk UPDATE because
    // "already resolved" is a rule the aggregate owns; at most a couple of rows can ever match, so
    // there is no volume argument for reaching past it.
    protected async handle(
        event: TelemetryThresholdClearedEvent,
    ): Promise<void> {
        try {
            const openAlerts = await this.alertRepository.findActive(
                DeviceId.create(event.deviceId),
                AlertType.of(event.alertType),
                event.recordedAt,
            );

            for (const alert of openAlerts) {
                alert.resolve(event.recordedAt);
                await this.alertRepository.save(alert);
            }

            if (openAlerts.length > 0) {
                this.logger.info('Telemetry alerts resolved', {
                    deviceId: event.deviceId,
                    type: event.alertType,
                    resolved: openAlerts.length,
                });
            }
        } catch (error) {
            // note: swallowed after logging, same as the breach handler — the bus emits without
            // awaiting its listeners, so rethrowing here becomes an unhandled rejection. A missed
            // resolution is self-healing anyway: the next healthy reading tries again.
            this.logger.error(
                'Failed to resolve telemetry alerts',
                error as Error,
                { deviceId: event.deviceId, type: event.alertType },
            );
        }
    }
}
