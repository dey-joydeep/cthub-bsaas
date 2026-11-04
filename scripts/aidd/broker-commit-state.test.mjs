import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const script = fileURLToPath(new URL('./broker-commit-state.mjs', import.meta.url));

test('prepares a staged UTF-8 BOM without changing its bytes', async () => {
  const fixtureRoot = resolve('tmp', 'aidd-broker-commit-tests');
  await mkdir(fixtureRoot, { recursive: true });
  const repo = await mkdtemp(join(fixtureRoot, 'bom-'));
  const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    git('init', '-b', 'chore/bom-test');
    git('config', 'user.name', 'Fixture');
    git('config', 'user.email', 'fixture@example.invalid');
    git('remote', 'add', 'origin', 'https://github.com/dey-joydeep/cthub-bsaas.git');
    git('commit', '--allow-empty', '-m', 'fixture baseline');
    const bytes = Buffer.from('\ufeff# BOM fixture\n', 'utf8');
    await writeFile(join(repo, 'bom.md'), bytes);
    git('add', 'bom.md');
    const prepared = JSON.parse(
      execFileSync('node', [script, 'prepare', '--branch', 'chore/bom-test', '--issue', '113', '--message', 'test: BOM'], {
        cwd: repo,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }),
    );
    const input = JSON.parse(await readFile(prepared.inputFile, 'utf8'));
    assert.equal(input.files[0].contents.charCodeAt(0), 0xfeff);
    assert.deepEqual(Buffer.from(input.files[0].contents, 'utf8'), bytes);
  } finally {
    if (!repo.startsWith(`${fixtureRoot}\\`) && !repo.startsWith(`${fixtureRoot}/`)) throw new Error('Unexpected fixture path');
    await rm(repo, { recursive: true, force: true });
  }
});
