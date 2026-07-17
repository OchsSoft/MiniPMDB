# Build Week video script

Target length: **2 minutes 40 seconds**. Record at 1080p with readable terminal text and spoken narration. Keep the repository and dashboard public-safe before recording.

## 0:00–0:18 — Problem

Show the repository README headline.

> Coding agents can remember more than ever, but a remembered note is not automatically true. One stale, unsourced instruction can quietly steer every future session. MiniPMDB is CI for agent memory.

## 0:18–0:42 — Failing state

Run:

```console
npm run demo:reset
node src/cli.js audit --strict
```

Point to the nonzero audit and the three core findings: active-but-unreviewed, unsourced high-confidence claim, and unresolved conflict.

> This synthetic agent note says our release needs a long-lived token. The reviewed workflow says OIDC. MiniPMDB refuses to choose silently, and CI fails.

## 0:42–1:15 — Dashboard inspection

Start `npm start`, open `http://127.0.0.1:8797`, and show:

- strict audit blocked;
- the conflicting memory lifecycle rows;
- the compact context pack, where the unreviewed claim is a warning rather than active truth.

## 1:15–1:45 — Governed fix

Select **Apply governed fix**.

> The fix does not delete inconvenient history. It adds a reviewed resolution, links the reviewed OIDC decision as the replacement, and marks the token note superseded.

Show the green strict audit, then scroll the context pack to show active OIDC truth and the preserved historical warning.

## 1:45–2:12 — Codex and GPT-5.6

Show the MCP configuration and briefly invoke `memory_audit` or `memory_context` from the primary Codex thread.

> Codex with GPT-5.6 was the primary build environment for the sanitized extraction, audit design, tests, and documentation. The MCP server gives Codex governed context, defaults to read-only, and cannot self-approve a memory even when draft writes are enabled.

Show the `/feedback` session confirmation briefly, without exposing unrelated conversation content.

## 2:12–2:32 — Open-source and CI path

Show `action.yml`, the zero-dependency `package.json`, and the passing test command.

> The same audit runs as a CLI, MCP tool, local dashboard, or GitHub Action. It needs Node 20—no cloud, database, API key, container, or runtime dependency.

## 2:32–2:40 — Close

Return to the dashboard.

> Other tools help agents remember. MiniPMDB helps teams decide what agents are allowed to trust.

## Recording checklist

- Public YouTube video, under three minutes, with audible narration.
- Show the working product, not slides alone.
- Explain both Codex and GPT-5.6 usage.
- No notifications, private paths, usernames, local tabs, tokens, or unrelated repositories visible.
- Use only the synthetic Paper Crane CLI data.
- Add captions and verify the public link in a signed-out browser.
