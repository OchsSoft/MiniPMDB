# MiniPMDB

**CI for agent memory.** MiniPMDB is a small, local-first quality gate that stops unreviewed, unsourced, contradictory, or obsolete project memories from silently becoming coding-agent truth.

Most memory tools optimize recall. MiniPMDB asks a different question: **should this memory be trusted, and can the repository prove why?**

It ships as a dependency-free Node.js CLI, a stdio MCP server for Codex and other compatible agents, a local audit dashboard, and a composable GitHub Action.

## Judge demo: one command

Requirements: Node.js 20 or newer. No database, account, API key, container, or package download is required.

```console
npm run judge:demo
```

The command loads a synthetic unsafe-memory example, starts the loopback dashboard, and opens it in your browser. Select **Apply governed fix** to see the strict audit move from blocked to passing without deleting the historical warning. On Windows, `judge-demo.cmd` provides the same path by double-click; macOS and Linux users can run `./judge-demo.sh`.

For a non-interactive proof of the complete CLI, context, dashboard API, default project-draft MCP path, and strict read-only mode:

```console
npm run judge:dry-run
```

See the [judge guide](docs/judge-guide.md) for supported platforms, expected results, and a three-minute evaluation route.

## See the failure manually in 60 seconds

```console
npm run demo:reset
node src/cli.js audit --strict
```

The strict audit fails because an agent-created, unsourced claim says the release needs a long-lived registry token while reviewed evidence says the project uses OIDC.

```console
npm run demo:fix
node src/cli.js audit --strict
node src/cli.js context --profile compact --task "prepare the release"
```

The fix does not erase history. It adds a reviewed resolution, marks the old claim superseded, and keeps the conflict visible as a warning. The audit passes, and the compact context pack gives an agent clean active truth without silently hiding the historical risk.

Start the local dashboard:

```console
npm start
```

Open `http://127.0.0.1:8797`. The dashboard's two demo buttons reproduce the same fail–fix–pass flow.

## What the strict audit checks

- Active records cannot still be marked unreviewed.
- High-confidence active claims need source references.
- Supersession links must resolve, and superseded records cannot remain active.
- Conflicts need a reviewed resolution record.
- Source and relationship references cannot be broken.
- Archived or rejected records cannot leak into context.
- Warning records cannot be presented as active truth.
- Every profile must stay within budget.
- Compact profiles cannot silently drop critical warnings.

`minipmdb audit --strict` exits nonzero on errors or warnings, so the same policy runs locally, through MCP, and in CI.

## Use it from Codex through MCP

MiniPMDB defaults to `project-draft`: the connected agent can read governed context, propose unreviewed memories, and attach evidence to those candidates inside the configured project store. Add this to your Codex configuration, replacing the path with your checkout:

```toml
[mcp_servers.minipmdb]
command = "node"
args = ["/absolute/path/to/MiniPMDB/src/mcp.js"]
cwd = "/absolute/path/to/your-project"
env = { MINIPMDB_STORE = ".minipmdb/store.json" }
```

Available read tools:

- `memory_context` returns a budgeted pack with reviewed truth and warnings in separate sections.
- `memory_audit` runs the same governance checks as CI.
- `memory_list` exposes the local lifecycle state for inspection.

Default project-draft mode also exposes:

- `memory_remember` creates a candidate with lifecycle status `unreviewed`.
- `source_attach` adds evidence only to a `draft` or `unreviewed` candidate and does not promote it.

**Project-draft names the MCP permission boundary, not the stored lifecycle state.** An agent cannot approve or reject its own claim; review stays an explicit CLI or maintainer action. Set `MINIPMDB_MCP_MODE=read-only` for a strict no-write connection. `draft-write` remains accepted as a compatibility alias for `project-draft`.

To exercise that full workflow on a repository of your own, follow [Try MiniPMDB on your own project](docs/try-your-project.md) and paste the [copy-ready draft-memory intake prompt](docs/prompts/draft-memory-intake.md) into a new Codex task. The guide covers local store initialization, MCP configuration, unreviewed candidate creation, evidence attachment, human approval or rejection, and final audit/context verification.

The MCP tool schemas include read-only, destructive, and open-world annotations that match their behavior. See the official [Codex MCP documentation](https://developers.openai.com/codex/mcp/) for configuration concepts.

## Put the audit in GitHub Actions

Commit only a deliberately reviewed, non-sensitive MiniPMDB store. Then add:

```yaml
- uses: OchsSoft/MiniPMDB@v0.1.0
  with:
    store: governance/project-memory.json
    strict: "true"
```

The action has no install step and receives only read access from the workflow. Local stores under `.minipmdb/` are ignored by default to reduce accidental publication.

## CLI

```text
minipmdb init --project <key> --name <name>
minipmdb list [--status unreviewed|reviewed|rejected|...]
minipmdb remember --title <title> --body <body> [--kind decision]
minipmdb source attach <memory-id> --label <label> --ref <reference>
minipmdb review <memory-id> [--status reviewed]
minipmdb supersede <old-id> --with <replacement-id>
minipmdb context --task <task> [--profile drift_guard|balanced|compact]
minipmdb audit [--strict] [--json]
```

All commands accept `--store <path>`. The default is `.minipmdb/store.json`.

## Design boundaries

MiniPMDB intentionally does not:

- capture conversations or IDE sessions automatically;
- embed, vectorize, or send memory to a hosted service;
- execute tasks, shell commands, deployments, or approval workflows;
- claim that a stored note is true merely because an agent wrote it;
- replace the full database-backed system from which the governance problem was learned.

The JSON store is canonical in this mini edition. Writes use a same-directory temporary file and rename, and in-process updates are serialized. The HTTP dashboard binds only to `127.0.0.1`.

See [Architecture](docs/architecture.md), [Hackathon disclosure](HACKATHON.md), and [Security](SECURITY.md).

## Validate

```console
npm ci --ignore-scripts
npm run check
npm test
npm run smoke
npm run judge:dry-run
```

The project uses Node built-ins only. `npm ci` verifies the lockfile but downloads no runtime packages.

## Open source

MiniPMDB is licensed under the [Mozilla Public License 2.0](LICENSE). Changes to MPL-covered source files remain open while the library can still be used inside larger works under different terms.

This is the first public, intentionally bounded edition of a larger private project. Contributions are welcome when they preserve the small, auditable product boundary. Start with [CONTRIBUTING.md](CONTRIBUTING.md).
