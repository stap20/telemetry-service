// cypod-telemetry
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { IIdGenerator } from '../../domain/contracts/id-generator.interface';

@Injectable()
export class UuidGenerator implements IIdGenerator {
    generate(): string {
        return randomUUID();
    }
}
