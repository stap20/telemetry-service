// cypod-telemetry
import * as bcrypt from 'bcrypt';
import { ValueObject } from 'src/shared/domain/value-objects/value-object';
import { InvalidPasswordError, UnhashedPasswordError } from '../errors/password.error';

export class Password extends ValueObject<string> {
  private readonly hashed: boolean;

  private constructor(value: string, hashed: boolean) {
    super(value);
    this.hashed = hashed;
  }

  public static async create(plainPassword: string): Promise<Password> {
    if (!this.isValidPassword(plainPassword)) {
      throw new InvalidPasswordError();
    }
    const hashedPassword = await this.hashPassword(plainPassword);
    return new Password(hashedPassword, true);
  }

  public static async fromHashed(hashedPassword: string): Promise<Password> {
    return new Password(hashedPassword, true);
  }

  public static fromPlain(plain: string): Password {
    if (!this.isValidPassword(plain)) {
      throw new InvalidPasswordError();
    }
    return new Password(plain, false);
  }

  private static isValidPassword(password: string): boolean {
    return password.length >= 5;
  }

  private static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return await bcrypt.hash(password, salt);
  }

  public async match(plainPassword: string): Promise<boolean> {
    if (!this.hashed) {
      throw new UnhashedPasswordError();
    }

    const isMatch = await bcrypt.compare(plainPassword, this._value);

    return isMatch;
  }


  public isHashed(): boolean {
    return this.hashed;
  }
} 