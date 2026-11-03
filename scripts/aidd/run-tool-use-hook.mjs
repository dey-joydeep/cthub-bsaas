import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const input = readFileSync(0, 'utf8');
const mode = process.argv[2];
const adapter = fileURLToPath(
  new URL(mode === 'codex' ? '../../.codex/hooks/pre_tool_use_policy.py' : '../../.agents/hooks/pre_tool_use_policy.py', import.meta.url),
);
const candidates =
  process.platform === 'win32'
    ? [
        ['python', '-B'],
        ['py', '-3', '-B'],
      ]
    : [
        ['python3', '-B'],
        ['python', '-B'],
      ];

let response;
for (const [executable, ...prefix] of candidates) {
  const result = spawnSync(executable, [...prefix, adapter], {
    input,
    encoding: 'utf8',
    timeout: 8000,
    windowsHide: true,
  });
  if (result.error || result.status !== 0) continue;
  try {
    if (mode === 'codex' && !result.stdout.trim()) {
      response = '';
      break;
    }
    const parsed = JSON.parse(result.stdout);
    if (mode === 'antigravity' && ['allow', 'deny'].includes(parsed.decision)) response = result.stdout;
    if (mode === 'codex' && parsed.hookSpecificOutput?.hookEventName === 'PreToolUse') response = result.stdout;
    if (response !== undefined) break;
  } catch {
    // Try another installed Python interpreter before failing closed.
  }
}

if (response === undefined) {
  const reason = 'Repository hook could not run; install Python 3 and retry.';
  if (mode === 'codex') {
    let eventName = 'PreToolUse';
    try {
      eventName = JSON.parse(input).hook_event_name ?? eventName;
    } catch {
      // Use the default event name for malformed input.
    }
    response = JSON.stringify({
      hookSpecificOutput: { hookEventName: eventName, permissionDecision: 'deny', permissionDecisionReason: reason },
    });
  } else {
    response = JSON.stringify({ decision: 'deny', reason });
  }
}
if (response) process.stdout.write(`${response.trim()}\n`);
