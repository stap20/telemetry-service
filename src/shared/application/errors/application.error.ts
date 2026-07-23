// cypod-telemetry
export abstract class ApplicationError extends Error {
    // note: same contract as DomainError — carry a stable translationKey + params; the global filter
    // turns them into a localized sentence. `message` is the English default for logs/fallback.
    readonly translationKey?: string;
    readonly translationParams?: Record<string, string | number>;

    constructor(
        message: string,
        translationKey?: string,
        params?: Record<string, string | number>,
    ) {
        super(message);
        this.name = this.constructor.name;
        this.translationKey = translationKey;
        this.translationParams = params;
        Error.captureStackTrace(this, this.constructor);
    }
}
