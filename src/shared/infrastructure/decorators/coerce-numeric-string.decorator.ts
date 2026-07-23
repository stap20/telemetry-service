// cypod-telemetry
// src/shared/infrastructure/decorators/coerce-numeric-string.decorator.ts
import { Transform } from 'class-transformer';

// note: repairs the single unambiguous JSON typing slip — a number sent as `"88"` instead of `88`.
// Deliberately NOT `@Type(() => Number)`, which coerces via Number() and would turn `null` into 0,
// `true` into 1 and `""` into 0. On a battery field those all become "0%", which is not a parse
// failure but a silent low-battery alert about a device that is fine. This transform only touches
// strings that are entirely numeric and leaves every other shape exactly as it arrived, so the
// class-validator rule below it still gets to reject the things that really are malformed.
export function CoerceNumericString(): PropertyDecorator {
    return Transform(({ value }: { value: unknown }) => {
        if (typeof value !== 'string' || value.trim() === '') {
            return value;
        }

        const parsed = Number(value);

        return Number.isFinite(parsed) ? parsed : value;
    });
}
