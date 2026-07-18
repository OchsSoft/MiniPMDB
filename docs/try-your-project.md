# Try MiniPMDB on your own project

This route exercises the complete trust boundary on a disposable or real local repository. MiniPMDB stores only the memories and evidence references you explicitly submit; never add secrets, raw private conversations, or credential files.

## 1. Start MiniPMDB

From the MiniPMDB checkout:

```console
npm ci --ignore-scripts
npm start
```

Managed MongoDB downloads on first use and persists under the platform user-data directory. Keep this foreground server running.

## 2. Register the repository

In another terminal:

```console
node /absolute/path/to/MiniPMDB/src/cli.js project add --key your-project --name "Your Project" --repo /absolute/path/to/your-project
```

Registration is a human operation. The repository path lets MCP resolve the project from its working directory; an agent cannot choose another project key.

## 3. Connect Codex in project-draft mode

Add the following to personal `~/.codex/config.toml` or a trusted project configuration. Avoid committing machine-specific absolute paths.

```toml
[mcp_servers.minipmdb]
command = "node"
args = ["/absolute/path/to/MiniPMDB/src/mcp.js"]
cwd = "/absolute/path/to/your-project"
env = { MINIPMDB_API_URL = "http://127.0.0.1:8797", MINIPMDB_MCP_MODE = "project-draft" }
```

Restart Codex and confirm the five MiniPMDB tools are available. `project-draft` permits local unreviewed candidates and candidate evidence only. Use `read-only` to expose only context, audit, and list.

## 4. Let Codex build a review queue

Paste the [copy-ready intake prompt](prompts/draft-memory-intake.md) into a new task in the registered repository. It asks Codex to inspect durable repository evidence, propose three to seven candidates, attach evidence, verify they remain unreviewed, and stop at the human gate.

## 5. Approve or reject as a human

Open `http://127.0.0.1:8797`, select the project, and use the review queue. Or use the CLI:

```console
node /absolute/path/to/MiniPMDB/src/cli.js list --project your-project --status unreviewed
node /absolute/path/to/MiniPMDB/src/cli.js review MEMORY_ID --status reviewed --reviewer judge --note "Verified against repository evidence."
node /absolute/path/to/MiniPMDB/src/cli.js review OTHER_ID --status rejected --reviewer judge --note "Transient or unsupported."
```

Rejected records remain auditable but do not enter generated context. If a claim is ambiguous, reject it and have the agent create a corrected candidate.

## 6. Verify the result

```console
node /absolute/path/to/MiniPMDB/src/cli.js audit --project your-project --strict
node /absolute/path/to/MiniPMDB/src/cli.js context --project your-project --profile balanced --task "continue project work"
```

Expected behavior: reviewed records enter active truth, rejected records are excluded, pending candidates remain warnings/history, and a high-confidence approved record without evidence fails strict audit.

## 7. Optional cross-project proof

Register a second disposable repository, create and review a memory in each, then use the dashboard's touchpoint form or:

```console
node /absolute/path/to/MiniPMDB/src/cli.js touchpoint upsert --name "Shared contract" --projects your-project,second-project --memories FIRST_ID,SECOND_ID --kind api-contract
```

Context for either project now includes the other project's referenced memory with a project label and inclusion reason. Remove the touchpoint and that cross-project memory disappears.
