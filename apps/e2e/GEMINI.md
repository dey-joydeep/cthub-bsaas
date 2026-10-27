# Antigravity E2E Guidance

Read `apps/e2e/AGENTS.md` for E2E scope and test conventions. This file adds Antigravity execution guidance only.

- Run the relevant Nx E2E target with its documented prerequisites. Use Playwright traces or browser tooling to diagnose failures when those artifacts and tools are available.
- Keep test data isolated, verify cleanup against the intended test environment, and report environmental failures separately from product defects.
- Give the QA agent the E2E result and evidence. Independent Codex review remains a separate gate.
