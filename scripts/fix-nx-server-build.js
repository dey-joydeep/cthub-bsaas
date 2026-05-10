/* Ensure unique tsBuildInfoFile per lib + solid build deps for server-core */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repo = path.resolve(__dirname, '..');

function j(p){ return path.join(repo, p); }
function load(p){ return JSON.parse(fs.readFileSync(j(p), 'utf8')); }
function save(p, o){ fs.writeFileSync(j(p), JSON.stringify(o, null, 2)+'\n', 'utf8'); console.log('Updated', p); }

function ensureUniqueTsBuildInfo(tsconfigPath, relOutDir) {
  const cfg = load(tsconfigPath);
  cfg.compilerOptions = cfg.compilerOptions || {};
  // normalize outDir/rootDir
  if (!cfg.compilerOptions.outDir) cfg.compilerOptions.outDir = relOutDir;
  if (!cfg.compilerOptions.rootDir) cfg.compilerOptions.rootDir = 'src';
  cfg.compilerOptions.composite = true;
  cfg.compilerOptions.declaration = true;
  cfg.compilerOptions.declarationMap = true;
  // unique tsbuildinfo per lib
  const outDir = cfg.compilerOptions.outDir.replace(/\/+$/,'');
  const info = `${outDir}/tsconfig.lib.tsbuildinfo`.replace(/\\/g,'/');
  cfg.compilerOptions.tsBuildInfoFile = info;
  // sane includes
  cfg.include = ['src/**/*.ts'];
  if (!cfg.exclude) cfg.exclude = ['**/*.spec.ts', '**/*.test.ts'];
  save(tsconfigPath, cfg);
}

function ensureDependsOn(projectJsonPath) {
  const pj = load(projectJsonPath);
  pj.targets = pj.targets || {};
  const b = pj.targets.build || {};
  b.options = b.options || {};
  // make sure we use tsconfig.lib.json (which extends server base)
  if (!b.options.tsConfig || !b.options.tsConfig.endsWith('tsconfig.lib.json')) {
    b.options.tsConfig = pj.root
      ? `${pj.root}/tsconfig.lib.json`
      : 'tsconfig.lib.json';
  }
  // ensure dependsOn builds upstream libs first
  b.dependsOn = Array.from(new Set([...(b.dependsOn || []), '^build']));
  pj.targets.build = b;
  save(projectJsonPath, pj);
}

// Patch shared
ensureUniqueTsBuildInfo('libs/shared/tsconfig.lib.json', '../../dist/libs/shared');

// Patch server/data-access
ensureUniqueTsBuildInfo('libs/server/data-access/tsconfig.lib.json', '../../../dist/libs/server/data-access');
ensureDependsOn('libs/server/data-access/project.json');

// Patch server/core
ensureUniqueTsBuildInfo('libs/server/core/tsconfig.lib.json', '../../../dist/libs/server/core');
ensureDependsOn('libs/server/core/project.json');

// Clean conflicting tsbuildinfo if it exists at a shared location
[
  'dist/libs/server/tsconfig.lib.tsbuildinfo',
].forEach(p => {
  const abs = j(p);
  if (fs.existsSync(abs)) {
    fs.rmSync(abs, { force:true });
    console.log('Removed stale', p);
  }
});

console.log(`
Done. Next:
  npx nx reset
  npx nx build shared
  npx nx build server-data-access
  npx nx build server-core
  # If TS2307 persists in server-core build, run:
  #   npx tsc -p libs/server/core/tsconfig.lib.json --showConfig > /tmp/core-tsc.json
  # and share the import it complains about.
`);
