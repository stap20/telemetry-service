// cypod-telemetry
// src/modules/devices/internal/presentation/dtos/requests/device-history.request.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, Max, Min } from 'class-validator';

export class DeviceHistoryRequestDto {
    @ApiPropertyOptional({
        description: 'Only include readings recorded at or after this instant',
        example: '2026-07-01T00:00:00.000Z',
    })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    from?: Date;

    @ApiPropertyOptional({
        description: 'Only include readings recorded at or before this instant',
        example: '2026-07-23T00:00:00.000Z',
    })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    to?: Date;

    // note: query strings are always text, so @Type coerces before the numeric rules run —
    // without it every value arrives as a string and @IsInt rejects even a valid `?offset=0`.
    @ApiPropertyOptional({ description: 'Readings to skip', example: 0, default: 0 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    offset?: number;

    // note: the cap is the point of this field, not the default. An uncapped limit turns one
    // request into a full dump of a device's event log — the largest table in the system — so the
    // ceiling is enforced here rather than trusted to well-behaved clients.
    @ApiPropertyOptional({
        description: 'Readings to return, capped at 100',
        example: 20,
        default: 20,
        maximum: 100,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;
}
