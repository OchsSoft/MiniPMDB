# Submission copy

## YouTube

**Title:** MiniPMDB — CI for Cross-Project Agent Memory | OpenAI Build Week

**Description:**

MiniPMDB is a local-first developer tool that stops unreviewed, unsourced, contradictory, or obsolete memories from silently becoming coding-agent truth.

This working demo shows two synthetic projects colliding over a shared release-auth contract, MongoDB-backed touchpoints making the conflict visible, a strict audit failure, project-scoped Codex memory drafting, human review, explicit supersession, and a passing audit that preserves history.

Built with Codex and GPT-5.6 for OpenAI Build Week. Open source under MPL-2.0.

Repository: https://github.com/OchsSoft/MiniPMDB

## Devpost tagline

CI for cross-project agent memory.

## Devpost description

Coding agents are increasingly good at remembering, but persistence creates a new failure mode: a stale, unsourced, or agent-invented note can quietly steer every future session. The danger increases when Project A depends on a contract owned by Project B while each agent sees only its own repository.

MiniPMDB is a local-first trust and provenance layer for coding-agent memory. MongoDB is its canonical store across five collections: projects, memories, sources, links, and touchpoints. A touchpoint connects two or more projects and validates that its referenced memories belong to its participants. Context for either project can then include the other project's governed memory with an explicit project label and inclusion reason. Broken contracts and unresolved warnings survive even compact context profiles.

The MCP server defaults to project-draft. Codex can read governed context, propose only unreviewed candidates for the project resolved from its working directory, and attach evidence only to those candidates. It cannot approve, reject, supersede, register projects, write another project, or edit shared touchpoints. Humans retain those controls in the loopback dashboard and CLI. Strict read-only exposes no write tools.

MiniPMDB runs with a managed, persistent local MongoDB by default and also supports external local, Podman, and Docker instances. Snapshot v2 JSON is a derived audit/export artifact for the dependency-free GitHub Action, never a second canonical backend.

The demo uses two entirely synthetic projects. Their release-auth memories conflict, the strict audit fails, a human-reviewed resolution supersedes the unsafe claim, the touchpoint is repaired, and the identical audit passes without deleting history.

This public repository is a small new implementation created during Build Week. A larger private concept predated the event; none of its code, data, integrations, or history is included. Codex with GPT-5.6 was the primary build environment for the extraction, architecture, implementation, tests, docs, and demo.

## Devpost testing instructions

Requirements: Node.js 20.19+ and first-run network access.

1. Clone the repository.
2. Run `npm ci --ignore-scripts`.
3. Run `npm run judge:demo`.
4. In the dashboard, select Paper Crane CLI and inspect the blocked audit, broken Release authentication contract, review queue, and cross-project context.
5. Select **Apply governed fix** and confirm the audit passes while the superseded token claim remains in history.
6. Stop with `Ctrl+C`.
7. Optionally run `npm run judge:dry-run` for automated managed persistence, external Mongo, MCP permissions, cross-project isolation, and fail–resolve–pass verification.
8. For a project of your own, follow `docs/try-your-project.md` and paste `docs/prompts/draft-memory-intake.md` into Codex.

The first managed start downloads a pinned MongoDB Community Server binary; subsequent starts reuse the local cache. No account, API key, hosted service, model call, or container is required for the prepared demo.
