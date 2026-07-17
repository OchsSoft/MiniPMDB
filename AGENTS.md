# MiniPMDB agent instructions

- MiniPMDB is a standalone, sanitized open-source developer tool. Do not add private-source data, vocabulary, paths, or integration contracts.
- Keep the product focused on durable memory governance: provenance, lifecycle, conflicts, supersession, deterministic context, and CI audits.
- Do not add task execution, shell execution, deployment control, transcript capture, or remote hosting.
- Use Node.js 20+ built-ins. New runtime dependencies require explicit justification.
- MCP is read-only by default. Agent-originated writes must remain draft or unreviewed.
- Use synthetic fixtures only. Never store credentials, raw reasoning, private conversations, or customer data.
- Work on topic branches after the initial repository commit and open pull requests; do not auto-merge.
- Keep source files under 1,000 lines.
- Validate with `npm run check`, `npm test`, and `npm run smoke`.
