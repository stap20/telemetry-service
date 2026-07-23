// cypod-telemetry
import { ICommand } from "src/shared/application/command.interface";

export class AuthenticateCommand implements ICommand {
    constructor(public readonly email: string, public readonly password: string) { }
}