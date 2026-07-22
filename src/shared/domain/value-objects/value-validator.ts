// cypod-telemetry
export class ValueValidator {

    static PHONE_NUMBER_PATTERN_LIST = [/^(?:\+?20|0)?1[0125]\d{8}$/];
    static URL_WITH_EXTENSION_PATTERN = /^https?:\/\/[^\s]+\.[a-zA-Z0-9]+$/;

    static isEmpty(value: string): boolean {
        return !value || value.trim().length === 0;
    }

    static isWithinRange(
        value: string,
        minLength: number,
        maxLength: number,
    ): boolean {
        return value.length >= minLength && value.length <= maxLength;
    }

    static isValidFormat(value: string, pattern: RegExp): boolean {
        return pattern.test(value);
    }

    static isValidUUID(value: string): boolean {
        const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(value);
    }

    static isPositiveNumber(value: number): boolean {
        return value >= 0;
    }

    static isNumberInRange(value: number, min: number, max: number): boolean {
        return value >= min && value <= max;
    }

    static isValidEmail(value: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    }

    static isValidCurrency(value: string): boolean {
        const validCurrencies = ['USD', 'EGP', 'EUR', 'GBP'];
        return validCurrencies.includes(value.toUpperCase());
    }

    static isValidCountryCode(value: string): boolean {
        const countryCodeRegex = /^[A-Z]{2}$/;
        return countryCodeRegex.test(value.toUpperCase());
    }

    static isValidPattern(value: string, pattern: RegExp): boolean {
        return pattern.test(value);
    }

    static isValidPhoneNumber(value: string): boolean {
        return this.PHONE_NUMBER_PATTERN_LIST.some((pattern) =>
            this.isValidPattern(value, pattern),
        );
    }

    static isDateInThePast(value: Date): boolean {
        return value < new Date();
    }

    static isDateInTheFuture(value: Date): boolean {
        return value > new Date();
    }

    static isDateWithinRange(value: Date, min: Date, max: Date): boolean {
        return value >= min && value <= max;
    }
    static isValidUrlWithExtension(value: string): boolean {
        return this.URL_WITH_EXTENSION_PATTERN.test(value);
    }
}
