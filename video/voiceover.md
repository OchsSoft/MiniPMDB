# MiniPMDB live-demo voiceover

The delivered narration was generated locally with Kokoro `am_echo` at 1.0 speed. The nine sections align to the live application's scene boundaries. Every visual is a recording of the real loopback application using synthetic data.

## 00:00-00:15 - Live blocked overview

MiniPMDB is CI for cross-project agent memory. You are watching the real local application, backed by its managed MongoDB. Paper Crane and Release Relay currently disagree about one shared release-auth contract.

## 00:15-00:40 - Context and touchpoint

The strict audit blocks the run for reasons an agent cannot hide. The token claim is unreviewed, high-confidence but unsourced, part of an unresolved conflict, and connected through a broken touchpoint. Paper Crane sees Release Relay's reviewed OIDC requirement only because that governed touchpoint explicitly names both projects and explains why the memory was included. That inclusion is visible, not implicit, so reviewers can challenge it.

## 00:40-01:00 - Human review and canonical history

The shared contract and review queue stay under human control. An agent cannot self-approve, reject another project's truth, or edit the touchpoint. MongoDB preserves evidence, project ownership, review state, and the complete lifecycle, instead of flattening everything into a convenient context file. That distinction remains enforceable.

## 01:00-01:20 - Governed resolution

Now, watch the real state transition. Applying the governed fix creates a reviewed resolution, supersedes the unsafe token claim, and repairs the touchpoint. Nothing is deleted or silently rewritten. The strict audit recalculates against the canonical records and changes from blocked to passing. The result is immediate and inspectable.

## 01:20-01:45 - Passing audit with history intact

The same live dashboard now has zero findings. OIDC is active truth, with its source and review history intact. Release Relay's memory is clearly labeled inside Paper Crane's context pack, and the superseded token claim remains visible in history. Agents get current guidance without losing the provenance needed to challenge it later. That history remains available for audit, rollback, and human challenge. No state needs reconstruction.

## 01:45-02:05 - Switch project scope

Switching to Release Relay changes the active project without duplicating canonical records. This is also how project-draft MCP is scoped. Codex can read governed context and propose only unreviewed candidates for the repository matching its working directory. It cannot manufacture reviewed truth or cross project boundaries.

## 02:05-02:25 - Reciprocal cross-project context

The reciprocal view proves the touchpoint is genuinely shared, rather than copied into isolated files. Both projects inspect the same governed relationship and the specific memories it references. Rejected, unrelated, or broken records cannot silently leak into generated context just because another project knows they exist.

## 02:25-02:40 - Real runtime choices

Managed MongoDB is local and loopback-only by default. MiniPMDB also supports external Mongo through Podman or Docker. Public CI validates managed mode and container persistence. The application stays outside.

## 02:40-02:50 - Close

I defined the architecture and product decisions. Codex and GPT-5.6 accelerated implementation, testing, documentation, and this demo.
