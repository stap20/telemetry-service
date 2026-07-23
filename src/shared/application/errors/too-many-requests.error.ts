// cypod-telemetry
// src/shared/application/errors/too-many-requests.error.ts
import { ApplicationError } from './application.error';

// note: its own class rather than a BadRequestError with a different message, because 429 says
// something 400 cannot — "this request was well formed and you may send it again later". A client
// that reads 400 has no reason to ever retry; a client that reads 429 knows to back off, which is
// the entire behaviour a rate limit is trying to produce.
export class TooManyRequestsError extends ApplicationError {
    constructor(
        message: string,
        translationKey?: string,
        params?: Record<string, string | number>,
    ) {
        super(message, translationKey, params);
    }
}
