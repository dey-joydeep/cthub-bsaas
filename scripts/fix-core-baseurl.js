// scripts/fix-core-baseurl.js
import fs from 'fs';
import path from 'path';

const repo = process.cwd();
const files = [
  'libs/server/core/tsconfig.lib.json',
  'libs/server/data-access/tsconfig.lib.json'
];

for (const rel of files) {
  const p = path.join(repo, rel);
  const json = JSON.parse(fs.readFileSync(p, 'utf8'));

  json.compilerOptions = json.compilerOptions || {};
  // remove local baseUrl so we inherit root baseUrl="."
  if ('baseUrl' in json.compilerOptions) delete json.compilerOptions.baseUrl;

  // keep the paths we set (they are repo-root relative)
  json.compilerOptions.paths = {
    '@cthub-bsaas/shared': ['dist/libs/shared/index.d.ts'],
    '@cthub-bsaas/shared/*': ['dist/libs/shared/*'],
    '@cthub-bsaas/server-data-access': ['dist/libs/server/data-access/index.d.ts'],
    '@cthub-bsaas/server-data-access/*': ['dist/libs/server/data-access/*'],
    ...(json.compilerOptions.paths || {})
  };

  fs.writeFileSync(p, JSON.stringify(json, null, 2) + '\n', 'utf8');
  console.log('Updated', rel);
}
