# Known gaps, diagnosis, and recovery

## Diagnose from the symptom

If the CLI reports a connection refusal, inspect the foreground API terminal and intended API URL before changing the database. If the dashboard loads but runtime is not ready, inspect mode, database, managed binary preparation, and Mongo connection errors. If records appear missing after a restart, compare `MINIPMDB_HOME`, saved configuration, URI override, and database name with the previous run. A different empty database is not proof that the original files were lost.

If managed start fails on NixOS, preserve `data/`, record the exact loader/library message, and qualify either a packaged executable configuration or the external Podman route. A failed binary download belongs to network/cache diagnosis; an executable that downloads then cannot start belongs to platform diagnosis. Repeatedly clearing data conflates both and destroys the strongest recovery evidence.

If MCP cannot resolve a project, compare its launch working directory with the registered canonical root. If a write tool is absent, inspect `MINIPMDB_MCP_MODE` and the client tool refresh. If a write succeeds but context does not show it as active, check candidate status, review metadata, ranking, profile limits, and truncation. Do not promote a record to high confidence solely to improve its ranking.

## Audit failures are actionable records

`broken_source_reference` requires locating the missing source or correcting the claim's reference, not deleting the audit message. `cross_project_source_reference` means evidence ownership is wrong. `active_unreviewed` signals inconsistent governance state. `unresolved_conflict` requires an actual reviewed resolution. `touchpoint_missing_project_memory` means one side of a shared agreement has no qualifying record. Strict-mode candidate warnings usually mean review work remains, not database corruption.

The audit is structural. It does not fetch every source URL, verify a human identity, prove every stored claim, or execute the projects described. Its touchpoint check counts nonexcluded records; it is not an independent semantic review that every participant agreed. A passing report must be interpreted within those limits.

## Recovery and backup limits

An export is useful but not automatically a transactionally consistent backup. `snapshot()` reads collections in parallel, while writes may proceed. `replaceSnapshot()` deletes and inserts collections sequentially and is destructive; interruption can leave a partial state. The ordinary CLI exposes export and offline audit, not a safe general-purpose atomic import wizard. The demo reset route is not a restore procedure.

For a real restore, stop writers, preserve the original database/volume and export, validate the candidate snapshot offline, and restore into a separate named database first. Compare collection counts, important IDs, sources, review metadata, links, and all-profile audits. Start an isolated API against that copy and verify representative records before any deliberate switch. Preserve the original until the human accepts the result. A copy of live WiredTiger files without proper database backup handling is not a guaranteed recoverable image.

## Prioritized development backlog

The first priority is truthful context completeness: required warnings may survive selection but be cut by the final text slice. Fix `src/context.js`, `src/audit.js`, and dashboard warnings with overflow tests described in the development chapter. The acceptance criterion is that required text delivery and omission telemetry agree for tiny budgets and many critical records.

The second priority is multi-write integrity. Evidence attachment and supersession can stop between writes, while snapshot replacement can stop between collections. Design idempotent operations, validation, and recoverable failure handling. Do not advertise an atomic backup/import capability until a killed-process/fault-injection test proves it. Preserve raw broken states as synthetic fixtures for regression tests.

The third priority is the local trust boundary. The API's loopback binding is useful but has no authentication, human identity verification, or distinct authorization for review/demo operations. Before any shared-machine, forwarded-port, or remote access design, add an explicit threat model and authenticated authority checks. Test unauthorized review/reset, origin/CSRF behavior, credential handling, and restricted read/write scopes. Do not broaden the listener as a quick convenience change.

The fourth priority is reproducible NixOS qualification. Add an approved development environment and a tested database route, then demonstrate persistence, restart, cleanup, and offline recovery. Record managed and external modes separately. A generic Linux build badge cannot settle NixOS loader compatibility.

The fifth priority is scale and migrations. Several endpoints materialize the full snapshot, and context/audit use in-process scans. Add bounded pagination and explicit full-record retrieval without confusing a bounded page with an exhaustive project inventory. Introduce versioned migrations and compatible snapshot upgrades before changing stored contracts. Measure with synthetic large datasets; never solve a slow context request by silently dropping the warnings it was meant to preserve.

## Before you stop a difficult session

Write the reproducible issue in the normal issue/PR system with the exact source revision, relevant record IDs, redacted error, command, expected result, observed result, and preservation location. Keep secrets and raw private records out of public reports. Leave the database stopped or clearly identify the owned running service. This handbook supplies the map; durable project claims should still pass through the product's evidence and review process rather than becoming informal notes scattered around the repository.
