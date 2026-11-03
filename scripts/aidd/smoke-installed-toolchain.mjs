#!/usr/bin/env node

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const requirePrismaClient = process.argv.includes('--require-prisma-client');

function check(label, callback) {
  try {
    callback();
    console.log(`Toolchain smoke passed: ${label}`);
  } catch (error) {
    console.error(`Toolchain smoke failed: ${label}: ${error.message}`);
    process.exitCode = 1;
  }
}

check('Nx native binding', () => {
  const native = require('nx/src/native');
  assert.equal(typeof native.hashArray, 'function');
  assert.match(native.hashArray(['aidd-install-smoke']), /^[a-f0-9]+$/);
});

check('SWC native transform', () => {
  const { transformSync } = require('@swc/core');
  const output = transformSync('const smoke: number = 1;', { jsc: { parser: { syntax: 'typescript' } } });
  assert.match(output.code, /smoke/);
});

check('esbuild native transform', () => {
  const { transformSync } = require('esbuild');
  const output = transformSync('const smoke: number = 1;', { loader: 'ts' });
  assert.match(output.code, /smoke/);
});

if (requirePrismaClient) {
  check('generated Prisma Client', () => {
    const { Prisma, PrismaClient } = require('@prisma/client');
    assert.equal(typeof PrismaClient, 'function');
    assert.ok(Prisma.dmmf.datamodel.models.length > 0);
  });
}
