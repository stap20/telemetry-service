// cypod-telemetry
// src/modules/devices/internal/application/queries/list-active-alerts/list-active-alerts.query.ts
import { IQuery } from 'src/shared/application/query.interface';

// note: ownerId is the only input, and like GET /devices it comes from the JWT rather than a query
// param — "my alerts" is not something a caller gets to parametrise. There is no `active` flag
// either: the endpoint IS the active view. An "include resolved" switch would quietly turn an
// operational dashboard into an audit log, and those two want different shapes and different
// pagination, so they should be different endpoints when the second one is actually needed.
export class ListActiveAlertsQuery implements IQuery {
    constructor(public readonly ownerId: string) {}
}
