# Build Week submission runbook

This runbook keeps the final MiniPMDB Developer Tools submission reproducible. Complete it from a fresh public checkout before submitting.

## Repository dry run

- [ ] Clone or download the public repository into a new directory.
- [ ] From a fresh clone and empty runtime/cache directory, run `npm ci --ignore-scripts` and `npm run judge:demo` through the real first MongoDB download.
- [ ] Verify the dashboard starts blocked, **Apply governed fix** turns it green, and the warning remains visible.
- [ ] Run the bring-your-own-project flow from [`docs/try-your-project.md`](try-your-project.md) against a disposable repository: create drafts through MCP, approve one with evidence, reject one, and inspect the resulting context.
- [ ] Run `npm ci --ignore-scripts`, `npm run check`, `npm test`, `npm run smoke`, and `npm run judge:dry-run`.
- [ ] Confirm the public GitHub Actions validation is green.
- [ ] Inspect the repository and source archive for credentials, private data, local paths, build output, and unrelated project vocabulary.
- [ ] Confirm the repository is public and includes the MPL-2.0 license, contribution guide, code of conduct, security policy, and hackathon disclosure.

## Video pass

- [ ] Open the 2:50 narrated 1080p master described in [`video/README.md`](../video/README.md).
- [ ] Confirm the narration matches [`video/voiceover.md`](../video/voiceover.md) and the captions match [`video/voiceover.srt`](../video/voiceover.srt).
- [ ] Confirm the export is under three minutes, 1080p, H.264/AAC, and has clearly audible narration with natural pauses.
- [ ] Watch the complete export once for private tabs, usernames, notifications, credentials, and unintended audio.
- [ ] Upload to YouTube with public visibility and verify the link in a signed-out browser.

## Devpost fields

- **Project:** MiniPMDB
- **Category:** Developer Tools
- **Tagline:** CI for cross-project agent memory.
- **One-sentence pitch:** MiniPMDB prevents unreviewed, unsourced, contradictory, or obsolete project memories from silently becoming coding-agent truth.
- **Repository:** `https://github.com/OchsSoft/MiniPMDB`
- **Primary proof:** the fail-fix-pass dashboard flow backed by the identical CLI, MCP, and GitHub Action audit.
- **Built with:** Codex, GPT-5.6, Node.js, MongoDB, MCP, GitHub Actions, HTML, CSS, and JavaScript.

Copy the final public descriptions and testing steps from [`docs/submission-copy.md`](submission-copy.md).

Use the README and [`HACKATHON.md`](../HACKATHON.md) as the source of truth for product boundaries, entrant-led architecture, Codex/GPT-5.6 implementation assistance, and preexisting-work disclosure. Before submission, enter the primary `/feedback` Session ID directly in the required Devpost field, add the public video URL, and record the final public commit or release tag.

## Final submission check

- [ ] Product name, category, repository, and video link are correct.
- [ ] Installation and supported-platform instructions point to [`docs/judge-guide.md`](judge-guide.md).
- [ ] The description leads with memory trust and governance, not generic persistence or retrieval.
- [ ] Claims about Codex, GPT-5.6, test results, and build-period work are verifiable.
- [ ] The `/feedback` Session ID is entered in the required form field.
- [ ] A final signed-out click-through reaches the repository, video, and judge path.
- [ ] Submit only after saving a local copy or screenshot of the completed form.
