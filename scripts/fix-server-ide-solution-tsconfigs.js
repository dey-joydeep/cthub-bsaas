/* Point server libs' solution tsconfigs to server-only base (so IDE uses dist-only path aliases) */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repo = path.resolve(__dirname, '..');

const SERVER_LIBS = [
  'libs/server/core',
  'libs/server/data-access',
];

const serverBaseRel = '../../../tsconfig.server.base.json';

function patchSolutionTsconfig(dir) {
  const p = path.join(repo, dir, 'tsconfig.json');
  if (!fs.existsSync(p)) {
    console.log(`• Skipped (no tsconfig.json): ${dir}`);
    return;
  }
  const json = JSON.parse(fs.readFileSync(p, 'utf8'));

  // Ensure it extends the server base (important for IDE)
  json.extends = serverBaseRel;

  // Keep solution-style references as-is; just ensure files is an array
  if (!Array.isArray(json.files)) json.files = [];
  if (!Array.isArray(json.references)) json.references = json.references ?? [
    { path: './tsconfig.lib.json' },
    { path: './tsconfig.spec.json' }
  ];

  // Absolutely DO NOT set rootDir here — leave that to tsconfig.lib.json
  if (json.compilerOptions && json.compilerOptions.rootDir) {
    delete json.compilerOptions.rootDir;
  }

  fs.writeFileSync(p, JSON.stringify(json, null, 2) + '\n', 'utf8');
  console.log(`✔ Patched ${path.relative(repo, p)} to extend ${serverBaseRel}`);
}

for (const dir of SERVER_LIBS) patchSolutionTsconfig(dir);

console.log(`
Next:
  npx nx reset
  npx nx build shared && npx nx build server-data-access && npx nx build server-core
  Reload the editor (restart TypeScript server). In VS Code/Windsurf:
    - Command Palette → "TypeScript: Restart TS server"
    - (Optional) "TypeScript: Select TypeScript Version" → Use Workspace Version
`);
