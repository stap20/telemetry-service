// cypod-telemetry
import { ICommand } from './command.interface';
import { NestLogger } from '../infrastructure/logger/nest-logger';
import { ILogger } from '../domain/contracts/logger.interface';

export abstract class CommandHandlerBase<TCommand extends ICommand, TResponse> {
    protected readonly logger: ILogger;

    constructor() {
        this.logger = new NestLogger();
    }

    abstract handle(command: TCommand): Promise<TResponse>;
}
