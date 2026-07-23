// cypod-telemetry
// src/modules/devices/internal/application/queries/list-active-alerts/list-active-alerts.handler.interface.ts
import { IQueryHandler } from 'src/shared/application/query.handler.interface';
import { ListActiveAlertsQuery } from './list-active-alerts.query';
import { ActiveAlertResponse } from './list-active-alerts.response';

export interface IListActiveAlertsHandler
    extends IQueryHandler<ListActiveAlertsQuery, ActiveAlertResponse[]> {}

export const IListActiveAlertsHandler = Symbol('IListActiveAlertsHandler');
