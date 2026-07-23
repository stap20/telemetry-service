// cypod-telemetry
export abstract class DomainError extends Error {
    // note: user-facing wording (and its language) is a presentation concern — the domain only
    // names the error via translationKey and carries the data (params) the sentence needs. The
    // global filter renders that into a localized message per Accept-Language. `message` stays as
    // the English default, used for logs and as the last-resort fallback if a key is untranslated.
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
