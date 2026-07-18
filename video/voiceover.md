# MiniPMDB voiceover

Read naturally at roughly 118–122 words per minute. Each block fits its visual scene; pauses at the ends are intentional edit handles.

## 00:00–00:08 · Intro

Coding agents can remember more than ever. MiniPMDB makes sure remembered information is actually safe to trust.

## 00:08–00:20 · The problem

Here, an agent says our release needs a long-lived registry token. Reviewed evidence says the project uses OIDC. Both claims cannot be active truth.

## 00:20–00:36 · Strict failure

I load the intentionally broken synthetic project and run the strict audit. MiniPMDB exits nonzero for three reasons: the claim is active but unreviewed, high-confidence but unsourced, and part of an unresolved conflict.

## 00:36–00:54 · Blocked dashboard

The local dashboard shows the same policy, not a separate interpretation. The audit is blocked, the two memories remain visible, and the unsafe claim cannot silently pass as reviewed project context.

## 00:54–01:08 · Context gate

Even before resolution, compact context keeps the reviewed OIDC decision as active truth and moves the agent note into warnings. Token saving is never allowed to erase a critical warning.

## 01:08–01:22 · Governed fix

The fix does not delete history. It adds a reviewed resolution, marks the old token claim superseded, and links the source-backed OIDC decision as its replacement. The strict audit now passes.

## 01:22–01:40 · Passing dashboard

The live dashboard turns green. The agent receives clean active truth, while the superseded claim stays visible as historical warning. That makes the result explainable instead of merely convenient.

## 01:40–01:58 · Codex MCP

Through MCP, Codex can request governed context, run the audit, or inspect lifecycle state. Project-draft mode can propose unreviewed memories and attach evidence here, but only a human can approve them. Strict read-only remains available.

## 01:58–02:14 · CI and open source

The identical audit runs in the CLI, MCP, dashboard, and this GitHub Action. MiniPMDB has zero runtime dependencies, eleven passing tests, synthetic sample data, and an MPL two point zero license.

## 02:14–02:32 · Build evidence

Codex with GPT-five-point-six was the primary environment for this Build Week extraction: from the audit-first product thesis through implementation, sanitization, tests, documentation, and demo design. The repository has new history and contains no private payloads or integrations.

## 02:32–02:42 · Close

Other tools help agents remember. MiniPMDB helps teams decide what agents are allowed to trust. The project is open source on GitHub.
