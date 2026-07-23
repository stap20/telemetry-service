// cypod-telemetry
import {
    Catch,
    ArgumentsHost,
    HttpStatus,
    ExceptionFilter,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ILogger } from '../../domain/contracts/logger.interface';

@Catch(Prisma.PrismaClientUnknownRequestError)
export class PrismaUnknownExceptionFilter implements ExceptionFilter {
    constructor(private readonly logger: ILogger) {}

    catch(exception: Prisma.PrismaClientUnknownRequestError, host: ArgumentsHost) {
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
