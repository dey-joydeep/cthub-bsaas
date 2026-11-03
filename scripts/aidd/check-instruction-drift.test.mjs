import test from 'node:test';
import assert from 'node:assert/strict';
import { instructionDrift } from './check-instruction-drift.mjs';

const packages = {
  dependencies: { '@angular/core': '~22.2.0', '@nestjs/core': '11.1.27' },
  devDependencies: { nx: '24.0.1' },
  engines: { node: '>=24 <25' },
};
const instructions = 'Monorepo: Nx 24.\nBackend: NestJS 11.\nFrontend: Angular 22, standalone.';

test('matching major versions pass', () => {
  assert.deepEqual(instructionDrift(packages, instructions), []);
});

test('stale project snapshot fails even when dependencies are otherwise valid', () => {
  assert.match(instructionDrift(packages, instructions.replace('Nx 24', 'Nx 21'))[0], /Nx 21.*Nx 24/);
  assert.match(instructionDrift(packages, instructions.replace('Angular 22', 'Angular 20'))[0], /Angular 20.*Angular 22/);
});

test('missing project snapshot version fails', () => {
  assert.match(instructionDrift(packages, instructions.replace('NestJS 11', 'NestJS'))[0], /must state the NestJS/);
});

test('scoped web and Node runtime claims must match dependencies', () => {
  const errors = instructionDrift(packages, instructions, 'Angular 21.', '22');
  assert.equal(errors.length, 2);
  assert.match(errors[0], /libs\/web\/AGENTS.md says Angular 21/);
  assert.match(errors[1], /\.nvmrc Node 22/);
});
