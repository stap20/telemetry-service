// cypod-telemetry
import { Injectable, Logger } from '@nestjs/common';
import { ILogger } from '../../domain/contracts/logger.interface';

@Injectable()
export class NestLogger implements ILogger {
    private logger = new Logger();

    info(message: string, context?: any): void {
        this.logger.log(message, context || 'Info');
    }

    error(message: string, error?: Error, context?: any): void {
        this.logger.error(message, error?.stack, context || 'Error');
    }

    warn(message: string, context?: any): void {
        this.logger.warn(message, context || 'Warn');
    }

    debug(message: string, context?: any): void {
        this.logger.debug(message, context || 'Debug');
    }
}
