// cypod-telemetry
// src/modules/devices/internal/infrastructure/database/mappers/alert.mapper.ts
import { Injectable } from '@nestjs/common';
import { Alert } from '../../../domain/entities/alert.aggregate';
import { AlertEntity } from '../entities/alert.entity';

@Injectable()
export class AlertMapper {
    toDomain(entity: AlertEntity): Alert {
        return Alert.fromPersistence({
            id: entity.id,
            deviceId: entity.deviceId,
            type: entity.type,
            message: entity.message,
            value: entity.value,
            threshold: entity.threshold,
            triggeredAt: entity.triggeredAt,
            resolvedAt: entity.resolvedAt,
        });
    }

    toPersistence(alert: Alert): Omit<AlertEntity, 'createdAt'> {
        return {
            id: alert.getId().value,
            deviceId: alert.getDeviceId().value,
            type: alert.getType().value,
            message: alert.getMessage(),
            value: alert.getValue(),
            threshold: alert.getThreshold(),
            triggeredAt: alert.getTriggeredAt(),
            resolvedAt: alert.getResolvedAt(),
        };
    }
}
