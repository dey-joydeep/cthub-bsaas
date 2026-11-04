import assert from 'node:assert/strict';
import { createHmac, createPublicKey, generateKeyPairSync, sign, verify } from 'node:crypto';
import { describe, it } from 'node:test';
import worker, { appJwt, perform, validateAction, validateMandate, validateMandateAction } from './worker.mjs';

const commit = {
  issueNumber: 100,
  branch: 'feature/salon-calendar',
  expectedHeadOid: 'a'.repeat(40),
  message: 'feat: add salon calendar',
  files: [{ path: 'libs/web/calendar/src/index.ts', contents: 'export const label = "salon";' }],
};
const approvalSecret = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';
function approvalCode(offset = 0) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let count = 0;
  const bytes = [];
  for (const letter of approvalSecret) {
    bits = (bits << 5) | alphabet.indexOf(letter);
    count += 5;
    if (count >= 8) {
      count -= 8;
      bytes.push((bits >> count) & 255);
    }
  }
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000) + offset));
  const digest = createHmac('sha1', Buffer.from(bytes)).update(counter).digest();
  const digestOffset = digest.at(-1) & 15;
  return ((digest.readUInt32BE(digestOffset) & 0x7fffffff) % 1000000).toString().padStart(6, '0');
}

describe('broker action validation', () => {
  it('accepts a scoped task branch commit', () => {
    assert.equal(validateAction('dev.commit', commit), 'dev');
  });

  it('rejects protected or malformed branches', () => {
    for (const branch of ['main', 'release/v1.0.0', 'refs/aidd/checkpoints/100', 'feature/../main', 'Feature/Upper']) {
      assert.throws(() => validateAction('dev.commit', { ...commit, branch }));
    }
  });

  it('requires explicit workflow permission in the exact grant', () => {
    const input = { ...commit, files: [{ path: '.github/workflows/ci.yml', contents: 'name: CI' }] };
    assert.throws(() => validateAction('dev.commit', input), /Workflow changes/);
    assert.throws(() => validateAction('dev.commit', { ...input, files: [{ path: '.GitHub/workflows/ci.yml', contents: 'name: CI' }] }));
    assert.equal(validateAction('dev.commit-workflow', { ...input, reason: 'Update CI validation' }), 'dev');
    assert.throws(() => validateAction('dev.commit-workflow', { ...input, files: commit.files, reason: 'Mixed files' }));
    assert.throws(() => validateAction('dev.commit', { ...commit, reason: 'unapproved' }));
  });

  it('rejects traversal, overlapping paths, and oversized commits', () => {
    assert.throws(() => validateAction('dev.commit', { ...commit, files: [{ path: 'a/../b', contents: 'x' }] }));
    assert.throws(() => validateAction('dev.commit', { ...commit, files: [commit.files[0], commit.files[0]] }));
    assert.throws(() =>
      validateAction('dev.commit', {
        ...commit,
        files: [
          { path: 'docs/status', contents: 'x' },
          { path: 'docs/status/probe.md', contents: 'y' },
        ],
      }),
    );
    assert.throws(() => validateAction('dev.commit', { ...commit, files: [{ path: 'a.ts', contents: 'x'.repeat(150001) }] }));
    assert.throws(() => validateAction('dev.commit', { ...commit, files: [{ path: 'a.ts', contents: 'binary\0data' }] }));
    assert.throws(() =>
      validateAction('dev.commit', {
        ...commit,
        files: [
          { path: 'docs/Test.md', contents: 'x' },
          { path: 'docs/test.md', contents: 'y' },
        ],
      }),
    );
    for (const path of ['docs/CON.txt', 'docs/name.', 'docs/name ', 'docs/a:b', 'docs/a?.txt', '.github/workflows./ci.yml']) {
      assert.throws(() => validateAction('dev.commit', { ...commit, files: [{ path, contents: 'x' }] }));
    }
  });

  it('rejects nested environment files and likely credentials', () => {
    assert.throws(() => validateAction('dev.commit', { ...commit, files: [{ path: 'apps/api/.env.production', contents: 'x' }] }));
    assert.throws(() => validateAction('dev.commit', { ...commit, files: [{ path: 'apps/api/.ENV', contents: 'x' }] }));
    assert.throws(() => validateAction('dev.commit', { ...commit, files: [{ path: 'config/private.pem', contents: 'x' }] }));
    assert.throws(() =>
      validateAction('dev.commit', { ...commit, files: [{ path: 'safe.txt', contents: '-----BEGIN PRIVATE KEY-----' }] }),
    );
  });

  it('binds QA evidence to an exact PR head', () => {
    assert.equal(validateAction('qa.review-pr', { prNumber: 99, expectedHeadOid: 'a'.repeat(40), body: 'Tested.' }), 'qa');
    assert.throws(() => validateAction('qa.review-pr', { prNumber: 99, body: 'Tested.' }));
  });

  it('requires an issue-closing PR body and exact head', () => {
    const input = {
      issueNumber: 100,
      branch: 'feature/salon-calendar',
      expectedHeadOid: 'a'.repeat(40),
      title: 'Salon calendar',
      body: 'Closes #100',
    };
    assert.equal(validateAction('dev.create-pr', input), 'dev');
    assert.throws(() => validateAction('dev.create-pr', { ...input, body: 'No issue link' }));
    assert.throws(() => validateAction('dev.create-pr', { ...input, expectedHeadOid: 'bad' }));
  });
});

