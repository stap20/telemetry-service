// cypod-telemetry
import {
    Catch,
    ArgumentsHost,
    HttpStatus,
    ExceptionFilter,
} from '@nestjs/common';
import { PrismaClientUnknownRequestError } from '@prisma/client-runtime-utils';
import { ILogger } from '../../domain/contracts/logger.interface';

@Catch(PrismaClientUnknownRequestError)
export class PrismaUnknownExceptionFilter implements ExceptionFilter {
    constructor(private readonly logger: ILogger) {}

    catch(exception: PrismaClientUnknownRequestError, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        this.logger.error('Unknown Prisma error:', exception, {
            path: request.url,
            method: request.method,
            userId: request.user?.id,
        });

        return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Unexpected database error',
            errorCode: 'UNKNOWN_DATABASE_ERROR',
            timestamp: new Date().toISOString(),
        });
    }
}
