#!/usr/bin/env python3
"""Codex pre-tool policy hook for repository guardrails."""

import json
import re
import sys

BLOCKED_PATH_NAMES = (
    'node_modules',
    'dist',
    'coverage',
    '.nx',
)

WARN_PATH_FRAGMENTS = (
    'package.json',
    'package-lock.json',
    'prisma/schema.prisma',
)


def output(payload):
    print(json.dumps(payload))


def deny(event_name, reason):
    output({
        'hookSpecificOutput': {
            'hookEventName': event_name,
            'permissionDecision': 'deny',
            'permissionDecisionReason': reason,
        }
    })


def warn(event_name, message):
    output({
        'hookSpecificOutput': {
            'hookEventName': event_name,
            'additionalContext': message,
        }
    })


def normalize(value):
    return str(value).replace('\\', '/')


def tokenize_command(text):
    return [
        token.strip('\'"(),')
        for token in text.split()
        if token.strip('\'"(),')
    ]


def collect_text(value):
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        return ' '.join(collect_text(item) for item in value.values())
    if isinstance(value, list):
        return ' '.join(collect_text(item) for item in value)
    return ''


def token_mentions_blocked_path(token):
    lowered = token.lower()
    if any(f'!{name}' in lowered for name in BLOCKED_PATH_NAMES):
        return False

    for name in BLOCKED_PATH_NAMES:
        if re.search(rf'(^|/){re.escape(name)}(/|$)', lowered):
            return True
    return False


def has_blocked_path_reference(text):
    return any(token_mentions_blocked_path(token) for token in tokenize_command(text))


def patch_targets(text):
    references = re.findall(r'\btools\.([a-zA-Z_]\w*)', text)
    direct_patch = text.lstrip().startswith('*** Begin Patch')
    if not direct_patch and (references != ['apply_patch'] or 'tools[' in text):
        return None
    expanded = text.replace('\\n', '\n')
    if '*** Begin Patch' not in expanded or '*** End Patch' not in expanded:
        return None
    targets = re.findall(r'^\*\*\* (?:Add|Update|Delete|Move to) File:\s*(.+?)\s*$', expanded, re.MULTILINE)
    return targets or None


def has_rm_rf_variant(command):
    tokens = tokenize_command(command.lower())
    for index, token in enumerate(tokens):
        if token != 'rm':
            continue

        flags = ''
        for option in tokens[index + 1:]:
            if option.startswith('-'):
                flags += option.replace('-', '')
                continue
            break

        if 'f' in flags and any(flag in flags for flag in ('r', 'R')):
            return True
    return False


def has_git_clean_force(command):
    tokens = tokenize_command(command.lower())
    for index in range(len(tokens) - 1):
        if tokens[index] != 'git' or tokens[index + 1] != 'clean':
            continue

        flags = ''
        for option in tokens[index + 2:]:
            if option.startswith('-'):
                flags += option.replace('-', '')
                continue
            break

        if 'f' in flags:
            return True
    return False


def is_destructive_command(command):
    normalized_command = command.lower()
    return (
        has_rm_rf_variant(normalized_command)
        or re.search(r'\bgit\s+reset\s+--hard\b', normalized_command)
        or has_git_clean_force(normalized_command)
        or re.search(r'\bprisma\s+migrate\s+reset\b', normalized_command)
    )


def main():
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return

    event_name = payload.get('hook_event_name', 'PreToolUse')
    tool_input = payload.get('tool_input') or {}
    text = normalize(collect_text(tool_input))

    targets = patch_targets(text)
    checked_text = ' '.join(targets) if targets is not None else text

    if has_blocked_path_reference(checked_text):
        deny(event_name, 'Repository policy blocks edits or commands touching generated or cache directories.')
        return

    command = normalize(tool_input.get('command', '')) if isinstance(tool_input, dict) else text
    command = command or text
    if targets is None and is_destructive_command(command):
        deny(event_name, 'Repository policy blocks destructive commands without explicit manual handling.')
        return

    warnings = [fragment for fragment in WARN_PATH_FRAGMENTS if fragment in checked_text]
    if warnings:
        warn(event_name, f'Repository policy notice: this action touches high-impact files: {", ".join(warnings)}. Confirm AIDD traceability and validation before completion.')
        return


if __name__ == '__main__':
    main()
