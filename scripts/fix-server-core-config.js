/* Normalize server-core config so IDE and Nx build agree.
 * - Force libs/server/core/tsconfig.lib.json to a good state (no `files`, correct rootDir/outDir, unique tsBuildInfoFile, references)
 * - Ensure libs/server/core/tsconfig.json (solution) extends tsconfig.server.base.json
 * - Ensure project.json for server-core uses tsconfig.lib.json and dependsOn ^build
 * - Point tsconfig.server.base.json to FLAT dist (no /src)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const repo       = path.resolve(__dirname, '..');

function jp(...x){ return path.join(repo, ...x); }
function readJSON(p){ return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJSON(p, o){ fs.writeFileSync(p, JSON.stringify(o, null, 2) + '\n', 'utf8'); console.log('Updated', path.relative(repo, p)); }
function ensureDir(p){ fs.mkdirSync(path.dirname(p), { recursive: true }); }

function merge(a,b){ return JSON.parse(JSON.stringify({ ...a, ...b })); }

// 0) server base paths → flat dist
(function patchServerBase(){
  const p = jp('tsconfig.server.base.json');
  let base = { extends: './tsconfig.base.json', compilerOptions: {} };
  if (fs.existsSync(p)) {
    try { base = merge(base, readJSON(p)); } catch {}
  }
  base.compilerOptions = base.compilerOptions || {};
  base.compilerOptions.paths = {
    "@cthub-bsaas/shared": ["dist/libs/shared/index.d.ts"],
    "@cthub-bsaas/shared/*": ["dist/libs/shared/*"],
    "@cthub-bsaas/server-data-access": ["dist/libs/server/data-access/index.d.ts"],
    "@cthub-bsaas/server-data-access/*": ["dist/libs/server/data-access/*"]
  };
  ensureDir(p); writeJSON(p, base);
})();

// 1) libs/server/core/tsconfig.lib.json
(function patchServerCoreTsLib(){
  const p = jp('libs/server/core/tsconfig.lib.json');
  let cfg = {
    "extends": "../../../tsconfig.server.base.json",
    "compilerOptions": {
      "rootDir": "src",
      "outDir": "../../../dist/libs/server/core",
      "declaration": true,
      "declarationMap": true,
      "composite": true,
      "tsBuildInfoFile": "../../../dist/libs/server/core/tsconfig.lib.tsbuildinfo"
    },
    "include": ["src/**/*.ts"],
    "exclude": ["**/*.spec.ts", "**/*.test.ts"],
    "references": [
      { "path": "../../shared/tsconfig.lib.json" },
      { "path": "../data-access/tsconfig.lib.json" }
    ]
  };
  if (fs.existsSync(p)) {
    try {
      const current = readJSON(p);
      // always enforce extends/root/out/tsbuildinfo/include/exclude/references; ignore any `files`
      current.extends = cfg.extends;
      current.compilerOptions = { ...(current.compilerOptions||{}), ...cfg.compilerOptions };
      delete current.files; // <- remove files array if present (causes rootDir weirdness)
      current.include = cfg.include;
      current.exclude = cfg.exclude;
      current.references = cfg.references;
      cfg = current;
    } catch {}
  }
  ensureDir(p); writeJSON(p, cfg);
})();

// 2) libs/server/core/tsconfig.json (solution tsconfig used by IDE)
(function patchServerCoreTsSolution(){
  const p = jp('libs/server/core/tsconfig.json');
  let cfg = {
    "extends": "../../../tsconfig.server.base.json",
    "files": [],
    "references": [
      { "path": "./tsconfig.lib.json" },
      { "path": "./tsconfig.spec.json" }
    ]
  };
  if (fs.existsSync(p)) {
    try {
      const current = readJSON(p);
      current.extends = "../../../tsconfig.server.base.json";
      // keep references if already present
      if (!Array.isArray(current.references)) current.references = cfg.references;
      // do NOT set rootDir here
      // avoid absolute Windows paths creeping in via "files"
      if (!Array.isArray(current.files)) current.files = [];
      cfg = current;
    } catch {}
  }
  ensureDir(p); writeJSON(p, cfg);
})();

// 3) libs/server/core/project.json (ensure proper tsconfig + dependsOn)
(function patchServerCoreProject(){
  const p = jp('libs/server/core/project.json');
  if (!fs.existsSync(p)) return;
  const pj = readJSON(p);
  pj.targets = pj.targets || {};
  const b = pj.targets.build || {};
  b.executor = b.executor || '@nx/js:tsc';
  b.options = b.options || {};
  // Always build using the lib tsconfig we just normalized
  b.options.tsConfig = "libs/server/core/tsconfig.lib.json";
  b.options.outputPath = b.options.outputPath || "dist/libs/server/core";
  b.options.main = b.options.main || "libs/server/core/src/index.ts";
  // Upstream libs first
  b.dependsOn = Array.from(new Set([...(b.dependsOn || []), '^build']));
  pj.targets.build = b;
  writeJSON(p, pj);
})();
