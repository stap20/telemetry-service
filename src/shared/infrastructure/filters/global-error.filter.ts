// cypod-telemetry
// src/shared/infrastructure/filters/global-error.filter.ts
import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpStatus,
    HttpException,
} from '@nestjs/common';
import { DomainError } from '../../domain/errors/domain.error';
import { NotFoundDomainError } from '../../domain/errors/not-found.domain.error';
import { ApplicationError } from '../../application/errors/application.error';
import { InfrastructureError } from '../errors/infrastructure.error';
import { BadRequestError } from '../../application/errors/bad-request.error';
import { ConflictError } from '../../application/errors/conflict.error';
import { UnauthorizedError } from '../../application/errors/unauthorized.error';
import { NotFoundError } from '../../application/errors/notfound.error';
import { ILogger } from '../../domain/contracts/logger.interface';

@Catch()
export class GlobalErrorFilter implements ExceptionFilter {
    constructor(private readonly logger: ILogger) {}

    catch(error: Error, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        this.logger.error('Request failed', error, {
            path: request.url,
            method: request.method,
            userId: request.user?.userId,
        });

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let errorCode = 'INTERNAL_ERROR';
        let customData: any = {};

        if (error instanceof NotFoundDomainError) {
            status = HttpStatus.NOT_FOUND;
        } else if (error instanceof DomainError) {
            status = HttpStatus.CONFLICT;
        } else if (error instanceof ConflictError) {
            status = HttpStatus.CONFLICT;
        } else if (error instanceof BadRequestError) {
            status = HttpStatus.BAD_REQUEST;
        } else if (error instanceof UnauthorizedError) {
            status = HttpStatus.UNAUTHORIZED;
        } else if (error instanceof NotFoundError) {
            status = HttpStatus.NOT_FOUND;
        } else if (error instanceof ApplicationError) {
            status = HttpStatus.BAD_REQUEST;
        } else if (error instanceof InfrastructureError) {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
        } else if (error instanceof HttpException) {
            status = error.getStatus();
            const response = error.getResponse();
            if (typeof response === 'object') {
                customData = { ...response };
                delete customData.statusCode;
                delete customData.message;
            }
        }

        message = error.message;
        errorCode = status.toString();

        response.status(status).json({
            statusCode: status,
            message,
            errorCode,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            ...customData,
        });
    }
}
