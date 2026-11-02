import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const options = {
  model: 'gemini-3.8-flash-medium',
  dryRun: false,
};

function fail(message) {
  console.error(message);
  process.exit(1);
}

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === '--dry-run') {
    options.dryRun = true;
    continue;
  }
  if (!['--agent', '--prompt-file', '--model'].includes(arg)) {
    fail(`Unknown argument: ${arg}`);
  }
  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    fail(`Missing value for ${arg}`);
  }
  options[arg.slice(2).replace('-file', 'File')] = value;
  index += 1;
}

if (!options.agent || !options.promptFile) {
  fail('Usage: node scripts/aidd/run-agy-agent.mjs --agent <name> --prompt-file <path> [--model <slug>] [--dry-run]');
}
if (!/^[a-z][a-z0-9-]*$/.test(options.agent)) {
  fail('Agent name must be a repository agent identifier.');
}

if (!/^gemini-(3\.8-flash|4-argon)-(low|medium|high)$/.test(options.model)) {
  fail(`Model ${options.model} is below or outside the Gemini 3.8 Flash minimum policy.`);
}

const agentPath = resolve('.agents', 'agents', `${options.agent}.md`);
const promptPath = resolve(options.promptFile);
if (!existsSync(agentPath)) {
  fail(`Unknown repository agent: ${options.agent}`);
}
if (!existsSync(promptPath)) {
  fail(`Prompt file not found: ${promptPath}`);
}

const profile = readFileSync(agentPath, 'utf8');
if (!/^model:\s*inherit\s*$/m.test(profile)) {
  fail(`Agent ${options.agent} must inherit the pinned model.`);
}
if (!/^mainAgent:\s*true\s*$/m.test(profile)) {
  fail(`Agent ${options.agent} is not selectable with agy --agent; set mainAgent: true or delegate it from a main agent.`);
}

const prompt = readFileSync(promptPath, 'utf8').trim();
if (!prompt) {
  fail('Prompt file is empty.');
}

if (options.dryRun) {
  console.log(`AGY agent: ${options.agent}; model: ${options.model}; prompt file: ${promptPath}`);
  process.exit(0);
}

const available = spawnSync('agy', ['models'], { encoding: 'utf8' });
if (available.error || available.status !== 0) {
  fail(`Unable to verify Antigravity models: ${available.error?.message ?? available.stderr}`);
}
if (!available.stdout.split(/\r?\n/).some((line) => line.split(/\s+/)[0] === options.model)) {
  fail(`Model ${options.model} is not available in this Antigravity installation.`);
}

const result = spawnSync('agy', ['--print', prompt, '--agent', options.agent, '--model', options.model, '--output-format', 'json'], {
  stdio: 'inherit',
});
if (result.error) {
  fail(`Unable to launch Antigravity: ${result.error.message}`);
}
process.exit(result.status ?? 1);
