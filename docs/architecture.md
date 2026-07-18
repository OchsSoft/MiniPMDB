# Architecture

MongoDB is MiniPMDB's only canonical store. The foreground server owns storage startup, the loopback API, and the dashboard. CLI and MCP are API clients, so no surface can create an isolated project-local truth silo.

```text
Codex / MCP ─┐
CLI ─────────┼── HTTP on 127.0.0.1 ── service + policy ── MongoDB
Dashboard ───┘                                      projects
                                                    memories
Snapshot export ── snapshot v2 ── GitHub Action     sources
                                      (audit only)  links
                                                    touchpoints
```

## Storage modes

Managed mode uses `mongodb-memory-server-core` as a lifecycle manager for an unmodified, pinned `mongod`. Despite the package name, MiniPMDB uses a persistent database path, the WiredTiger storage engine, and loopback binding. The binary cache and database live under `MINIPMDB_HOME` or the platform user-data directory.

External mode uses `MINIPMDB_MONGODB_URI` or a credential-free URI saved through the dashboard. The same official Node driver, schema validators, indexes, service, API, and policy run in both modes. `compose.yaml` supplies an optional external instance; it does not containerize the Node app.

## Collections

- `projects`: stable keys, display labels, and canonical repository roots.
- `memories`: project-owned claims and lifecycle metadata.
- `sources`: project-owned provenance references, not copied source payloads.
- `links`: explicit conflict and supersession relationships.
- `touchpoints`: two or more project keys plus memory references across participants.

Touchpoint writes validate that every project and memory exists and that each referenced memory belongs to a participating project. Project context loads its governed memory plus linked participant memory, labeled with its owning project and the touchpoint inclusion reason.

## Trust model

Agent-created records are always `unreviewed`. Only human CLI/dashboard operations can register projects, review or reject candidates, supersede memory, or edit touchpoints. Rejected records never enter agent context. Superseded records remain history. High-confidence active claims require evidence, and open conflicts require a reviewed resolution.

Context profiles may trim ordinary content, but cannot silently omit critical warnings or unresolved/broken touchpoints. The audit independently verifies raw references and every rendered profile.

Snapshot v2 contains all five canonical collections at an export point. It is portable evidence for CI, not a writable backend.
