// cypod-telemetry
import { Device } from '../entities/device.aggregate';
import { DeviceId } from '../value-objects/device-id.vo';

// note: no generateId() here (unlike IUserRepository) — the device id is client-supplied (the
// physical device's own identity), so the handler never asks the repo to mint one. getById exists
// only to enforce the "already registered" invariant before save.
export interface IDeviceRepository {
    getById(id: DeviceId): Promise<Device | null>;
    save(device: Device): Promise<void>;
}

export const IDeviceRepository = Symbol('IDeviceRepository');
