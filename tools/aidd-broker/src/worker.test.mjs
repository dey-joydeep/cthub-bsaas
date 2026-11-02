import assert from 'node:assert/strict';
import { createPublicKey, generateKeyPairSync, sign, verify } from 'node:crypto';
import { describe, it } from 'node:test';
import worker, { appJwt, perform, validateAction } from './worker.mjs';

const commit = {
  issueNumber: 100,
  branch: 'feature/salon-calendar',
  expectedHeadOid: 'a'.repeat(40),
  message: 'feat: add salon calendar',
  files: [{ path: 'libs/web/calendar/src/index.ts', contents: 'export const label = "salon";' }],
};

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

  it('binds each grant to the executor client ID for its role', async () => {
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
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: 'Executor role mismatch' });
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
