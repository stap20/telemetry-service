// cypod-telemetry
// src/shared/infrastructure/id/id.module.ts
import { Global, Module } from '@nestjs/common';
import { IIdGenerator } from '../../domain/contracts/id-generator.interface';
import { UuidGenerator } from './uuid-generator';

// note: global so every module's repository can inject IIdGenerator without re-providing it. ID
// generation is one cross-cutting infrastructure concern — the strategy (uuid here) lives once in
// UuidGenerator; swapping to cuid/db-sequence is a single-file change nobody else sees.
@Global()
@Module({
    providers: [{ provide: IIdGenerator, useClass: UuidGenerator }],
    exports: [IIdGenerator],
})
export class IdModule {}
