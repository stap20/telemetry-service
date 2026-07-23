// cypod-telemetry
// src/shared/infrastructure/event/event.module.ts
import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { IEventBus } from '../../domain/contracts/event-bus.interface';
import { NestEventBus } from './nest-event-bus';

// note: NestEventBus already existed but was never registered, so nothing could publish. Wiring it
// once, globally, mirrors CacheModule and IdModule: the in-process emitter is an implementation
// detail behind IEventBus, so moving to a real broker later is a change to this file alone and no
// publisher or handler has to know.
@Global()
@Module({
    imports: [EventEmitterModule.forRoot()],
    providers: [{ provide: IEventBus, useClass: NestEventBus }],
    exports: [IEventBus],
})
export class EventModule {}
