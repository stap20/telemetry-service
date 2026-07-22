// cypod-telemetry
import {
    Catch,
    ArgumentsHost,
    HttpStatus,
    ExceptionFilter,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client-runtime-utils';
import { ILogger } from '../../domain/contracts/logger.interface';

@Catch(PrismaClientKnownRequestError)
export class PrismaKnownExceptionFilter implements ExceptionFilter {
    constructor(private readonly logger: ILogger) {}

    catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        this.logger.error('Known Prisma error:', exception, {
            path: request.url,
            method: request.method,
            userId: request.user?.id,
        });

        switch (exception.code) {
            case 'P2000': // Value too long
                return response.status(HttpStatus.BAD_REQUEST).json({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: 'Value too long',
                    errorCode: exception.code,
                });

            case 'P2001': // Missing required value
                return response.status(HttpStatus.BAD_REQUEST).json({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: 'Missing required value',
                    errorCode: exception.code,
                });

            case 'P2002': // Unique constraint violation
                return response.status(HttpStatus.CONFLICT).json({
                    statusCode: HttpStatus.CONFLICT,
                    message: 'Resource already exists',
                    errorCode: exception.code,
                });

            case 'P2003': // Foreign key constraint violation
                return response.status(HttpStatus.BAD_REQUEST).json({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: 'Invalid reference',
                    errorCode: exception.code,
                });

            case 'P2025': // Record not found
                return response.status(HttpStatus.NOT_FOUND).json({
                    statusCode: HttpStatus.NOT_FOUND,
                    message: 'Resource not found',
                    errorCode: exception.code,
                });

            case 'P1001': // Connection error
                return response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
                    statusCode: HttpStatus.SERVICE_UNAVAILABLE,
                    message: 'Database connection failed',
                    errorCode: exception.code,
                });

            case 'P1002': // Connection timeout
                return response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
                    statusCode: HttpStatus.SERVICE_UNAVAILABLE,
                    message: 'Database connection timeout',
                    errorCode: exception.code,
                });

            case 'P1003': // Database error
                return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: 'Database error',
                    errorCode: exception.code,
                });

            case 'P2016': // Query interpretation error
                return response.status(HttpStatus.BAD_REQUEST).json({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: 'Database query interpretation failed',
                    errorCode: exception.code,
                });

            case 'P2017': // Raw query failed
                return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: 'Database raw query failed',
                    errorCode: exception.code,
                });

            case 'P2024': // Transaction API error
                return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: 'Database transaction failed',
                    errorCode: exception.code,
                });

            default:
                return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: 'Database error',
                    errorCode: exception.code,
                });
        }
    }
}
