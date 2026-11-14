import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { JSDOM } from 'jsdom';
import { ownerClient, ownerHtml, ownerJs } from './owner-ui.mjs';

test('browser script is static and stays aligned with the tested owner client', () => {
  assert.equal(ownerJs, `(${ownerClient.toString()})();`);
  assert.doesNotMatch(ownerJs, /__name/);
  assert.doesNotMatch(ownerJs, /<\/script/i);
});

const original = { document: globalThis.document, FormData: globalThis.FormData, fetch: globalThis.fetch };
afterEach(() => {
  globalThis.document = original.document;
  globalThis.FormData = original.FormData;
  globalThis.fetch = original.fetch;
});

test('owner form previews exact scope without the code and submits one mandate', async () => {
  const dom = new JSDOM(ownerHtml({ enabled: true, nonce: 'test-nonce' }), { url: 'https://broker.example/owner' });
  globalThis.document = dom.window.document;
  globalThis.FormData = dom.window.FormData;
  const calls = [];
  globalThis.fetch = async (path, options) => {
    calls.push({ path, options });
    if (path === '/v1/whoami') {
      return Response.json({ principal: 'user:owner@example.com', admin: true, enabled: true });
    }
    return Response.json({ id: '11111111-1111-4111-8111-111111111111', expiresAt: '2026-11-12T00:00:00Z' }, { status: 201 });
  };
  ownerClient();
  await new Promise((resolve) => setImmediate(resolve));
  const form = document.querySelector('#create');
  assert.equal(form.querySelector('button').disabled, false);
  form.elements.outcome.value = 'Deliver salon calendar';
  form.elements.issueNumber.value = '113';
  form.elements.branch.value = 'feature/salon-calendar';
  form.elements.allowedPaths.value = 'libs/web/calendar/\ndocs/specs/calendar/';
  form.elements['dev.commit'].value = '3';
  form.elements.days.value = '7';
  form.elements.approvalCode.value = '123456';
  form.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  assert.equal(document.querySelector('#scope').textContent.includes('123456'), false);
  document.querySelector('#confirmed').checked = true;
  form.elements.branch.value = 'fix/changed-without-input';
  form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
  assert.equal(
    calls.some((call) => call.path === '/v1/mandates'),
    false,
  );
  assert.equal(document.querySelector('#confirmed').checked, false);
  form.elements.branch.value = 'feature/salon-calendar';
  form.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  document.querySelector('#confirmed').checked = true;
  form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
  await new Promise((resolve) => setImmediate(resolve));
  const submitted = JSON.parse(calls.find((call) => call.path === '/v1/mandates').options.body);
  assert.deepEqual(submitted, {
    outcome: 'Deliver salon calendar',
    issueNumber: 113,
    branch: 'feature/salon-calendar',
    allowedPaths: ['libs/web/calendar/', 'docs/specs/calendar/'],
    actions: { 'dev.commit': 3 },
    ttlSeconds: 7 * 86400,
    approvalCode: '123456',
  });
  assert.equal(form.elements.approvalCode.value, '');
  assert.equal(document.querySelector('#revoke').elements.mandateId.value, '11111111-1111-4111-8111-111111111111');
});

test('served browser script initializes the owner form', async () => {
  const dom = new JSDOM(ownerHtml({ enabled: true, nonce: 'test-nonce' }), { url: 'https://broker.example/owner' });
  const fetch = async () => Response.json({ principal: 'user:owner@example.com', admin: true, enabled: true });
  runInNewContext(ownerJs, { document: dom.window.document, FormData: dom.window.FormData, fetch });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(dom.window.document.querySelector('#create button').disabled, false);
});

test('owner controls remain disabled when the broker is disabled', async () => {
  const dom = new JSDOM(ownerHtml({ enabled: false, nonce: 'test-nonce' }), { url: 'https://broker.example/owner' });
  globalThis.document = dom.window.document;
  globalThis.FormData = dom.window.FormData;
  globalThis.fetch = async () => Response.json({ principal: 'user:owner@example.com', admin: true, enabled: false });
  ownerClient();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(document.querySelector('#create button').disabled, true);
  assert.equal(document.querySelector('#revoke button').disabled, true);
});
