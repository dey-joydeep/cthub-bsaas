import type { PrismaClient } from '@prisma/client';

export type SeedScope = 'all' | 'baseline' | 'master';

export interface SeedOptions {
  readonly scope: SeedScope;
  readonly isTestTarget: boolean;
}

export interface SeedContext {
  readonly prisma: PrismaClient;
  readonly options: SeedOptions;
}
