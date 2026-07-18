# Security policy

MiniPMDB stores project memory. Treat both MongoDB data and exported snapshots as potentially sensitive.

## Report a vulnerability

Use GitHub private vulnerability reporting. Do not open a public issue containing exploit details, credentials, private memory, or local paths. Include the affected version, a synthetic reproduction, impact, and suggested mitigation when available.

## Security posture

- The dashboard/API and managed MongoDB bind only to `127.0.0.1`; MiniPMDB has no remote-access mode.
- MCP defaults to project-draft, resolved from its working directory and a human-registered repository root.
- Project-draft can create only unreviewed local candidates and attach evidence only to them. It cannot review, reject, supersede, register projects, or edit touchpoints.
- Strict read-only exposes no write tools.
- Credentialed MongoDB URIs are never persisted by the dashboard and are masked in runtime status. Supply credentials through `MINIPMDB_MONGODB_URI`.
- `.minipmdb/`, environment files, binary caches, database data, logs, and build output are ignored by Git.
- Snapshot exports may contain sensitive project knowledge; review them before committing.
- The public-source check rejects known private-source vocabulary, absolute Windows user paths, and likely embedded credentials.

MiniPMDB does not encrypt MongoDB or snapshots. Use operating-system access controls and disk encryption. Do not store secrets, credentials, raw private conversations, or hidden reasoning as memories.

The optional Compose deployment publishes MongoDB only on loopback and has no authentication because it is intended for a single-user local machine. Do not expose port 27017 to a network. Configure and secure your own external MongoDB for any broader deployment.
