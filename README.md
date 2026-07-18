# MiniPMDB

**CI for cross-project agent memory.** MiniPMDB is a small, local-first trust gate that stops unreviewed, unsourced, contradictory, or obsolete memories from silently becoming coding-agent truth.

Most memory tools optimize recall. MiniPMDB asks whether a memory is allowed to be trusted, why, and what happens when two projects collide at a shared contract.

## Judge demo

Requirements: Node.js 20.19 or newer and network access for the first managed MongoDB download.

```console
npm ci --ignore-scripts
npm run judge:demo
```

The foreground process downloads a pinned, real MongoDB Community Server binary on first use, keeps its database under the platform user-data directory, binds both MongoDB and the dashboard to `127.0.0.1`, seeds two synthetic projects, and opens `http://127.0.0.1:8797`.

The demo begins blocked: Paper Crane CLI proposes a long-lived release token while Release Relay accepts only OIDC. Their touchpoint makes both projects' memories visible together. Apply the governed fix to see the audit pass without deleting the superseded claim.

For a non-interactive proof of managed persistence, external Mongo mode, cross-project context, MCP permissions, and audit behavior:

```console
npm run judge:dry-run
```

See the [judge guide](docs/judge-guide.md) for the three-minute route and [try it on your project](docs/try-your-project.md) for the full agent-to-human review flow.

## Trust boundary

MongoDB is the only canonical store. The five collections are `projects`, `memories`, `sources`, `links`, and `touchpoints`. Snapshot v2 JSON is a derived, portable audit artifact—not another write backend.

MCP defaults to `project-draft`:

- `memory_context`, `memory_audit`, and `memory_list` read governed state;
- `memory_remember` creates only `unreviewed` memories for the project resolved from the MCP working directory;
- `source_attach` adds evidence only to that project's unreviewed candidates;
- the agent cannot approve, reject, supersede, register projects, or edit shared touchpoints.

Set `MINIPMDB_MCP_MODE=read-only` to expose no write tools. `draft-write` remains a compatibility alias for `project-draft`. Human dashboard and CLI operations own trust decisions.

## Run against your own repository

Start MiniPMDB in one terminal:

```console
npm start
```

Register a repository and inspect it from another terminal:

```console
node src/cli.js project add --key your-project --name "Your Project" --repo /absolute/path/to/repository
node src/cli.js context --project your-project --task "understand this project safely"
```

Configure Codex with the registered repository as the MCP working directory:

```toml
[mcp_servers.minipmdb]
command = "node"
args = ["/absolute/path/to/MiniPMDB/src/mcp.js"]
cwd = "/absolute/path/to/repository"
env = { MINIPMDB_API_URL = "http://127.0.0.1:8797", MINIPMDB_MCP_MODE = "project-draft" }
```

Then paste the [review-first intake prompt](docs/prompts/draft-memory-intake.md) into a new Codex task. Review candidates in the dashboard or with:

```console
node src/cli.js list --project your-project --status unreviewed
node src/cli.js review MEMORY_ID --status reviewed --reviewer judge
node src/cli.js audit --project your-project --strict
```

## Cross-project touchpoints

A touchpoint names two or more registered projects and references memories owned by its participants. Context for Project A includes Project B memory only through such a valid touchpoint, with the source project and inclusion reason labeled. Missing references, wrong-project references, and broken touchpoints are audit findings that compact context cannot silently omit.

Humans can create a touchpoint in the dashboard or CLI:

```console
node src/cli.js touchpoint upsert --name "Shared auth contract" --projects project-a,project-b --memories MEMORY_A,MEMORY_B --kind api-contract
```

## MongoDB runtime choices

Managed local MongoDB is the default. The dashboard's Storage runtime panel can test and save an external, loopback MongoDB endpoint; restart MiniPMDB after changing it. Environment variables take precedence:

- `MINIPMDB_MONGODB_URI`
- `MINIPMDB_DB_NAME`
- `MINIPMDB_HOME`
- `MINIPMDB_API_URL`
- `MINIPMDB_MCP_MODE`

Credential-free local URIs may be saved. Credentialed URIs can be tested for the current process but are not persisted; provide them with `MINIPMDB_MONGODB_URI`. Status output masks credentials.

An engine-neutral [compose.yaml](compose.yaml) runs the same MongoDB patch release with a loopback port, named volume, and health check:

```console
podman compose up -d
# or, for public users
docker compose up -d
```

Keep the Node application outside the container, select External MongoDB, and use `mongodb://127.0.0.1:27017`. Maintainer validation is Podman-first; Docker is documented only as a public-user compatibility path.

## GitHub Action

Export a deliberately reviewed, non-sensitive snapshot:

```console
node src/cli.js export --out governance/minipmdb.snapshot.json
```

Then audit the derived artifact without MongoDB or an install step:

```yaml
- uses: OchsSoft/MiniPMDB@v0.1.0
  with:
    snapshot: governance/minipmdb.snapshot.json
    strict: "true"
```

The Action never treats JSON as canonical and has read-only workflow permissions.

## Validate

```console
npm ci --ignore-scripts
npm run check
npm test
npm run smoke
npm run judge:dry-run
npm run sanitize
npm audit --omit=dev
npm audit signatures
```

MiniPMDB has no remote hosting, telemetry, vector search, transcript capture, or task execution. Only synthetic data is public. See [Architecture](docs/architecture.md), [Security](SECURITY.md), [third-party notices](THIRD_PARTY_NOTICES.md), and the [Build Week disclosure](HACKATHON.md).

MiniPMDB is MPL-2.0 licensed and intentionally small enough to be a first open-source tool without publishing the larger private system that inspired the problem.
