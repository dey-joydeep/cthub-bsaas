import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface TestDatabaseTarget {
  url: string;
  host: string;
  database: string;
}

const localHosts = new Set(['localhost', '127.0.0.1', '[::1]']);

function fixtureDatabaseUrl(): string | undefined {
  const file = readFileSync(resolve(process.cwd(), '.env.test'), 'utf8');
  const line = file.split(/\r?\n/).find((entry) => /^DATABASE_URL\s*=/.test(entry));
  if (!line) return undefined;
  const value = line.slice(line.indexOf('=') + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value.split(/\s+#/, 1)[0]?.trim();
}

export function resolveTestDatabaseTarget(env: NodeJS.ProcessEnv = process.env): TestDatabaseTarget {
  if (env.NODE_ENV !== 'test') {
    throw new Error('Database-backed tests require NODE_ENV=test');
  }

  const rawUrl = env.TEST_DATABASE_URL || fixtureDatabaseUrl();
  if (!rawUrl) {
    throw new Error('A test database URL is required in TEST_DATABASE_URL or .env.test');
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('The test database URL is invalid');
  }
  const database = decodeURIComponent(parsed.pathname.slice(1));
  const allowedHosts = new Set([
    ...localHosts,
    ...(env.TEST_DATABASE_ALLOWED_HOSTS ?? '')
      .split(',')
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean),
  ]);
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol) || !allowedHosts.has(parsed.hostname.toLowerCase())) {
    throw new Error('The test database URL must use PostgreSQL on an allowed host');
  }
  if (!/^[a-z0-9][a-z0-9_]*_test(?:_[a-z0-9]+)*$/.test(database)) {
    throw new Error('The test database name must identify an isolated *_test database');
  }
  if (parsed.hash || !parsed.username) {
    throw new Error('The test database URL must include a user and no fragment');
  }

  return { url: rawUrl, host: parsed.hostname, database };
}

export function bindTestDatabaseTarget(env: NodeJS.ProcessEnv = process.env): TestDatabaseTarget {
  const target = resolveTestDatabaseTarget(env);
  env.TEST_DATABASE_URL = target.url;
  env.DATABASE_URL = target.url;
  return target;
}
