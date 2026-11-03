"""Regression tests for patch-path and command guards."""

import json
import os
import subprocess
import sys
import unittest
from pathlib import Path


HOOK = Path(__file__).with_name('pre_tool_use_policy.py')
AGY_HOOK = Path(__file__).resolve().parents[2] / '.agents' / 'hooks' / 'pre_tool_use_policy.py'
LAUNCHER = AGY_HOOK.parents[2] / 'scripts' / 'aidd' / 'run-tool-use-hook.mjs'


def decision(tool_input, tool_name='Bash'):
    result = subprocess.run(
        [sys.executable, str(HOOK)],
        input=json.dumps({'hook_event_name': 'PreToolUse', 'tool_name': tool_name, 'tool_input': tool_input}),
        text=True,
        capture_output=True,
        check=True,
    )
    return json.loads(result.stdout) if result.stdout.strip() else {}


def agy_decision(tool_name, args):
    result = subprocess.run(
        [sys.executable, str(AGY_HOOK)],
        input=json.dumps({'toolCall': {'name': tool_name, 'args': args}}),
        text=True,
        capture_output=True,
        check=True,
    )
    return json.loads(result.stdout)


class PreToolUsePolicyTests(unittest.TestCase):
    def test_antigravity_command_guard_matches_codex_policy(self):
        cache_path = 'node' + '_modules/bad.js'
        self.assertEqual(agy_decision('run_command', {'CommandLine': 'git status'})['decision'], 'allow')
        self.assertEqual(agy_decision('run_command', {'CommandLine': 'git reset --hard'})['decision'], 'deny')
        self.assertEqual(agy_decision('run_command', {'CommandLine': f'Remove-Item {cache_path}'})['decision'], 'deny')
        self.assertEqual(agy_decision('run_command', {'CommandLine': 'Remove-Item src -Recurse -Force'})['decision'], 'deny')

    def test_antigravity_background_terminal_input_uses_command_guard(self):
        cache_path = 'node' + '_modules/bad.js'
        self.assertEqual(agy_decision('manage_task', {'Action': 'send_input', 'Input': 'git status'})['decision'], 'allow')
        self.assertEqual(agy_decision('manage_task', {'Action': 'send_input', 'Input': 'git reset --hard'})['decision'], 'deny')
        self.assertEqual(agy_decision('manage_task', {'Action': 'send_input', 'Input': f'Remove-Item {cache_path}'})['decision'], 'deny')
        self.assertEqual(agy_decision('manage_task', {'Action': 'send_input'})['decision'], 'deny')
        self.assertEqual(agy_decision('manage_task', {'Action': 'status'})['decision'], 'allow')

    def test_antigravity_edit_checks_target_and_not_source_prose(self):
        cache_path = 'node' + '_modules/bad.js'
        self.assertEqual(
            agy_decision('write_to_file', {'TargetFile': 'safe.js', 'CodeContent': f'const path = "{cache_path}";'})['decision'],
            'allow',
        )
        self.assertEqual(agy_decision('write_to_file', {'TargetFile': cache_path, 'CodeContent': 'safe'})['decision'], 'deny')
        self.assertEqual(agy_decision('replace_file_content', {'TargetFile': cache_path})['decision'], 'deny')
        self.assertEqual(agy_decision('multi_replace_file_content', {'TargetFile': cache_path})['decision'], 'deny')
        nested_negation = 'node' + '_modules/!dist/payload.js'
        self.assertEqual(agy_decision('write_to_file', {'TargetFile': nested_negation})['decision'], 'deny')

    def test_antigravity_does_not_approve_malformed_tool_arguments(self):
        self.assertEqual(agy_decision('run_command', {})['decision'], 'deny')
        self.assertEqual(agy_decision('write_to_file', {})['decision'], 'deny')

    def test_antigravity_node_launcher_runs_the_shared_guard(self):
        result = subprocess.run(
            ['node', str(LAUNCHER), 'antigravity'],
            input=json.dumps({'toolCall': {'name': 'run_command', 'args': {'CommandLine': 'git reset --hard'}}}),
            text=True,
            capture_output=True,
            check=True,
        )
        self.assertEqual(json.loads(result.stdout)['decision'], 'deny')

    def test_codex_node_launcher_runs_the_shared_guard(self):
        result = subprocess.run(
            ['node', str(LAUNCHER), 'codex'],
            input=json.dumps({'hook_event_name': 'PreToolUse', 'tool_name': 'Bash', 'tool_input': {'command': 'git reset --hard'}}),
            text=True,
            capture_output=True,
            check=True,
        )
        self.assertEqual(json.loads(result.stdout)['hookSpecificOutput']['permissionDecision'], 'deny')

    def test_node_launchers_deny_when_python_cannot_start(self):
        environment = {**os.environ, 'PYTHONHOME': str(HOOK.parent / 'nonexistent-python-home')}
        for mode in ('antigravity', 'codex'):
            result = subprocess.run(
                ['node', str(LAUNCHER), mode],
                input=json.dumps({'hook_event_name': 'PreToolUse', 'toolCall': {'name': 'run_command', 'args': {'CommandLine': 'git status'}}}),
                text=True,
                capture_output=True,
                check=True,
                env=environment,
            )
            response = json.loads(result.stdout)
            if mode == 'antigravity':
                self.assertEqual(response['decision'], 'deny')
            else:
                self.assertEqual(response['hookSpecificOutput']['permissionDecision'], 'deny')

    def test_pr_comment_prose_is_not_treated_as_a_cache_path(self):
        comment = {'repo_full_name': 'owner/repo', 'pr_number': 99, 'comment': 'Please review CI coverage, then report.'}
        self.assertEqual(decision(comment, 'mcp__codex_apps__github__add_comment_to_issue'), {})
        wrapped = decision({'code': f'await tools.mcp__codex_apps__github_add_comment_to_issue({json.dumps(comment)})'})
        self.assertEqual(wrapped['hookSpecificOutput']['permissionDecision'], 'deny')

    def test_structured_comment_may_describe_a_destructive_command_without_running_it(self):
        comment = {'repo_full_name': 'owner/repo', 'pr_number': 99, 'comment': 'The guard rejects git reset --hard.'}
        self.assertEqual(decision(comment, 'mcp__codex_apps__github__add_comment_to_issue'), {})
        wrapped = decision({'code': f'await tools.mcp__codex_apps__github_add_comment_to_issue({json.dumps(comment)})'})
        self.assertEqual(wrapped['hookSpecificOutput']['permissionDecision'], 'deny')

    def test_structured_pr_body_is_prose_not_a_filesystem_action(self):
        update = {
            'repository_full_name': 'owner/repo',
            'pr_number': 99,
            'body': 'CI coverage is green. The guard rejects git reset --hard.',
        }
        self.assertEqual(decision(update, 'mcp__codex_apps__github__update_pull_request'), {})
        wrapped = decision({'code': f'await tools.mcp__codex_apps__github_update_pull_request({json.dumps(update)})'})
        self.assertEqual(wrapped['hookSpecificOutput']['permissionDecision'], 'deny')

    def test_matching_fields_do_not_exempt_another_tool(self):
        update = {'repository_full_name': 'owner/repo', 'pr_number': 99, 'body': 'CI coverage is green.'}
        self.assertEqual(decision(update)['hookSpecificOutput']['permissionDecision'], 'deny')

    def test_pr_text_with_extra_action_field_is_not_exempt(self):
        update = {
            'repository_full_name': 'owner/repo',
            'pr_number': 99,
            'body': 'CI coverage is green.',
            'command': 'git reset --hard',
        }
        self.assertEqual(decision(update)['hookSpecificOutput']['permissionDecision'], 'deny')

    def test_comment_plus_shell_command_keeps_path_guard(self):
        cache_name = 'node' + '_modules'
        code = (
            'await tools.mcp__codex_apps__github_add_comment_to_issue({comment:"CI coverage"}); '
            f'await tools.exec_command({{cmd:"Remove-Item {cache_name}/bad.js"}})'
        )
        self.assertEqual(decision({'code': code})['hookSpecificOutput']['permissionDecision'], 'deny')

    def test_comment_reference_does_not_hide_aliased_shell_calls(self):
        cache_path = 'node' + '_modules/bad.js'
        comment_call = 'await tools.mcp__codex_apps__github_add_comment_to_issue({comment:"Review"}); '
        for shell_call in (
            f'const runner = tools; await runner.exec_command({{cmd:"Get-Content {cache_path}"}})',
            f'await Reflect.get(tools, "exec_command")({{cmd:"Get-Content {cache_path}"}})',
            f'await tools ["exec_command"]({{cmd:"Get-Content {cache_path}"}})',
        ):
            result = decision({'code': comment_call + shell_call})
            self.assertEqual(result['hookSpecificOutput']['permissionDecision'], 'deny')

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

    def test_patch_move_destination_in_cache_directory_is_denied(self):
        cache_name = 'node' + '_modules'
        patch = f'*** Begin Patch\n*** Update File: safe.js\n*** Move to: {cache_name}/bad.js\n@@\n+safe\n*** End Patch'
        for tool_input in ({'command': patch}, {'code': f'await tools.apply_patch({json.dumps(patch)})'}):
            result = decision(tool_input)
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

    def test_patch_exemption_rejects_mixed_aliased_calls(self):
        cache_name = 'node' + '_modules'
        patch = '*** Begin Patch\n*** Update File: safe.js\n@@\n+safe\n*** End Patch'
        code = (
            'const runner = tools; '
            f'await tools.apply_patch({json.dumps(patch)}); '
            f'await runner.exec_command({{cmd:"Get-Content {cache_name}/bad.js"}})'
        )
        self.assertEqual(decision({'code': code})['hookSpecificOutput']['permissionDecision'], 'deny')
        destructive = code.replace(f'Get-Content {cache_name}/bad.js', 'git reset --hard')
        self.assertEqual(decision({'code': destructive})['hookSpecificOutput']['permissionDecision'], 'deny')

    def test_destructive_git_command_is_denied(self):
        result = decision({'command': 'git reset --hard'})
        self.assertEqual(result['hookSpecificOutput']['permissionDecision'], 'deny')

    def test_recursive_powershell_delete_is_denied(self):
        result = decision({'command': 'Remove-Item -LiteralPath src -Recurse -Force'})
        self.assertEqual(result['hookSpecificOutput']['permissionDecision'], 'deny')

    def test_wrapped_destructive_git_command_is_denied(self):
        result = decision({'code': 'await tools.exec_command({cmd:"git reset --hard"})'})
        self.assertEqual(result['hookSpecificOutput']['permissionDecision'], 'deny')


if __name__ == '__main__':
    unittest.main()
