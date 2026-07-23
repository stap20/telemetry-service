// cypod-telemetry
// src/modules/devices/internal/application/commands/register-device/register-device.command.ts
import { ICommand } from 'src/shared/application/command.interface';

export class RegisterDeviceCommand implements ICommand {
    // note: ownerId is NOT part of the HTTP body — the controller fills it from the verified JWT
    // (@CurrentUser). Keeping it a command field (not a request field) is what makes ownership a
    // server-decided fact instead of a client claim.
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly ownerId: string,
    ) {}
}
