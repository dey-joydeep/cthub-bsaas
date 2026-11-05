import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { runBrokerAction } from './broker-client.mjs';

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

const request = {
  role: 'qa',
  mandateId: '11111111-1111-4111-8111-111111111111',
  action: 'qa.review-pr',
  input: { prNumber: 99, expectedHeadOid: 'a'.repeat(40), body: 'QA verified the current head.' },
  credentials: { clientId: 'qa-client', clientSecret: 'never-print-this-value' },
};

test('checks service identity and the real bot actor across a complete action', async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ path: new URL(url).pathname, headers: options.headers, body: options.body });
    if (url.endsWith('/v1/whoami')) return Response.json({ principal: 'service:qa-client', admin: false, enabled: true });
    if (url.endsWith('/v1/task-grants')) return Response.json({ id: 'grant-id' }, { status: 201 });
    return Response.json({ result: { actor: 'shearflow-qa[bot]', url: 'https://github.com/example/review' } });
  };
  const result = await runBrokerAction(request);
  assert.equal(result.actor, 'shearflow-qa[bot]');
  assert.equal(result.grantId, 'grant-id');
  assert.deepEqual(
    calls.map((call) => call.path),
    ['/v1/whoami', '/v1/task-grants', '/v1/execute'],
  );
  assert.equal(
    calls.every((call) => call.headers['CF-Access-Client-Secret'] === request.credentials.clientSecret),
    true,
  );
  assert.equal(JSON.stringify(result).includes(request.credentials.clientSecret), false);
});

test('fails closed before requesting a grant when the broker is disabled or role mismatched', async () => {
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(url);
    return Response.json({ principal: 'service:qa-client', admin: false, enabled: false });
  };
  await assert.rejects(() => runBrokerAction(request), /unavailable or disabled/);
  assert.equal(calls.length, 1);
  await assert.rejects(() => runBrokerAction({ ...request, role: 'dev' }), /Role and action mismatch/);
  assert.equal(calls.length, 1);
});

test('retains the one-time grant ID when execution fails and rejects false bot attribution', async () => {
  globalThis.fetch = async (url) => {
    if (url.endsWith('/v1/whoami')) return Response.json({ principal: 'service:qa-client', admin: false, enabled: true });
    if (url.endsWith('/v1/task-grants')) return Response.json({ id: 'grant-id' }, { status: 201 });
    return Response.json({ error: 'Action did not complete' }, { status: 502 });
  };
  await assert.rejects(() => runBrokerAction(request), /Grant grant-id needs reconciliation/);
  globalThis.fetch = async (url) => {
    if (url.endsWith('/v1/whoami')) return Response.json({ principal: 'service:qa-client', admin: false, enabled: true });
    if (url.endsWith('/v1/task-grants')) return Response.json({ id: 'grant-id' }, { status: 201 });
    return Response.json({ result: { actor: 'dey-joydeep' } });
  };
  await assert.rejects(() => runBrokerAction(request), /GitHub actor mismatch/);
});

test('recovers a completed request without executing its one-time grant again', async () => {
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(new URL(url).pathname);
    if (url.endsWith('/v1/whoami')) return Response.json({ principal: 'service:qa-client', admin: false, enabled: true });
    return Response.json({
      id: 'original-grant',
      reused: true,
      state: 'succeeded',
      result: { actor: 'shearflow-qa[bot]', url: 'https://github.com/example/review' },
    });
  };
  const result = await runBrokerAction({ ...request, requestId: '11111111-1111-4111-8111-111111111111' });
  assert.equal(result.grantId, 'original-grant');
  assert.deepEqual(calls, ['/v1/whoami', '/v1/task-grants']);
});
