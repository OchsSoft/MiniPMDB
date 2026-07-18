# Copy-ready project-draft intake prompt

Paste this into a new Codex task opened in the repository registered with MiniPMDB.

```text
Use MiniPMDB as a review-first memory intake for this repository.

Goal: build a small human review queue of durable project memories grounded in repository evidence. Nothing you create is approved truth.

Before writing:
1. Confirm memory_list, memory_context, memory_audit, memory_remember, and source_attach are available. If either write tool is missing, report strict read-only mode and stop without changes.
2. Call memory_list, memory_context for “understand this project safely,” and memory_audit with strict=true.
3. Inspect the repository README, agent instructions, build/package manifest, primary configuration, architecture docs, and CI. Do not inspect credentials, private keys, unrelated user files, or secret stores.
4. Avoid duplicates.

Create three to seven candidates with memory_remember, one per call. Good candidates are durable decisions, constraints, commands, environment requirements, integration boundaries, recurring patterns, and concrete risks that would materially help future work.

For every candidate:
- choose the narrowest accurate kind;
- use high confidence only for an explicit repository fact;
- write a concise title and self-contained body explaining what future work must know and why;
- add useful tags;
- attach a real repository-relative file, heading, URL, issue, or commit with source_attach after memory_remember returns the ID;
- verify evidence attachment does not change status from unreviewed;
- never store secrets, credentials, personal data, raw conversation, hidden reasoning, temporary progress, guesses, or generic summaries;
- never request reviewed/current/resolved status.

After writing:
1. Call memory_list with status=unreviewed.
2. Call memory_context again and verify candidates appear only in warnings/history, never active truth.
3. Call memory_audit with strict=true.
4. Return a compact review table: memory ID, kind, confidence, title, evidence reference, why durable, and recommendation (approve, reject, or clarify).

Stop at the human gate. Do not approve, reject, supersede, register projects, edit touchpoints, or claim review is complete.
```
