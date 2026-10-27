# Antigravity Web Guidance

Read `libs/web/AGENTS.md` for architecture, SSR, accessibility, i18n, and test rules. This file adds Antigravity execution guidance only.

- For user-visible changes, run the narrowest relevant Nx checks and inspect the affected route in a browser when an app can be started. Check console errors, hydration, responsive layout, keyboard access, and the states changed by the task.
- Use Penpot or another design source when the change implements an existing design. If that source or its MCP tool is unavailable, use the checked-in spec and report the gap; do not invent precise design tokens.
- Preserve screenshots or browser evidence for QA when visual behavior changes.
- Hand the finished change and validation evidence to an independent Codex reviewer. Route security-sensitive frontend behavior to Codex security review.
