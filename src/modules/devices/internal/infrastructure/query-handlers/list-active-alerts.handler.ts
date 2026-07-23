// cypod-telemetry
// src/modules/devices/internal/infrastructure/query-handlers/list-active-alerts.handler.ts
import { Injectable } from '@nestjs/common';
import { IListActiveAlertsHandler } from '../../application/queries/list-active-alerts/list-active-alerts.handler.interface';
import { ListActiveAlertsQuery } from '../../application/queries/list-active-alerts/list-active-alerts.query';
import { ActiveAlertResponse } from '../../application/queries/list-active-alerts/list-active-alerts.response';
import { ReadAlertRepository } from '../repositories/read-alert.repository';
import { ReadDeviceRepository } from '../repositories/read-device.repository';

@Injectable()
export class ListActiveAlertsHandler implements IListActiveAlertsHandler {
    constructor(
        private readonly readDeviceRepository: ReadDeviceRepository,
        private readonly readAlertRepository: ReadAlertRepository,
    ) {}

    // note: two queries, not a join. Alerts hold the device id by value with no foreign key, so the
    // owner's devices are fetched first and the alerts are then scoped to exactly those ids —
    // ownership is enforced by construction rather than filtered afterwards. The result is bounded
    // by the alert lifecycle: a device can hold at most one open alert per threshold, so this is at
    // most two rows per device and cannot grow with history. That bound is why the endpoint is not
    // paginated; an owner with a fleet large enough to break it is the signal to add paging here.
    async handle(query: ListActiveAlertsQuery): Promise<ActiveAlertResponse[]> {
        const devices = await this.readDeviceRepository.findByOwnerId(
            query.ownerId,
        );

        if (devices.length === 0) {
            return [];
        }

        const deviceNames = new Map(
            devices.map((device) => [device.id, device.name]),
        );

        const alerts = await this.readAlertRepository.findActiveByDeviceIds([
            ...deviceNames.keys(),
        ]);

        return alerts.map(
            (alert) =>
                new ActiveAlertResponse(
                    alert.id,
                    alert.deviceId,
                    // note: the fallback can only fire if a device were deleted between the two
                    // queries. It exists so a race degrades to a missing name rather than to a
                    // crash on an alert the caller legitimately owns.
                    deviceNames.get(alert.deviceId) ?? '',
                    alert.type,
                    alert.message,
                    alert.value,
                    alert.threshold,
                    alert.triggeredAt,
                ),
        );
    }
}
