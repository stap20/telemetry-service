// cypod-telemetry
// src/modules/devices/internal/presentation/controllers/register-device.controller.ts
import {
    Controller,
    Post,
    Body,
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

import { RegisterDeviceHandler } from '../../application/commands/register-device/register-device.handler';
import { RegisterDeviceCommand } from '../../application/commands/register-device/register-device.command';
import { RegisterDeviceRequestDto } from '../dtos/requests/register-device.request.dto';
import { DeviceResponseDto } from '../dtos/responses/device.response.dto';

// note: one use-case per controller (register device). The whole controller is behind JwtAuthGuard —
// registering a device requires an authenticated user, and that user IS the owner.
@ApiTags('Devices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('devices')
export class RegisterDeviceController {
    constructor(
        @Inject(RegisterDeviceHandler)
        private readonly registerDeviceHandler: RegisterDeviceHandler,
    ) {}

    @Version('1')
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Register a device owned by the logged-in user' })
    @ApiResponse({ status: 201, description: 'Device registered', type: DeviceResponseDto })
    @ApiResponse({ status: 409, description: 'A device with this id is already registered' })
    async register(
        @Body() dto: RegisterDeviceRequestDto,
        @CurrentUser() user: AuthenticatedUser,
    ): Promise<DeviceResponseDto> {
        // note: owner = the authenticated user's id from the JWT, not anything in the body.
        const result = await this.registerDeviceHandler.handle(
            new RegisterDeviceCommand(dto.id, dto.name, user.userId),
        );

        return new DeviceResponseDto(result.id, result.name, result.ownerId);
    }
}
