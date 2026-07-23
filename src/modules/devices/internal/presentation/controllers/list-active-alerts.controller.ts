// cypod-telemetry
// src/modules/devices/internal/presentation/controllers/list-active-alerts.controller.ts
import {
    Controller,
    Get,
    Version,
    Inject,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';

import { JwtAuthGuard } from 'src/modules/security/internal/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from 'src/modules/security/shared/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/modules/security/shared/contracts/authenticated-user.interface';

import { IListActiveAlertsHandler } from '../../application/queries/list-active-alerts/list-active-alerts.handler.interface';
import { ListActiveAlertsQuery } from '../../application/queries/list-active-alerts/list-active-alerts.query';
import { ActiveAlertResponseDto } from '../dtos/responses/active-alert.response.dto';

// note: routed at /alerts, not /devices/:id/alerts, because the question being asked is "what needs
// my attention right now" across the whole fleet — a per-device path would force a client to fan
// out one request per device to build the only view anyone actually wants. It still lives in the
// devices module: alerts are raised from telemetry and stored in this module's database, so
// exposing them elsewhere would mean a module owning data it does not write.
@ApiTags('Alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('alerts')
export class ListActiveAlertsController {
    constructor(
        @Inject(IListActiveAlertsHandler)
        private readonly listActiveAlertsHandler: IListActiveAlertsHandler,
    ) {}

    @Version('1')
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: "List unresolved alerts across the logged-in user's devices",
    })
    @ApiResponse({
        status: 200,
        description: 'Alerts whose condition is still current, newest first',
        type: ActiveAlertResponseDto,
        isArray: true,
    })
    async list(
        @CurrentUser() user: AuthenticatedUser,
    ): Promise<ActiveAlertResponseDto[]> {
        const alerts = await this.listActiveAlertsHandler.handle(
            new ListActiveAlertsQuery(user.userId),
        );

        return alerts.map(
            (alert) =>
                new ActiveAlertResponseDto(
                    alert.id,
                    alert.deviceId,
                    alert.deviceName,
                    alert.type,
                    alert.message,
                    alert.value,
                    alert.threshold,
                    alert.triggeredAt,
                ),
        );
    }
}
