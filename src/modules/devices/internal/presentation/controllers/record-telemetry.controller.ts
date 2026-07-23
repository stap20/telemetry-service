// cypod-telemetry
// src/modules/devices/internal/presentation/controllers/record-telemetry.controller.ts
import {
    Controller,
    Post,
    Body,
    Param,
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
    ApiParam,
} from '@nestjs/swagger';

import { JwtAuthGuard } from 'src/modules/security/internal/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from 'src/modules/security/shared/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/modules/security/shared/contracts/authenticated-user.interface';

import { RecordTelemetryHandler } from '../../application/commands/record-telemetry/record-telemetry.handler';
import { RecordTelemetryCommand } from '../../application/commands/record-telemetry/record-telemetry.command';
import { RecordTelemetryRequestDto } from '../dtos/requests/record-telemetry.request.dto';
import { TelemetryRecordedResponseDto } from '../dtos/responses/telemetry-recorded.response.dto';

// note: guarded like the rest of the module. In a production fleet the device itself would present
// its own credential rather than a user's JWT — this task only provides user auth, so ingestion is
// scoped to the owner instead, which is why the handler rejects devices the caller does not own.
@ApiTags('Devices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('devices')
export class RecordTelemetryController {
    constructor(
        @Inject(RecordTelemetryHandler)
        private readonly recordTelemetryHandler: RecordTelemetryHandler,
    ) {}

    @Version('1')
    @Post(':id/telemetry')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Record a telemetry reading for a device' })
    @ApiParam({ name: 'id', description: 'The device id', example: 'sensor-A1B2C3' })
    @ApiResponse({
        status: 201,
        description: 'Reading stored',
        type: TelemetryRecordedResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Invalid telemetry payload' })
    @ApiResponse({ status: 404, description: 'Device not found for this user' })
    @ApiResponse({
        status: 429,
        description:
            'The device has exceeded its allowed number of readings per minute',
    })
    async record(
        @Param('id') deviceId: string,
        @Body() dto: RecordTelemetryRequestDto,
        @CurrentUser() user: AuthenticatedUser,
    ): Promise<TelemetryRecordedResponseDto> {
        const result = await this.recordTelemetryHandler.handle(
            new RecordTelemetryCommand(
                deviceId,
                user.userId,
                dto.battery,
                dto.temperature,
                dto.lat ?? null,
                dto.lng ?? null,
                dto.status ?? null,
                dto.timestamp,
            ),
        );

        return new TelemetryRecordedResponseDto(
            result.id,
            result.deviceId,
            result.recordedAt,
            result.alertsRaised,
            result.duplicate,
        );
    }
}
