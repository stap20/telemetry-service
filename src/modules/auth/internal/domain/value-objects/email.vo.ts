// cypod-telemetry
import { InvalidEmailError } from '../errors/email.error';
import { ValueObject } from 'src/shared/domain/value-objects/value-object';

export class Email extends ValueObject<string> {
    private constructor(value: string) {
        super(value);
    }

    public static create(email: string): Email {
        if (!this.isValidEmail(email)) {
            throw new InvalidEmailError(email);
        }
        return new Email(email);
    }

    private static isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}