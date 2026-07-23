// cypod-telemetry
import { Injectable, Logger } from '@nestjs/common';
import { ILogger } from '../../domain/contracts/logger.interface';

// note: Nest's own Logger takes a SCOPE NAME as its second argument — the "[MyService]" tag — not
// structured data. Passing our context object there meant every `{ deviceId, cache: 'HIT' }` in the
// codebase was quietly swallowed: the message appeared, the facts did not. Serialising the context
// into the message keeps the ILogger contract intact and actually gets it printed.
@Injectable()
export class NestLogger implements ILogger {
    private logger = new Logger();

    info(message: string, context?: any): void {
        this.logger.log(NestLogger.compose(message, context));
    }

    error(message: string, error?: Error, context?: any): void {
        this.logger.error(NestLogger.compose(message, context), error?.stack);
    }

    warn(message: string, context?: any): void {
        this.logger.warn(NestLogger.compose(message, context));
    }

    debug(message: string, context?: any): void {
        this.logger.debug(NestLogger.compose(message, context));
    }

    // note: serialisation is guarded because a caller passing something circular must not turn a
    // log line into a thrown exception — logging is the thing you reach for when everything else is
    // already going wrong, so it is the last place that should be able to fail.
    private static compose(message: string, context?: any): string {
        if (context === undefined || context === null) {
            return message;
        }

        if (typeof context === 'string') {
            return `${message} ${context}`;
        }

        try {
            return `${message} ${JSON.stringify(context)}`;
        } catch {
            return `${message} [unserialisable context]`;
        }
    }
}
