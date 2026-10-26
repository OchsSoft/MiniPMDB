# Using, running, and closing

## Register one repository

Run the CLI against the intended loopback API, supplying a deliberate stable key and the actual repository root. This example uses a synthetic folder that you create for the exercise:

```bash
mkdir -p /tmp/mini-workshop-demo
node src/cli.js project add --key sample-workshop \
  --name 'Sample Workshop' --repo /tmp/mini-workshop-demo
```

Read the returned project key and canonical root. If the path is wrong, correct registration deliberately before starting MCP. A project key is an identity that other records reference; renaming a display label is different from migrating every reference to a new key.

## Record, support, and review a fact

Create a narrowly phrased candidate describing a decision and its reason. The CLI forces review-first capture. Do not use one huge memory to hold a whole log or every open task.

```bash
node src/cli.js remember --project sample-workshop \
  --title 'Use a local-only development listener' \
  --body 'The development API binds to loopback so this demo is not exposed on the LAN.' \
  --kind constraint --confidence medium
```

Copy the returned memory ID. Attach a real synthetic evidence reference using `source attach MEMORY_ID --label LABEL --ref REF`. Then inspect the claim and evidence in the review queue. Choose approve only when the actual source supports the wording and scope. Reject unsupported candidates; review is not a cosmetic step to make audit green. The dashboard writes reviewer `dashboard-human` and a standard note; the CLI permits an explicit reviewer/note for a more useful audit trail.

After review, request context for the same project and a concrete task. Read warning/history sections as well as active guidance. A superseded decision can still explain why an older source file differs from the current intended policy.

```bash
node src/cli.js context --project sample-workshop \
  --task 'change the development listener' --profile balanced
node src/cli.js audit --project sample-workshop --strict
```

## Change a decision without erasing history

First create and review the replacement record with the new reason and supporting evidence. Then use `supersede OLD_ID --with REPLACEMENT_ID --reason TEXT`. Check the old record, replacement, and supersession link afterward. A successful single request is not permission to delete the old memory. If interrupted, inspect both records and links before retrying because the operation is not transactional and a repeated call can create another link.

A touchpoint is appropriate when two registered projects share an actual contract. Use `touchpoint upsert` with both project keys and a memory from each side. The service checks that each memory exists and belongs to a participant. For an active relationship the audit additionally expects a nonexcluded memory for every participant. Use `planned` for a proposed connection and change its state only when the contract has been checked.

## Connect an assistant safely

Start the HTTP service first. Configure the assistant's MCP client to launch `node src/mcp.js` from the exact registered repository root, with the intended `MINIPMDB_API_URL`. Keep stdout reserved for protocol messages; diagnostic text belongs on stderr. Do not launch it from an unrelated directory and then grant a broader mode to fix a scope error.

Default `project-draft` exposes read tools and project-scoped candidate/evidence writes. `read-only` removes write tools. The accepted alias `draft-write` follows the draft-write policy, not unrestricted human review authority. Tool descriptions and annotations are informative; enforced checks in the server/service remain essential. The MCP interface does not offer human review, arbitrary project registration, or unrestricted supersession.

Ask the assistant to capture a synthetic fact, confirm the returned ID, then independently see that it is still unreviewed. Verify that attempts to write another project, attach evidence to an already reviewed record, and invoke unavailable human operations fail in a test fixture. A tool's existence in a client list is not evidence that a memory was actually saved.

## Export and close

Before a substantial change, write an export to a private backup directory:

```bash
node src/cli.js export --out /tmp/minipmdb-workshop-backup.json
node src/cli.js audit-snapshot \
  --snapshot /tmp/minipmdb-workshop-backup.json --strict
```

Use a durable private location instead of `/tmp` for a real backup. The temporary path here avoids suggesting a universal machine-specific backup layout. Export includes all collections, not only the currently selected dashboard project. Snapshot reads are parallel across collections, so a busy database can change during export; quiesce writes for an important recovery point.

Stop the MCP client/assistant connection, finish outstanding writes, and stop the foreground API with its normal terminal interrupt. `RuntimeManager.stop` closes the driver and stops the managed child with cleanup disabled so persistent files remain. For an external Podman service, stop only the service you started after other clients have disconnected. Do not remove volumes. On the next start verify the same database identity and a known record ID before resuming work.
