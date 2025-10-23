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

function extractRoutes(controllerSource: string): string[] {
  const routes: string[] = [];
  const base = extractBase(controllerSource) ?? '';
  const methodRegex = /@(Get|Post|Put|Patch|Delete)\(([^)]*)\)/g;
  let m: RegExpExecArray | null;
  while ((m = methodRegex.exec(controllerSource))) {
    const rawArg = m[2] ?? '';
    const sm = rawArg.match(/['"]([^'"]*)['"]/);
    const sub = sm ? sm[1] : '';
    const full = [base, sub].filter(Boolean).join('/');
    // normalize slashes
    let norm = '/' + full.replace(/(^\/|\/+$)/g, '').replace(/\/+/, '/');
    // normalize path params: :id -> {id}
    norm = norm.replace(/:(\w+)/g, '{$1}');
    routes.push(norm);
  }
  return Array.from(new Set(routes));
}

function extractOpenapiPaths(yaml: string): string[] {
  const lines = yaml.split(/\r?\n/);
  const paths: string[] = [];
  let inPaths = false;
  for (const line of lines) {
    if (!inPaths) {
      if (/^\s*paths:\s*$/.test(line)) inPaths = true;
      continue;
    }
    const pathMatch = line.match(/^\s{2}\/[^:]+:/);
    if (pathMatch) {
      const p = pathMatch[0].trim().slice(0, -1); // remove trailing :
      paths.push(p);
    }
    // stop if next top-level section
    if (/^\w/.test(line)) break;
  }
  return paths;
}

function main() {
  const controllerFiles = listControllerFiles(controllersDir);
  const implRoutes = new Set<string>();
  for (const file of controllerFiles) {
    const src = read(file);
    for (const r of extractRoutes(src)) implRoutes.add(r);
  }
  const specYaml = read(openapiPath);
  const specRoutes = new Set(extractOpenapiPaths(specYaml));

  // Filter to /auth namespace only
  const implAuth = Array.from(implRoutes).filter((r) => r.startsWith('/auth'));
  const specAuth = Array.from(specRoutes).filter((r) => r.startsWith('/auth'));

  const missingInSpec = implAuth.filter((r) => !specAuth.includes(r));
  const missingInImpl = specAuth.filter((r) => !implAuth.includes(r));

  const ok = missingInSpec.length === 0 && missingInImpl.length === 0;

  const report = {
    ok,
    implementedCount: implAuth.length,
    specCount: specAuth.length,
    missingInSpec,
    missingInImpl,
  };
  const out = JSON.stringify(report, null, 2);
  console.log(out);
  if (!ok) process.exitCode = 1;
}

main();
