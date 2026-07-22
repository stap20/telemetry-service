// cypod-telemetry
import { ILogger } from '../domain/contracts/logger.interface';
import { NestLogger } from '../infrastructure/logger/nest-logger';

export abstract class ServiceBase {
    protected readonly logger: ILogger;

    constructor() {
        this.logger = new NestLogger();
    }

    abstract execute(): Promise<void>;
}
