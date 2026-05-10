/* Final patch:
 * - Inject explicit dist-only path aliases into server-core & server-data-access tsconfig.lib.json
 * - Ensure unique tsBuildInfoFile per lib to avoid collisions
 * - Ensure build dependsOn '^build' so deps compile first
 * - Ensure build uses tsconfig.lib.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repo = path.resolve(__dirname, '..');

function jp(p) {
  return path.join(repo, p);
}
function load(p) {
  return JSON.parse(fs.readFileSync(jp(p), 'utf8'));
}
function save(p, o) {
  fs.writeFileSync(jp(p), JSON.stringify(o, null, 2) + '\n', 'utf8');
  console.log('Updated', p);
}

const DIST_PATHS = {
  '@cthub-bsaas/shared': ['dist/libs/shared/index.d.ts'],
  '@cthub-bsaas/shared/*': ['dist/libs/shared/*'],
  '@cthub-bsaas/server-data-access': ['dist/libs/server/data-access/index.d.ts'],
  '@cthub-bsaas/server-data-access/*': ['dist/libs/server/data-access/*'],
};

function ensureBuildTsConfig(projectJsonPath, tsconfigLibPath) {
  const pj = load(projectJsonPath);
  pj.targets = pj.targets || {};
  const build = pj.targets.build || {};
  build.options = build.options || {};
  // Make sure we use the lib tsconfig for builds
  if (!build.options.tsConfig || !build.options.tsConfig.endsWith('tsconfig.lib.json')) {
    // try to point to the file relative to project root
    const root = pj.root || path.dirname(projectJsonPath).replace(/\\/g, '/');
    build.options.tsConfig = `${root}/tsconfig.lib.json`;
  }
  // Build dependencies first
  build.dependsOn = Array.from(new Set([...(build.dependsOn || []), '^build']));
  pj.targets.build = build;
  save(projectJsonPath, pj);
}

function ensureUniqueTsBuildInfo(tsconfigPath, outDir) {
  const cfg = load(tsconfigPath);
  cfg.compilerOptions = cfg.compilerOptions || {};
  cfg.compilerOptions.outDir = outDir;
  cfg.compilerOptions.rootDir = 'src';
  cfg.compilerOptions.composite = true;
  cfg.compilerOptions.declaration = true;
  cfg.compilerOptions.declarationMap = true;
  // unique file per lib
  const info = `${outDir.replace(/\/+$/, '')}/tsconfig.lib.tsbuildinfo`.replace(/\\/g, '/');
  cfg.compilerOptions.tsBuildInfoFile = info;

  // ⛑️ Inject dist-only path aliases explicitly (so build never uses source)
  cfg.compilerOptions.paths = {
    ...(cfg.compilerOptions.paths || {}),
    ...DIST_PATHS,
  };

  cfg.include = ['src/**/*.ts'];
  cfg.exclude = cfg.exclude || ['**/*.spec.ts', '**/*.test.ts'];
  save(tsconfigPath, cfg);
}

// Shared: we don't inject paths here; it’s the source producer
ensureUniqueTsBuildInfo('libs/shared/tsconfig.lib.json', '../../dist/libs/shared');

// Server/data-access
ensureUniqueTsBuildInfo('libs/server/data-access/tsconfig.lib.json', '../../../dist/libs/server/data-access');
ensureBuildTsConfig('libs/server/data-access/project.json', 'libs/server/data-access/tsconfig.lib.json');

// Server/core
ensureUniqueTsBuildInfo('libs/server/core/tsconfig.lib.json', '../../../dist/libs/server/core');
ensureBuildTsConfig('libs/server/core/project.json', 'libs/server/core/tsconfig.lib.json');

// Clean any stale shared tsbuildinfo
['dist/libs/server/tsconfig.lib.tsbuildinfo'].forEach((p) => {
  const abs = jp(p);
  if (fs.existsSync(abs)) {
    fs.rmSync(abs, { force: true });
    console.log('Removed stale', p);
  }
});

console.log(`
✅ Patched tsconfig.lib.json for server libs with explicit dist-only path aliases
✅ Ensured unique tsBuildInfoFile per lib
✅ Ensured build depends on '^build' and uses tsconfig.lib.json

Now run:
  npx nx reset
  npx nx build shared
  npx nx build server-data-access
  npx nx build server-core
`);
