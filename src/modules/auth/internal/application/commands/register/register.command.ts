// cypod-telemetry
// src/modules/auth/internal/application/commands/register/register.command.ts
import { ICommand } from 'src/shared/application/command.interface';

export class RegisterCommand implements ICommand {
    constructor(
        public readonly email: string,
        public readonly password: string,
        public readonly firstName: string,
        public readonly lastName: string,
    ) {}
}
