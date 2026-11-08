import fs from 'fs';
import path from 'path';

const repoRoot = process.cwd();
const controllersDir = path.join(repoRoot, 'libs/server/features/salon-owner/src/lib/controllers');
const openapiPath = path.join(repoRoot, 'docs/specs/salon-owner/API/openapi.yaml');
const implementedOperationIds = new Set([
  'listSalonBusinesses',
  'createSalonBusiness',
  'getSalonBusiness',
  'updateSalonBusiness',
  'listBranches',
  'createBranch',
  'getBranch',
  'getBranchHours',
  'listBranchHolidays',
  'getBranchPolicy',
  'updateBranch',
  'replaceBranchHours',
  'setBranchHoliday',
  'updateBranchPolicy',
  'listStaff',
  'createStaff',
  'getStaff',
  'updateStaff',
  'replaceStaffRoles',
  'replaceStaffSkills',
  'replaceStaffShifts',
  'createStaffLeaveBlock',
  'getStaffPersonalDetails',
  'updateStaffPersonalDetails',
  'selfUpdateStaffContact',
  'uploadStaffIdentityDocument',
  'listStaffIdentityDocuments',
  'verifyStaffIdentityDocument',
  'listBusinessRoles',
  'createBusinessRole',
  'updateBusinessRole',
  'deleteBusinessRole',
  'listSystemPermissions',
  'listServiceCategories',
  'createServiceCategory',
  'listServices',
  'createService',
  'getService',
  'updateService',
  'updateServiceStatus',
  'replaceServiceStaffEligibility',
  'searchCustomers',
  'createCustomer',
  'getCustomer',
  'updateCustomer',
  'createCustomerNote',
  'updateCustomerCommunicationPreferences',
  'getCustomerVisitHistory',
]);

interface ControllerRoute {
  readonly method: string;
  readonly path: string;
  readonly operationId?: string;
}

interface SpecRoute {
  readonly method: string;
  readonly path: string;
  readonly operationId: string;
}

function read(file: string): string {
  return fs.readFileSync(file, 'utf8');
}

function routeKey(route: Pick<ControllerRoute | SpecRoute, 'method' | 'path'>): string {
  return `${route.method.toUpperCase()} ${route.path}`;
}

function extractBase(controllerSource: string): string {
  const match = controllerSource.match(/@Controller\(([^)]*)\)/);
  const arg = match?.[1] ?? '';
  return arg.match(/['"]([^'"]+)['"]/)?.[1] ?? '';
}

function extractControllerRoutes(controllerSource: string): ControllerRoute[] {
  const routes: ControllerRoute[] = [];
  const base = extractBase(controllerSource);
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
      if (trimmed.length > 0 && !trimmed.startsWith('//')) {
        decorators = [];
      }
      continue;
    }

    const routeMatch = routeDecorator.match(/^@(Get|Post|Put|Patch|Delete)\(([^)]*)\)/);
    if (!routeMatch) {
      decorators = [];
      continue;
    }

    const subPath = routeMatch[2]?.match(/['"]([^'"]*)['"]/)?.[1] ?? '';
    const operationId = decorators
      .find((decorator) => decorator.startsWith('@ApiOperation('))
      ?.match(/operationId:\s*['"]([^'"]+)['"]/)?.[1];
    const full = [base, subPath].filter(Boolean).join('/');
    const normalized = `/${full.replace(/(^\/|\/+$)/g, '').replace(/\/+/g, '/')}`.replace(/:(\w+)/g, '{$1}');

    routes.push({
      method: routeMatch[1].toUpperCase(),
      path: normalized,
      operationId,
    });
    decorators = [];
  }

  return routes;
}

function extractSpecRoutes(yaml: string): SpecRoute[] {
  const lines = yaml.split(/\r?\n/);
  const routes: SpecRoute[] = [];
  let inPaths = false;
  let currentPath: string | undefined;
  let currentMethod: string | undefined;
  let currentOperationId: string | undefined;

  const flush = () => {
    if (currentPath && currentMethod && currentOperationId && implementedOperationIds.has(currentOperationId)) {
      routes.push({ method: currentMethod, path: currentPath, operationId: currentOperationId });
    }
  };

  for (const line of lines) {
    if (!inPaths) {
      if (/^\s*paths:\s*$/.test(line)) {
        inPaths = true;
      }
      continue;
    }

    const pathMatch = line.match(/^\s{2}(\/[^:]+):/);
    if (pathMatch) {
      flush();
      currentPath = pathMatch[1];
      currentMethod = undefined;
      currentOperationId = undefined;
      continue;
    }

    const methodMatch = line.match(/^\s{4}(get|post|put|patch|delete):\s*$/);
    if (methodMatch) {
      flush();
      currentMethod = methodMatch[1].toUpperCase();
      currentOperationId = undefined;
      continue;
    }

    const operationMatch = line.match(/^\s{6}operationId:\s*([A-Za-z0-9_]+)/);
    if (operationMatch) {
      currentOperationId = operationMatch[1];
    }

    if (/^\w/.test(line)) {
      break;
    }
  }

  flush();
  return routes;
}

function main(): void {
  const implRoutes = fs
    .readdirSync(controllersDir)
    .filter((file) => file.endsWith('.ts') && !file.endsWith('.spec.ts'))
    .flatMap((file) => extractControllerRoutes(read(path.join(controllersDir, file))))
    .filter((route) => route.operationId && implementedOperationIds.has(route.operationId));
  const specRoutes = extractSpecRoutes(read(openapiPath));
  const implByOperation = new Map(implRoutes.map((route) => [route.operationId, route]));
  const missingInImpl = specRoutes
    .filter((route) => routeKey(implByOperation.get(route.operationId) ?? { method: '', path: '' }) !== routeKey(route))
    .map((route) => ({ operationId: route.operationId, expected: routeKey(route), actual: implByOperation.get(route.operationId) }));
  const extraInImpl = implRoutes.filter((route) => !specRoutes.some((specRoute) => specRoute.operationId === route.operationId));
  const ok = missingInImpl.length === 0 && extraInImpl.length === 0;

  console.log(
    JSON.stringify(
      {
        ok,
        implementedCount: implRoutes.length,
        specCount: specRoutes.length,
        missingInImpl,
        extraInImpl,
      },
      null,
      2,
    ),
  );

  if (!ok) {
    process.exitCode = 1;
  }
}

main();
