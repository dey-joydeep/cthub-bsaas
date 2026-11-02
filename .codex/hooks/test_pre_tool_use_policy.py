"""Regression tests for patch-path and command guards."""

import json
import subprocess
import sys
import unittest
from pathlib import Path


HOOK = Path(__file__).with_name('pre_tool_use_policy.py')


def decision(tool_input):
    result = subprocess.run(
        [sys.executable, str(HOOK)],
        input=json.dumps({'hook_event_name': 'PreToolUse', 'tool_input': tool_input}),
        text=True,
        capture_output=True,
        check=True,
    )
    return json.loads(result.stdout) if result.stdout.strip() else {}


class PreToolUsePolicyTests(unittest.TestCase):
    def test_pr_comment_prose_is_not_treated_as_a_cache_path(self):
        comment = {'repo_full_name': 'owner/repo', 'pr_number': 99, 'comment': 'Please review CI coverage.'}
        self.assertEqual(decision(comment), {})
        self.assertEqual(decision({'code': f'await tools.mcp__codex_apps__github_add_comment_to_issue({json.dumps(comment)})'}), {})

    def test_comment_plus_shell_command_keeps_path_guard(self):
        cache_name = 'node' + '_modules'
        code = (
            'await tools.mcp__codex_apps__github_add_comment_to_issue({comment:"CI coverage"}); '
            f'await tools.exec_command({{cmd:"Remove-Item {cache_name}/bad.js"}})'
        )
        self.assertEqual(decision({'code': code})['hookSpecificOutput']['permissionDecision'], 'deny')

    def test_patch_content_can_mention_a_cache_directory(self):
        cache_name = 'node' + '_modules'
        patch = (
            '*** Begin Patch\n'
            '*** Update File: .codex/environments/setup.mjs\n'
            '@@\n'
            f"+const path = '{cache_name}';\n"
            '*** End Patch'
        )
        self.assertEqual(decision({'command': patch}), {})
        self.assertEqual(decision({'code': f'await tools.apply_patch({json.dumps(patch)})'}), {})

    def test_patch_target_in_cache_directory_is_denied(self):
        cache_name = 'node' + '_modules'
        patch = f'*** Begin Patch\n*** Add File: {cache_name}/bad.js\n+bad\n*** End Patch'
        result = decision({'command': patch})
        self.assertEqual(result['hookSpecificOutput']['permissionDecision'], 'deny')

    def test_command_target_in_cache_directory_is_denied(self):
        cache_name = 'node' + '_modules'
        result = decision({'command': f'Remove-Item {cache_name}/bad.js'})
        self.assertEqual(result['hookSpecificOutput']['permissionDecision'], 'deny')

    def test_mixed_patch_and_shell_command_keeps_command_guard(self):
        cache_name = 'node' + '_modules'
        patch = '*** Begin Patch\n*** Update File: safe.js\n@@\n+safe\n*** End Patch'
        code = f'await tools.apply_patch({json.dumps(patch)}); await tools.exec_command({{cmd:"Remove-Item {cache_name}/bad.js"}})'
        result = decision({'code': code})
        self.assertEqual(result['hookSpecificOutput']['permissionDecision'], 'deny')

    def test_aliased_shell_tool_keeps_command_guard(self):
        cache_name = 'node' + '_modules'
        patch = '*** Begin Patch\n*** Update File: safe.js\n@@\n+safe\n*** End Patch'
        code = f'const command = tools.exec_command; await tools.apply_patch({json.dumps(patch)}); await command({{cmd:"Remove-Item {cache_name}/bad.js"}})'
        result = decision({'code': code})
        self.assertEqual(result['hookSpecificOutput']['permissionDecision'], 'deny')

    def test_destructive_git_command_is_denied(self):
        result = decision({'command': 'git reset --hard'})
        self.assertEqual(result['hookSpecificOutput']['permissionDecision'], 'deny')

    def test_wrapped_destructive_git_command_is_denied(self):
        result = decision({'code': 'await tools.exec_command({cmd:"git reset --hard"})'})
        self.assertEqual(result['hookSpecificOutput']['permissionDecision'], 'deny')


if __name__ == '__main__':
    unittest.main()
