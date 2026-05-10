// Fix TS2307 in server-core by normalizing tsconfig chain, barrel exports, and imports.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const repo       = path.resolve(__dirname, '..');

function jp(p){ return path.join(repo, p); }
function read(p){ return fs.readFileSync(jp(p), 'utf8'); }
function write(p, s){ fs.writeFileSync(jp(p), s, 'utf8'); console.log('Updated', p); }
function parseJsonc(text) {
  let s = text.replace(/^\uFEFF/, '');
  s = s.replace(/\/\*[\s\S]*?\*\//g, '');
  s = s.replace(/(^|[^:])\/\/.*$/gm, '$1');
  s = s.replace(/,\s*([}\]])/g, '$1');
  return JSON.parse(s);
}
function loadJSON(p){ return parseJsonc(read(p)); }
function saveJSON(p, obj){ write(p, JSON.stringify(obj, null, 2) + '\n'); }

// 1) server base: ensure baseUrl + flat dist paths
(() => {
  const p = 'tsconfig.server.base.json';
  const j = loadJSON(p);
  j.extends = './tsconfig.base.json';
  j.compilerOptions = j.compilerOptions || {};
  j.compilerOptions.baseUrl = '.';
  j.compilerOptions.paths = {
    '@cthub-bsaas/shared': ['dist/libs/shared/index.d.ts'],
    '@cthub-bsaas/shared/*': ['dist/libs/shared/*'],
    '@cthub-bsaas/server-data-access': ['dist/libs/server/data-access/index.d.ts'],
    '@cthub-bsaas/server-data-access/*': ['dist/libs/server/data-access/*']
  };
  saveJSON(p, j);
})();

// 2) shared tsconfig.lib: producer should not map itself; correct include/exclude
(() => {
  const p = 'libs/shared/tsconfig.lib.json';
  const j = loadJSON(p);
  j.extends = '../../tsconfig.base.json';
  j.compilerOptions = j.compilerOptions || {};
  delete j.compilerOptions.paths;
  j.compilerOptions.rootDir = 'src';
  j.compilerOptions.outDir = '../../dist/libs/shared';
  j.compilerOptions.declaration = true;
  j.compilerOptions.declarationMap = true;
  j.compilerOptions.composite = true;
  j.compilerOptions.tsBuildInfoFile = '../../dist/libs/shared/tsconfig.lib.tsbuildinfo';
  if (Array.isArray(j.files)) delete j.files;
  j.include = ['src/**/*.ts'];
  j.exclude = ['**/*.spec.ts','**/*.test.ts'];
  saveJSON(p, j);
})();

// 3) server libs tsconfig.lib: inherit baseUrl/paths; keep refs/root/out
['libs/server/core/tsconfig.lib.json', 'libs/server/data-access/tsconfig.lib.json'].forEach(p => {
  const j = loadJSON(p);
  j.extends = '../../../tsconfig.server.base.json';
  j.compilerOptions = j.compilerOptions || {};
  delete j.compilerOptions.baseUrl;
  delete j.compilerOptions.paths;
  if (p.includes('/core/')) {
    j.compilerOptions.rootDir = 'src';
    j.compilerOptions.outDir = '../../../dist/libs/server/core';
    j.compilerOptions.tsBuildInfoFile = '../../../dist/libs/server/core/tsconfig.lib.tsbuildinfo';
    j.references = [
      { path: '../../shared/tsconfig.lib.json' },
      { path: '../data-access/tsconfig.lib.json' }
    ];
  } else {
    j.compilerOptions.rootDir = 'src';
    j.compilerOptions.outDir = '../../../dist/libs/server/data-access';
    j.compilerOptions.tsBuildInfoFile = '../../../dist/libs/server/data-access/tsconfig.lib.tsbuildinfo';
    j.references = [{ path: '../../shared/tsconfig.lib.json' }];
  }
  j.compilerOptions.declaration = true;
  j.compilerOptions.declarationMap = true;
  j.compilerOptions.composite = true;
  if (Array.isArray(j.files)) delete j.files;
  j.include = ['src/**/*.ts'];
  j.exclude = ['**/*.spec.ts','**/*.test.ts'];
  saveJSON(p, j);
});

// 4) Ensure shared barrel re-exports needed symbols
(() => {
  const p = 'libs/shared/src/index.ts';
  let s = read(p);
  const ensure = (line) => { if (!s.includes(line)) s += (s.endsWith('\n')?'':'\n') + line + '\n'; };
  ensure(`export * from './enums/user-role.enum';`);
  ensure(`export * from './enums/appointment-status.enum';`);
  ensure(`export * from './types/user.types';`);
  write(p, s);
})();

// 5) Revert any lingering subpath imports in server-core back to barrel
(() => {
  const base = jp('libs/server/core/src');
  const files = [
    'auth/decorators/roles.decorator.ts',
    'auth/guards/roles.guard.ts',
    'decorators/current-user.decorator.ts',
    'decorators/user.decorator.ts',
    'validation/validators/has-permission.validator.ts',
    'validation/validators/last-admin.validator.ts',
    'validators/appointment.validators.ts',
    'database/database.module.ts'
  ];
  for (const rel of files) {
    const p = path.join(base, rel);
    if (!fs.existsSync(p)) continue;
    let s = fs.readFileSync(p, 'utf8');
    s = s
      .replace(/from\s+['"]@cthub-bsaas\/shared\/enums\/user-role\.enum['"]/g, `from '@cthub-bsaas/shared'`)
      .replace(/from\s+['"]@cthub-bsaas\/shared\/enums\/appointment-status\.enum['"]/g, `from '@cthub-bsaas/shared'`)
      .replace(/from\s+['"]@cthub-bsaas\/shared\/types\/user\.types['"]/g, `from '@cthub-bsaas/shared'`)
      .replace(/from\s+['"]@cthub-bsaas\/server-data-access(?:\/index)?['"]/g, `from '@cthub-bsaas/server-data-access'`);
    fs.writeFileSync(p, s, 'utf8');
    console.log('Patched', rel);
  }
})();

// 6) Fix the two TS7006 implicit anys in roles.guard.ts
(() => {
  const p = 'libs/server/core/src/auth/guards/roles.guard.ts';
  if (!fs.existsSync(jp(p))) return;
  let s = read(p);
  s = s
    .replace(/\.map\(\(\s*role\s*\)\s*=>/g, '.map((role: string) =>')
    .replace(/\.filter\(\(\s*role\s*\)\s*:\s*role is AppUserRole/g, '.filter((role: AppUserRole | undefined): role is AppUserRole');
  write(p, s);
})();
