// cypod-telemetry
// src/modules/devices/internal/application/queries/list-devices/list-devices.query.ts
import { IQuery } from 'src/shared/application/query.interface';

export class ListDevicesQuery implements IQuery {
    // note: ownerId is the ONLY filter and it comes from the JWT, not from a query param — the
    // endpoint lists "devices belonging to the logged-in user", so ownership is never client-chosen.
    // Pagination is intentionally omitted (not in scope); the read repo is the seam to add it later.
    constructor(public readonly ownerId: string) {}
}
