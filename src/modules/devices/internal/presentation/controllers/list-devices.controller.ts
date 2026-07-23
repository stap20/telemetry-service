// cypod-telemetry
// src/modules/devices/internal/presentation/controllers/list-devices.controller.ts
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

import { IListDevicesHandler } from '../../application/queries/list-devices/list-devices.handler.interface';
import { ListDevicesQuery } from '../../application/queries/list-devices/list-devices.query';
import { DeviceResponseDto } from '../dtos/responses/device.response.dto';

// note: one use-case per controller (list devices). Behind JwtAuthGuard; the result is always scoped
// to the caller — a user can only ever see their OWN devices.
@ApiTags('Devices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('devices')
export class ListDevicesController {
    constructor(
        @Inject(IListDevicesHandler)
        private readonly listDevicesHandler: IListDevicesHandler,
    ) {}

    @Version('1')
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "List the logged-in user's devices" })
    @ApiResponse({ status: 200, description: 'Devices owned by the user', type: DeviceResponseDto, isArray: true })
    async list(
        @CurrentUser() user: AuthenticatedUser,
    ): Promise<DeviceResponseDto[]> {
        // note: the owner filter is the authenticated user's id — never a client-supplied query param.
        const devices = await this.listDevicesHandler.handle(
            new ListDevicesQuery(user.userId),
        );

        return devices.map(
            (device) =>
                new DeviceResponseDto(device.id, device.name, device.ownerId),
        );
    }
}
