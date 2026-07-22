// cypod-telemetry
// src/shared/infrastructure/events/nest-event-bus.ts
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IEventBus } from '../../domain/contracts/event-bus.interface';
import { DomainEvent } from '../../domain/events/domain-event';
import { IntegrationEvent } from '../../domain/events/integration-event';

@Injectable()
export class NestEventBus implements IEventBus {
    constructor(private eventEmitter: EventEmitter2) {}

    // Publisher methods
    async publish<T extends DomainEvent | IntegrationEvent>(
        event: T,
    ): Promise<void> {
        try {
            await this.eventEmitter.emit(event.constructor.name, event);
        } catch (error) {
            throw error;
        }
    }

    async publishAll<T extends DomainEvent | IntegrationEvent>(
        events: T[],
    ): Promise<void> {
        try {
            await Promise.all(events.map((event) => this.publish(event)));
        } catch (error) {
            throw error;
        }
    }

    // Listener methods
    on<T extends DomainEvent | IntegrationEvent>(
        eventType: string,
        handler: (event: T) => Promise<void>,
    ): void {
        this.eventEmitter.on(eventType, async (event: T) => {
            try {
                await handler(event);
            } catch (error) {
                console.error(`Error handling event ${eventType}:`, error);
                throw error;
            }
        });
    }

    off(eventType: string): void {
        this.eventEmitter.removeAllListeners(eventType);
    }

    removeAllListeners(): void {
        this.eventEmitter.removeAllListeners();
    }
}
