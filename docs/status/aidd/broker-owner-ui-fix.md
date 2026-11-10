# Broker owner approval page repair

- Tracking issue: [#113](https://github.com/dey-joydeep/cthub-bsaas/issues/113)
- Branch: `fix/broker-owner-ui`, based on `main` at `040b392330e04e6d3918cfc0a483cd8f54994fab`
- Outcome: make the Access-authenticated owner form initialize on iPhone without depending on additional authenticated script and identity requests.
- Writable scope: `tools/aidd-broker/src/owner-ui.mjs`, `tools/aidd-broker/src/worker.mjs`, their tests, and the aligned AIDD broker documentation.

On 2026-11-10, the deployed broker returned `enabled: true` for all three role principals. A PO token was denied owner mandate creation (`403`) and a grant without a mandate (`400`). The owner could open `/owner` in iPhone Chrome, but the page stayed at its initial status and its scope preview was empty; direct `/v1/whoami` returned the expected administrator with `enabled: true`, and `/owner.js` was available. A fresh Safari login separately failed Cloudflare Access's Cloudflare identity-provider membership test.

This branch renders the verified owner state and a nonce-protected inline script in the authenticated HTML response. Broker tests and a browser-style initialization check passed locally. An independent Codex security review found no blocker. The page change is not deployed, and the new task-mandate flow has no live PO, Dev, or QA write evidence yet. After Access login is repaired, the owner must authorize deployment of the reviewed patch, create one bounded mandate from a device outside agent control, and verify the role writes without merging the probe PR.
