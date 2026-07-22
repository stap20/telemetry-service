// cypod-telemetry
// src/shared/core/domain/contracts/event-bus.interface.ts
import { DomainEvent } from '../events/domain-event';
import { IntegrationEvent } from '../events/integration-event';

export interface IEventBus {
    // Publisher methods
    publish<T extends DomainEvent | IntegrationEvent>(event: T): Promise<void>;
    publishAll<T extends DomainEvent | IntegrationEvent>(
        events: T[],
    ): Promise<void>;

    // Listener methods
    on<T extends DomainEvent | IntegrationEvent>(
        eventType: string,
        handler: (event: T) => Promise<void>,
    ): void;

    off(eventType: string): void;
    removeAllListeners(): void;
}
export const IEventBus = Symbol('IEventBus');
