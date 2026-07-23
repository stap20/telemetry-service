// cypod-telemetry
// src/modules/devices/internal/application/queries/get-latest-device-state/get-latest-device-state.handler.interface.ts
import { IQueryHandler } from 'src/shared/application/query.handler.interface';
import { GetLatestDeviceStateQuery } from './get-latest-device-state.query';
import { GetLatestDeviceStateResponse } from './get-latest-device-state.response';

export interface IGetLatestDeviceStateHandler
    extends IQueryHandler<
        GetLatestDeviceStateQuery,
        GetLatestDeviceStateResponse
    > {}

export const IGetLatestDeviceStateHandler = Symbol(
    'IGetLatestDeviceStateHandler',
);
