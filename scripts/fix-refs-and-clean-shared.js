/* Fix server-core project references + remove self paths from shared tsconfig (JSONC-safe) */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const repo       = path.resolve(__dirname, '..');

function jp(p){ return path.join(repo, p); }
function readText(p){ return fs.readFileSync(jp(p), 'utf8'); }

function sanitizeJson(jsonc) {
  // remove BOM
  let s = jsonc.replace(/^\uFEFF/, '');
  // remove /* block comments */
  s = s.replace(/\/\*[\s\S]*?\*\//g, '');
  // remove // line comments (not perfect but fine for tsconfig)
  s = s.replace(/(^|[^:])\/\/.*$/gm, '$1');
  // remove trailing commas before } or ]
  s = s.replace(/,\s*([}\]])/g, '$1');
  return s.trim();
}
function load(p){
  const raw = readText(p);
  try {
    return JSON.parse(raw);
  } catch {
    return JSON.parse(sanitizeJson(raw));
  }
}
function save(p, o){
  fs.writeFileSync(jp(p), JSON.stringify(o, null, 2) + '\n', 'utf8');
  console.log('Updated', p);
}

/* 1) Clean libs/shared/tsconfig.lib.json (remove self "paths") */
(() => {
  const ts = 'libs/shared/tsconfig.lib.json';
  const j = load(ts);

  j.compilerOptions = j.compilerOptions || {};
  if (j.compilerOptions.paths) {
    delete j.compilerOptions.paths;
    console.log('Removed compilerOptions.paths from', ts);
  }
  // enforce good producer settings
  j.compilerOptions.rootDir = 'src';
  j.compilerOptions.outDir = '../../dist/libs/shared';
  j.compilerOptions.declaration = true;
  j.compilerOptions.declarationMap = true;
  j.compilerOptions.composite = true;
  j.compilerOptions.tsBuildInfoFile = '../../dist/libs/shared/tsconfig.lib.tsbuildinfo';
  j.include = ['src/**/*.ts'];
  j.exclude = j.exclude || ['**/*.spec.ts','**/*.test.ts'];

  // do not allow a "files" array here (it can skew rootDir/commonSourceDir)
  if (Array.isArray(j.files)) delete j.files;

  save(ts, j);
})();

/* 2) Fix server-core tsconfig.lib.json "references" to correct relative paths */
(() => {
  const ts = 'libs/server/core/tsconfig.lib.json';
  const j = load(ts);

  j.extends = '../../../tsconfig.server.base.json';
  j.compilerOptions = j.compilerOptions || {};
  j.compilerOptions.rootDir = 'src';
  j.compilerOptions.outDir = '../../../dist/libs/server/core';
  j.compilerOptions.declaration = true;
  j.compilerOptions.declarationMap = true;
  j.compilerOptions.composite = true;
  j.compilerOptions.tsBuildInfoFile = '../../../dist/libs/server/core/tsconfig.lib.tsbuildinfo';

  // keep any existing consumer paths (fine), but ensure project refs are correct
  j.references = [
    { path: '../../shared/tsconfig.lib.json' },
    { path: '../data-access/tsconfig.lib.json' }
  ];

  // ensure include/exclude and NO "files"
  if (Array.isArray(j.files)) delete j.files;
  j.include = ['src/**/*.ts'];
  j.exclude = j.exclude || ['**/*.spec.ts','**/*.test.ts'];

  save(ts, j);
})();

/* 3) Fix server-data-access tsconfig.lib.json "references" to shared */
(() => {
  const ts = 'libs/server/data-access/tsconfig.lib.json';
  const j = load(ts);

  j.extends = '../../../tsconfig.server.base.json';
  j.compilerOptions = j.compilerOptions || {};
  j.compilerOptions.rootDir = 'src';
  j.compilerOptions.outDir = '../../../dist/libs/server/data-access';
  j.compilerOptions.declaration = true;
  j.compilerOptions.declarationMap = true;
  j.compilerOptions.composite = true;
  j.compilerOptions.tsBuildInfoFile = '../../../dist/libs/server/data-access/tsconfig.lib.tsbuildinfo';

  j.references = [
    { path: '../../shared/tsconfig.lib.json' }
  ];

  if (Array.isArray(j.files)) delete j.files;
  j.include = ['src/**/*.ts'];
  j.exclude = j.exclude || ['**/*.spec.ts','**/*.test.ts'];

  save(ts, j);
})();

/* 4) Ensure server base tsconfig maps to FLAT dist (no /src) */
(() => {
  const ts = 'tsconfig.server.base.json';
  const j = load(ts);
  j.extends = './tsconfig.base.json';
  j.compilerOptions = j.compilerOptions || {};
  j.compilerOptions.paths = {
    '@cthub-bsaas/shared': ['dist/libs/shared/index.d.ts'],
    '@cthub-bsaas/shared/*': ['dist/libs/shared/*'],
    '@cthub-bsaas/server-data-access': ['dist/libs/server/data-access/index.d.ts'],
    '@cthub-bsaas/server-data-access/*': ['dist/libs/server/data-access/*']
  };
  save(ts, j);
})();

console.log('\nDone. Now run:\n' +
'  npx nx reset\n' +
'  Remove-Item -Recurse -Force dist\n' +
'  npx nx build shared --skip-nx-cache\n' +
'  npx nx build server-data-access --skip-nx-cache\n' +
'  npx nx build server-core --skip-nx-cache\n');
