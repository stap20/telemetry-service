// cypod-telemetry
// src/modules/devices/internal/application/queries/get-latest-device-state/get-latest-device-state.query.ts
import { IQuery } from 'src/shared/application/query.interface';

// note: ownerId travels with the lookup key rather than being applied afterwards. The read path
// serves a cache first, and a cache keyed only by deviceId would happily hand another tenant's
// device state to whoever asked — so ownership has to be part of the question, not a filter on
// the answer.
export class GetLatestDeviceStateQuery implements IQuery {
    constructor(
        public readonly deviceId: string,
        public readonly ownerId: string,
    ) {}
}
