// cypod-telemetry
export abstract class InfrastructureError extends Error {
    // note: same translation contract as DomainError/ApplicationError so the whole error hierarchy
    // behaves uniformly. Infra errors usually map to a generic 500 (we don't localize internal
    // failures), but the fields exist so any infra error that IS user-facing can carry a key.
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
