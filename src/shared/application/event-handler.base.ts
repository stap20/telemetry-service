// cypod-telemetry
// src/shared/core/domain/events/event-handler.base.ts
import { OnModuleInit } from '@nestjs/common';
import { IEventBus } from '../domain/contracts/event-bus.interface';
import { DomainEvent } from '../domain/events/domain-event';
import { IntegrationEvent } from '../domain/events/integration-event';
import { NestLogger } from '../infrastructure/logger/nest-logger';
import { ILogger } from '../domain/contracts/logger.interface';

export abstract class EventHandlerBase<
    T extends DomainEvent | IntegrationEvent,
> implements OnModuleInit {
    protected readonly logger: ILogger;

    constructor(
        protected readonly eventBus: IEventBus,
        protected readonly eventType: string,
    ) {
        this.logger = new NestLogger();
    }

    onModuleInit(): void {
        this.registerHandler();
    }

    protected abstract handle(event: T): Promise<void>;

    private registerHandler(): void {
        this.eventBus.on<T>(this.eventType, async (event: T) => {
            await this.handle(event);
        });
    }
}
