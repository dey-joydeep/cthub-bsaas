import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { portsForSlot, prepareWorktreeRuntime } from './prepare-worktree-runtime.mjs';

test('worktree slots have distinct API, web, and SSR ports', () => {
  const allPorts = new Set();
  for (let slot = 0; slot <= 19; slot += 1) {
    for (const port of Object.values(portsForSlot(slot))) {
      assert.equal(allPorts.has(port), false, `port ${port} is assigned twice`);
      allPorts.add(port);
    }
  }
  assert.deepEqual(portsForSlot(1), { api: 3010, ssr: 4010, customer: 4210, partner: 4211, admin: 4212 });
  for (const invalid of [-1, 20, 1.5, Number.NaN]) {
    assert.throws(() => portsForSlot(invalid), /0 to 19/);
  }
});

test('preparation writes only local web environment overrides for the chosen slot', () => {
  const root = mkdtempSync(join(tmpdir(), 'aidd-worktree-runtime-'));
  try {
    writeFileSync(join(root, 'package.json'), '{}');
    for (const role of ['customer', 'partner', 'admin']) {
      const directory = join(root, 'libs', 'web', 'config', 'src', 'environments', role);
      mkdirSync(directory, { recursive: true });
      writeFileSync(join(directory, 'environment.ts'), 'tracked source');
    }

    prepareWorktreeRuntime(root, 2);
    for (const role of ['customer', 'partner', 'admin']) {
      const directory = join(root, 'libs', 'web', 'config', 'src', 'environments', role);
      assert.match(readFileSync(join(directory, 'environment.worktree.ts'), 'utf8'), /apiUrl: '\/api'/);
      assert.equal(readFileSync(join(directory, 'environment.ts'), 'utf8'), 'tracked source');
    }
    const proxy = JSON.parse(readFileSync(join(root, 'tmp', 'aidd-runtime', 'proxy.conf.json'), 'utf8'));
    assert.equal(proxy['/api'].target, 'http://localhost:3020');
    assert.equal(proxy['/partner'].target, 'http://localhost:3020');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
