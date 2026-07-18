# MiniPMDB live-demo voiceover

Read naturally at roughly 120 words per minute. Every visual is a recording of the real loopback application using synthetic data.

## 00:00-00:15 - Live blocked overview

MiniPMDB is CI for cross-project agent memory. This is the real local application running against its managed MongoDB. Paper Crane and Release Relay disagree about the same release-auth contract.

## 00:15-00:40 - Context and touchpoint

The strict audit blocks the run. The token claim is unreviewed, high-confidence but unsourced, part of an unresolved conflict, and attached to a broken touchpoint. Paper Crane sees Release Relay's reviewed OIDC requirement only because that touchpoint explicitly names both projects.

## 00:40-01:00 - Human review and canonical history

The shared contract and review queue are human-controlled. An agent cannot self-approve, reject another project's truth, or edit the touchpoint. The lifecycle below comes directly from MongoDB, including evidence, ownership, and pending review state.

## 01:00-01:20 - Governed resolution

Now watch the actual state transition. Applying the governed fix creates a reviewed resolution, supersedes the unsafe token claim, and repairs the touchpoint. Nothing is deleted, but the strict audit changes from blocked to passing.

## 01:20-01:45 - Passing audit with history intact

The same live dashboard now has zero findings. OIDC is active truth, the other project's memory is labeled inside the context pack, and the superseded token claim remains visible in history instead of being rewritten away.

## 01:45-02:05 - Switch project scope

Switching to Release Relay changes the active project without changing the canonical records. This is also how project-draft MCP is scoped: Codex can propose only unreviewed candidates for the repository matching its working directory.

## 02:05-02:25 - Reciprocal cross-project context

The reciprocal view proves the touchpoint is shared rather than copied into isolated files. Both projects can inspect the same governed relationship, while rejected or unrelated memories stay out of generated context.

## 02:25-02:40 - Real runtime choices

Managed MongoDB is the default, bound to loopback. The same application can use an external local, Podman, or Docker Mongo instance. The public CI validates managed runtimes, Compose configuration, and Podman restart persistence.

## 02:40-02:50 - Close

Built during Build Week with Codex and GPT-five-point-six, MiniPMDB helps teams decide what agents may trust across projects. It is open source on GitHub.
