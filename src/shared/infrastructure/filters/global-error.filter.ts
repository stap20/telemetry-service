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
import { ValidationDomainError } from '../../domain/errors/validation.domain.error';
import { ApplicationError } from '../../application/errors/application.error';
import { InfrastructureError } from '../errors/infrastructure.error';
import { BadRequestError } from '../../application/errors/bad-request.error';
import { ConflictError } from '../../application/errors/conflict.error';
import { UnauthorizedError } from '../../application/errors/unauthorized.error';
import { NotFoundError } from '../../application/errors/notfound.error';
import { ILogger } from '../../domain/contracts/logger.interface';
import { LocalizationService } from '../i18n/localization.service';

@Catch()
export class GlobalErrorFilter implements ExceptionFilter {
    constructor(
        private readonly logger: ILogger,
        private readonly localization: LocalizationService,
    ) {}

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

        const locale = this.localization.resolveLocale(
            request.headers['accept-language'],
        );

        // note: Prisma errors are detected by their stable `name`/`code`, NOT by instanceof. Each
        // module owns an isolated generated client, so every module ships its OWN copy of the
        // PrismaClient* error classes — instanceof against any single import silently fails across the
        // boundary. `name` is identical across those copies, so it's the reliable signal. Handling it
        // here (not in separate @Catch filters) keeps one consistent response envelope and one place
        // that decides HTTP shape.
        const prisma = this.mapPrismaError(error);
        if (prisma) {
            status = prisma.status;
            message = prisma.message;
            errorCode = prisma.errorCode;
        } else {
            if (error instanceof NotFoundDomainError) {
                status = HttpStatus.NOT_FOUND;
            } else if (error instanceof ValidationDomainError) {
                // note: must precede the generic DomainError branch — it is a subclass, so the
                // order of these checks is what decides 400 vs 409.
                status = HttpStatus.BAD_REQUEST;
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
                const httpResponse = error.getResponse();
                if (typeof httpResponse === 'object') {
                    customData = { ...httpResponse };
                    delete customData.statusCode;
                    delete customData.message;
                }
            }

            // note: translation happens HERE, at the HTTP boundary — the only place that sees the
            // request's Accept-Language. Domain/application errors only carry a translationKey +
            // params; errors without a key fall back as below.
            const localizable = error as {
                translationKey?: string;
                translationParams?: Record<string, string | number>;
            };
            // note: never echo a raw error.message on a 500 — that is exactly where unexpected
            // internals live (stack-adjacent text, driver details, a bug's message). The real error
            // is already in the log line above; the client gets a safe generic string. Errors we
            // *intend* to surface carry a translationKey and are localized; our own typed 4xx errors
            // keep their controlled English message as the fallback.
            message = localizable.translationKey
                ? this.localization.translate(
                      localizable.translationKey,
                      locale,
                      localizable.translationParams,
                      error.message,
                  )
                : status === HttpStatus.INTERNAL_SERVER_ERROR
                  ? 'Internal server error'
                  : error.message;
            errorCode = status.toString();
        }

        response.status(status).json({
            statusCode: status,
            message,
            errorCode,
            locale,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            ...customData,
        });
    }

    // note: keeps ALL Prisma messages generic and English — never the driver's raw text, which can
    // carry table/column/constraint names (an internal-detail leak). Same "developer/ops safety net,
    // stays unlocalized" boundary as the rest of our infra failures. In a correct flow most of these
    // (P2002 duplicate, P2025 not-found) are caught upstream as our own localized errors; reaching
    // here means an unhandled edge, so a stable ops message is the honest response. errorCode carries
    // the non-sensitive Prisma code for debugging.
    private mapPrismaError(
        error: Error,
    ): { status: number; message: string; errorCode: string } | null {
        if (error?.name === 'PrismaClientUnknownRequestError') {
            return {
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Unexpected database error',
                errorCode: 'UNKNOWN_DATABASE_ERROR',
            };
        }

        if (error?.name !== 'PrismaClientKnownRequestError') {
            return null;
        }

        const code = (error as { code?: string }).code ?? 'UNKNOWN';

        switch (code) {
            case 'P2000':
                return { status: HttpStatus.BAD_REQUEST, message: 'Value too long', errorCode: code };
            case 'P2001':
                return { status: HttpStatus.BAD_REQUEST, message: 'Missing required value', errorCode: code };
            case 'P2002':
                return { status: HttpStatus.CONFLICT, message: 'Resource already exists', errorCode: code };
            case 'P2003':
                return { status: HttpStatus.BAD_REQUEST, message: 'Invalid reference', errorCode: code };
            case 'P2025':
                return { status: HttpStatus.NOT_FOUND, message: 'Resource not found', errorCode: code };
            case 'P1001':
                return { status: HttpStatus.SERVICE_UNAVAILABLE, message: 'Database connection failed', errorCode: code };
            case 'P1002':
                return { status: HttpStatus.SERVICE_UNAVAILABLE, message: 'Database connection timeout', errorCode: code };
            case 'P2016':
                return { status: HttpStatus.BAD_REQUEST, message: 'Database query interpretation failed', errorCode: code };
            default:
                return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Database error', errorCode: code };
        }
    }
}
