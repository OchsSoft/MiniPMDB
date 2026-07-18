# MiniPMDB judge guide

MiniPMDB is designed to be evaluated as a working local developer tool, not as a slide deck or hosted mockup. The fastest visual path takes about three minutes and uses only synthetic data.

## Requirements and supported platforms

- Node.js 20 or newer.
- Windows 10/11, macOS, or a maintained Linux distribution.
- Any current browser for the local dashboard.

No install step, package download, account, API key, database, model call, or container is required. The dashboard binds only to `127.0.0.1`, and the demo makes no outbound network requests.

The project is validated locally on Windows and by GitHub Actions on Ubuntu. The universal `npm` commands work on all supported platforms; the convenience launchers use the platform's normal browser-opening command.

## Three-minute visual path

From an extracted source archive or cloned repository, run:

```console
npm run judge:demo
```

Windows users can instead double-click `judge-demo.cmd`. On macOS or Linux:

```console
./judge-demo.sh
```

The browser opens `http://127.0.0.1:8797` with the intentionally broken Paper Crane CLI fixture.

1. Confirm **Strict audit blocked** and three errors.
2. Read the compact context pack. The reviewed OIDC decision is active truth; the unsourced token claim is a critical warning.
3. Select **Apply governed fix**.
4. Confirm **Strict audit passing**.
5. Read the context again. OIDC remains active truth and the token claim remains visible as superseded history.
6. Return to the terminal and press `Ctrl+C`.

This is the core product claim: an agent-written memory cannot silently become trusted context, and resolving a conflict does not erase the provenance trail.

If port `8797` is occupied, choose another one:

```console
npm run judge:demo -- --port 8800
```

## Automated proof

Run:

```console
npm run judge:dry-run
```

The disposable dry run verifies that:

- the strict CLI audit exits nonzero with the three expected governance findings;
- compact context separates reviewed truth from a critical warning;
- the governed resolution makes the identical strict audit pass;
- the local dashboard API reproduces the blocked-to-passing flow; and
- read-only MCP exposes context, audit, and lifecycle inspection without a write or self-approval path.

It removes its temporary store when complete and prints `Judge dry run: PASS` only after every assertion succeeds.

## Full verification

`npm ci --ignore-scripts` is optional for the demo because MiniPMDB has no runtime dependencies. It verifies the lockfile for a conventional clean build path.

```console
npm ci --ignore-scripts
npm run check
npm test
npm run smoke
npm run judge:dry-run
```

The same governance audit is available through the CLI, local dashboard, MCP server, and [`action.yml`](../action.yml) GitHub Action.
