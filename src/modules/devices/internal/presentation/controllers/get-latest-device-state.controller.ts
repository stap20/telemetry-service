// cypod-telemetry
// src/modules/devices/internal/presentation/controllers/get-latest-device-state.controller.ts
import {
    Controller,
    Get,
    Param,
    Res,
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
    ApiHeader,
} from '@nestjs/swagger';
import type { Response } from 'express';

import { JwtAuthGuard } from 'src/modules/security/internal/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from 'src/modules/security/shared/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/modules/security/shared/contracts/authenticated-user.interface';

import { IGetLatestDeviceStateHandler } from '../../application/queries/get-latest-device-state/get-latest-device-state.handler.interface';
import { GetLatestDeviceStateQuery } from '../../application/queries/get-latest-device-state/get-latest-device-state.query';
import { LatestDeviceStateResponseDto } from '../dtos/responses/latest-device-state.response.dto';

@ApiTags('Devices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('devices')
export class GetLatestDeviceStateController {
    private static readonly CACHE_HEADER = 'X-Cache-Status';

    constructor(
        @Inject(IGetLatestDeviceStateHandler)
        private readonly getLatestDeviceStateHandler: IGetLatestDeviceStateHandler,
    ) {}

    @Version('1')
    @Get(':id/latest')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Get a device's most recent reported state" })
    @ApiHeader({
        name: 'X-Cache-Status',
        description: 'Whether the response came from the cache (HIT) or the database (MISS)',
    })
    @ApiResponse({ status: 200, description: 'The latest known state', type: LatestDeviceStateResponseDto })
    @ApiResponse({ status: 404, description: 'Device not found, or it has never reported' })
    async latest(
        @Param('id') deviceId: string,
        @CurrentUser() user: AuthenticatedUser,
        // note: passthrough keeps Nest in charge of serialising the return value — the response
        // object is borrowed only to set a header, not to take over writing the body. Dropping
        // passthrough would silently make this endpoint hang, since nothing would ever call send().
        @Res({ passthrough: true }) response: Response,
    ): Promise<LatestDeviceStateResponseDto> {
        const state = await this.getLatestDeviceStateHandler.handle(
            new GetLatestDeviceStateQuery(deviceId, user.userId),
        );

        // note: the cache path is surfaced as a header rather than a body field. It describes how
        // this particular response was produced, not the device — a client caching or comparing
        // two responses should see identical bodies whether we hit or missed. It also means the
        // fact is observable from plain curl, not only from the service logs.
        response.setHeader(
            GetLatestDeviceStateController.CACHE_HEADER,
            state.cacheOutcome,
        );

        return new LatestDeviceStateResponseDto(
            state.deviceId,
            state.battery,
            state.temperature,
            state.lat,
            state.lng,
            state.status,
            state.recordedAt,
        );
    }
}
