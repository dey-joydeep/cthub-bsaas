/* Point server libs to actual dist declaration locations with /src */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repo = path.resolve(__dirname, '..');

function jp(p){ return path.join(repo, p); }
function load(p){ return JSON.parse(fs.readFileSync(jp(p), 'utf8')); }
function save(p, o){ fs.writeFileSync(jp(p), JSON.stringify(o, null, 2)+'\n', 'utf8'); console.log('Updated', p); }

function patchTsConfig(tsPath) {
  const cfg = load(tsPath);
  cfg.compilerOptions = cfg.compilerOptions || {};
  cfg.compilerOptions.paths = {
    ...(cfg.compilerOptions.paths || {}),
    "@cthub-bsaas/shared": ["dist/libs/shared/src/index.d.ts"],
    "@cthub-bsaas/shared/*": ["dist/libs/shared/src/*"],
    "@cthub-bsaas/server-data-access": ["dist/libs/server/data-access/src/index.d.ts"],
    "@cthub-bsaas/server-data-access/*": ["dist/libs/server/data-access/src/*"]
  };
  // keep the rest as-is
  save(tsPath, cfg);
}

[
  'libs/server/core/tsconfig.lib.json',
  'libs/server/data-access/tsconfig.lib.json'
].forEach(patchTsConfig);

console.log(`
Now run:
  npx nx reset
  npx nx build shared --skip-nx-cache
  npx nx build server-data-access --skip-nx-cache
  npx nx build server-core --skip-nx-cache
`);
