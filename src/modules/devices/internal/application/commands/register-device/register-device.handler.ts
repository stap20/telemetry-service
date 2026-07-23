// cypod-telemetry
// src/modules/devices/internal/application/commands/register-device/register-device.handler.ts
import { Injectable, Inject } from '@nestjs/common';
import { CommandHandlerBase } from 'src/shared/application/command.handler.base';
import { IDeviceRepository } from '../../../domain/repositories/device.repo.interface';
import { Device } from '../../../domain/entities/device.aggregate';
import { DeviceId } from '../../../domain/value-objects/device-id.vo';
import { DeviceAlreadyExistsError } from '../../../domain/errors/device.error';
import { RegisterDeviceCommand } from './register-device.command';
import { RegisterDeviceResponse } from './register-device.response';

@Injectable()
export class RegisterDeviceHandler extends CommandHandlerBase<
    RegisterDeviceCommand,
    RegisterDeviceResponse
> {
    constructor(
        @Inject(IDeviceRepository)
        private readonly deviceRepository: IDeviceRepository,
    ) {
        super();
    }

    async handle(
        command: RegisterDeviceCommand,
    ): Promise<RegisterDeviceResponse> {
        this.logger.info('Registering device', {
            id: command.id,
            ownerId: command.ownerId,
        });

        // note: build the id VO first so a malformed id fails validation (400) before any DB hit.
        const deviceId = DeviceId.create(command.id);

        const existing = await this.deviceRepository.getById(deviceId);
        if (existing) {
            throw new DeviceAlreadyExistsError(command.id);
        }

        const device = Device.register({
            id: command.id,
            name: command.name,
            ownerId: command.ownerId,
        });

        await this.deviceRepository.save(device);

        this.logger.info('Device registered', {
            id: device.getId().value,
            ownerId: device.getOwnerId().value,
        });

        return new RegisterDeviceResponse(
            device.getId().value,
            device.getName().value,
            device.getOwnerId().value,
        );
    }
}
