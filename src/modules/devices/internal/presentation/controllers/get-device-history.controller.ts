// cypod-telemetry
// src/modules/devices/internal/presentation/controllers/get-device-history.controller.ts
import {
    Controller,
    Get,
    Param,
    Query,
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

import { IGetDeviceHistoryHandler } from '../../application/queries/get-device-history/get-device-history.handler.interface';
import { GetDeviceHistoryQuery } from '../../application/queries/get-device-history/get-device-history.query';
import { DeviceHistoryRequestDto } from '../dtos/requests/device-history.request.dto';
import {
    DeviceHistoryResponseDto,
    TelemetryReadingResponseDto,
} from '../dtos/responses/telemetry-reading.response.dto';

@ApiTags('Devices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('devices')
export class GetDeviceHistoryController {
    // note: the defaults live here, in the layer that owns the HTTP contract, rather than in the
    // query or the repository. A caller who sends no pagination is not asking for "everything" —
    // they are declining to choose, and the API decides on their behalf.
    private static readonly DEFAULT_OFFSET = 0;
    private static readonly DEFAULT_LIMIT = 20;

    constructor(
        @Inject(IGetDeviceHistoryHandler)
        private readonly getDeviceHistoryHandler: IGetDeviceHistoryHandler,
    ) {}

    @Version('1')
    @Get(':id/history')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Page through a device's recorded telemetry" })
    @ApiResponse({ status: 200, description: 'A page of readings', type: DeviceHistoryResponseDto })
    @ApiResponse({ status: 400, description: 'Malformed range or pagination' })
    @ApiResponse({ status: 404, description: 'Device not found' })
    async history(
        @Param('id') deviceId: string,
        @Query() filter: DeviceHistoryRequestDto,
        @CurrentUser() user: AuthenticatedUser,
    ): Promise<DeviceHistoryResponseDto> {
        const page = await this.getDeviceHistoryHandler.handle(
            new GetDeviceHistoryQuery(
                deviceId,
                user.userId,
                filter.offset ?? GetDeviceHistoryController.DEFAULT_OFFSET,
                filter.limit ?? GetDeviceHistoryController.DEFAULT_LIMIT,
                filter.from,
                filter.to,
            ),
        );

        return new DeviceHistoryResponseDto(
            page.items.map(
                (reading) =>
                    new TelemetryReadingResponseDto(
                        reading.id,
                        reading.deviceId,
                        reading.battery,
                        reading.temperature,
                        reading.lat,
                        reading.lng,
                        reading.status,
                        reading.recordedAt,
                    ),
            ),
            page.total,
            page.offset,
            page.limit,
        );
    }
}
