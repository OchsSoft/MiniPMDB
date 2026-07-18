# Copy-ready draft-memory intake prompt

Paste the prompt below into a new Codex task opened in the project you want to evaluate. MiniPMDB must already be configured in `project-draft` mode as described in the [bring-your-own-project guide](../try-your-project.md).

```text
Use MiniPMDB as a review-first memory intake for this repository.

Goal:
Build a small human review queue of durable project memories grounded in this repository. Do not treat anything you create as approved truth.

Before creating drafts:
1. Confirm that the MiniPMDB tools memory_list, memory_context, memory_audit, memory_remember, and source_attach are available. If either write tool is unavailable, explain that MiniPMDB is in strict read-only mode and stop without making changes.
2. Call memory_list with no status filter, then memory_context for the task "understand this project safely", then memory_audit with strict set to true.
3. Inspect the repository's highest-value evidence: its README, agent instructions, package or build manifest, primary configuration, architecture documentation, and CI workflow. Do not scan credentials, private key material, or unrelated user files.
4. Avoid duplicates of existing memories.

Create between three and seven candidates with memory_remember, one call per candidate. Good candidates are durable decisions, constraints, commands, environment requirements, integration boundaries, known risks, or recurring patterns that would materially help a future coding session.

For each candidate:
- Choose the narrowest accurate kind.
- Use high confidence only for an explicit repository fact; use medium or low for anything less direct.
- Write a concise title and a self-contained body that says what future work must know and why it matters.
- Add useful tags.
- Do not invent source IDs. Leave source_ids empty when calling memory_remember, then call source_attach with the returned memory ID and a real repository-relative file, heading, URL, issue, or commit. Evidence attachment must not change the candidate's unreviewed status.
- Do not store secrets, credentials, personal data, raw conversation text, chain-of-thought, temporary progress, speculative guesses, or generic summaries.
- Do not request current, reviewed, or resolved status. MiniPMDB must keep every agent-created item unreviewed.

After creating the candidates:
1. Call memory_list with status "unreviewed".
2. Call memory_context again for "understand this project safely" and verify the candidates appear only in warnings/history, never active truth.
3. Call memory_audit with strict set to true.
4. Return a compact review table with: memory ID, kind, confidence, title, attached or proposed evidence reference, why it is durable, and your recommendation of approve, reject, or needs clarification.

Stop at the human gate. Do not approve, reject, supersede, edit project files, or claim the review is complete. The human will make every trust decision with the MiniPMDB CLI.
```
