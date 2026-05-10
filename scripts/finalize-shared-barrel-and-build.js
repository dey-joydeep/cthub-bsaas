/* Ensure @cthub-bsaas/shared barrel exports required symbols and rebuild chain */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repo = path.resolve(__dirname, '..');

function p(...x){ return path.join(repo, ...x); }
function read(pth){ return fs.existsSync(pth) ? fs.readFileSync(pth, 'utf8') : ''; }
function write(pth, s){ fs.mkdirSync(path.dirname(pth), {recursive:true}); fs.writeFileSync(pth, s, 'utf8'); }
function ensureLine(file, line){
  let src = read(file);
  if (!src.includes(line)) {
    if (src && !src.endsWith('\n')) src += '\n';
    src += line + '\n';
    write(file, src);
    console.log('Added to barrel:', line);
  } else {
    console.log('Already in barrel:', line);
  }
}

const barrel = p('libs/shared/src/index.ts');

// 1) Ensure shared barrel exports the things server-core imports
const neededExports = [
  "export * from './enums/user-role.enum';",
  "export * from './types/user.types';",
  // add other enums/types you use from server-core as needed
  "export * from './enums/appointment-status.enum';",
  // you can add more here if core consumes them:
  // "export * from './enums/another.enum';",
];

if (!fs.existsSync(barrel)) {
  console.error('Shared barrel not found:', barrel);
  process.exit(1);
}

for (const line of neededExports) ensureLine(barrel, line);

// 2) Clean & rebuild in order
function run(cmd){
  console.log('> ' + cmd);
  execSync(cmd, {stdio:'inherit', cwd: repo});
}

try {
  run('npx nx reset');
  run('npx nx build shared');
} catch (e) {
  console.error('Shared failed to build. Check shared tsconfig.lib.json/composite/outDir.');
  process.exit(1);
}

// 3) Verify the dist barrel file exists
const distBarrel = p('dist/libs/shared/index.d.ts');
if (!fs.existsSync(distBarrel)) {
  console.error(`Expected ${distBarrel} to exist but it doesn't.
- Ensure libs/shared/tsconfig.lib.json has:
  { "compilerOptions": { "outDir": "../../dist/libs/shared", "rootDir": "src", "declaration": true, "composite": true } }
- Ensure project's build uses that tsconfig (project.json -> targets.build.options.tsConfig = "libs/shared/tsconfig.lib.json")
`);
  process.exit(1);
}

// 4) Build remaining deps then server-core (which consumes the dist declarations)
try {
  run('npx nx build server-data-access');
  run('npx nx build server-core');
  console.log('✅ server-core build resolved @cthub-bsaas/shared from dist declarations.');
} catch (e) {
  console.error('server-core still failing. Next debug step:\n' +
`- Dump TypeScript config used by server-core:
  npx tsc -p libs/server/core/tsconfig.lib.json --showConfig > /tmp/core-tsc.json
  Then open /tmp/core-tsc.json and verify:
    compilerOptions.paths["@cthub-bsaas/shared"] = ["dist/libs/shared/index.d.ts"]
    compilerOptions.paths["@cthub-bsaas/shared/*"] = ["dist/libs/shared/*"]
  Also verify baseUrl is "." (root-level), and that dist/libs/shared/index.d.ts exists.

- As a fallback, replace barrel imports in server-core with explicit subpath imports:
    from '@cthub-bsaas/shared/enums/user-role.enum'
    from '@cthub-bsaas/shared/types/user.types'
  (wildcard paths are definitely mapped and avoid relying on the barrel file)
`);
  process.exit(1);
}
