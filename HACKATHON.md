# OpenAI Build Week disclosure

MiniPMDB is planned for the **Developer Tools** category.

## Preexisting foundation

Before the submission period, a private database-backed project already explored durable project memory, provenance, lifecycle states, context profiles, and local MCP access. That private project is not this repository and is not submitted for judging.

## New work for this entry

This repository has new history and a deliberately smaller implementation written during the Build Week submission period. The judged work is:

- the audit-first product thesis: CI for agent-memory quality rather than generic persistent recall;
- a strict, deterministic governance audit with machine-readable exit behavior;
- checks for review state, evidence, conflicts, supersession, reference integrity, context leakage, warning retention, and context budgets;
- a dependency-free, versioned JSON store with atomic writes;
- a review-first stdio MCP surface with accurate safety annotations;
- a composable GitHub Action;
- the synthetic fail–fix–pass release demonstration;
- the local inspection dashboard, tests, public documentation, and open-source packaging.

No private project data, private integration vocabulary, credentials, transcripts, customer material, local machine paths, or Git history are included. The example project and every memory in it are synthetic.

## Codex and GPT-5.6 build evidence

Codex is the primary implementation environment for this extraction. The primary session covers product positioning, sanitization boundaries, implementation, tests, documentation, demo design, and repository preparation. GPT-5.6 is used in that primary Codex build thread.

Before submission, add the `/feedback` Session ID here and to the Devpost form:

```text
Primary Codex /feedback Session ID: TBD before submission
```

The final public commit range and release tag will provide the corresponding source evidence. Claims in this file should be updated only with verifiable build evidence.

## Judge path

1. Run `npm run judge:demo` or use the platform launcher documented in [`docs/judge-guide.md`](docs/judge-guide.md).
2. In the dashboard, observe the blocked strict audit and the unsafe claim separated into warnings.
3. Select **Apply governed fix** and observe the passing audit, reviewed OIDC truth, and retained historical warning.
4. Optionally run `npm run judge:dry-run` for an automated proof across CLI, context, HTTP API, and read-only MCP.
5. Run `npm test` to inspect the focused unit and integration suite.
6. For a flexible evaluation beyond the prepared fixture, follow [`docs/try-your-project.md`](docs/try-your-project.md) to let an agent draft memories from another local repository and then approve or reject them at the human gate.

The full flow requires no account, secret, model API call, container, or external database.