describe('task mandates', () => {
  const proposal = {
    outcome: 'Deliver the salon calendar slice',
    issueNumber: 100,
    branch: 'feature/salon-calendar',
    allowedPaths: ['libs/web/calendar/', 'docs/specs/calendar/'],
    actions: { 'dev.commit': 4, 'dev.create-pr': 1, 'qa.review-pr': 1, 'po.comment-issue': 2 },
    ttlSeconds: 86400,
  };
  const active = {
    issue_number: 100,
    branch: proposal.branch,
    allowed_paths_json: JSON.stringify(proposal.allowedPaths),
    state: 'active',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  };

  it('accepts a bounded owner scope and rejects broad or malformed scopes', () => {
    assert.equal(validateMandate(proposal).branch, proposal.branch);
    assert.throws(() => validateMandate({ ...proposal, branch: 'main' }), /Invalid task branch/);
    assert.throws(() => validateMandate({ ...proposal, allowedPaths: ['libs/'] }), /Repository-wide directory scope/);
    assert.throws(() => validateMandate({ ...proposal, allowedPaths: ['../'] }), /Invalid path/);
    assert.throws(() => validateMandate({ ...proposal, actions: { 'dev.commit': 101 } }), /Invalid action limit/);
    assert.deepEqual(
      validateMandate({ ...proposal, actions: { 'dev.commit-workflow': 1 }, allowedPaths: ['.github/workflows/'] }).allowedPaths,
      ['.github/workflows/'],
    );
    assert.throws(() => validateMandate({ ...proposal, ttlSeconds: 31 * 86400 }), /Invalid mandate lifetime/);
    assert.equal(validateMandate({ ...proposal, issueNumber: null, actions: { 'po.create-issue': 1 } }).issueNumber, null);
    assert.throws(() => validateMandate({ ...proposal, issueNumber: null }), /one PO issue action/);
  });

  it('rejects branch, issue, path, revocation and expiry escapes', () => {
    assert.equal(validateMandateAction(active, 'dev.commit', commit), 'dev');
    assert.throws(() => validateMandateAction(active, 'dev.commit', { ...commit, branch: 'fix/other' }), /Branch outside mandate/);
    assert.throws(() => validateMandateAction(active, 'dev.commit', { ...commit, issueNumber: 101 }), /Issue outside mandate/);
    assert.throws(
      () =>
        validateMandateAction(active, 'dev.commit', {
          ...commit,
          files: [{ path: 'libs/server/auth.ts', contents: 'safe' }],
        }),
      /Path outside mandate/,
    );
    assert.throws(() => validateMandateAction({ ...active, state: 'revoked' }, 'dev.commit', commit), /Mandate unavailable/);
    assert.throws(() => validateMandateAction({ ...active, expires_at: 1 }, 'dev.commit', commit), /Mandate unavailable/);
    assert.throws(() => validateMandateAction({ ...active, issue_number: null }, 'dev.commit', commit), /issue not created/);
  });

  it('lets the owner approve once and a role issue only its bounded grant', async () => {
    const mandates = new Map();
    const limits = new Map();
    const grants = new Map();
    const approvalSteps = new Set();
    let approvalAttempts = 0;
    const store = {
      prepare(sql) {
        return {
          bind(...args) {
            return {
              async first() {
                if (sql.startsWith('SELECT * FROM task_mandates')) return mandates.get(args[0]) ?? null;
                if (sql.startsWith('SELECT id, request_hash, executor, state, result_json FROM grants')) {
                  const grant = [...grants.entries()].find(([, value]) => value.mandateId === args[0] && value.requestId === args[1]);
                  return grant
                    ? { id: grant[0], request_hash: grant[1].requestHash, executor: grant[1].executor, state: 'approved' }
                    : null;
                }
                throw new Error(`Unexpected select: ${sql}`);
              },
              async run() {
                if (sql.startsWith('INSERT INTO owner_approval_attempts')) {
                  approvalAttempts += 1;
                  return { meta: { changes: approvalAttempts <= 5 ? 1 : 0 } };
                }
                if (sql.startsWith('INSERT INTO task_mandates')) {
                  const [id, outcome, issue_number, branch, allowed_paths_json, expires_at, created_by, created_at] = args;
                  mandates.set(id, {
                    id,
                    outcome,
                    issue_number,
                    branch,
                    allowed_paths_json,
                    expires_at,
                    created_by,
                    created_at,
                    state: 'active',
                  });
                } else if (sql.startsWith('INSERT INTO mandate_action_usage')) {
                  const [id, action, max_issued] = args;
                  limits.set(`${id}:${action}`, { max_issued, issued: 0 });
                } else if (sql.startsWith('INSERT INTO owner_approval_steps')) {
                  if (approvalSteps.has(args[0])) throw new Error('Approval code replay');
                  approvalSteps.add(args[0]);
                } else if (sql.startsWith('UPDATE mandate_action_usage')) {
                  const [id, action] = args;
                  const usage = limits.get(`${id}:${action}`);
                  if (!usage || usage.issued >= usage.max_issued || !grants.has(args[2])) return { meta: { changes: 0 } };
                  usage.issued += 1;
                } else if (sql.startsWith('INSERT INTO grants')) {
                  const usage = limits.get(`${args[8]}:${args[1]}`);
                  if (!usage || usage.issued >= usage.max_issued || mandates.get(args[8])?.state !== 'active')
                    return { meta: { changes: 0 } };
                  grants.set(args[0], {
                    action: args[1],
                    executor: args[3],
                    mandateId: args[8],
                    requestId: args[9],
                    requestHash: args[10],
                  });
                } else if (sql.startsWith("UPDATE task_mandates SET state = 'revoked'")) {
                  const mandate = mandates.get(args[1]);
                  if (!mandate || mandate.state !== 'active') return { meta: { changes: 0 } };
                  mandate.state = 'revoked';
                } else throw new Error(`Unexpected write: ${sql}`);
                return { meta: { changes: 1 } };
              },
            };
          },
        };
      },
      async batch(statements) {
        const results = [];
        for (const statement of statements) results.push(await statement.run());
        return results;
      },
    };
    const env = {
      BROKER_ENABLED: 'true',
      ACCESS_AUD: 'expected',
      ADMIN_PRINCIPAL: 'user:owner@example.com',
      PO_CLIENT_ID: 'po-client',
      QA_CLIENT_ID: 'qa-client',
      DEV_CLIENT_ID: 'dev-client',
      OWNER_APPROVAL_TOTP_KEY: approvalSecret,
      GRANTS: store,
    };
    const context = (identity) => ({ access: { aud: 'expected', getIdentity: async () => identity } });
    const admin = context({ email: 'owner@example.com' });
    const dev = context({ service_token_status: true, service_token_id: 'dev-client' });
    const qa = context({ service_token_status: true, service_token_id: 'qa-client' });
    const post = (path, body, browser = false) =>
      new Request(`https://broker.example${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(browser ? { origin: 'https://broker.example' } : {}) },
        body: JSON.stringify(body),
      });
    const created = await worker.fetch(post('/v1/mandates', { ...proposal, approvalCode: approvalCode() }, true), env, admin);
    assert.equal(created.status, 201);
    const { id } = await created.json();
    assert.equal(mandates.get(id).created_by, 'user:owner@example.com');
    assert.equal((await worker.fetch(post('/v1/mandates', { ...proposal, approvalCode: approvalCode() }, true), env, admin)).status, 400);
    assert.equal((await worker.fetch(post('/v1/mandates', proposal), env, dev)).status, 403);
    let requestNumber = 0;
    const task = (action, input) => ({
      mandateId: id,
      action,
      input,
      requestId: `11111111-1111-4111-8111-${String(++requestNumber).padStart(12, '0')}`,
    });
    assert.equal((await worker.fetch(post('/v1/task-grants', task('dev.commit', commit)), env, qa)).status, 403);
    const firstInput = task('dev.commit', commit);
    const first = await worker.fetch(post('/v1/task-grants', firstInput), env, dev);
    assert.equal(first.status, 201);
    const grant = await first.json();
    assert.equal(grants.get(grant.id).mandateId, id);
    const reused = await worker.fetch(post('/v1/task-grants', firstInput), env, dev);
    assert.equal((await reused.json()).id, grant.id);
    for (let index = 0; index < 3; index += 1) {
      assert.equal((await worker.fetch(post('/v1/task-grants', task('dev.commit', commit)), env, dev)).status, 201);
    }
    assert.equal((await worker.fetch(post('/v1/task-grants', task('dev.commit', commit)), env, dev)).status, 409);
    assert.equal(
      (await worker.fetch(post('/v1/mandates/revoke', { mandateId: id, approvalCode: approvalCode(1) }, true), env, admin)).status,
      200,
    );
    for (let index = 0; index < 2; index += 1) {
      assert.equal((await worker.fetch(post('/v1/mandates', { ...proposal, approvalCode: '000000' }, true), env, admin)).status, 400);
    }
    assert.equal((await worker.fetch(post('/v1/mandates', { ...proposal, approvalCode: approvalCode() }, true), env, admin)).status, 429);
    assert.equal(
      (
        await worker.fetch(
          post(
            '/v1/task-grants',
            task('dev.create-pr', {
              issueNumber: 100,
              branch: proposal.branch,
              expectedHeadOid: 'a'.repeat(40),
              title: 'Calendar',
              body: 'Closes #100',
            }),
          ),
          env,
          dev,
        )
      ).status,
      400,
    );
  });
});

describe('broker request gate', () => {
  const request = new Request('https://broker.example/v1/whoami');
  it('stays disabled without an explicit switch', async () => {
    const response = await worker.fetch(new Request('https://broker.example/v1/execute', { method: 'POST' }), {}, {});
    assert.equal(response.status, 503);
  });

  it('requires a Cloudflare Access context with the expected audience', async () => {
    const env = { BROKER_ENABLED: 'true', ACCESS_AUD: 'expected' };
    assert.equal((await worker.fetch(request, env, {})).status, 403);
    const ctx = { access: { aud: 'wrong', getIdentity: async () => ({ email: 'operator@example.com' }) } };
    assert.equal((await worker.fetch(request, env, ctx)).status, 403);
  });

  it('derives the actor from Access, not request headers', async () => {
    const env = { BROKER_ENABLED: 'true', ACCESS_AUD: 'expected', ADMIN_PRINCIPAL: 'user:operator@example.com' };
    const ctx = { access: { aud: 'expected', getIdentity: async () => ({ email: 'operator@example.com' }) } };
    const response = await worker.fetch(new Request(request.url, { headers: { 'x-user': 'attacker' } }), env, ctx);
    assert.deepEqual(await response.json(), { principal: 'user:operator@example.com', admin: true, enabled: true });
  });

  it('distinguishes a verified service token from a user', async () => {
    const env = {
      BROKER_ENABLED: 'true',
      ACCESS_AUD: 'expected',
      ADMIN_PRINCIPAL: 'user:operator@example.com',
      PO_CLIENT_ID: 'client-id',
      QA_CLIENT_ID: 'qa-client',
      DEV_CLIENT_ID: 'dev-client',
    };
    const ctx = {
      access: {
        aud: 'expected',
        getIdentity: async () => ({ service_token_status: true, service_token_id: 'client-id', email: 'operator@example.com' }),
      },
    };
    const response = await worker.fetch(request, env, ctx);
    assert.deepEqual(await response.json(), { principal: 'service:client-id', admin: false, enabled: true });
  });

  it('verifies a service token JWT when Access has no identity object', async () => {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'test-key', alg: 'RS256' };
    const env = {
      BROKER_ENABLED: 'false',
      ACCESS_AUD: 'expected',
      ACCESS_ISSUER: 'https://access.example',
      PO_CLIENT_ID: 'client-id',
      QA_CLIENT_ID: 'qa-client',
      DEV_CLIENT_ID: 'dev-client',
    };
    const context = { access: { aud: 'expected', getIdentity: async () => null } };
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'test-key' })).toString('base64url');
    const makeToken = (commonName, overrides = {}) => {
      const now = Math.floor(Date.now() / 1000);
      const claims = Buffer.from(
        JSON.stringify({
          iss: env.ACCESS_ISSUER,
          aud: [env.ACCESS_AUD],
          iat: now,
          exp: now + 300,
          sub: '',
          common_name: commonName,
          ...overrides,
        }),
      ).toString('base64url');
      const message = `${header}.${claims}`;
      return `${message}.${sign('RSA-SHA256', Buffer.from(message), privateKey).toString('base64url')}`;
    };
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify({ keys: [jwk] }), { status: 200 });
    try {
      const token = makeToken('client-id');
      const headers = (jwt) => ({ 'cf-access-jwt-assertion': jwt });
      const valid = await worker.fetch(new Request(request.url, { headers: headers(token) }), env, context);
      assert.deepEqual(await valid.json(), { principal: 'service:client-id', admin: false, enabled: false });
      const forged = `${token.slice(0, -2)}xx`;
      assert.equal((await worker.fetch(new Request(request.url, { headers: headers(forged) }), env, context)).status, 403);
      const unlisted = await worker.fetch(new Request(request.url, { headers: headers(makeToken('different-client')) }), env, context);
      assert.equal(unlisted.status, 403);
      for (const overrides of [
        { iss: 'https://other.example' },
        { aud: ['other'] },
        { exp: Math.floor(Date.now() / 1000) - 1 },
        { iat: Math.floor(Date.now() / 1000) - 90000 },
      ]) {
        const invalid = await worker.fetch(new Request(request.url, { headers: headers(makeToken('client-id', overrides)) }), env, context);
        assert.equal(invalid.status, 403);
      }
      assert.equal((await worker.fetch(new Request(request.url, { headers: headers(token) }), env, {})).status, 403);
      assert.equal(
        (await worker.fetch(new Request(request.url, { headers: headers(token) }), { ...env, QA_CLIENT_ID: 'client-id' }, context)).status,
        403,
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('retires the legacy unscoped grant route', async () => {
    const env = {
      BROKER_ENABLED: 'true',
      ACCESS_AUD: 'expected',
      ADMIN_PRINCIPAL: 'user:operator@example.com',
      PO_CLIENT_ID: 'po-client',
      QA_CLIENT_ID: 'qa-client',
      DEV_CLIENT_ID: 'dev-client',
      GRANTS: {},
    };
    const context = { access: { aud: 'expected', getIdentity: async () => ({ email: 'operator@example.com' }) } };
    const response = await worker.fetch(
      new Request('https://broker.example/v1/grants', {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: 'https://broker.example' },
        body: JSON.stringify({
          action: 'po.create-issue',
          executor: 'service:qa-client',
          ttlSeconds: 600,
          input: { title: 'Test', body: 'Test' },
        }),
      }),
      env,
      context,
    );
    assert.equal(response.status, 404);
  });

  it('allows an authenticated identity probe while writes remain disabled', async () => {
    const env = { BROKER_ENABLED: 'false', ACCESS_AUD: 'expected', ADMIN_PRINCIPAL: 'user:operator@example.com' };
    const ctx = { access: { aud: 'expected', getIdentity: async () => ({ email: 'operator@example.com' }) } };
    const response = await worker.fetch(request, env, ctx);
    assert.deepEqual(await response.json(), { principal: 'user:operator@example.com', admin: true, enabled: false });
  });

  it('rejects a body exceeding the byte limit without Content-Length', async () => {
    const env = { BROKER_ENABLED: 'true', ACCESS_AUD: 'expected', ADMIN_PRINCIPAL: 'user:operator@example.com', GRANTS: {} };
    const ctx = { access: { aud: 'expected', getIdentity: async () => ({ email: 'operator@example.com' }) } };
    const body = JSON.stringify({ data: 'é'.repeat(110000) });
    const response = await worker.fetch(
      new Request('https://broker.example/v1/grants', {
        method: 'POST',
        body,
        headers: { 'content-type': 'application/json', origin: 'https://broker.example' },
      }),
      env,
      ctx,
    );
    assert.equal(response.status, 413);
  });

  it('rejects cross-origin or simple browser writes', async () => {
    const env = { BROKER_ENABLED: 'true', ACCESS_AUD: 'expected', ADMIN_PRINCIPAL: 'user:operator@example.com', GRANTS: {} };
    const ctx = { access: { aud: 'expected', getIdentity: async () => ({ email: 'operator@example.com' }) } };
    const endpoint = 'https://broker.example/v1/grants';
    const simple = new Request(endpoint, {
      method: 'POST',
      body: '{}',
      headers: { 'content-type': 'text/plain', origin: 'https://evil.example' },
    });
    assert.equal((await worker.fetch(simple, env, ctx)).status, 415);
    const crossOrigin = new Request(endpoint, {
      method: 'POST',
      body: '{}',
      headers: { 'content-type': 'application/json', origin: 'https://evil.example' },
    });
    assert.equal((await worker.fetch(crossOrigin, env, ctx)).status, 403);
  });
});

describe('one-time grant execution', () => {
  it('claims once, rejects replay and expiry, and reconciles an ambiguous failure', async () => {
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const grants = new Map();
    const transitions = [];
    const store = {
      prepare(sql) {
        return {
          bind(...args) {
            return {
              async run() {
                if (sql.startsWith("UPDATE grants SET state = 'running'")) {
                  const [, id, executor, now] = args;
                  const grant = grants.get(id);
                  if (!grant || grant.executor !== executor || grant.state !== 'approved' || grant.expires_at <= now) {
                    return { meta: { changes: 0 } };
                  }
                  grant.state = 'running';
                  transitions.push(`${id}:running`);
                  return { meta: { changes: 1 } };
                }
                if (sql.startsWith("UPDATE grants SET state = 'succeeded'")) {
                  const [, , id] = args;
                  grants.get(id).state = 'succeeded';
                  transitions.push(`${id}:succeeded`);
                } else if (sql.startsWith("UPDATE grants SET state = 'needs-reconciliation'")) {
                  const [, id] = args;
                  grants.get(id).state = 'needs-reconciliation';
                  transitions.push(`${id}:needs-reconciliation`);
                } else {
                  throw new Error(`Unexpected D1 query: ${sql}`);
                }
                return { meta: { changes: 1 } };
              },
              async first() {
                if (sql.startsWith('SELECT * FROM task_mandates')) {
                  return {
                    issue_number: 100,
                    branch: 'feature/salon-calendar',
                    state: 'active',
                    expires_at: Math.floor(Date.now() / 1000) + 3600,
                    allowed_paths_json: '[]',
                  };
                }
                assert.equal(sql, 'SELECT action, input_json, mandate_id FROM grants WHERE id = ?');
                const grant = grants.get(args[0]);
                return { action: grant.action, input_json: grant.input_json, mandate_id: 'mandate-id' };
              },
            };
          },
        };
      },
    };
    const env = {
      BROKER_ENABLED: 'true',
      ACCESS_AUD: 'expected',
      PO_CLIENT_ID: 'po-client',
      QA_CLIENT_ID: 'qa-client',
      DEV_CLIENT_ID: 'dev-client',
      GRANTS: store,
      PO_PRIVATE_KEY: privateKey.export({ type: 'pkcs1', format: 'pem' }).toString(),
    };
    const context = {
      access: { aud: 'expected', getIdentity: async () => ({ service_token_status: true, service_token_id: 'po-client' }) },
    };
    const makeRequest = (id) =>
      new Request('https://broker.example/v1/execute', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ grantId: id }),
      });
    const addGrant = (id, expiresAt) =>
      grants.set(id, {
        action: 'po.comment-issue',
        input_json: JSON.stringify({ issueNumber: 100, body: 'Bounded test' }),
        executor: 'service:po-client',
        expires_at: expiresAt,
        state: 'approved',
        mandate_id: 'mandate-id',
      });
    const originalFetch = globalThis.fetch;
    let githubCalls = 0;
    let failGitHub = false;
    globalThis.fetch = async (url) => {
      githubCalls += 1;
      if (failGitHub) return Response.json({ message: 'upstream unavailable' }, { status: 502 });
      if (url.endsWith('/access_tokens'))
        return Response.json({
          token: 'temporary-test-token',
          repository_selection: 'selected',
          repositories: [{ full_name: 'dey-joydeep/cthub-bsaas' }],
          permissions: { issues: 'write', metadata: 'read' },
        });
      if (url.endsWith('/comments'))
        return Response.json({ id: 8, html_url: 'https://github.com/example/comment/8', user: { login: 'shearflow-po[bot]' } });
      return Response.json({ number: 100 });
    };
    try {
      const now = Math.floor(Date.now() / 1000);
      const valid = '11111111-1111-4111-8111-111111111111';
      const expired = '22222222-2222-4222-8222-222222222222';
      const failed = '33333333-3333-4333-8333-333333333333';
      addGrant(valid, now + 600);
      addGrant(expired, now - 1);
      addGrant(failed, now + 600);
      const first = await worker.fetch(makeRequest(valid), env, context);
      assert.equal(first.status, 200);
      assert.equal((await first.json()).result.id, 8);
      assert.equal(grants.get(valid).state, 'succeeded');
      const callsAfterSuccess = githubCalls;
      assert.equal((await worker.fetch(makeRequest(valid), env, context)).status, 409);
      assert.equal((await worker.fetch(makeRequest(expired), env, context)).status, 409);
      assert.equal(githubCalls, callsAfterSuccess);
      failGitHub = true;
      assert.equal((await worker.fetch(makeRequest(failed), env, context)).status, 502);
      assert.equal(grants.get(failed).state, 'needs-reconciliation');
      const callsAfterFailure = githubCalls;
      assert.equal((await worker.fetch(makeRequest(failed), env, context)).status, 409);
      assert.equal(githubCalls, callsAfterFailure);
      assert.deepEqual(transitions, [`${valid}:running`, `${valid}:succeeded`, `${failed}:running`, `${failed}:needs-reconciliation`]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe('GitHub App signing', () => {
  it('signs GitHub RSA private-key PEM without exposing it', async () => {
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const pem = privateKey.export({ type: 'pkcs1', format: 'pem' }).toString();
    const jwt = await appJwt({ id: '123', key: 'TEST_KEY' }, { TEST_KEY: pem });
    const [header, payload, signature] = jwt.split('.');
    assert.equal(JSON.parse(Buffer.from(payload, 'base64url').toString()).iss, '123');
    assert.equal(
      verify('RSA-SHA256', Buffer.from(`${header}.${payload}`), createPublicKey(privateKey), Buffer.from(signature, 'base64url')),
      true,
    );
  });
});

describe('GitHub writes', () => {
  it('keeps PO issue comments off pull requests', async () => {
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const originalFetch = globalThis.fetch;
    let commentPosted = false;
    globalThis.fetch = async (url) => {
      if (url.endsWith('/access_tokens')) {
        return Response.json({
          token: 'temporary-test-token',
          repository_selection: 'selected',
          repositories: [{ full_name: 'dey-joydeep/cthub-bsaas' }],
          permissions: { issues: 'write', metadata: 'read' },
        });
      }
      if (url.endsWith('/comments')) commentPosted = true;
      return Response.json({ pull_request: { url: 'https://api.github.com/repos/dey-joydeep/cthub-bsaas/pulls/99' } });
    };
    try {
      await assert.rejects(
        () =>
          perform(
            'po.comment-issue',
            { issueNumber: 99, body: 'Approved' },
            {
              PO_PRIVATE_KEY: privateKey.export({ type: 'pkcs1', format: 'pem' }).toString(),
            },
          ),
        /pull request/,
      );
      assert.equal(commentPosted, false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('pins a QA review to the approved head and returns no token', async () => {
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const originalFetch = globalThis.fetch;
    const calls = [];
    globalThis.fetch = async (url, options) => {
      calls.push({ url, body: options.body && JSON.parse(options.body) });
      if (url.endsWith('/access_tokens')) {
        return Response.json({
          token: 'temporary-test-token',
          repository_selection: 'selected',
          repositories: [{ full_name: 'dey-joydeep/cthub-bsaas' }],
          permissions: { pull_requests: 'write', metadata: 'read' },
        });
      }
      if (url.endsWith('/reviews'))
        return Response.json({
          id: 7,
          html_url: 'https://github.com/dey-joydeep/cthub-bsaas/pull/99#pullrequestreview-7',
          commit_id: 'a'.repeat(40),
          user: { login: 'shearflow-qa[bot]' },
        });
      return Response.json({ state: 'open', head: { sha: 'a'.repeat(40) } });
    };
    try {
      const result = await perform(
        'qa.review-pr',
        { prNumber: 99, expectedHeadOid: 'a'.repeat(40), body: 'QA passed' },
        {
          QA_PRIVATE_KEY: privateKey.export({ type: 'pkcs1', format: 'pem' }).toString(),
        },
      );
      assert.equal(result.headOid, 'a'.repeat(40));
      assert.equal(JSON.stringify(result).includes('temporary-test-token'), false);
      assert.equal(calls.find((call) => call.url.endsWith('/reviews')).body.commit_id, 'a'.repeat(40));
      assert.equal(calls.filter((call) => call.url.endsWith('/pulls/99')).length, 2);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('rejects a same-named fork PR before posting QA evidence', async () => {
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const originalFetch = globalThis.fetch;
    let posted = false;
    globalThis.fetch = async (url, options) => {
      if (url.endsWith('/access_tokens'))
        return Response.json({
          token: 'temporary-test-token',
          repository_selection: 'selected',
          repositories: [{ full_name: 'dey-joydeep/cthub-bsaas' }],
          permissions: { pull_requests: 'write', metadata: 'read' },
        });
      if (url.endsWith('/reviews') && options.method === 'POST') posted = true;
      return Response.json({
        state: 'open',
        body: 'Closes #100',
        head: { sha: 'a'.repeat(40), ref: 'feature/salon-calendar', repo: { full_name: 'attacker/cthub-bsaas' } },
        base: { ref: 'main', repo: { full_name: 'dey-joydeep/cthub-bsaas' } },
      });
    };
    try {
      await assert.rejects(
        () =>
          perform(
            'qa.review-pr',
            {
              prNumber: 99,
              expectedHeadOid: 'a'.repeat(40),
              body: 'QA passed',
            },
            { QA_PRIVATE_KEY: privateKey.export({ type: 'pkcs1', format: 'pem' }).toString() },
            {
              issue_number: 100,
              branch: 'feature/salon-calendar',
              state: 'active',
              expires_at: Math.floor(Date.now() / 1000) + 600,
              allowed_paths_json: '[]',
            },
          ),
        /PR outside mandate/,
      );
      assert.equal(posted, false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('creates a task PR only from the bound branch under the Dev App actor', async () => {
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const originalFetch = globalThis.fetch;
    const input = {
      issueNumber: 100,
      branch: 'feature/salon-calendar',
      expectedHeadOid: 'a'.repeat(40),
      title: 'Salon calendar',
      body: 'Closes #100',
    };
    const mandate = {
      issue_number: 100,
      branch: input.branch,
      state: 'active',
      expires_at: Math.floor(Date.now() / 1000) + 600,
      allowed_paths_json: '[]',
    };
    const env = { DEV_PRIVATE_KEY: privateKey.export({ type: 'pkcs1', format: 'pem' }).toString() };
    let actor = 'shearflow-dev[bot]';
    globalThis.fetch = async (url) => {
      if (url.endsWith('/access_tokens'))
        return Response.json({
          token: 'temporary-test-token',
          repository_selection: 'selected',
          repositories: [{ full_name: 'dey-joydeep/cthub-bsaas' }],
          permissions: { pull_requests: 'write', contents: 'read', metadata: 'read' },
        });
      if (url.includes('/git/ref/heads/'))
        return Response.json({ ref: `refs/heads/${input.branch}`, object: { sha: input.expectedHeadOid } });
      return Response.json({
        number: 99,
        html_url: 'https://github.com/dey-joydeep/cthub-bsaas/pull/99',
        user: { login: actor },
        head: { sha: input.expectedHeadOid, repo: { full_name: 'dey-joydeep/cthub-bsaas' } },
        base: { repo: { full_name: 'dey-joydeep/cthub-bsaas' } },
      });
    };
    try {
      const result = await perform('dev.create-pr', input, env, mandate);
      assert.equal(result.actor, 'shearflow-dev[bot]');
      actor = 'dey-joydeep';
      await assert.rejects(() => perform('dev.create-pr', input, env, mandate), /GitHub actor mismatch/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('builds a scoped REST commit and atomically compares the branch head', async () => {
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const originalFetch = globalThis.fetch;
    const requests = [];
    let compareFiles = [{ filename: 'docs/test.txt', status: 'added' }];
    globalThis.fetch = async (url, options) => {
      if (url.endsWith('/access_tokens')) {
        return Response.json({
          token: 'temporary-test-token',
          repository_selection: 'selected',
          repositories: [{ full_name: 'dey-joydeep/cthub-bsaas' }],
          permissions: { contents: 'write', metadata: 'read' },
        });
      }
      const body = options.body && JSON.parse(options.body);
      requests.push({ url, method: options.method, body });
      if (url.endsWith('/git/ref/heads/feature/salon-calendar')) {
        return Response.json({
          ref: 'refs/heads/feature/salon-calendar',
          object: { type: 'commit', sha: 'a'.repeat(40) },
        });
      }
      if (url.endsWith(`/git/commits/${'a'.repeat(40)}`)) return Response.json({ tree: { sha: 'c'.repeat(40) } });
      if (url.includes(`/git/trees/${'c'.repeat(40)}?recursive=1`)) {
        return Response.json({ truncated: false, tree: [{ path: 'docs', type: 'tree', mode: '040000', sha: 'e'.repeat(40) }] });
      }
      if (url.endsWith('/git/trees')) return Response.json({ sha: 'd'.repeat(40) });
      if (url.endsWith('/git/commits')) return Response.json({ sha: 'b'.repeat(40) });
      if (url.includes('/compare/')) return Response.json({ files: compareFiles });
      if (url.endsWith('/repos/dey-joydeep/cthub-bsaas')) {
        return Response.json({ full_name: 'dey-joydeep/cthub-bsaas', node_id: 'repository-node-id' });
      }
      if (url.endsWith('/graphql')) return Response.json({ data: { updateRefs: { clientMutationId: null } } });
      if (url.endsWith(`/commits/${'b'.repeat(40)}`)) return Response.json({ author: { login: 'shearflow-dev[bot]' } });
      throw new Error(`Unexpected GitHub request: ${url}`);
    };
    try {
      const input = { ...commit, files: [{ path: 'docs/test.txt', contents: '🙂 salon' }] };
      const result = await perform('dev.commit', input, {
        DEV_PRIVATE_KEY: privateKey.export({ type: 'pkcs1', format: 'pem' }).toString(),
      });
      assert.equal(result.oid, 'b'.repeat(40));
      assert.deepEqual(
        requests.map((request) => `${request.method} ${request.url.replace('https://api.github.com/repos/dey-joydeep/cthub-bsaas', '')}`),
        [
          'GET /git/ref/heads/feature/salon-calendar',
          `GET /git/commits/${'a'.repeat(40)}`,
          `GET /git/trees/${'c'.repeat(40)}?recursive=1`,
          'POST /git/trees',
          'POST /git/commits',
          `GET /compare/${'a'.repeat(40)}...${'b'.repeat(40)}`,
          'GET /git/ref/heads/feature/salon-calendar',
          'GET ',
          'POST https://api.github.com/graphql',
          `GET /commits/${'b'.repeat(40)}`,
        ],
      );
      assert.deepEqual(requests[3].body, {
        base_tree: 'c'.repeat(40),
        tree: [{ path: 'docs/test.txt', mode: '100644', type: 'blob', content: '🙂 salon' }],
      });
      assert.deepEqual(requests[4].body, {
        message: 'feat: add salon calendar\n\nRefs #100',
        tree: 'd'.repeat(40),
        parents: ['a'.repeat(40)],
      });
      assert.deepEqual(requests[8].body.variables.input, {
        repositoryId: 'repository-node-id',
        refUpdates: [
          {
            name: 'refs/heads/feature/salon-calendar',
            beforeOid: 'a'.repeat(40),
            afterOid: 'b'.repeat(40),
            force: false,
          },
        ],
      });
      compareFiles = [...compareFiles, { filename: 'docs/other.txt', status: 'removed' }];
      requests.length = 0;
      await assert.rejects(
        () => perform('dev.commit', input, { DEV_PRIVATE_KEY: privateKey.export({ type: 'pkcs1', format: 'pem' }).toString() }),
        /Commit changed paths outside grant/,
      );
      assert.equal(
        requests.some((request) => request.url.endsWith('/graphql')),
        false,
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('creates the remote task branch from the exact main head on first Dev commit', async () => {
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const originalFetch = globalThis.fetch;
    let branchReads = 0;
    let branchCreated = false;
    globalThis.fetch = async (url) => {
      if (url.endsWith('/access_tokens'))
        return Response.json({
          token: 'temporary-test-token',
          repository_selection: 'selected',
          repositories: [{ full_name: 'dey-joydeep/cthub-bsaas' }],
          permissions: { contents: 'write', metadata: 'read' },
        });
      if (url.endsWith('/git/ref/heads/feature/salon-calendar')) {
        branchReads += 1;
        if (branchReads === 1) return Response.json({ message: 'Not Found' }, { status: 404 });
        return Response.json({ ref: 'refs/heads/feature/salon-calendar', object: { type: 'commit', sha: 'a'.repeat(40) } });
      }
      if (url.endsWith('/git/ref/heads/main')) return Response.json({ ref: 'refs/heads/main', object: { sha: 'a'.repeat(40) } });
      if (url.endsWith('/git/refs')) {
        branchCreated = true;
        return Response.json({ ref: 'refs/heads/feature/salon-calendar', object: { type: 'commit', sha: 'a'.repeat(40) } });
      }
      if (url.endsWith(`/git/commits/${'a'.repeat(40)}`)) return Response.json({ tree: { sha: 'c'.repeat(40) } });
      if (url.includes(`/git/trees/${'c'.repeat(40)}?recursive=1`)) return Response.json({ truncated: false, tree: [] });
      if (url.endsWith('/git/trees')) return Response.json({ sha: 'd'.repeat(40) });
      if (url.endsWith('/git/commits')) return Response.json({ sha: 'b'.repeat(40) });
      if (url.includes('/compare/')) return Response.json({ files: [{ filename: 'docs/test.txt', status: 'added' }] });
      if (url.endsWith('/repos/dey-joydeep/cthub-bsaas'))
        return Response.json({ full_name: 'dey-joydeep/cthub-bsaas', node_id: 'repo-id' });
      if (url.endsWith('/graphql')) return Response.json({ data: { updateRefs: {} } });
      if (url.endsWith(`/commits/${'b'.repeat(40)}`)) return Response.json({ author: { login: 'shearflow-dev[bot]' } });
      throw new Error(`Unexpected request: ${url}`);
    };
    try {
      const result = await perform(
        'dev.commit',
        { ...commit, files: [{ path: 'docs/test.txt', contents: 'safe' }] },
        {
          DEV_PRIVATE_KEY: privateKey.export({ type: 'pkcs1', format: 'pem' }).toString(),
        },
      );
      assert.equal(result.actor, 'shearflow-dev[bot]');
      assert.equal(branchCreated, true);
      assert.equal(branchReads, 2);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('rejects a changed branch head before creating Git objects', async () => {
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const originalFetch = globalThis.fetch;
    let mutationCalls = 0;
    globalThis.fetch = async (url, options) => {
      if (url.endsWith('/access_tokens')) {
        return Response.json({
          token: 'temporary-test-token',
          repository_selection: 'selected',
          repositories: [{ full_name: 'dey-joydeep/cthub-bsaas' }],
          permissions: { contents: 'write', metadata: 'read' },
        });
      }
      if (options.method !== 'GET') mutationCalls += 1;
      return Response.json({ ref: 'refs/heads/feature/salon-calendar', object: { type: 'commit', sha: 'e'.repeat(40) } });
    };
    try {
      const input = { ...commit, files: [{ path: 'docs/test.txt', contents: 'probe' }] };
      const env = { DEV_PRIVATE_KEY: privateKey.export({ type: 'pkcs1', format: 'pem' }).toString() };
      await assert.rejects(
        () => perform('dev.commit', input, env),
        (error) => error.message === 'Branch head changed',
      );
      assert.equal(mutationCalls, 0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('rejects directory, executable, ancestor, and case-colliding targets', async () => {
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const originalFetch = globalThis.fetch;
    const cases = [
      { path: 'docs/probe.md', type: 'tree', mode: '040000' },
      { path: 'docs/probe.md', type: 'blob', mode: '100755' },
      { path: 'docs', type: 'blob', mode: '100644' },
      { path: 'Docs', type: 'tree', mode: '040000' },
      { path: 'docs/PROBE.md', type: 'blob', mode: '100644' },
    ];
    try {
      for (const entry of cases) {
        let treeCreated = false;
        globalThis.fetch = async (url, options) => {
          if (url.endsWith('/access_tokens')) {
            return Response.json({
              token: 'temporary-test-token',
              repository_selection: 'selected',
              repositories: [{ full_name: 'dey-joydeep/cthub-bsaas' }],
              permissions: { contents: 'write', metadata: 'read' },
            });
          }
          if (url.endsWith('/git/ref/heads/feature/salon-calendar')) {
            return Response.json({ ref: 'refs/heads/feature/salon-calendar', object: { type: 'commit', sha: 'a'.repeat(40) } });
          }
          if (url.endsWith(`/git/commits/${'a'.repeat(40)}`)) return Response.json({ tree: { sha: 'c'.repeat(40) } });
          if (url.includes('?recursive=1')) return Response.json({ truncated: false, tree: [entry] });
          if (options.method === 'POST') treeCreated = true;
          throw new Error(`Unexpected GitHub request: ${url}`);
        };
        await assert.rejects(
          () =>
            perform(
              'dev.commit',
              { ...commit, files: [{ path: 'docs/probe.md', contents: 'probe' }] },
              {
                DEV_PRIVATE_KEY: privateKey.export({ type: 'pkcs1', format: 'pem' }).toString(),
              },
            ),
          /Non-regular file target|Non-directory ancestor|Case-colliding path/,
        );
        assert.equal(treeCreated, false);
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
