import { randomUUID } from 'node:crypto';
import { monitorEventLoopDelay, performance } from 'node:perf_hooks';
import { PrismaClient } from '@prisma/client';
import { bindTestDatabaseTarget } from '../../libs/server/core/src/config/test-database-target.ts';

function positiveInteger(name, fallback, maximum) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > maximum) {
    throw new Error(`${name} must be an integer from 1 to ${maximum}`);
  }
  return value;
}

function percentile(sorted, fraction) {
  if (sorted.length === 0) return null;
  return Math.round(sorted[Math.ceil(sorted.length * fraction) - 1] * 100) / 100;
}

async function main() {
  const target = bindTestDatabaseTarget();
  const sampleCount = positiveInteger('AIDD_PROBE_REQUESTS', 200, 5000);
  const concurrency = positiveInteger('AIDD_PROBE_CONCURRENCY', 10, 100);
  const fixtureCount = positiveInteger('AIDD_PROBE_BUSINESSES', 1000, 10000);
  const prisma = new PrismaClient({ datasources: { db: { url: target.url } } });
  const runId = randomUUID();
  let tenantId;
  let userId;

  try {
    await prisma.$connect();
    const tenant = await prisma.salonTenant.create({
      data: { name: `Capacity probe ${runId}`, email: `${runId}@example.test` },
    });
    tenantId = tenant.id;
    const user = await prisma.user.create({
      data: { email: `owner-${runId}@example.test`, passwordHash: 'test-only', salonTenantId: tenant.id },
    });
    userId = user.id;
    await prisma.salonBusiness.createMany({
      data: Array.from({ length: fixtureCount }, (_, index) => ({
        tenantId: tenant.id,
        displayName: `Probe ${runId} ${index}`,
        legalName: 'Capacity Probe Ltd',
      })),
    });

    const listBusinesses = async () => {
      const [items, totalItems] = await Promise.all([
        prisma.salonBusiness.findMany({
          where: { tenantId: tenant.id },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          skip: 0,
          take: 25,
        }),
        prisma.salonBusiness.count({ where: { tenantId: tenant.id } }),
      ]);
      return { items, totalItems };
    };
    for (let index = 0; index < Math.min(20, sampleCount); index += 1) {
      await listBusinesses();
    }

    const delay = monitorEventLoopDelay({ resolution: 20 });
    delay.enable();
    const utilizationStart = performance.eventLoopUtilization();
    const samples = [];
    let errors = 0;
    let completed = 0;
    const startedAt = performance.now();
    try {
      await Promise.all(
        Array.from({ length: Math.min(concurrency, sampleCount) }, async () => {
          while (completed < sampleCount) {
            completed += 1;
            const start = performance.now();
            try {
              const page = await listBusinesses();
              if (page.items.length !== Math.min(25, fixtureCount) || page.totalItems !== fixtureCount) {
                errors += 1;
              } else {
                samples.push(performance.now() - start);
              }
            } catch {
              errors += 1;
            }
          }
        }),
      );
    } finally {
      delay.disable();
    }
    const elapsedSeconds = (performance.now() - startedAt) / 1000;
    const utilization = performance.eventLoopUtilization(utilizationStart);
    samples.sort((left, right) => left - right);
    process.stdout.write(
      `${JSON.stringify({
        profile: 'test',
        databaseHost: target.host,
        databaseName: target.database,
        operation: 'SalonOwnerSettingsService.listBusinesses database query pair (page=1,pageSize=25)',
        fixtureBusinesses: fixtureCount,
        requests: sampleCount,
        successes: samples.length,
        errors,
        errorRate: Math.round((errors / sampleCount) * 10000) / 10000,
        concurrency,
        elapsedSeconds: Math.round(elapsedSeconds * 100) / 100,
        requestsPerSecond: Math.round((samples.length / elapsedSeconds) * 100) / 100,
        latencyMs: { p50: percentile(samples, 0.5), p95: percentile(samples, 0.95), p99: percentile(samples, 0.99) },
        eventLoopDelayP95Ms: Math.round((delay.percentile(95) / 1_000_000) * 100) / 100,
        eventLoopUtilization: Math.round(utilization.utilization * 10000) / 10000,
      })}\n`,
    );
    if (errors > 0) process.exitCode = 1;
  } finally {
    if (tenantId) {
      await prisma.auditEvent.deleteMany({ where: { tenantId } });
    }
    if (userId) {
      await prisma.user.delete({ where: { id: userId } });
    }
    if (tenantId) {
      await prisma.salonTenant.delete({ where: { id: tenantId } });
    }
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
