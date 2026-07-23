// cypod-telemetry
// src/modules/auth/internal/infrastructure/database/auth.prisma.client.interface.ts
// note: relative import into the gitignored generated client (regenerated on install) — keeps
// this module's Prisma client fully isolated and off the npm dependency graph.
import { PrismaClient } from './prisma/generated/client';

export interface IAuthPrismaClient extends PrismaClient {}

export const IAuthPrismaClient = Symbol('IAuthPrismaClient');
