# Build Week submission runbook

This runbook keeps the final MiniPMDB Developer Tools submission reproducible. Complete it from a fresh public checkout before submitting.

## Repository dry run

- [ ] Clone or download the public repository into a new directory.
- [ ] Confirm the README's first command works without an install step: `npm run judge:demo`.
- [ ] Verify the dashboard starts blocked, **Apply governed fix** turns it green, and the warning remains visible.
- [ ] Run `npm ci --ignore-scripts`, `npm run check`, `npm test`, `npm run smoke`, and `npm run judge:dry-run`.
- [ ] Confirm the public GitHub Actions validation is green.
- [ ] Inspect the repository and source archive for credentials, private data, local paths, build output, and unrelated project vocabulary.
- [ ] Confirm the repository is public and includes the MPL-2.0 license, contribution guide, code of conduct, security policy, and hackathon disclosure.

## Video pass

- [ ] Open the 2:42 silent 1080p master described in [`video/README.md`](../video/README.md).
- [ ] Record one narration track from [`video/voiceover.md`](../video/voiceover.md), beginning at `00:00`.
- [ ] Import [`video/voiceover.srt`](../video/voiceover.srt) as captions and retime only if the final narration needs it.
- [ ] Confirm the export is under three minutes, 1080p, H.264/AAC, and has clearly audible narration.
- [ ] Watch the complete export once for private tabs, usernames, notifications, credentials, and unintended audio.
- [ ] Upload to YouTube with public visibility and verify the link in a signed-out browser.

## Devpost fields

- **Project:** MiniPMDB
- **Category:** Developer Tools
- **Tagline:** CI for agent memory.
- **One-sentence pitch:** MiniPMDB prevents unreviewed, unsourced, contradictory, or obsolete project memories from silently becoming coding-agent truth.
- **Repository:** `https://github.com/OchsSoft/MiniPMDB`
- **Primary proof:** the fail-fix-pass dashboard flow backed by the identical CLI, MCP, and GitHub Action audit.
- **Built with:** Codex, GPT-5.6, Node.js, MCP, GitHub Actions, HTML, CSS, and JavaScript.

Use the README and [`HACKATHON.md`](../HACKATHON.md) as the source of truth for product boundaries and preexisting-work disclosure. Before submission, replace the pending `/feedback` Session ID in `HACKATHON.md`, add the public video URL, and record the final public commit or release tag.

## Final submission check

- [ ] Product name, category, repository, and video link are correct.
- [ ] Installation and supported-platform instructions point to [`docs/judge-guide.md`](judge-guide.md).
- [ ] The description leads with memory trust and governance, not generic persistence or retrieval.
- [ ] Claims about Codex, GPT-5.6, test results, and build-period work are verifiable.
- [ ] The `/feedback` Session ID is entered in the required form field.
- [ ] A final signed-out click-through reaches the repository, video, and judge path.
- [ ] Submit only after saving a local copy or screenshot of the completed form.
