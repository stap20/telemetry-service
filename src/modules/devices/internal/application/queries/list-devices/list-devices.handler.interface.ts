// cypod-telemetry
// src/modules/devices/internal/application/queries/list-devices/list-devices.handler.interface.ts
import { IQueryHandler } from 'src/shared/application/query.handler.interface';
import { ListDevicesQuery } from './list-devices.query';
import { ListDevicesResponse } from './list-devices.response';

export interface IListDevicesHandler
    extends IQueryHandler<ListDevicesQuery, ListDevicesResponse[]> {}

export const IListDevicesHandler = Symbol('IListDevicesHandler');
