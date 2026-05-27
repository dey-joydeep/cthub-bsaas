#!/usr/bin/env python3
"""Codex pre-tool policy hook for repository guardrails."""

import json
import re
import sys
from pathlib import Path

BLOCKED_PATH_FRAGMENTS = (
    'node_modules/',
    'dist/',
    'coverage/',
    '.nx/',
)

DESTRUCTIVE_COMMAND_PATTERNS = (
    r'\brm\s+-rf\b',
    r'\bgit\s+reset\s+--hard\b',
    r'\bgit\s+clean\s+-fd\b',
    r'\bprisma\s+migrate\s+reset\b',
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


def collect_text(value):
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        return ' '.join(collect_text(item) for item in value.values())
    if isinstance(value, list):
        return ' '.join(collect_text(item) for item in value)
    return ''


def main():
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return

    event_name = payload.get('hook_event_name', 'PreToolUse')
    tool_input = payload.get('tool_input') or {}
    text = normalize(collect_text(tool_input))

    for fragment in BLOCKED_PATH_FRAGMENTS:
        if fragment in text:
            deny(event_name, f'Repository policy blocks edits or commands touching {fragment}.')
            return

    command = normalize(tool_input.get('command', '')) if isinstance(tool_input, dict) else text
    for pattern in DESTRUCTIVE_COMMAND_PATTERNS:
        if re.search(pattern, command):
            deny(event_name, 'Repository policy blocks destructive commands without explicit manual handling.')
            return

    warnings = [fragment for fragment in WARN_PATH_FRAGMENTS if fragment in text]
    if warnings:
        warn(event_name, f'Repository policy notice: this action touches high-impact files: {", ".join(warnings)}. Confirm AIDD traceability and validation before completion.')
        return


if __name__ == '__main__':
    main()
