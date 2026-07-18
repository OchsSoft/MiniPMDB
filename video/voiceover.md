# MiniPMDB voiceover

Read naturally at roughly 120 words per minute. Each block has a short edit handle at the end.

## 00:00–00:10 · Intro

Coding agents can remember more than ever. MiniPMDB makes sure remembered information is actually safe to trust—even when two projects share a contract.

## 00:10–00:24 · The collision

Here, Paper Crane says releases need a long-lived token. Release Relay's reviewed contract accepts only OIDC. Their shared touchpoint makes the contradiction visible to both projects.

## 00:24–00:40 · Strict failure

The strict audit fails closed. The token claim is unreviewed, high-confidence but unsourced, part of an open conflict, and attached to a broken touchpoint. It never enters active truth.

## 00:40–01:00 · Mongo-backed dashboard

This is the live local dashboard backed by a real managed MongoDB—not a slide or JSON write backend. The runtime, two projects, lifecycle state, review queue, and shared contract all come from the canonical database.

## 01:00–01:15 · Context gate

Paper Crane can see Release Relay's reviewed memory only because the touchpoint names both projects. The unsafe local claim stays in warnings, and compact context cannot silently hide the broken contract.

## 01:15–01:30 · Governed fix

The human-controlled fix adds a reviewed resolution, supersedes the token claim, and repairs the touchpoint. History remains intact while the strict audit becomes clean.

## 01:30–01:50 · Passing state

The same dashboard now passes. OIDC is active truth, the other project's inclusion is labeled, and the old claim remains inspectable instead of being rewritten out of history.

## 01:50–02:10 · Codex MCP

Through MCP, Codex gets governed context and can propose unreviewed memories with evidence for its registered project. It cannot write another project, self-approve, or edit touchpoints. Strict read-only removes writes entirely.

## 02:10–02:26 · CI artifact

MongoDB stays canonical. A reviewed snapshot exports all five collections, and the dependency-free GitHub Action audits that artifact on Windows, Ubuntu, and macOS without creating a second backend.

## 02:26–02:42 · Build evidence

Codex with GPT-five-point-six was the primary Build Week environment—from the product thesis and Mongo pivot through implementation, sanitization, tests, public documentation, and this demo package.

## 02:42–02:50 · Close

Other tools help agents remember. MiniPMDB helps teams decide what agents are allowed to trust across projects. It is open source on GitHub.
