// cypod-telemetry
// src/modules/devices/internal/infrastructure/database/devices.prisma.client.interface.ts
// note: relative import into the gitignored generated client (regenerated on install) — keeps
// this module's Prisma client fully isolated and off the npm dependency graph.
import { PrismaClient } from './prisma/generated/client';

export interface IDevicesPrismaClient extends PrismaClient {}

export const IDevicesPrismaClient = Symbol('IDevicesPrismaClient');
