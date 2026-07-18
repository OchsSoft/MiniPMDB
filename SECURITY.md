# Security policy

MiniPMDB stores project memory. Treat its JSON files as potentially sensitive even though the software is local-first.

## Supported version

Security fixes currently target the latest `0.1.x` release.

## Report a vulnerability

Use GitHub's private vulnerability reporting for the repository. Do not open a public issue with exploit details, credentials, private memory content, or local paths. Include the affected version, reproduction steps using synthetic data, impact, and any suggested mitigation.

## Security posture

- The dashboard binds to `127.0.0.1` and has no remote-access mode.
- MCP defaults to `project-draft`, which can create only unreviewed candidates and attach evidence only to draft or unreviewed candidates in the configured store.
- Set `MINIPMDB_MCP_MODE=read-only` for a strict no-write MCP connection. `draft-write` is a compatibility alias for `project-draft`.
- Project-draft MCP cannot approve, reject, supersede, or otherwise create reviewed/current truth.
- The project has no runtime dependencies, CDN assets, telemetry, or hosted service.
- Local `.minipmdb/` data and environment files are ignored by Git.
- The public-source check rejects known private-source vocabulary and absolute Windows user paths.

MiniPMDB does not encrypt the JSON store. Use operating-system file permissions and full-disk encryption, and do not put secrets or raw private conversations in memory records. If remote access is needed, keep it behind a separately reviewed authenticated service; this project deliberately does not provide one.
