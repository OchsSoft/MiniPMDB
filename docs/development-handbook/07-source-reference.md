# Source reference

The handbook describes the committed implementation at the following baseline. These links remain tied to that revision, so a future change can be compared with the behavior described here.

Repository `OchsSoft/MiniPMDB`. Baseline `834274e5bf7ab78bac36d6fd70ec317759201dcc`.

| Source | What to inspect |
|---|---|
| [src/api.js](https://github.com/OchsSoft/MiniPMDB/blob/834274e5bf7ab78bac36d6fd70ec317759201dcc/src/api.js) | Loopback server, routes, static files, startup and close. |
| [src/runtime.js](https://github.com/OchsSoft/MiniPMDB/blob/834274e5bf7ab78bac36d6fd70ec317759201dcc/src/runtime.js) | Managed/external storage lifecycle and persistent WiredTiger path. |
| [src/runtime-config.js](https://github.com/OchsSoft/MiniPMDB/blob/834274e5bf7ab78bac36d6fd70ec317759201dcc/src/runtime-config.js) | Application home, config validation and credential rule. |
| [src/database.js](https://github.com/OchsSoft/MiniPMDB/blob/834274e5bf7ab78bac36d6fd70ec317759201dcc/src/database.js) | Collections, indexes, snapshot and nontransactional replacement. |
| [src/schema.js](https://github.com/OchsSoft/MiniPMDB/blob/834274e5bf7ab78bac36d6fd70ec317759201dcc/src/schema.js) | Normalization and snapshot version 2. |
| [src/constants.js](https://github.com/OchsSoft/MiniPMDB/blob/834274e5bf7ab78bac36d6fd70ec317759201dcc/src/constants.js) | Kinds, statuses, context profiles and pinned MongoDB. |
| [src/service.js](https://github.com/OchsSoft/MiniPMDB/blob/834274e5bf7ab78bac36d6fd70ec317759201dcc/src/service.js) | Project identity, candidate policy, review, sources and supersession. |
| [src/context.js](https://github.com/OchsSoft/MiniPMDB/blob/834274e5bf7ab78bac36d6fd70ec317759201dcc/src/context.js) | Ranking, required-first selection, trimming and final slice. |
| [src/audit.js](https://github.com/OchsSoft/MiniPMDB/blob/834274e5bf7ab78bac36d6fd70ec317759201dcc/src/audit.js) | Integrity issue codes and three-profile audit. |
| [src/cli.js](https://github.com/OchsSoft/MiniPMDB/blob/834274e5bf7ab78bac36d6fd70ec317759201dcc/src/cli.js) | Human commands, export and offline audit. |
| [src/mcp.js](https://github.com/OchsSoft/MiniPMDB/blob/834274e5bf7ab78bac36d6fd70ec317759201dcc/src/mcp.js) | JSON-RPC, tool modes and repository scope. |
| [src/api-client.js](https://github.com/OchsSoft/MiniPMDB/blob/834274e5bf7ab78bac36d6fd70ec317759201dcc/src/api-client.js) | Shared HTTP client and default endpoint. |
| [public/app.js](https://github.com/OchsSoft/MiniPMDB/blob/834274e5bf7ab78bac36d6fd70ec317759201dcc/public/app.js) | Dashboard state, review queue, runtime controls and context display. |
| [public/index.html](https://github.com/OchsSoft/MiniPMDB/blob/834274e5bf7ab78bac36d6fd70ec317759201dcc/public/index.html) | Human controls and labels. |
| [compose.yaml](https://github.com/OchsSoft/MiniPMDB/blob/834274e5bf7ab78bac36d6fd70ec317759201dcc/compose.yaml) | Optional external MongoDB service; use Podman. |
| [package.json](https://github.com/OchsSoft/MiniPMDB/blob/834274e5bf7ab78bac36d6fd70ec317759201dcc/package.json) | Actual check/test/smoke/sanitize commands and dependencies. |
| [test/context.test.js](https://github.com/OchsSoft/MiniPMDB/blob/834274e5bf7ab78bac36d6fd70ec317759201dcc/test/context.test.js) | Context profile and warning regression tests. |
| [test/service.test.js](https://github.com/OchsSoft/MiniPMDB/blob/834274e5bf7ab78bac36d6fd70ec317759201dcc/test/service.test.js) | Service behavior tests. |
| [test/mcp.test.js](https://github.com/OchsSoft/MiniPMDB/blob/834274e5bf7ab78bac36d6fd70ec317759201dcc/test/mcp.test.js) | MCP policy and protocol tests. |
| [test/api.test.js](https://github.com/OchsSoft/MiniPMDB/blob/834274e5bf7ab78bac36d6fd70ec317759201dcc/test/api.test.js) | API contract tests. |
| [test/runtime.test.js](https://github.com/OchsSoft/MiniPMDB/blob/834274e5bf7ab78bac36d6fd70ec317759201dcc/test/runtime.test.js) | Storage lifecycle tests. |
| [test/audit.test.js](https://github.com/OchsSoft/MiniPMDB/blob/834274e5bf7ab78bac36d6fd70ec317759201dcc/test/audit.test.js) | Audit safety checks. |
| [scripts/sanitize-check.js](https://github.com/OchsSoft/MiniPMDB/blob/834274e5bf7ab78bac36d6fd70ec317759201dcc/scripts/sanitize-check.js) | Public-source vocabulary, file-size and credential-like checks. |

Use repository search to find a named function before editing. Source line numbers move as code changes; a symbol and pinned commit are more durable together than an unqualified line number.

## How to keep this handbook current

When a route, schema, mode default, storage path, or review rule changes, update the affected chapter and its diagram in the same PR. Keep the source baseline explicit; compare the new source with this edition before relying on a formerly known limitation. Regenerate Word and PDF from the reviewed chapter text and inspect every page. A planned repair remains a gap until code and its real acceptance evidence establish otherwise.

The reproducible commands in this book are source-defined instructions. Documentation creation does not certify live persistence, browser use, assistant connection, or managed MongoDB qualification. Record those as separate local validation results when you actually perform them.
