const actions = [
  ['po.create-issue', 'PO create issue'],
  ['po.comment-issue', 'PO comment on issue'],
  ['dev.commit', 'Dev commit'],
  ['dev.commit-workflow', 'Dev workflow commit'],
  ['dev.create-pr', 'Dev create PR'],
  ['qa.review-pr', 'QA review PR'],
];

export function ownerHtml({ enabled = false, nonce = '' } = {}) {
  const actionFields = actions
    .map(([action, label]) => `<label>${label} limit <input name="${action}" type="number" min="0" max="100" value="0" required></label>`)
    .join('\n');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Shearflow task approval</title><link rel="stylesheet" href="/owner.css"></head>
<body><main data-enabled="${enabled}"><h1>Shearflow task approval</h1>
<p id="identity" role="status">${enabled ? 'Owner verified. Initializing approval form…' : 'Broker writes are disabled. Approval controls are disabled.'}</p>
<p>Approve one exact task scope. The six-digit owner code is sent only with the approval request and is never shown in the preview.</p>
<form id="create"><h2>Create a mandate</h2>
<label>Outcome <textarea name="outcome" maxlength="2000" rows="3" required></textarea></label>
<label>GitHub issue number (leave blank only if PO will create it; then set PO create issue limit to 1) <input name="issueNumber" type="number" min="1"></label>
<label>Task branch <input name="branch" maxlength="60" placeholder="feature/salon-calendar" required></label>
<label>Allowed paths, one file or directory per line (end a directory with /) <textarea name="allowedPaths" rows="5" required></textarea></label>
<fieldset><legend>Maximum actions for this task (0 means unavailable)</legend>${actionFields}</fieldset>
<label>Lifetime in days <input name="days" type="number" min="1" max="30" value="7" required></label>
<h3>Scope to approve</h3><pre id="scope" aria-live="polite"></pre>
<label><input id="confirmed" type="checkbox" required> I checked this outcome, issue, branch, paths, limits, and lifetime.</label>
<label>Six-digit owner code <input name="approvalCode" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required></label>
<button type="submit" disabled>Create mandate</button><p id="create-result" role="status" aria-live="polite"></p></form>
<form id="revoke"><h2>Revoke a mandate</h2>
<label>Mandate ID <input name="mandateId" type="text" pattern="[0-9a-f-]{36}" required></label>
<label>New six-digit owner code <input name="approvalCode" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required></label>
<button type="submit" disabled>Revoke mandate</button><p id="revoke-result" role="status" aria-live="polite"></p></form>
</main><script nonce="${nonce}">${ownerJs}</script></body></html>`;
}

export const ownerCss = `html{font:16px system-ui,sans-serif;color:#17212b;background:#f6f8fa}body{margin:0}main{max-width:46rem;margin:auto;padding:1rem}form{background:white;border:1px solid #ccd4dd;border-radius:.6rem;padding:1rem;margin:1.5rem 0}label{display:block;margin:.8rem 0}input:not([type=checkbox]),textarea{display:block;box-sizing:border-box;width:100%;font:inherit;padding:.6rem;margin-top:.3rem}fieldset{border:1px solid #ccd4dd}button{font:inherit;padding:.6rem 1rem}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#edf2f7;padding:1rem}#identity,#create-result,#revoke-result{overflow-wrap:anywhere}`;

export function ownerClient() {
  const create = document.querySelector('#create');
  const revoke = document.querySelector('#revoke');
  const scope = document.querySelector('#scope');
  const confirmed = document.querySelector('#confirmed');
  let previewedScope = '';
  const actionNames = ['po.create-issue', 'po.comment-issue', 'dev.commit', 'dev.commit-workflow', 'dev.create-pr', 'qa.review-pr'];
  function mandateInput() {
    const data = new FormData(create);
    const actions = {};
    for (const name of actionNames) {
      const count = Number(data.get(name));
      if (count > 0) actions[name] = count;
    }
    return {
      outcome: String(data.get('outcome') ?? '').trim(),
      issueNumber: data.get('issueNumber') ? Number(data.get('issueNumber')) : null,
      branch: String(data.get('branch') ?? '').trim(),
      allowedPaths: String(data.get('allowedPaths') ?? '')
        .split(/\r?\n/)
        .map((path) => path.trim())
        .filter(Boolean),
      actions,
      ttlSeconds: Number(data.get('days')) * 86400,
    };
  }
  function refreshScope() {
    confirmed.checked = false;
    previewedScope = JSON.stringify(mandateInput(), null, 2);
    scope.textContent = previewedScope;
  }
  async function post(path, body) {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      cache: 'no-store',
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? `Request failed (${response.status})`);
    return result;
  }
  create.addEventListener('input', (event) => {
    if (event.target !== confirmed && event.target.name !== 'approvalCode') refreshScope();
  });
  create.addEventListener('submit', async (event) => {
    event.preventDefault();
    const result = document.querySelector('#create-result');
    const scopeInput = mandateInput();
    if (!confirmed.checked || JSON.stringify(scopeInput, null, 2) !== previewedScope) {
      refreshScope();
      result.textContent = 'Scope changed. Review the updated preview and confirm it again.';
      return;
    }
    result.textContent = 'Submitting…';
    try {
      const input = { ...scopeInput, approvalCode: create.elements.approvalCode.value };
      const created = await post('/v1/mandates', input);
      result.textContent = `Created mandate ${created.id}. Expires ${created.expiresAt}. Save the ID for revocation.`;
      revoke.elements.mandateId.value = created.id;
      confirmed.checked = false;
    } catch (error) {
      result.textContent = error.message;
    } finally {
      create.elements.approvalCode.value = '';
    }
  });
  revoke.addEventListener('submit', async (event) => {
    event.preventDefault();
    const result = document.querySelector('#revoke-result');
    result.textContent = 'Submitting…';
    try {
      const revoked = await post('/v1/mandates/revoke', {
        mandateId: revoke.elements.mandateId.value,
        approvalCode: revoke.elements.approvalCode.value,
      });
      result.textContent = `Mandate ${revoked.id} revoked.`;
    } catch (error) {
      result.textContent = error.message;
    } finally {
      revoke.elements.approvalCode.value = '';
    }
  });
  refreshScope();
  if (document.querySelector('main').dataset.enabled === 'true') {
    document.querySelector('#identity').textContent = 'Owner verified. Broker enabled.';
    create.querySelector('button').disabled = false;
    revoke.querySelector('button').disabled = false;
  }
}

// Static browser source avoids helpers injected into Function#toString() by Wrangler's bundler.
export const ownerJs =
  "(function ownerClient() {\n  const create = document.querySelector('#create');\n  const revoke = document.querySelector('#revoke');\n  const scope = document.querySelector('#scope');\n  const confirmed = document.querySelector('#confirmed');\n  let previewedScope = '';\n  const actionNames = ['po.create-issue', 'po.comment-issue', 'dev.commit', 'dev.commit-workflow', 'dev.create-pr', 'qa.review-pr'];\n  function mandateInput() {\n    const data = new FormData(create);\n    const actions = {};\n    for (const name of actionNames) {\n      const count = Number(data.get(name));\n      if (count > 0) actions[name] = count;\n    }\n    return {\n      outcome: String(data.get('outcome') ?? '').trim(),\n      issueNumber: data.get('issueNumber') ? Number(data.get('issueNumber')) : null,\n      branch: String(data.get('branch') ?? '').trim(),\n      allowedPaths: String(data.get('allowedPaths') ?? '')\n        .split(/\\r?\\n/)\n        .map((path) => path.trim())\n        .filter(Boolean),\n      actions,\n      ttlSeconds: Number(data.get('days')) * 86400,\n    };\n  }\n  function refreshScope() {\n    confirmed.checked = false;\n    previewedScope = JSON.stringify(mandateInput(), null, 2);\n    scope.textContent = previewedScope;\n  }\n  async function post(path, body) {\n    const response = await fetch(path, {\n      method: 'POST',\n      headers: { 'content-type': 'application/json' },\n      credentials: 'same-origin',\n      cache: 'no-store',\n      body: JSON.stringify(body),\n    });\n    const result = await response.json();\n    if (!response.ok) throw new Error(result.error ?? `Request failed (${response.status})`);\n    return result;\n  }\n  create.addEventListener('input', (event) => {\n    if (event.target !== confirmed && event.target.name !== 'approvalCode') refreshScope();\n  });\n  create.addEventListener('submit', async (event) => {\n    event.preventDefault();\n    const result = document.querySelector('#create-result');\n    const scopeInput = mandateInput();\n    if (!confirmed.checked || JSON.stringify(scopeInput, null, 2) !== previewedScope) {\n      refreshScope();\n      result.textContent = 'Scope changed. Review the updated preview and confirm it again.';\n      return;\n    }\n    result.textContent = 'Submitting…';\n    try {\n      const input = { ...scopeInput, approvalCode: create.elements.approvalCode.value };\n      const created = await post('/v1/mandates', input);\n      result.textContent = `Created mandate ${created.id}. Expires ${created.expiresAt}. Save the ID for revocation.`;\n      revoke.elements.mandateId.value = created.id;\n      confirmed.checked = false;\n    } catch (error) {\n      result.textContent = error.message;\n    } finally {\n      create.elements.approvalCode.value = '';\n    }\n  });\n  revoke.addEventListener('submit', async (event) => {\n    event.preventDefault();\n    const result = document.querySelector('#revoke-result');\n    result.textContent = 'Submitting…';\n    try {\n      const revoked = await post('/v1/mandates/revoke', {\n        mandateId: revoke.elements.mandateId.value,\n        approvalCode: revoke.elements.approvalCode.value,\n      });\n      result.textContent = `Mandate ${revoked.id} revoked.`;\n    } catch (error) {\n      result.textContent = error.message;\n    } finally {\n      revoke.elements.approvalCode.value = '';\n    }\n  });\n  refreshScope();\n  if (document.querySelector('main').dataset.enabled === 'true') {\n    document.querySelector('#identity').textContent = 'Owner verified. Broker enabled.';\n    create.querySelector('button').disabled = false;\n    revoke.querySelector('button').disabled = false;\n  }\n})();";
