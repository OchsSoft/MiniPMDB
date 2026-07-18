# Try MiniPMDB on your own project

This path lets a judge or maintainer exercise the full review-first workflow against any local repository: an agent proposes unreviewed memories and attaches candidate evidence, a human inspects them, approves or rejects each candidate, and then verifies the resulting audit and context.

The experiment is local. MiniPMDB writes one JSON store and makes no outbound network requests. Use a disposable checkout for the quickest evaluation, or exclude `.minipmdb/` from version control before using a real project. Never put secrets or private conversation content into the store.

## 1. Initialize a store in the target project

Open a terminal in the project you want to evaluate. Replace the MiniPMDB path and project values:

```console
node /absolute/path/to/MiniPMDB/src/cli.js init --project your-project --name "Your Project" --store .minipmdb/store.json
```

For a real repository, add `.minipmdb/` to its `.git/info/exclude` for a local-only experiment, or to `.gitignore` if that policy should be shared. Do not commit the store until you have deliberately reviewed it for sensitive material.

## 2. Connect Codex in project-draft mode

Codex supports local stdio MCP servers in `config.toml`. Personal configuration lives in `~/.codex/config.toml`; a trusted repository can instead use `.codex/config.toml`. Avoid committing a project-local configuration containing machine-specific absolute paths.

```toml
[mcp_servers.minipmdb]
command = "node"
args = ["/absolute/path/to/MiniPMDB/src/mcp.js"]
cwd = "/absolute/path/to/your-project"
env = { MINIPMDB_STORE = ".minipmdb/store.json", MINIPMDB_MCP_MODE = "project-draft" }
```

On Windows, forward-slash paths such as `C:/tools/MiniPMDB/src/mcp.js` work well inside TOML. Save the configuration, restart the Codex client or extension, and open a new task in the target repository. Use `/mcp` where available to confirm that `minipmdb` is connected.

The server advertises its review-first constraints during MCP initialization. `project-draft` is the default MCP permission mode: it means the connected LLM may propose memories and attach evidence to draft or unreviewed candidates in this configured store. It is not the stored lifecycle state. New records are `unreviewed`; `memory_remember` and `source_attach` cannot promote, approve, or reject them. Set `MINIPMDB_MCP_MODE=read-only` for a strict no-write connection. The older name `draft-write` is accepted as a compatibility alias.

Official Codex configuration details are in the [OpenAI MCP documentation](https://learn.chatgpt.com/docs/extend/mcp).

## 3. Let the agent build a review queue

Paste the [draft-memory intake prompt](prompts/draft-memory-intake.md) into the new task. It asks the agent to inspect durable repository evidence, avoid secrets and transient notes, create only three to seven candidates, attach explicit source references, and return their IDs for review.

The prompt ends at the human gate. Before review, candidates stay in the warning/history section of context and cannot become active truth.

## 4. Inspect and decide as the human reviewer

Run every command below from the target project, replacing the MiniPMDB path and memory ID.

List the pending queue:

```console
node /absolute/path/to/MiniPMDB/src/cli.js list --status unreviewed --store .minipmdb/store.json
```

If the agent did not attach evidence, or you want to correct it, use the CLI before review:

```console
node /absolute/path/to/MiniPMDB/src/cli.js source attach <memory-id> --type file --label "Runtime declaration" --ref "package.json#engines" --store .minipmdb/store.json
```

Then approve it explicitly:

```console
node /absolute/path/to/MiniPMDB/src/cli.js review <memory-id> --status reviewed --reviewer judge --note "Verified against the repository source." --store .minipmdb/store.json
```

Reject a candidate that is incorrect, speculative, duplicate, sensitive, or too transient:

```console
node /absolute/path/to/MiniPMDB/src/cli.js review <memory-id> --status rejected --reviewer judge --note "Transient rather than durable project truth." --store .minipmdb/store.json
```

Rejected records remain inspectable in the store and through `list --status rejected`, but they are excluded from generated agent context. If a candidate needs rewriting, reject it and ask the agent to draft a corrected replacement rather than silently approving an ambiguous claim.

## 5. Verify the governed result

```console
node /absolute/path/to/MiniPMDB/src/cli.js audit --strict --store .minipmdb/store.json
node /absolute/path/to/MiniPMDB/src/cli.js context --profile balanced --task "continue project work" --store .minipmdb/store.json
node /absolute/path/to/MiniPMDB/src/cli.js list --status rejected --store .minipmdb/store.json
```

Expected behavior:

- approved, reviewed records can enter active project truth;
- rejected records never enter context;
- pending agent candidates remain warnings rather than truth;
- a high-confidence approved record without a source makes the strict audit fail; and
- source references and lifecycle state remain visible for inspection.

When the experiment is complete, change `MINIPMDB_MCP_MODE` to `read-only` and restart the client if you want strict no-write access. To remove a disposable evaluation, delete only the target project's `.minipmdb/` directory after confirming its exact path and that no reviewed data needs to be retained.
