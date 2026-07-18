# MiniPMDB judge guide

MiniPMDB is a working local developer tool. The fastest visual evaluation takes about three minutes and uses only synthetic data.

## Requirements

- Node.js 20.19 or newer.
- Network access on first managed start for the pinned MongoDB Community Server download.
- A current browser.

No account, API key, model call, preinstalled database, or container is required. The API, dashboard, and managed database bind only to `127.0.0.1`.

## Three-minute route

```console
npm ci --ignore-scripts
npm run judge:demo
```

Windows users may run `judge-demo.cmd`; macOS and Linux users may run `./judge-demo.sh`. If port 8797 is occupied, use `npm run judge:demo -- --port 8800`.

1. Confirm the runtime panel reports Managed MongoDB 8.2.6 and a masked loopback endpoint.
2. Select Paper Crane CLI and observe the blocked strict audit.
3. Read the broken Release authentication contract touchpoint. Paper Crane context includes the labeled Release Relay contract because both participate.
4. Observe the unreviewed, unsourced long-lived-token claim in the review queue.
5. Select **Apply governed fix**. The reviewed OIDC resolution supersedes the token claim and repairs the touchpoint.
6. Confirm the audit passes and the old claim remains in lifecycle history.
7. Press `Ctrl+C` in the terminal.

The first download is intentionally visible and can be hundreds of megabytes depending on platform. Later starts reuse the platform user-data cache and persistent database.

## Automated proof

```console
npm run judge:dry-run
```

PASS means the script verified cross-project visibility only through touchpoints, broken-touchpoint retention, fail–resolve–pass behavior, agent project isolation, strict read-only tools, clean-restart persistence, and external Mongo mode. It uses disposable database data and does not alter normal MiniPMDB state.

## Full verification

```console
npm run check
npm test
npm run smoke
npm run judge:dry-run
npm run sanitize
npm audit --omit=dev
npm audit signatures
```

Managed-runtime support is claimed only for operating systems passing the public validation matrix. An optional Podman/Docker external path is documented in the README; it is not required for judging.

For an unscripted evaluation, follow [Try MiniPMDB on your own project](try-your-project.md) and paste the [review-first intake prompt](prompts/draft-memory-intake.md) into Codex.
