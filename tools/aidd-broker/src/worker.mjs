const REPOSITORY = 'dey-joydeep/cthub-bsaas';
const APPS = {
  po: { id: '5552057', installation: '177123152', key: 'PO_PRIVATE_KEY' },
  qa: { id: '5552133', installation: '177125278', key: 'QA_PRIVATE_KEY' },
  dev: { id: '5563672', installation: '177419051', key: 'DEV_PRIVATE_KEY' },
};
const ACTION_ROLE = {
  'po.create-issue': 'po',
  'po.comment-issue': 'po',
  'qa.review-pr': 'qa',
  'dev.commit': 'dev',
  'dev.commit-workflow': 'dev',
  'dev.create-pr': 'dev',
};
const BRANCH = /^(feature|fix|chore|docs|test|refactor|style|ci)\/[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SHA = /^[a-f0-9]{40}$/;
const ACCESS_CLIENT_ID = { po: 'PO_CLIENT_ID', qa: 'QA_CLIENT_ID', dev: 'DEV_CLIENT_ID' };
const BOT_LOGIN = { po: 'shearflow-po[bot]', qa: 'shearflow-qa[bot]', dev: 'shearflow-dev[bot]' };
let signingKeys = { issuer: '', expiresAt: 0, keys: [] };

function executorClientIds(env) {
  const ids = Object.values(ACCESS_CLIENT_ID).map((key) => env[key]);
  return ids.every((id) => typeof id === 'string' && id.length > 0) && new Set(ids).size === ids.length ? ids : null;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function fail(message, status = 400) {
  return json({ error: message }, status);
}

function assertString(value, name, limit = 8192) {
  if (typeof value !== 'string' || !value.trim() || value.length > limit) {
    throw new Error(`Invalid ${name}`);
  }
}

function assertIssue(value) {
  if (!Number.isSafeInteger(value) || value < 1) throw new Error('Invalid issue or PR number');
}

function assertBranch(value) {
  if (typeof value !== 'string' || value.split('/')[1]?.length > 50 || !BRANCH.test(value)) {
    throw new Error('Invalid task branch');
  }
}

function assertPath(path, workflowOnly) {
  assertString(path, 'path', 240);
  const parts = path.split('/');
  if (
    path.startsWith('/') ||
    path.includes('\\') ||
    parts.some(
      (part) =>
        !part ||
        part === '.' ||
        part === '..' ||
        /[<>:"|?*\x00-\x1f]/.test(part) ||
        /[. ]$/.test(part) ||
        /^(?:con|prn|aux|nul|conin\$|conout\$|com[1-9]|lpt[1-9])(?:\..*)?$/i.test(part),
    )
  ) {
    throw new Error('Invalid path');
  }
  if (
    parts.some(
      (part) =>
        part.toLowerCase() === '.git' ||
        part.toLowerCase() === '.env' ||
        /^\.env\.(?!example$|sample$|template$)/i.test(part) ||
        /^(id_rsa|id_ed25519)$/i.test(part) ||
        /\.(pem|key|p12|pfx|jks|keystore)$/i.test(part),
    )
  ) {
    throw new Error('Protected path');
  }
  const isWorkflow = parts.length > 2 && parts[0].toLowerCase() === '.github' && parts[1].toLowerCase() === 'workflows';
  if (isWorkflow !== workflowOnly) {
    throw new Error(workflowOnly ? 'Workflow grant accepts workflow files only' : 'Workflow changes require a separate grant');
  }
}

function assertNoLikelySecret(contents) {
  if (
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,}|\bcfast_[A-Za-z0-9]{40,}|\bAKIA[0-9A-Z]{16}\b/i.test(
      contents,
    )
  ) {
    throw new Error('Likely secret in commit content');
  }
}

export function validateAction(action, input) {
  if (!Object.hasOwn(ACTION_ROLE, action) || !input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Invalid action');
  }
  if (action === 'po.create-issue') {
    assertString(input.title, 'title', 160);
    assertString(input.body, 'body', 20000);
  } else if (action === 'po.comment-issue') {
    assertIssue(input.issueNumber);
    assertString(input.body, 'body', 20000);
  } else if (action === 'qa.review-pr') {
    assertIssue(input.prNumber);
    if (!SHA.test(input.expectedHeadOid ?? '')) throw new Error('Invalid expected PR head');
    assertString(input.body, 'body', 20000);
  } else if (action === 'dev.create-pr') {
    assertIssue(input.issueNumber);
    assertBranch(input.branch);
    if (!SHA.test(input.expectedHeadOid ?? '')) throw new Error('Invalid expected branch head');
    assertString(input.title, 'title', 160);
    assertString(input.body, 'body', 20000);
    if (!new RegExp(`\\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\\s+#${input.issueNumber}\\b`, 'i').test(input.body)) {
      throw new Error('PR must close its tracked issue');
    }
  } else if (action === 'dev.commit' || action === 'dev.commit-workflow') {
    assertIssue(input.issueNumber);
    assertBranch(input.branch);
    if (action === 'dev.commit-workflow') assertString(input.reason, 'workflow change reason', 1000);
    if (action === 'dev.commit' && input.reason !== undefined) throw new Error('Unexpected workflow reason');
    if (!SHA.test(input.expectedHeadOid ?? '')) throw new Error('Invalid expected branch head');
    assertString(input.message, 'commit message', 200);
    if (!Array.isArray(input.files) || input.files.length < 1 || input.files.length > 20) {
      throw new Error('Invalid file count');
    }
    const paths = new Set();
    let bytes = 0;
    for (const file of input.files) {
      assertPath(file?.path, action === 'dev.commit-workflow');
      assertString(file?.contents, 'file contents', 150000);
      if (file.contents.includes('\0')) throw new Error('Binary file content forbidden');
      assertNoLikelySecret(file.contents);
      bytes += new TextEncoder().encode(file.contents).byteLength;
      const folded = file.path.normalize('NFC').toLowerCase();
      if (
        [...paths].some((path) => {
          const prior = path.normalize('NFC').toLowerCase();
          return prior === folded || prior.startsWith(`${folded}/`) || folded.startsWith(`${prior}/`);
        })
      ) {
        throw new Error('Overlapping paths');
      }
      paths.add(file.path);
    }
    if (bytes > 150000) throw new Error('Commit too large');
  }
  if (input.allowWorkflowChanges !== undefined) throw new Error('Unexpected workflow grant flag');
  return ACTION_ROLE[action];
}

function pathIsWorkflow(path) {
  return path.toLowerCase().startsWith('.github/workflows/');
}

export function validateMandate(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid mandate');
  assertString(input.outcome, 'outcome', 2000);
  assertBranch(input.branch);
  if (input.issueNumber !== null && input.issueNumber !== undefined) assertIssue(input.issueNumber);
  if (!Array.isArray(input.allowedPaths) || input.allowedPaths.length < 1 || input.allowedPaths.length > 50) {
    throw new Error('Invalid allowed paths');
  }
  const paths = new Set();
  for (const scope of input.allowedPaths) {
    if (typeof scope !== 'string') throw new Error('Invalid allowed path');
    const isDirectory = scope.endsWith('/');
    const value = isDirectory ? scope.slice(0, -1) : scope;
    assertPath(isDirectory ? `${value}/__scope__.txt` : value, pathIsWorkflow(`${value}/file`));
    if (isDirectory && !value.includes('/')) throw new Error('Repository-wide directory scope forbidden');
    const folded = scope.normalize('NFC').toLowerCase();
    if (paths.has(folded)) throw new Error('Duplicate allowed path');
    paths.add(folded);
  }
  if (!input.actions || typeof input.actions !== 'object' || Array.isArray(input.actions)) throw new Error('Invalid action limits');
  const entries = Object.entries(input.actions);
  if (!entries.length || entries.length > Object.keys(ACTION_ROLE).length) throw new Error('Invalid action limits');
  for (const [action, limit] of entries) {
    if (!Object.hasOwn(ACTION_ROLE, action) || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      throw new Error('Invalid action limit');
    }
  }
  if (input.issueNumber != null && Object.hasOwn(input.actions, 'po.create-issue')) {
    throw new Error('Issue already assigned to mandate');
  }
  if (input.issueNumber == null && input.actions['po.create-issue'] !== 1) {
    throw new Error('New issue mandate requires one PO issue action');
  }
  const ttl = Number(input.ttlSeconds);
  if (!Number.isSafeInteger(ttl) || ttl < 300 || ttl > 30 * 86400) throw new Error('Invalid mandate lifetime');
  return { ...input, issueNumber: input.issueNumber ?? null, ttlSeconds: ttl };
}

export function validateMandateAction(mandate, action, input) {
  const role = validateAction(action, input);
  if (!mandate || mandate.state !== 'active' || mandate.expires_at <= Math.floor(Date.now() / 1000)) {
    throw new Error('Mandate unavailable');
  }
  if (action === 'po.create-issue') {
    if (mandate.issue_number != null) throw new Error('Mandate issue already created');
  } else {
    if (mandate.issue_number == null) throw new Error('Mandate issue not created');
    if (action === 'qa.review-pr') {
      // The PR branch and issue are checked against GitHub during execution.
    } else if (input.issueNumber !== mandate.issue_number) {
      throw new Error('Issue outside mandate');
    }
  }
  if (role === 'dev') {
    if (input.branch !== mandate.branch) throw new Error('Branch outside mandate');
    if (action !== 'dev.create-pr') {
      const scopes = JSON.parse(mandate.allowed_paths_json);
      for (const file of input.files) {
        const path = file.path.normalize('NFC').toLowerCase();
        if (
          !scopes.some((scope) => {
            const allowed = scope.normalize('NFC').toLowerCase();
            return allowed.endsWith('/') ? path.startsWith(allowed) : path === allowed;
          })
        )
          throw new Error('Path outside mandate');
      }
    }
  }
  return role;
}

function verifiedActor(login, role) {
  if (login !== BOT_LOGIN[role]) throw new Error('GitHub actor mismatch');
  return login;
}

function reusedGrant(grant, mandateId, action) {
  return json({
    id: grant.id,
    mandateId,
    action,
    reused: true,
    state: grant.state,
    result: grant.state === 'succeeded' && grant.result_json ? JSON.parse(grant.result_json) : undefined,
  });
}

function decodeBase32(value) {
  if (typeof value !== 'string' || !/^[A-Z2-7]{32,64}$/.test(value)) throw new Error('Owner approval factor unavailable');
  let bits = 0;
  let count = 0;
  const bytes = [];
  for (const character of value) {
    bits = (bits << 5) | 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.indexOf(character);
    count += 5;
    if (count >= 8) {
      count -= 8;
      bytes.push((bits >> count) & 255);
    }
  }
  return Uint8Array.from(bytes);
}

async function approvalStep(code, secret) {
  if (typeof code !== 'string' || !/^[0-9]{6}$/.test(code)) throw new Error('Owner approval code required');
  const key = await crypto.subtle.importKey('raw', decodeBase32(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const current = Math.floor(Date.now() / 30000);
  for (const step of [current, current - 1, current + 1]) {
    const counter = new Uint8Array(8);
    new DataView(counter.buffer).setBigUint64(0, BigInt(step));
    const digest = new Uint8Array(await crypto.subtle.sign('HMAC', key, counter));
    const offset = digest[digest.length - 1] & 15;
    const number = (((digest[offset] & 127) << 24) | (digest[offset + 1] << 16) | (digest[offset + 2] << 8) | digest[offset + 3]) % 1000000;
    if (number.toString().padStart(6, '0') === code) return step;
  }
  throw new Error('Invalid owner approval code');
}

async function checkedOwnerStep(env, actor, code) {
  const attempts = await env.GRANTS.prepare(
    'INSERT INTO owner_approval_attempts (principal, window, attempts) VALUES (?, ?, 1) ON CONFLICT(principal, window) DO UPDATE SET attempts = attempts + 1 WHERE attempts < 5',
  )
    .bind(actor, Math.floor(Date.now() / 86400000))
    .run();
  if (attempts.meta.changes !== 1) throw new Error('Owner approval temporarily locked');
  return approvalStep(code, env.OWNER_APPROVAL_TOTP_KEY);
}

function derLength(length) {
  if (length < 128) return Uint8Array.of(length);
  if (length < 256) return Uint8Array.of(0x81, length);
  return Uint8Array.of(0x82, length >> 8, length & 255);
}

function der(tag, value) {
  return Uint8Array.from([tag, ...derLength(value.length), ...value]);
}

function pkcs8(pem) {
  const pkcs1 = pem.includes('BEGIN RSA PRIVATE KEY');
  const encoded = pem.replace(/-----[^-]+-----|\s/g, '');
  const raw = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
  if (!pkcs1) return raw;
  const algorithm = Uint8Array.from([0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00]);
  return der(0x30, Uint8Array.from([0x02, 0x01, 0x00, ...algorithm, ...der(0x04, raw)]));
}

function base64url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export async function appJwt(app, env) {
  const pem = env[app.key];
  assertString(pem, 'App private key', 5000);
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(new TextEncoder().encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const payload = base64url(new TextEncoder().encode(JSON.stringify({ iat: now - 60, exp: now + 540, iss: app.id })));
  const message = `${header}.${payload}`;
  const key = await crypto.subtle.importKey('pkcs8', pkcs8(pem), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(message));
  return `${message}.${base64url(new Uint8Array(signature))}`;
}

async function github(url, token, method = 'GET', body) {
  const response = await fetch(`https://api.github.com${url}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/vnd.github+json',
      'content-type': 'application/json',
      'x-github-api-version': '2022-11-28',
      'user-agent': 'shearflow-aidd-broker',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`GitHub request failed (${response.status})`);
  return data;
}

async function installationToken(role, action, input, env) {
  const app = APPS[role];
  const jwt = await appJwt(app, env);
  const permissions =
    action === 'po.create-issue' || action === 'po.comment-issue'
      ? { issues: 'write' }
      : action === 'qa.review-pr'
        ? { pull_requests: 'write' }
        : action === 'dev.create-pr'
          ? { pull_requests: 'write', contents: 'read' }
          : action === 'dev.commit-workflow'
            ? { contents: 'write', workflows: 'write' }
            : { contents: 'write' };
  const token = await github(`/app/installations/${app.installation}/access_tokens`, jwt, 'POST', {
    repositories: ['cthub-bsaas'],
    permissions,
  });
  if (token.repository_selection !== 'selected' || token.repositories?.length !== 1 || token.repositories[0].full_name !== REPOSITORY) {
    throw new Error('Installation token scope mismatch');
  }
  for (const [name, level] of Object.entries(permissions)) {
    if (token.permissions?.[name] !== level) throw new Error('Installation token permission mismatch');
  }
  for (const [name, level] of Object.entries(token.permissions ?? {})) {
    if (name !== 'metadata' && permissions[name] !== level) throw new Error('Installation token permission mismatch');
  }
  return token.token;
}

export async function perform(action, input, env, mandate) {
  const role = validateAction(action, input);
  if (mandate) validateMandateAction(mandate, action, input);
  const token = await installationToken(role, action, input, env);
  const repo = `/repos/${REPOSITORY}`;
  if (action === 'po.create-issue') {
    const result = await github(`${repo}/issues`, token, 'POST', { title: input.title, body: input.body });
    return { url: result.html_url, number: result.number, actor: verifiedActor(result.user?.login, role) };
  }
  if (action === 'po.comment-issue') {
    const issue = await github(`${repo}/issues/${input.issueNumber}`, token);
    if (issue.pull_request) throw new Error('PO comment target is a pull request');
    const result = await github(`${repo}/issues/${input.issueNumber}/comments`, token, 'POST', { body: input.body });
    return { url: result.html_url, id: result.id, actor: verifiedActor(result.user?.login, role) };
  }
  if (action === 'qa.review-pr') {
    const pr = await github(`${repo}/pulls/${input.prNumber}`, token);
    if (pr.head?.sha !== input.expectedHeadOid || pr.state !== 'open') throw new Error('PR head changed');
    if (
      mandate &&
      (pr.head?.repo?.full_name !== REPOSITORY ||
        pr.base?.repo?.full_name !== REPOSITORY ||
        pr.head?.ref !== mandate.branch ||
        pr.base?.ref !== 'main' ||
        !new RegExp(`\\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\\s+#${mandate.issue_number}\\b`, 'i').test(pr.body ?? ''))
    )
      throw new Error('PR outside mandate');
    if (mandate) {
      const ref = await github(`${repo}/git/ref/heads/${mandate.branch}`, token);
      if (ref.ref !== `refs/heads/${mandate.branch}` || ref.object?.sha !== input.expectedHeadOid) {
        throw new Error('PR branch outside mandate');
      }
    }
    const result = await github(`${repo}/pulls/${input.prNumber}/reviews`, token, 'POST', {
      event: 'COMMENT',
      body: input.body,
      commit_id: input.expectedHeadOid,
    });
    if (result.commit_id !== input.expectedHeadOid) throw new Error('Review commit mismatch');
    const current = await github(`${repo}/pulls/${input.prNumber}`, token);
    if (
      current.head?.sha !== input.expectedHeadOid ||
      (mandate &&
        (current.head?.repo?.full_name !== REPOSITORY ||
          current.base?.repo?.full_name !== REPOSITORY ||
          current.head?.ref !== mandate.branch ||
          current.base?.ref !== 'main'))
    ) {
      throw new Error('PR changed after review');
    }
    return { url: result.html_url, id: result.id, headOid: input.expectedHeadOid, actor: verifiedActor(result.user?.login, role) };
  }
  if (action === 'dev.create-pr') {
    const branch = await github(`${repo}/git/ref/heads/${input.branch}`, token);
    if (branch.ref !== `refs/heads/${input.branch}` || branch.object?.sha !== input.expectedHeadOid) {
      throw new Error('Branch head changed');
    }
    const result = await github(`${repo}/pulls`, token, 'POST', {
      head: input.branch,
      base: 'main',
      title: input.title,
      body: input.body,
    });
    if (
      result.head?.sha !== input.expectedHeadOid ||
      result.head?.repo?.full_name !== REPOSITORY ||
      result.base?.repo?.full_name !== REPOSITORY
    )
      throw new Error('PR head changed during creation');
    return { url: result.html_url, number: result.number, actor: verifiedActor(result.user?.login, role) };
  }
  const refPath = `${repo}/git/ref/heads/${input.branch}`;
  const expectedRef = `refs/heads/${input.branch}`;
  let branch;
  try {
    branch = await github(refPath, token);
  } catch (error) {
    if (error.message !== 'GitHub request failed (404)') throw error;
    const base = await github(`${repo}/git/ref/heads/main`, token);
    if (base.ref !== 'refs/heads/main' || base.object?.sha !== input.expectedHeadOid) {
      throw new Error('Task branch base changed');
    }
    branch = await github(`${repo}/git/refs`, token, 'POST', {
      ref: expectedRef,
      sha: input.expectedHeadOid,
    });
  }
  if (branch.ref !== expectedRef || branch.object?.type !== 'commit' || branch.object.sha !== input.expectedHeadOid) {
    throw new Error('Branch head changed');
  }
  const parent = await github(`${repo}/git/commits/${input.expectedHeadOid}`, token);
  if (!SHA.test(parent.tree?.sha ?? '')) throw new Error('Invalid parent tree');
  const baseTree = await github(`${repo}/git/trees/${parent.tree.sha}?recursive=1`, token);
  if (baseTree.truncated || !Array.isArray(baseTree.tree)) throw new Error('Parent tree unavailable');
  const existing = new Map(baseTree.tree.map((entry) => [entry.path, entry]));
  const foldedExisting = new Map();
  const ambiguousPaths = new Set();
  for (const entry of baseTree.tree) {
    const folded = entry.path.normalize('NFC').toLowerCase();
    if (foldedExisting.has(folded) && foldedExisting.get(folded) !== entry.path) ambiguousPaths.add(folded);
    else foldedExisting.set(folded, entry.path);
  }
  for (const file of input.files) {
    const current = existing.get(file.path);
    if (current && (current.type !== 'blob' || current.mode !== '100644')) throw new Error('Non-regular file target');
    const parts = file.path.split('/');
    for (let index = 1; index <= parts.length; index += 1) {
      const parentPath = parts.slice(0, index).join('/');
      const folded = parentPath.normalize('NFC').toLowerCase();
      if (ambiguousPaths.has(folded) || (foldedExisting.has(folded) && foldedExisting.get(folded) !== parentPath)) {
        throw new Error('Case-colliding path');
      }
      if (index === parts.length) continue;
      const ancestor = existing.get(parentPath);
      if (ancestor && ancestor.type !== 'tree') throw new Error('Non-directory ancestor');
    }
  }
  const tree = await github(`${repo}/git/trees`, token, 'POST', {
    base_tree: parent.tree.sha,
    tree: input.files.map((file) => ({ path: file.path, mode: '100644', type: 'blob', content: file.contents })),
  });
  if (!SHA.test(tree.sha ?? '')) throw new Error('Invalid created tree');
  const message = `${input.message}\n\n${input.reason ? `${input.reason}\n\n` : ''}Refs #${input.issueNumber}`;
  const commit = await github(`${repo}/git/commits`, token, 'POST', {
    message,
    tree: tree.sha,
    parents: [input.expectedHeadOid],
  });
  if (!SHA.test(commit.sha ?? '')) throw new Error('Invalid created commit');
  const comparison = await github(`${repo}/compare/${input.expectedHeadOid}...${commit.sha}`, token);
  const expectedPaths = new Set(input.files.map((file) => file.path));
  if (
    !Array.isArray(comparison.files) ||
    comparison.files.length !== expectedPaths.size ||
    new Set(comparison.files.map((file) => file.filename)).size !== expectedPaths.size ||
    comparison.files.some((file) => !expectedPaths.has(file.filename) || !['added', 'modified'].includes(file.status))
  ) {
    throw new Error('Commit changed paths outside grant');
  }
  const current = await github(refPath, token);
  if (current.ref !== expectedRef || current.object?.sha !== input.expectedHeadOid) throw new Error('Branch head changed');
  const repository = await github(repo, token);
  if (repository.full_name !== REPOSITORY || typeof repository.node_id !== 'string') throw new Error('Repository identity mismatch');
  const updated = await github('/graphql', token, 'POST', {
    query: 'mutation UpdateRefs($input: UpdateRefsInput!) { updateRefs(input: $input) { clientMutationId } }',
    variables: {
      input: {
        repositoryId: repository.node_id,
        refUpdates: [{ name: expectedRef, beforeOid: input.expectedHeadOid, afterOid: commit.sha, force: false }],
      },
    },
  });
  if (updated.errors?.length || !updated.data?.updateRefs) throw new Error('GitHub ref compare-and-swap failed');
  const published = await github(`${repo}/commits/${commit.sha}`, token);
  return {
    url: `https://github.com/${REPOSITORY}/commit/${commit.sha}`,
    oid: commit.sha,
    actor: verifiedActor(published.author?.login, role),
  };
}

function jwtBytes(part) {
  if (!/^[A-Za-z0-9_-]+$/.test(part)) throw new Error('Invalid Access JWT encoding');
  const value = part.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(value.padEnd(Math.ceil(value.length / 4) * 4, '=')), (char) => char.charCodeAt(0));
}

function jwtJson(part) {
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(jwtBytes(part)));
}

async function accessSigningKeys(env, refresh = false) {
  if (!refresh && signingKeys.issuer === env.ACCESS_ISSUER && signingKeys.expiresAt > Date.now()) return signingKeys.keys;
  const response = await fetch(`${env.ACCESS_ISSUER}/cdn-cgi/access/certs`, { redirect: 'manual' });
  if (!response.ok) throw new Error('Access signing keys unavailable');
  const data = await response.json();
  if (!Array.isArray(data.keys) || data.keys.length < 1 || data.keys.length > 5) throw new Error('Invalid Access signing keys');
  signingKeys = { issuer: env.ACCESS_ISSUER, expiresAt: Date.now() + 300000, keys: data.keys };
  return signingKeys.keys;
}

async function verifiedServiceClientId(token, env) {
  if (typeof token !== 'string' || token.length > 8192) return null;
  const parts = token.split('.');
  if (parts.length !== 3 || parts.some((part) => !part)) return null;
  try {
    const header = jwtJson(parts[0]);
    const claims = jwtJson(parts[1]);
    if (header.alg !== 'RS256' || typeof header.kid !== 'string' || !header.kid) return null;
    const now = Math.floor(Date.now() / 1000);
    if (
      claims.iss !== env.ACCESS_ISSUER ||
      !(Array.isArray(claims.aud) ? claims.aud.includes(env.ACCESS_AUD) : claims.aud === env.ACCESS_AUD) ||
      !Number.isSafeInteger(claims.exp) ||
      claims.exp <= now ||
      !Number.isSafeInteger(claims.iat) ||
      claims.iat > now + 60 ||
      claims.exp - claims.iat > 86400 ||
      (claims.nbf !== undefined && (!Number.isSafeInteger(claims.nbf) || claims.nbf > now)) ||
      claims.sub !== '' ||
      typeof claims.common_name !== 'string'
    ) {
      return null;
    }
    const allowed = executorClientIds(env)?.includes(claims.common_name);
    if (!allowed) return null;
    let keys = await accessSigningKeys(env);
    let jwk = keys.find((key) => key.kid === header.kid);
    if (!jwk) {
      keys = await accessSigningKeys(env, true);
      jwk = keys.find((key) => key.kid === header.kid);
    }
    if (jwk?.kty !== 'RSA' || (jwk.alg && jwk.alg !== 'RS256')) return null;
    const publicKey = await crypto.subtle.importKey(
      'jwk',
      { kty: 'RSA', n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const valid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      publicKey,
      jwtBytes(parts[2]),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
    );
    return valid ? claims.common_name : null;
  } catch {
    return null;
  }
}

async function principal(request, ctx, env) {
  if (!ctx?.access || !env.ACCESS_AUD || ctx.access.aud !== env.ACCESS_AUD) return null;
  const identity = await ctx.access.getIdentity();
  if (identity?.service_token_status === true) {
    const id = identity.service_token_id;
    return typeof id === 'string' && executorClientIds(env)?.includes(id) ? `service:${id}` : null;
  }
  if (typeof identity?.email === 'string' && identity.email) return `user:${identity.email.toLowerCase()}`;
  const id = await verifiedServiceClientId(request.headers.get('cf-access-jwt-assertion'), env);
  return id ? `service:${id}` : null;
}

async function readJsonLimited(request) {
  if (!request.body) throw new Error('Invalid JSON');
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 200000) {
      await reader.cancel();
      throw new Error('Request too large');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/health' && request.method === 'GET') return json({ enabled: env.BROKER_ENABLED === 'true' });
    if (url.pathname === '/v1/whoami' && request.method === 'GET') {
      const actor = await principal(request, ctx, env);
      if (!actor) return fail('Access required', 403);
      return json({ principal: actor, admin: actor === env.ADMIN_PRINCIPAL, enabled: env.BROKER_ENABLED === 'true' });
    }
    if (env.BROKER_ENABLED !== 'true') return fail('Broker disabled', 503);
    const actor = await principal(request, ctx, env);
    if (!actor) return fail('Access required', 403);
    if (!env.GRANTS) return fail('Grant store unavailable', 503);
    if (request.method !== 'POST') return fail('Not found', 404);
    if (request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase() !== 'application/json') {
      return fail('JSON content type required', 415);
    }
    if (actor.startsWith('user:') && request.headers.get('origin') !== url.origin) {
      return fail('Same-origin request required', 403);
    }
    let body;
    try {
      body = await readJsonLimited(request);
    } catch (error) {
      return fail(
        error.message === 'Request too large' ? error.message : 'Invalid JSON',
        error.message === 'Request too large' ? 413 : 400,
      );
    }
    if (url.pathname === '/v1/mandates') {
      if (actor !== env.ADMIN_PRINCIPAL) return fail('Admin required', 403);
      try {
        const mandate = validateMandate(body);
        const step = await checkedOwnerStep(env, actor, body.approvalCode);
        const id = crypto.randomUUID();
        const expires = Math.floor(Date.now() / 1000) + mandate.ttlSeconds;
        const statements = [
          env.GRANTS.prepare(
            "INSERT INTO task_mandates (id, outcome, issue_number, branch, allowed_paths_json, expires_at, state, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)",
          ).bind(
            id,
            mandate.outcome,
            mandate.issueNumber,
            mandate.branch,
            JSON.stringify(mandate.allowedPaths),
            expires,
            actor,
            new Date().toISOString(),
          ),
        ];
        statements.push(env.GRANTS.prepare('INSERT INTO owner_approval_steps (step, mandate_id) VALUES (?, ?)').bind(step, id));
        for (const [action, limit] of Object.entries(mandate.actions)) {
          statements.push(
            env.GRANTS.prepare('INSERT INTO mandate_action_usage (mandate_id, action, max_issued) VALUES (?, ?, ?)').bind(
              id,
              action,
              limit,
            ),
          );
        }
        await env.GRANTS.batch(statements);
        return json(
          { id, issueNumber: mandate.issueNumber, branch: mandate.branch, expiresAt: new Date(expires * 1000).toISOString() },
          201,
        );
      } catch (error) {
        return fail(error.message, error.message === 'Owner approval temporarily locked' ? 429 : 400);
      }
    }
    if (url.pathname === '/v1/mandates/revoke') {
      if (actor !== env.ADMIN_PRINCIPAL) return fail('Admin required', 403);
      if (typeof body?.mandateId !== 'string' || !/^[0-9a-f-]{36}$/.test(body.mandateId)) return fail('Invalid mandate ID');
      try {
        const step = await checkedOwnerStep(env, actor, body.approvalCode);
        const [used, update] = await env.GRANTS.batch([
          env.GRANTS.prepare('INSERT INTO owner_approval_steps (step, mandate_id) VALUES (?, ?)').bind(step, body.mandateId),
          env.GRANTS.prepare("UPDATE task_mandates SET state = 'revoked', revoked_at = ? WHERE id = ? AND state = 'active'").bind(
            new Date().toISOString(),
            body.mandateId,
          ),
        ]);
        return used.meta.changes === 1 && update.meta.changes === 1
          ? json({ id: body.mandateId, state: 'revoked' })
          : fail('Mandate unavailable', 409);
      } catch (error) {
        return fail(error.message, error.message === 'Owner approval temporarily locked' ? 429 : 400);
      }
    }
    if (url.pathname === '/v1/task-grants') {
      const id = body?.mandateId;
      if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/.test(id)) return fail('Invalid mandate ID');
      try {
        const role = validateAction(body.action, body.input);
        if (
          typeof body.requestId !== 'string' ||
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(body.requestId)
        ) {
          throw new Error('Valid idempotency request ID required');
        }
        if (actor !== `service:${env[ACCESS_CLIENT_ID[role]]}` || !executorClientIds(env)) {
          return fail('Role identity required', 403);
        }
        const mandate = await env.GRANTS.prepare('SELECT * FROM task_mandates WHERE id = ?').bind(id).first();
        validateMandateAction(mandate, body.action, body.input);
        const requestHash = base64url(
          new Uint8Array(
            await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify({ action: body.action, input: body.input }))),
          ),
        );
        const existing = await env.GRANTS.prepare(
          'SELECT id, request_hash, executor, state, result_json FROM grants WHERE mandate_id = ? AND request_id = ?',
        )
          .bind(id, body.requestId)
          .first();
        if (existing) {
          if (existing.request_hash !== requestHash || existing.executor !== actor) return fail('Idempotency request mismatch', 409);
          return reusedGrant(existing, id, body.action);
        }
        const grantId = crypto.randomUUID();
        const expires = Math.min(Math.floor(Date.now() / 1000) + 600, mandate.expires_at);
        const insert = env.GRANTS.prepare(
          "INSERT INTO grants (id, action, role, executor, input_json, expires_at, state, created_by, mandate_id, request_id, request_hash) SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM mandate_action_usage WHERE mandate_id = ? AND action = ? AND issued < max_issued) AND EXISTS (SELECT 1 FROM task_mandates WHERE id = ? AND state = 'active' AND expires_at > ?)",
        ).bind(
          grantId,
          body.action,
          role,
          actor,
          JSON.stringify(body.input),
          expires,
          'approved',
          mandate.created_by,
          id,
          body.requestId,
          requestHash,
          id,
          body.action,
          id,
          Math.floor(Date.now() / 1000),
        );
        const increment = env.GRANTS.prepare(
          'UPDATE mandate_action_usage SET issued = issued + 1 WHERE mandate_id = ? AND action = ? AND issued < max_issued AND EXISTS (SELECT 1 FROM grants WHERE id = ?)',
        ).bind(id, body.action, grantId);
        try {
          const [created, counted] = await env.GRANTS.batch([insert, increment]);
          if (created.meta.changes !== 1 || counted.meta.changes !== 1) return fail('Mandate action limit reached', 409);
        } catch (error) {
          const concurrent = await env.GRANTS.prepare(
            'SELECT id, request_hash, executor, state, result_json FROM grants WHERE mandate_id = ? AND request_id = ?',
          )
            .bind(id, body.requestId)
            .first();
          if (concurrent?.request_hash === requestHash && concurrent.executor === actor) {
            return reusedGrant(concurrent, id, body.action);
          }
          throw error;
        }
        return json({ id: grantId, mandateId: id, action: body.action, expiresAt: new Date(expires * 1000).toISOString() }, 201);
      } catch (error) {
        return fail(error.message);
      }
    }
    if (url.pathname === '/v1/execute') {
      const id = body?.grantId;
      if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/.test(id)) return fail('Invalid grant ID');
      const claim = await env.GRANTS.prepare(
        "UPDATE grants SET state = 'running', started_at = ? WHERE id = ? AND executor = ? AND state = 'approved' AND expires_at > ? AND mandate_id IS NOT NULL AND EXISTS (SELECT 1 FROM task_mandates WHERE id = grants.mandate_id AND state = 'active' AND expires_at > ?)",
      )
        .bind(new Date().toISOString(), id, actor, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000))
        .run();
      if (claim.meta.changes !== 1) return fail('Grant unavailable', 409);
      const grant = await env.GRANTS.prepare('SELECT action, input_json, mandate_id FROM grants WHERE id = ?').bind(id).first();
      try {
        const mandate =
          grant.mandate_id && (await env.GRANTS.prepare('SELECT * FROM task_mandates WHERE id = ?').bind(grant.mandate_id).first());
        if (!mandate) throw new Error('Mandate unavailable');
        const result = await perform(grant.action, JSON.parse(grant.input_json), env, mandate);
        if (grant.mandate_id && grant.action === 'po.create-issue') {
          const bound = await env.GRANTS.prepare('UPDATE task_mandates SET issue_number = ? WHERE id = ? AND issue_number IS NULL')
            .bind(result.number, grant.mandate_id)
            .run();
          if (bound.meta.changes !== 1) throw new Error('Mandate issue binding failed');
        }
        await env.GRANTS.prepare("UPDATE grants SET state = 'succeeded', input_json = '{}', result_json = ?, finished_at = ? WHERE id = ?")
          .bind(JSON.stringify(result), new Date().toISOString(), id)
          .run();
        return json({ grantId: id, result });
      } catch (error) {
        const reason =
          error instanceof Error &&
          (/^GitHub request failed \(\d{3}\)$/.test(error.message) ||
            [
              'Installation token scope mismatch',
              'Installation token permission mismatch',
              'Branch head changed',
              'Invalid parent tree',
              'Parent tree unavailable',
              'Non-regular file target',
              'Non-directory ancestor',
              'Case-colliding path',
              'Invalid created tree',
              'Invalid created commit',
              'Commit changed paths outside grant',
              'Repository identity mismatch',
              'GitHub ref compare-and-swap failed',
              'GitHub actor mismatch',
              'PR outside mandate',
              'Mandate issue binding failed',
            ].includes(error.message))
            ? error.message
            : 'Unclassified action failure';
        console.error(JSON.stringify({ event: 'broker-action-failed', grantId: id, action: grant.action, reason }));
        await env.GRANTS.prepare("UPDATE grants SET state = 'needs-reconciliation', finished_at = ? WHERE id = ?")
          .bind(new Date().toISOString(), id)
          .run();
        return fail('Action did not complete; reconcile the grant before any retry', 502);
      }
    }
    return fail('Not found', 404);
  },
  async scheduled(_event, env) {
    if (!env.GRANTS) return;
    const now = Math.floor(Date.now() / 1000);
    await env.GRANTS.prepare("UPDATE grants SET state = 'needs-reconciliation' WHERE state = 'running' AND expires_at < ?")
      .bind(now - 3600)
      .run();
    await env.GRANTS.prepare("UPDATE grants SET input_json = '{}' WHERE state = 'needs-reconciliation' AND expires_at < ?")
      .bind(now - 7 * 86400)
      .run();
    await env.GRANTS.prepare("DELETE FROM grants WHERE state = 'approved' AND expires_at < ?")
      .bind(now - 7 * 86400)
      .run();
    await env.GRANTS.prepare("DELETE FROM grants WHERE state IN ('succeeded', 'needs-reconciliation') AND expires_at < ?")
      .bind(now - 30 * 86400)
      .run();
    const cutoff = now - 30 * 86400;
    const retired =
      'SELECT id FROM task_mandates WHERE expires_at < ? AND NOT EXISTS (SELECT 1 FROM grants WHERE grants.mandate_id = task_mandates.id)';
    await env.GRANTS.batch([
      env.GRANTS.prepare('DELETE FROM owner_approval_attempts WHERE window < ?').bind(Math.floor(Date.now() / 86400000) - 30),
      env.GRANTS.prepare(`DELETE FROM owner_approval_steps WHERE mandate_id IN (${retired})`).bind(cutoff),
      env.GRANTS.prepare(`DELETE FROM mandate_action_usage WHERE mandate_id IN (${retired})`).bind(cutoff),
      env.GRANTS.prepare(`DELETE FROM task_mandates WHERE id IN (${retired})`).bind(cutoff),
    ]);
  },
};
