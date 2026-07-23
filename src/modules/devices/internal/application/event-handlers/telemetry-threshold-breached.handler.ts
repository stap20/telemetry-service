// cypod-telemetry
// src/modules/devices/internal/application/event-handlers/telemetry-threshold-breached.handler.ts
import { Injectable, Inject } from '@nestjs/common';
import { EventHandlerBase } from 'src/shared/application/event-handler.base';
import { IEventBus } from 'src/shared/domain/contracts/event-bus.interface';
import { IAlertRepository } from '../../domain/repositories/alert.repo.interface';
import { Alert } from '../../domain/entities/alert.aggregate';
import { TelemetryThresholdBreachedEvent } from '../../domain/events/telemetry-threshold-breached.event';

// note: raising the alert is a SIDE EFFECT of ingestion, not part of it — that is exactly why it
// listens for an event instead of being called from the handler. Ingestion must stay fast and must
// not fail because alerting failed: a reading is still a valid reading even if we could not record
// the alert about it. If alerting ever had to be atomic with the write, this would have to become a
// direct call inside the same transaction instead.
@Injectable()
export class TelemetryThresholdBreachedHandler extends EventHandlerBase<TelemetryThresholdBreachedEvent> {
    constructor(
        @Inject(IEventBus) eventBus: IEventBus,
        @Inject(IAlertRepository)
        private readonly alertRepository: IAlertRepository,
    ) {
        super(eventBus, TelemetryThresholdBreachedEvent.name);
    }

    // note: errors are swallowed after logging rather than rethrown. The bus emits without awaiting
    // its listeners, so a rejection here would surface as an unhandled promise rejection and could
    // take the process down — a failed alert write must never do that to the service.
    protected async handle(
        event: TelemetryThresholdBreachedEvent,
    ): Promise<void> {
        try {
            const alert = Alert.raise({
                id: this.alertRepository.generateId(),
                deviceId: event.deviceId,
                type: event.alertType,
                value: event.value,
                threshold: event.threshold,
                triggeredAt: event.recordedAt,
            });

            await this.alertRepository.save(alert);

            this.logger.warn('Telemetry threshold breached', {
                deviceId: event.deviceId,
                type: event.alertType,
                value: event.value,
                threshold: event.threshold,
            });
        } catch (error) {
            this.logger.error(
                'Failed to raise telemetry alert',
                error as Error,
                { deviceId: event.deviceId, type: event.alertType },
            );
        }
    }
}
