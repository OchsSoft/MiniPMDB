# OpenAI Build Week disclosure

MiniPMDB is submitted to **Developer Tools** as “CI for cross-project agent memory.”

## Preexisting foundation

Before the submission period, a private database-backed project explored durable memory, provenance, lifecycle governance, context profiles, and local agent access. That private codebase, data, history, and integrations are not part of this repository or submission.

## New work for this entry

This repository has new public history and a deliberately bounded implementation created during the Build Week period. The judged work includes:

- a MongoDB-backed five-collection model for multiple projects and shared touchpoints;
- deterministic audits for review state, evidence, conflicts, supersession, reference integrity, rejected leakage, and context budgets;
- project-scoped `project-draft` MCP permissions and strict read-only mode;
- managed local MongoDB plus external, Podman, and Docker-compatible configuration;
- a dependency-free snapshot v2 GitHub Action;
- the synthetic cross-project fail–review–resolve demonstration;
- the dashboard, CLI, tests, documentation, and public open-source packaging.

No private project data, credentials, transcripts, customer material, machine paths, private integration vocabulary, MongoDB binaries, or previous Git history are included. Every public project and memory is synthetic.

## Codex and GPT-5.6 build evidence

Codex with GPT-5.6 is the primary implementation environment for product positioning, sanitization, architecture, implementation, validation, documentation, and demo preparation.

```text
Primary Codex /feedback Session ID: TBD before submission
```

The user supplies that session ID, narration, public YouTube upload, and final Devpost form. The public commits and release tag provide source evidence.

## Judge path

1. Run `npm ci --ignore-scripts` and `npm run judge:demo`.
2. Observe the broken cross-project release-auth touchpoint and strict audit failure.
3. Inspect Project A context and see Project B's labeled memory through that touchpoint.
4. Apply the governed fix and confirm strict audit passes while superseded history remains.
5. Optionally run `npm run judge:dry-run` for the managed, external, persistence, MCP, and audit proof.
6. Follow [the bring-your-own-project guide](docs/try-your-project.md) to let Codex propose real repository-grounded candidates for human approval or rejection.
