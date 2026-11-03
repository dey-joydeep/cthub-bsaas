#!/usr/bin/env python3
"""Antigravity adapter for the shared repository tool-use policy."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'scripts' / 'aidd'))
from tool_use_policy import assess  # noqa: E402


EDIT_TOOLS = {'write_to_file', 'replace_file_content', 'multi_replace_file_content'}


def main():
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        print(json.dumps({'decision': 'deny', 'reason': 'Invalid hook input'}))
        return
    tool_call = payload.get('toolCall') or {}
    name = tool_call.get('name')
    args = tool_call.get('args') or {}
    if not isinstance(args, dict):
        print(json.dumps({'decision': 'deny', 'reason': 'Invalid tool arguments'}))
        return
    if name == 'run_command':
        command = args.get('CommandLine')
        if not isinstance(command, str):
            print(json.dumps({'decision': 'deny', 'reason': 'Missing command line'}))
            return
        decision, reason = assess(name, {'command': command})
    elif name == 'manage_task':
        if args.get('Action') != 'send_input':
            print(json.dumps({'decision': 'allow'}))
            return
        command = args.get('Input')
        if not isinstance(command, str):
            print(json.dumps({'decision': 'deny', 'reason': 'Missing task input'}))
            return
        decision, reason = assess(name, {'command': command})
    elif name in EDIT_TOOLS:
        target = args.get('TargetFile')
        if not isinstance(target, str) or not target:
            print(json.dumps({'decision': 'deny', 'reason': 'Missing edit target'}))
            return
        decision, reason = assess(name, {}, path_targets=[target])
    else:
        print(json.dumps({'decision': 'allow'}))
        return
    print(json.dumps({'decision': 'deny' if decision == 'deny' else 'allow', **({'reason': reason} if reason else {})}))


if __name__ == '__main__':
    main()
