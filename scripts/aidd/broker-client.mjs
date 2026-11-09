import { mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const endpoint = 'https://shearflow-aidd-broker.dey-joydeep-cse.workers.dev';
const bot = { po: 'shearflow-po[bot]', qa: 'shearflow-qa[bot]', dev: 'shearflow-dev[bot]' };

function options(args) {
  const result = {};
  for (let index = 0; index < args.length; index += 2) {
    if (!args[index]?.startsWith('--') || !args[index + 1]) throw new Error('Expected named options');
    result[args[index].slice(2)] = args[index + 1];
  }
  return result;
}

async function request(path, credentials, body) {
  const response = await fetch(`${endpoint}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      'CF-Access-Client-Id': credentials.clientId,
      'CF-Access-Client-Secret': credentials.clientSecret,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: 'manual',
  });
  if (!response.headers.get('content-type')?.startsWith('application/json')) {
    throw new Error(`Broker returned non-JSON response (${response.status})`);
  }
  const result = await response.json();
  if (!response.ok) throw new Error(`Broker request failed (${response.status}): ${result.error ?? 'unknown error'}`);
  return result;
}

export async function runBrokerAction({ role, mandateId, action, input, credentials, requestId = crypto.randomUUID() }) {
  if (!Object.hasOwn(bot, role) || !action?.startsWith(`${role}.`)) throw new Error('Role and action mismatch');
  if (!/^[0-9a-f-]{36}$/.test(mandateId ?? '')) throw new Error('Invalid mandate ID');
  if (typeof credentials?.clientId !== 'string' || typeof credentials?.clientSecret !== 'string') {
    throw new Error('Role service credentials unavailable');
  }
  const identity = await request('/v1/whoami', credentials);
  if (!identity.enabled || identity.admin || identity.principal !== `service:${credentials.clientId}`) {
    throw new Error('Broker role identity unavailable or disabled');
  }
  let grant;
  try {
    grant = await request('/v1/task-grants', credentials, { mandateId, action, input, requestId });
  } catch (error) {
    throw new Error(`Grant request ${requestId} failed; reuse that ID for a safe retry: ${error.message}`);
  }
  if (grant.state === 'succeeded') {
    if (grant.result?.actor !== bot[role]) throw new Error(`Grant ${grant.id} actor mismatch; reconcile before another attempt`);
    return { requestId, grantId: grant.id, action, ...grant.result };
  }
  if (grant.reused && grant.state !== 'approved') {
    throw new Error(`Grant ${grant.id} is ${grant.state}; reconcile before another attempt`);
  }
  let execution;
  try {
    execution = await request('/v1/execute', credentials, { grantId: grant.id });
  } catch (error) {
    throw new Error(`Grant ${grant.id} needs reconciliation before another attempt: ${error.message}`);
  }
  if (execution.result?.actor !== bot[role]) throw new Error('GitHub actor mismatch; reconcile the grant');
  return { requestId, grantId: grant.id, action, actor: execution.result.actor, ...execution.result };
}

async function main() {
  const args = options(process.argv.slice(2));
  const role = args.role;
  if (!Object.hasOwn(bot, role)) throw new Error('Choose --role po, qa, or dev');
  const tokenFile = process.env.SHEARFLOW_BROKER_ROLE_TOKEN_FILE;
  if (!tokenFile) throw new Error('Set SHEARFLOW_BROKER_ROLE_TOKEN_FILE outside the repository');
  const repositoryRoot = await realpath(resolve(dirname(fileURLToPath(import.meta.url)), '../..'));
  const tokenPath = await realpath(tokenFile);
  const location = relative(dirname(repositoryRoot), tokenPath);
  if (!location || (!isAbsolute(location) && location !== '..' && !location.startsWith(`..${sep}`))) {
    throw new Error('Role token file must be outside the workspace parent');
  }
  const credentials = JSON.parse(await readFile(tokenPath, 'utf8'));
  if (credentials.role !== role) throw new Error('Token file role mismatch');
  if (args.command === 'whoami') {
    const identity = await request('/v1/whoami', credentials);
    if (identity.principal !== `service:${credentials.clientId}`) throw new Error('Role identity mismatch');
    process.stdout.write(`${JSON.stringify(identity)}\n`);
    return;
  }
  if (args.command !== 'run' || !args.input || !args.mandate || !args.action) {
    throw new Error('Use --command run --role <role> --mandate <id> --action <role.action> --input <json-file>');
  }
  const input = JSON.parse(await readFile(args.input, 'utf8'));
  const pendingPath = resolve(
    execFileSync('git', ['rev-parse', '--git-path', `aidd-broker/pending-${role}.json`], { encoding: 'utf8' }).trim(),
  );
  const payloadHash = createHash('sha256')
    .update(JSON.stringify({ mandateId: args.mandate, action: args.action, input }))
    .digest('hex');
  let previous;
  try {
    previous = JSON.parse(await readFile(pendingPath, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (previous?.state === 'pending' && previous.payloadHash !== payloadHash) {
    throw new Error(`Pending broker request ${previous.requestId} must be reconciled before changing the action`);
  }
  const requestId = previous?.state === 'pending' ? previous.requestId : (args['request-id'] ?? crypto.randomUUID());
  await mkdir(dirname(pendingPath), { recursive: true });
  await writeFile(pendingPath, `${JSON.stringify({ requestId, payloadHash, state: 'pending' })}\n`, { encoding: 'utf8', mode: 0o600 });
  const result = await runBrokerAction({
    role,
    mandateId: args.mandate,
    action: args.action,
    input,
    credentials,
    requestId,
  });
  if (args.receipt) {
    const path = resolve(args.receipt);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, `${JSON.stringify(result)}\n`, { encoding: 'utf8', mode: 0o600 });
  } else if (args.action === 'dev.commit') {
    const path = resolve(execFileSync('git', ['rev-parse', '--git-path', 'aidd-broker/receipt.json'], { encoding: 'utf8' }).trim());
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, `${JSON.stringify(result)}\n`, { encoding: 'utf8', mode: 0o600 });
  }
  await writeFile(pendingPath, `${JSON.stringify({ requestId, payloadHash, state: 'completed', grantId: result.grantId })}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
