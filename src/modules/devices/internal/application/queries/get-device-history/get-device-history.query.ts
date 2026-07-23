// cypod-telemetry
// src/modules/devices/internal/application/queries/get-device-history/get-device-history.query.ts
import { IQuery } from 'src/shared/application/query.interface';

// note: `from` and `to` are optional and independent — asking for "everything since Monday" with
// no upper bound is the normal way to use this, so requiring both would force callers to invent a
// far-future date. Pagination is not optional: the controller always supplies a bounded offset and
// limit, because an event log is the one collection guaranteed to outgrow a single response.
export class GetDeviceHistoryQuery implements IQuery {
    constructor(
        public readonly deviceId: string,
        public readonly ownerId: string,
        public readonly offset: number,
        public readonly limit: number,
        public readonly from?: Date,
        public readonly to?: Date,
    ) {}
}
