// cypod-telemetry
// src/modules/devices/internal/infrastructure/query-handlers/list-devices.handler.ts
import { Injectable } from '@nestjs/common';
import { IListDevicesHandler } from '../../application/queries/list-devices/list-devices.handler.interface';
import { ListDevicesQuery } from '../../application/queries/list-devices/list-devices.query';
import { ListDevicesResponse } from '../../application/queries/list-devices/list-devices.response';
import { ReadDeviceRepository } from '../repositories/read-device.repository';

@Injectable()
export class ListDevicesHandler implements IListDevicesHandler {
    constructor(private readonly readDeviceRepository: ReadDeviceRepository) {}

    async handle(query: ListDevicesQuery): Promise<ListDevicesResponse[]> {
        const devices = await this.readDeviceRepository.findByOwnerId(
            query.ownerId,
        );

        // note: an owner with no devices is a normal, empty result — not an error.
        return devices.map(
            (device) =>
                new ListDevicesResponse(device.id, device.name, device.ownerId),
        );
    }
}
