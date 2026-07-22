// cypod-telemetry
import { ILogger } from '../../domain/contracts/logger.interface';
import { NestLogger } from '../logger/nest-logger';

export abstract class FacadeBase {
    protected readonly logger: ILogger;

    constructor() {
        this.logger = new NestLogger();
    }
}
