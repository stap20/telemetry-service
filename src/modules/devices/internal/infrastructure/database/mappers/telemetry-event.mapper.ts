// cypod-telemetry
// src/modules/devices/internal/infrastructure/database/mappers/telemetry-event.mapper.ts
import { Injectable } from '@nestjs/common';
import { TelemetryReading } from '../../../domain/entities/telemetry-reading.aggregate';
import { TelemetryEventEntity } from '../entities/telemetry-event.entity';

@Injectable()
export class TelemetryEventMapper {
    toDomain(entity: TelemetryEventEntity): TelemetryReading {
        return TelemetryReading.fromPersistence({
            id: entity.id,
            deviceId: entity.deviceId,
            battery: entity.battery,
            temperature: entity.temperature,
            lat: entity.lat,
            lng: entity.lng,
            status: entity.status,
            recordedAt: entity.recordedAt,
        });
    }

    toPersistence(
        reading: TelemetryReading,
    ): Omit<TelemetryEventEntity, 'createdAt'> {
        return {
            id: reading.getId().value,
            deviceId: reading.getDeviceId().value,
            battery: reading.getBattery().value,
            temperature: reading.getTemperature().value,
            lat: reading.getLocation()?.latitude ?? null,
            lng: reading.getLocation()?.longitude ?? null,
            status: reading.getStatus().value,
            recordedAt: reading.getRecordedAt().value,
        };
    }
}
