#!/usr/bin/env python3
"""Codex adapter for the shared repository tool-use policy."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'scripts' / 'aidd'))
from tool_use_policy import assess  # noqa: E402


def main():
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return
    event_name = payload.get('hook_event_name', 'PreToolUse')
    decision, reason = assess(payload.get('tool_name'), payload.get('tool_input') or {})
    if decision == 'allow':
        return
    detail = {'hookEventName': event_name}
    if decision == 'deny':
        detail.update({'permissionDecision': 'deny', 'permissionDecisionReason': reason})
    else:
        detail['additionalContext'] = reason
    print(json.dumps({'hookSpecificOutput': detail}))


if __name__ == '__main__':
    main()
