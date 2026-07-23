// cypod-telemetry
// src/modules/devices/internal/infrastructure/query-handlers/get-device-history.handler.ts
import { Injectable } from '@nestjs/common';
import { PaginatedResult } from 'src/shared/application/paginated-result';
import { IGetDeviceHistoryHandler } from '../../application/queries/get-device-history/get-device-history.handler.interface';
import { GetDeviceHistoryQuery } from '../../application/queries/get-device-history/get-device-history.query';
import { TelemetryReadingResponse } from '../../application/queries/get-device-history/get-device-history.response';
import { DeviceNotFoundError } from '../../application/errors/device-not-found.error';
import { InvalidHistoryRangeError } from '../../application/errors/invalid-history-range.error';
import { ReadDeviceRepository } from '../repositories/read-device.repository';
import { ReadTelemetryRepository } from '../repositories/read-telemetry.repository';

@Injectable()
export class GetDeviceHistoryHandler implements IGetDeviceHistoryHandler {
    constructor(
        private readonly readDeviceRepository: ReadDeviceRepository,
        private readonly readTelemetryRepository: ReadTelemetryRepository,
    ) {}

    async handle(
        query: GetDeviceHistoryQuery,
    ): Promise<PaginatedResult<TelemetryReadingResponse>> {
        // note: the range is checked before the ownership lookup because it is a fault in the
        // request itself — it is wrong regardless of who is asking or whether the device exists,
        // so there is no reason to touch the database to find that out.
        if (query.from && query.to && query.from > query.to) {
            throw new InvalidHistoryRangeError();
        }

        // note: same 404-for-everything rule as the rest of the module. Telemetry rows carry no
        // ownerId of their own — ownership lives on the device — so this lookup is not a courtesy
        // check, it is the only thing standing between a guessed id and another tenant's history.
        const device = await this.readDeviceRepository.findOwnedById(
            query.deviceId,
            query.ownerId,
        );

        if (!device) {
            throw new DeviceNotFoundError(query.deviceId);
        }

        const page = await this.readTelemetryRepository.searchHistory({
            deviceId: query.deviceId,
            offset: query.offset,
            limit: query.limit,
            from: query.from,
            to: query.to,
        });

        // note: a device with no readings in the window is an ordinary empty page, not a 404 —
        // "nothing happened here" is a legitimate answer to a question about a time range.
        return new PaginatedResult(
            page.rows.map(
                (row) =>
                    new TelemetryReadingResponse(
                        row.id,
                        row.deviceId,
                        row.battery,
                        row.temperature,
                        row.lat,
                        row.lng,
                        row.status,
                        row.recordedAt,
                    ),
            ),
            page.total,
            query.offset,
            query.limit,
        );
    }
}
