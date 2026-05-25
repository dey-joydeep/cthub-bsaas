import fs from 'fs';
import path from 'path';

const repoRoot = process.cwd();
const controllersDir = path.join(repoRoot, 'libs/server/features/auth/src/lib/controllers');
const openapiPath = path.join(repoRoot, 'docs/specs/auth/API/openapi.yaml');

function read(file: string): string {
  return fs.readFileSync(file, 'utf8');
}

function listControllerFiles(dir: string): string[] {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.ts') && !f.endsWith('.spec.ts'))
    .map((f) => path.join(dir, f));
}

function extractBase(controllerSource: string): string | undefined {
  const m = controllerSource.match(/@Controller\(([^)]*)\)/);
  if (!m) return undefined;
  const arg = m[1];
  // naive: look for first quoted string
  const sm = arg.match(/['"]([^'"]+)['"]/);
  return sm ? sm[1] : undefined;
}

interface ControllerRoute {
  method: string;
  path: string;
  isPublic: boolean;
}

interface SpecRoute {
  method: string;
  path: string;
  requiresAuth: boolean;
}

function routeKey(route: Pick<ControllerRoute | SpecRoute, 'method' | 'path'>): string {
  return `${route.method.toUpperCase()} ${route.path}`;
}

function extractRoutes(controllerSource: string): ControllerRoute[] {
  const routes: ControllerRoute[] = [];
  const base = extractBase(controllerSource) ?? '';
  const lines = controllerSource.split(/\r?\n/);
  let decorators: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('@')) {
      decorators.push(trimmed);
      continue;
    }

    const routeDecorator = decorators.find((decorator) => /^@(Get|Post|Put|Patch|Delete)\(/.test(decorator));
    if (!routeDecorator) {
      if (trimmed.length > 0 && !trimmed.startsWith('//')) decorators = [];
      continue;
    }

    const m = routeDecorator.match(/^@(Get|Post|Put|Patch|Delete)\(([^)]*)\)/);
    if (!m) {
      decorators = [];
      continue;
    }

    const rawArg = m[2] ?? '';
    const sm = rawArg.match(/['"]([^'"]*)['"]/);
    const sub = sm ? sm[1] : '';
    const full = [base, sub].filter(Boolean).join('/');
    // normalize slashes
    let norm = '/' + full.replace(/(^\/|\/+$)/g, '').replace(/\/+/, '/');
    // normalize path params: :id -> {id}
    norm = norm.replace(/:(\w+)/g, '{$1}');
    routes.push({
      method: m[1].toUpperCase(),
      path: norm,
      isPublic: decorators.some((decorator) => decorator.startsWith('@Public(') || decorator === '@Public()'),
    });
    decorators = [];
  }

  return Array.from(new Map(routes.map((route) => [routeKey(route), route])).values());
}

function extractOpenapiRoutes(yaml: string): SpecRoute[] {
  const lines = yaml.split(/\r?\n/);
  const routes: SpecRoute[] = [];
  let inPaths = false;
  let currentPath: string | undefined;
  let currentMethod: string | undefined;
  let currentRequiresAuth = false;

  const flush = () => {
    if (currentPath && currentMethod) {
      routes.push({ method: currentMethod.toUpperCase(), path: currentPath, requiresAuth: currentRequiresAuth });
    }
  };

  for (const line of lines) {
    if (!inPaths) {
      if (/^\s*paths:\s*$/.test(line)) inPaths = true;
      continue;
    }
    const pathMatch = line.match(/^\s{2}(\/[^:]+):/);
    if (pathMatch) {
      flush();
      currentPath = pathMatch[1];
      currentMethod = undefined;
      currentRequiresAuth = false;
      continue;
    }

    const methodMatch = line.match(/^\s{4}(get|post|put|patch|delete):\s*$/);
    if (methodMatch) {
      flush();
      currentMethod = methodMatch[1].toUpperCase();
      currentRequiresAuth = false;
      continue;
    }

    if (currentMethod && /^\s{6}security:\s*$/.test(line)) {
      currentRequiresAuth = true;
    }

    // stop if next top-level section
    if (/^\w/.test(line)) break;
  }
  flush();
  return routes;
}

function main() {
  const controllerFiles = listControllerFiles(controllersDir);
  const implRoutes = new Map<string, ControllerRoute>();
  for (const file of controllerFiles) {
    const src = read(file);
    for (const r of extractRoutes(src)) implRoutes.set(routeKey(r), r);
  }
  const specYaml = read(openapiPath);
  const specRoutes = new Map(extractOpenapiRoutes(specYaml).map((route) => [routeKey(route), route]));

  // Filter to /auth namespace only
  const implAuth = Array.from(implRoutes.values()).filter((r) => r.path.startsWith('/auth'));
  const specAuth = Array.from(specRoutes.values()).filter((r) => r.path.startsWith('/auth'));
  const implAuthKeys = implAuth.map(routeKey);
  const specAuthKeys = specAuth.map(routeKey);

  const missingInSpec = implAuthKeys.filter((r) => !specAuthKeys.includes(r));
  const missingInImpl = specAuthKeys.filter((r) => !implAuthKeys.includes(r));
  const publicMetadataMismatches = specAuth
    .filter((specRoute) => !specRoute.requiresAuth)
    .filter((specRoute) => !implRoutes.get(routeKey(specRoute))?.isPublic)
    .map(routeKey);
  const protectedMetadataMismatches = specAuth
    .filter((specRoute) => specRoute.requiresAuth)
    .filter((specRoute) => implRoutes.get(routeKey(specRoute))?.isPublic)
    .map(routeKey);

  const ok =
    missingInSpec.length === 0 &&
    missingInImpl.length === 0 &&
    publicMetadataMismatches.length === 0 &&
    protectedMetadataMismatches.length === 0;

  const report = {
    ok,
    implementedCount: implAuth.length,
    specCount: specAuth.length,
    missingInSpec,
    missingInImpl,
    publicMetadataMismatches,
    protectedMetadataMismatches,
  };
  const out = JSON.stringify(report, null, 2);
  console.log(out);
  if (!ok) process.exitCode = 1;
}

main();
