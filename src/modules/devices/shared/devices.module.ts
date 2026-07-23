// cypod-telemetry
// src/modules/devices/shared/devices.module.ts
import { Module, OnModuleInit } from '@nestjs/common';

import { SecurityModule } from 'src/modules/security/shared/security.module';
import { LocalizationService } from 'src/shared/infrastructure/i18n/localization.service';

import en from './i18n/en.json';
import ar from './i18n/ar.json';

import { RegisterDeviceController } from '../internal/presentation/controllers/register-device.controller';
import { ListDevicesController } from '../internal/presentation/controllers/list-devices.controller';

import { RegisterDeviceHandler } from '../internal/application/commands/register-device/register-device.handler';

import { IDeviceRepository } from '../internal/domain/repositories/device.repo.interface';
import { IListDevicesHandler } from '../internal/application/queries/list-devices/list-devices.handler.interface';

import { DeviceMapper } from '../internal/infrastructure/database/mappers/device.mapper';
import { DeviceRepository } from '../internal/infrastructure/repositories/device.repository';
import { ReadDeviceRepository } from '../internal/infrastructure/repositories/read-device.repository';
import { ListDevicesHandler } from '../internal/infrastructure/query-handlers/list-devices.handler';
import { DevicesPrismaConnection } from '../internal/infrastructure/database/devices-prisma.connection';
import { IDevicesPrismaClient } from '../internal/infrastructure/database/devices.prisma.client.interface';

// note: SecurityModule is imported for JwtAuthGuard (it exports the guard) — the device endpoints are
// authenticated. Structurally identical to AuthModule: own Prisma connection behind the client token,
// handlers as plain providers, repo behind its interface token, i18n catalogs published on init.
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
        DeviceMapper,
        ReadDeviceRepository,
        { provide: IDeviceRepository, useClass: DeviceRepository },
        { provide: IListDevicesHandler, useClass: ListDevicesHandler },
    ],
    controllers: [RegisterDeviceController, ListDevicesController],
})
export class DevicesModule implements OnModuleInit {
    // note: devices publishes its OWN shared/i18n catalogs — the only place device error wording lives.
    constructor(private readonly localization: LocalizationService) {}

    onModuleInit(): void {
        this.localization.register('en', en);
        this.localization.register('ar', ar);
    }
}
