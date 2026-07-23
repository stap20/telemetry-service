// cypod-telemetry
// src/modules/devices/internal/application/queries/get-device-history/get-device-history.handler.interface.ts
import { IQueryHandler } from 'src/shared/application/query.handler.interface';
import { PaginatedResult } from 'src/shared/application/paginated-result';
import { GetDeviceHistoryQuery } from './get-device-history.query';
import { TelemetryReadingResponse } from './get-device-history.response';

export interface IGetDeviceHistoryHandler
    extends IQueryHandler<
        GetDeviceHistoryQuery,
        PaginatedResult<TelemetryReadingResponse>
    > {}

export const IGetDeviceHistoryHandler = Symbol('IGetDeviceHistoryHandler');
