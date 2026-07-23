// cypod-telemetry
// src/modules/devices/shared/devices.module.ts
import { Module, OnModuleInit } from '@nestjs/common';

import { SecurityModule } from 'src/modules/security/shared/security.module';
import { LocalizationService } from 'src/shared/infrastructure/i18n/localization.service';

import en from './i18n/en.json';
import ar from './i18n/ar.json';

import { RegisterDeviceController } from '../internal/presentation/controllers/register-device.controller';
import { ListDevicesController } from '../internal/presentation/controllers/list-devices.controller';
import { RecordTelemetryController } from '../internal/presentation/controllers/record-telemetry.controller';
import { GetLatestDeviceStateController } from '../internal/presentation/controllers/get-latest-device-state.controller';
import { GetDeviceHistoryController } from '../internal/presentation/controllers/get-device-history.controller';
import { ListActiveAlertsController } from '../internal/presentation/controllers/list-active-alerts.controller';

import { RegisterDeviceHandler } from '../internal/application/commands/register-device/register-device.handler';
import { RecordTelemetryHandler } from '../internal/application/commands/record-telemetry/record-telemetry.handler';
import { TelemetryThresholdBreachedHandler } from '../internal/application/event-handlers/telemetry-threshold-breached.handler';
import { TelemetryThresholdClearedHandler } from '../internal/application/event-handlers/telemetry-threshold-cleared.handler';

import { IDeviceRepository } from '../internal/domain/repositories/device.repo.interface';
import { ITelemetryEventRepository } from '../internal/domain/repositories/telemetry-event.repo.interface';
import { IAlertRepository } from '../internal/domain/repositories/alert.repo.interface';
import { IListDevicesHandler } from '../internal/application/queries/list-devices/list-devices.handler.interface';
import { IGetLatestDeviceStateHandler } from '../internal/application/queries/get-latest-device-state/get-latest-device-state.handler.interface';
import { IGetDeviceHistoryHandler } from '../internal/application/queries/get-device-history/get-device-history.handler.interface';
import { IListActiveAlertsHandler } from '../internal/application/queries/list-active-alerts/list-active-alerts.handler.interface';
import { IDeviceStateCache } from '../internal/application/contracts/device-state-cache.interface';
import { ITelemetryThresholdsProvider } from '../internal/application/contracts/telemetry-thresholds.provider.interface';
import { ITelemetryRateLimiter } from '../internal/application/contracts/telemetry-rate-limiter.interface';

import { DeviceMapper } from '../internal/infrastructure/database/mappers/device.mapper';
import { TelemetryEventMapper } from '../internal/infrastructure/database/mappers/telemetry-event.mapper';
import { AlertMapper } from '../internal/infrastructure/database/mappers/alert.mapper';
import { DeviceRepository } from '../internal/infrastructure/repositories/device.repository';
import { ReadDeviceRepository } from '../internal/infrastructure/repositories/read-device.repository';
import { ReadTelemetryRepository } from '../internal/infrastructure/repositories/read-telemetry.repository';
import { ReadAlertRepository } from '../internal/infrastructure/repositories/read-alert.repository';
import { TelemetryEventRepository } from '../internal/infrastructure/repositories/telemetry-event.repository';
import { AlertRepository } from '../internal/infrastructure/repositories/alert.repository';
import { ListDevicesHandler } from '../internal/infrastructure/query-handlers/list-devices.handler';
import { GetLatestDeviceStateHandler } from '../internal/infrastructure/query-handlers/get-latest-device-state.handler';
import { GetDeviceHistoryHandler } from '../internal/infrastructure/query-handlers/get-device-history.handler';
import { ListActiveAlertsHandler } from '../internal/infrastructure/query-handlers/list-active-alerts.handler';
import { DeviceStateCache } from '../internal/infrastructure/services/device-state.cache';
import { TelemetryThresholdsProvider } from '../internal/infrastructure/services/telemetry-thresholds.provider';
import { TelemetryRateLimiter } from '../internal/infrastructure/services/telemetry-rate-limiter';
import { DevicesPrismaConnection } from '../internal/infrastructure/database/devices-prisma.connection';
import { IDevicesPrismaClient } from '../internal/infrastructure/database/devices.prisma.client.interface';

// note: SecurityModule is imported for JwtAuthGuard (it exports the guard) — the device endpoints are
// authenticated. Structurally identical to AuthModule: own Prisma connection behind the client token,
// handlers as plain providers, repo behind its interface token, i18n catalogs published on init.
// ICachePort and IEventBus are NOT imported here — CacheModule and EventModule are global.
@Module({
    imports: [SecurityModule],
    providers: [
        DevicesPrismaConnection,
        {
            provide: IDevicesPrismaClient,
            useFactory: (connection: DevicesPrismaConnection) => connection.client,
            inject: [DevicesPrismaConnection],
        },
        RegisterDeviceHandler,
        RecordTelemetryHandler,
        // note: registered as a plain provider purely so Nest instantiates it — EventHandlerBase's
        // onModuleInit is what subscribes it to the bus. Nothing ever injects it by hand.
        TelemetryThresholdBreachedHandler,
        TelemetryThresholdClearedHandler,
        DeviceMapper,
        TelemetryEventMapper,
        AlertMapper,
        ReadDeviceRepository,
        ReadTelemetryRepository,
        ReadAlertRepository,
        { provide: IDeviceRepository, useClass: DeviceRepository },
        {
            provide: ITelemetryEventRepository,
            useClass: TelemetryEventRepository,
        },
        { provide: IAlertRepository, useClass: AlertRepository },
        { provide: IDeviceStateCache, useClass: DeviceStateCache },
        {
            provide: ITelemetryThresholdsProvider,
            useClass: TelemetryThresholdsProvider,
        },
        { provide: ITelemetryRateLimiter, useClass: TelemetryRateLimiter },
        { provide: IListDevicesHandler, useClass: ListDevicesHandler },
        {
            provide: IGetLatestDeviceStateHandler,
            useClass: GetLatestDeviceStateHandler,
        },
        { provide: IGetDeviceHistoryHandler, useClass: GetDeviceHistoryHandler },
        {
            provide: IListActiveAlertsHandler,
            useClass: ListActiveAlertsHandler,
        },
    ],
    controllers: [
        RegisterDeviceController,
        ListDevicesController,
        RecordTelemetryController,
        GetLatestDeviceStateController,
        GetDeviceHistoryController,
        ListActiveAlertsController,
    ],
})
export class DevicesModule implements OnModuleInit {
    // note: devices publishes its OWN shared/i18n catalogs — the only place device error wording lives.
    constructor(private readonly localization: LocalizationService) {}

    onModuleInit(): void {
        this.localization.register('en', en);
        this.localization.register('ar', ar);
    }
}
