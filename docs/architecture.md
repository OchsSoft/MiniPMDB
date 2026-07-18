# Architecture

MiniPMDB has one canonical artifact: a versioned JSON store. Every surface reads the same store and applies the same lifecycle and audit rules.

```text
                    ┌──────────────┐
Codex / MCP ───────▶│              │
CLI ───────────────▶│ JSON store   │◀──── atomic temp + rename
Local dashboard ──▶│              │
GitHub Action ─────▶│              │
                    └──────┬───────┘
                           │
                 context + audit engines
```

## Modules

- `schema.js` validates the complete store at every read and write boundary.
- `store.js` serializes in-process mutations and writes through a same-directory temporary file.
- `service.js` owns review-first mutations and the synthetic resolution operation.
- `context.js` ranks reviewed truth and warnings deterministically, then enforces exact profile budgets.
- `audit.js` evaluates raw lifecycle/provenance integrity and the output of every context profile.
- `mcp.js` defaults to project-draft: read tools plus constrained unreviewed-candidate creation and candidate evidence attachment. Explicit read-only removes every write tool; neither mode exposes review decisions.
- `api.js` serves read APIs, two synthetic demo operations, and the static local dashboard on loopback.
- `cli.js` is the human and CI interface.

## Store shape

The store contains four top-level fields after `version`:

- `project`: stable project identity and timestamps;
- `memories`: claims with kind, status, confidence, sources, criticality, and review metadata;
- `sources`: small provenance references, not copied source payloads;
- `links`: explicit support, conflict, and supersession relationships.

The mini edition favors inspectability over scale. It is suitable for a repository-sized governed memory set, not a high-volume event stream.

## Trust model

A record is active truth only when its lifecycle status is active and its review metadata is not unreviewed. Draft, unreviewed, stale, and superseded records are warnings/history. Archived and rejected records are excluded from context.

High confidence does not create trust by itself. Active high-confidence claims need a source. Conflicts require a separate reviewed resolution. Supersession keeps the old record but prevents it from remaining active.

The compact profile prioritizes critical warnings before other content. The audit independently verifies that no critical warning was dropped and that the rendered pack remains within budget.
