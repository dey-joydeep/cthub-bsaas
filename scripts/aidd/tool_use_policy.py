#!/usr/bin/env python3
"""Shared pre-tool policy for Codex and Antigravity adapters."""

import json
import re

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
    if lowered.startswith('!'):
        return False

    for name in BLOCKED_PATH_NAMES:
        if re.search(rf'(^|/){re.escape(name)}(/|$)', lowered):
            return True
    return False


def has_blocked_path_reference(text):
    return any(token_mentions_blocked_path(token) for token in tokenize_command(text))


def is_remote_prose_only_input(tool_name, tool_input):
    if not isinstance(tool_input, dict):
        return False

    keys = set(tool_input)
    comment_keys = {'repo_full_name', 'pr_number', 'comment'}
    pr_text_keys = {'repository_full_name', 'pr_number', 'body', 'title'}
    is_comment_tool = tool_name in {
        'mcp__codex_apps__github__add_comment_to_issue',
        'mcp__codex_apps__github_add_comment_to_issue',
    }
    is_update_tool = tool_name in {
        'mcp__codex_apps__github__update_pull_request',
        'mcp__codex_apps__github_update_pull_request',
    }
    return (is_comment_tool and keys == comment_keys) or (
        is_update_tool
        and {'repository_full_name', 'pr_number'} <= keys
        and bool(keys & {'body', 'title'})
        and keys <= pr_text_keys
    )


def patch_targets(tool_input, text):
    expanded = text
    if isinstance(tool_input, dict) and isinstance(tool_input.get('code'), str):
        code = tool_input['code']
        literal = r'("(?:\\.|[^"\\])*")'
        patterns = (
            rf'\s*await\s+tools\.apply_patch\(\s*{literal}\s*\)\s*;?\s*',
            rf'\s*text\(\s*await\s+tools\.apply_patch\(\s*{literal}\s*\)\s*\)\s*;?\s*',
        )
        match = next((match for pattern in patterns if (match := re.fullmatch(pattern, code, re.DOTALL))), None)
        if not match:
            return None
        try:
            expanded = json.loads(match.group(1))
        except json.JSONDecodeError:
            return None
    elif not text.lstrip().startswith('*** Begin Patch'):
        return None
    if '*** Begin Patch' not in expanded or '*** End Patch' not in expanded:
        return None
    targets = re.findall(r'^\*\*\* (?:(?:Add|Update|Delete) File|Move to):\s*(.+?)\s*$', expanded, re.MULTILINE)
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


def has_powershell_recursive_force(command):
    for segment in re.split(r'[;\n|]', command.lower()):
        if (
            re.search(r'\bremove-item\b', segment)
            and re.search(r'(?<!\w)-recurse\b', segment)
            and re.search(r'(?<!\w)-force\b', segment)
        ):
            return True
    return False


def is_destructive_command(command):
    normalized_command = command.lower()
    return (
        has_rm_rf_variant(normalized_command)
        or has_powershell_recursive_force(normalized_command)
        or re.search(r'\bgit\s+reset\s+--hard\b', normalized_command)
        or has_git_clean_force(normalized_command)
        or re.search(r'\bprisma\s+migrate\s+reset\b', normalized_command)
    )


def assess(tool_name, tool_input, path_targets=None):
    text = normalize(collect_text(tool_input))
    targets = path_targets if path_targets is not None else patch_targets(tool_input, text)
    checked_text = ' '.join(targets) if targets is not None else text

    prose_only = is_remote_prose_only_input(tool_name, tool_input)
    if not prose_only and has_blocked_path_reference(checked_text):
        return ('deny', 'Repository policy blocks edits or commands touching generated or cache directories.')

    command = normalize(tool_input.get('command', '')) if isinstance(tool_input, dict) else text
    command = command or text
    if not prose_only and targets is None and is_destructive_command(command):
        return ('deny', 'Repository policy blocks destructive commands without explicit manual handling.')

    warnings = [] if prose_only else [fragment for fragment in WARN_PATH_FRAGMENTS if fragment in checked_text]
    if warnings:
        return ('warn', f'Repository policy notice: this action touches high-impact files: {", ".join(warnings)}. Confirm AIDD traceability and validation before completion.')
    return ('allow', None)
