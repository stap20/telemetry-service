// cypod-telemetry
import { ValueObject } from 'src/shared/domain/value-objects/value-object';

export enum UserStatusType {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export class UserStatus extends ValueObject<UserStatusType> {
  private constructor(value: UserStatusType) {
    super(value);
  }

  public static create(status: UserStatusType): UserStatus {
    return new UserStatus(status);
  }

  public static active(): UserStatus {
    return new UserStatus(UserStatusType.ACTIVE);
  }

  public static inactive(): UserStatus {
    return new UserStatus(UserStatusType.INACTIVE);
  }

  public isActive(): boolean {
    return this._value === UserStatusType.ACTIVE;
  }

  public isInactive(): boolean {
    return this._value === UserStatusType.INACTIVE;
  }

  public static fromString(status: string): UserStatus {
    return new UserStatus(status as UserStatusType);
  }
} 