// cypod-telemetry
import { Alert } from '../entities/alert.aggregate';

export interface IAlertRepository {
    generateId(): string;
    save(alert: Alert): Promise<void>;
}

export const IAlertRepository = Symbol('IAlertRepository');
