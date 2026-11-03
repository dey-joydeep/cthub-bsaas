import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

function major(version, label) {
  const match = String(version ?? '').match(/(?:^|[^0-9])(\d+)\./);
  if (!match) throw new Error(`Cannot determine ${label} major version from package.json`);
  return Number(match[1]);
}

export function instructionDrift(packageJson, instructions, webInstructions, nvmrc) {
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const expected = [
    { label: 'Nx', pattern: /Monorepo:\s*Nx\s+(\d+)/i, version: dependencies.nx },
    { label: 'Angular', pattern: /Frontend:\s*Angular\s+(\d+)/i, version: dependencies['@angular/core'] },
    { label: 'NestJS', pattern: /Backend:\s*NestJS\s+(\d+)/i, version: dependencies['@nestjs/core'] },
  ];
  const errors = [];
  for (const entry of expected) {
    const declared = instructions.match(entry.pattern);
    if (!declared) {
      errors.push(`AGENTS.md must state the ${entry.label} major version in Project Snapshot`);
      continue;
    }
    const actual = major(entry.version, entry.label);
    if (Number(declared[1]) !== actual) {
      errors.push(`AGENTS.md says ${entry.label} ${declared[1]}, but package.json declares ${entry.label} ${actual}`);
    }
  }
  if (webInstructions) {
    const declared = webInstructions.match(/Angular\s+(\d+)/i);
    const actual = major(dependencies['@angular/core'], 'Angular');
    if (declared && Number(declared[1]) !== actual) {
      errors.push(`libs/web/AGENTS.md says Angular ${declared[1]}, but package.json declares Angular ${actual}`);
    }
  }
  if (nvmrc) {
    const selected = Number(nvmrc.trim());
    const engine = packageJson.engines?.node ?? '';
    if (
      !Number.isInteger(selected) ||
      !new RegExp(`(?:^|\\s)>=?${selected}(?:\\s|$)`).test(engine) ||
      !engine.includes(`<${selected + 1}`)
    ) {
      errors.push(`.nvmrc Node ${nvmrc.trim()} does not match package.json engines.node ${engine}`);
    }
  }
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const root = resolve(process.cwd());
  const errors = instructionDrift(
    JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')),
    readFileSync(resolve(root, 'AGENTS.md'), 'utf8'),
    readFileSync(resolve(root, 'libs/web/AGENTS.md'), 'utf8'),
    readFileSync(resolve(root, '.nvmrc'), 'utf8'),
  );
  if (errors.length) {
    for (const error of errors) console.error(error);
    process.exitCode = 1;
  } else {
    console.log('AIDD instruction versions match package.json.');
  }
}
