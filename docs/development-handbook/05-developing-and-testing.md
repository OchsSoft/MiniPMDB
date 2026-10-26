# Developing and testing changes

## Read the full request path

For a dashboard feature trace DOM controls in `public/index.html` and `public/app.js`, then its HTTP route in `src/api.js`, service method, normalization, and database write. For CLI/MCP changes also trace `src/cli.js`, `src/mcp.js`, and `src/api-client.js`. A useful first search is the route string or method name. Do not add a second storage helper because a frontend file seems convenient.

Use small focused tests with synthetic projects. The repository separates runtime, API, service, context, MCP, and audit tests. The service tests are where write-policy behavior belongs; context tests should assert both selected metadata and rendered text; API tests verify status/shape and lifecycle cleanup. A test that merely repeats a constant from the implementation does not establish a user-visible outcome.

## Worked change: make truncation honest

Problem: `buildContextPack` can preserve a critical warning in selection arrays but cut the final formatted string. `auditContext` checks selected omission arrays, not whether the full required text reached the final pack. This repair is proposed work, not present behavior.

First build a fixture with several long critical warnings, a broken touchpoint, and a deliberately small `maxChars`. Assert that either all required safety content appears or the result explicitly reports required overflow and incomplete governing coverage. Also assert the exact rendered pack budget and that a caller cannot mistake incomplete coverage for success. Include a warning with its important condition at the end of the body so a superficial ID-only check cannot pass.

Change `src/context.js` to track the items actually emitted after trimming, record required overflow, and avoid a silent arbitrary slice through a safety record. Decide whether overflow returns a bounded summary plus retrieval instructions or an explicit failure; document that contract before updating callers. Update `src/audit.js` to fail when required content cannot be delivered, then `public/app.js` to display the warning. Cover all three profiles and a normal no-overflow pack so the fix does not turn every request into an error. The acceptance evidence is actual output text and telemetry that agree, not just a green length assertion.

## Worked change: strengthen supersession integrity

Problem: `supersede` checks existence but does not reject self-replacement, prevent cycles, require an already reviewed replacement, or provide a single atomic relationship update. Those constraints are useful future governance work.

Write service tests for old equals new, replacement from an inappropriate project, unreviewed replacement, an existing chain/cycle, duplicate retry, and injected failure after updating the old record. Decide explicitly whether cross-project supersession is allowed; do not infer an identity migration from a similar title. Define idempotence: submitting the same completed request twice should return the same relationship rather than create duplicates.

Implement shared checks in `src/service.js`; keep schema validation in `src/schema.js` and storage operations in `src/database.js`. If using MongoDB transactions, establish a compatible replica-set deployment and test it; standalone managed MongoDB cannot simply be assumed to support transaction semantics. A recovery-oriented alternative may use a durable operation record and reconciliation, but that changes the data model and needs its own migration. Acceptance includes a restart/failure test demonstrating that the old memory cannot be left misleadingly superseded without a durable replacement relationship.

## Worked change: add a simple memory field

Suppose you want an optional review-due date. Define its meaning first: does it warn when overdue or automatically make guidance stale? Prefer an explicit warning rather than silently changing governance. Extend normalization in `src/schema.js`, the Mongo validator in `src/database.js`, service creation/update paths, snapshot import/export compatibility, dashboard rendering, and CLI/MCP schema only where those callers should set it. Existing records must remain readable when the field is absent.

Test invalid dates, absent dates, boundary times, and exports from the old shape. Use a fixed clock or supplied timestamp rather than tests that fail depending on today's date. Add an audit issue and UI explanation if overdue dates matter. Do not put a behaviorally important field only inside arbitrary metadata and rely on developers to remember its spelling.

## Validation sequence

Run the narrow affected tests while iterating, then `npm run check`, `npm test`, `npm run smoke`, and `npm run sanitize` on the complete documentation/source tree. For API/runtime changes, add an isolated real MongoDB round trip: create, review, export, stop, restart, retrieve the same ID, and verify shutdown leaves no owned child running. Separate failures caused by unsupported downloaded binaries from failures in the JavaScript logic.

A docs-only change needs link, source-reference, diagram, Word, and PDF checks; it does not warrant a destructive demo reset. A future runtime PR should record exact Node/Mongo versions, platform, commands, counts, and remaining skips. Commit intentionally on a topic branch, push only after local proof, open a ready independent PR against `master`, and leave merge/release to the human. Hosted CI being disabled is not a passing check.
