# Contributing

Thank you for considering a contribution. MiniPMDB is intentionally small: changes should make governed project memory easier to inspect, test, or integrate without turning the project into a general agent platform.

## Before opening a pull request

1. Open or reference an issue that describes the user-facing problem.
2. Work on a topic branch; do not push directly to `main`.
3. Keep runtime dependencies at zero unless the issue proves a standard-library implementation is unsuitable.
4. Use synthetic fixtures. Never submit real credentials, transcripts, customer data, private project vocabulary, or machine-specific paths.
5. Keep agent-created memories unreviewed by default. A new integration must not let an agent approve its own claims.
6. Run the complete validation suite.

```console
npm ci --ignore-scripts
npm run check
npm test
npm run smoke
```

Source files should stay below 1,000 lines. If a file approaches that limit, split it by responsibility before adding more behavior.

## Pull request expectations

Explain the behavior change, the risk it addresses, and how it was tested. New audit rules need both a failing fixture or test and a passing resolution path. Security-sensitive changes should be reported privately first as described in [SECURITY.md](SECURITY.md).

By contributing, you agree that your contribution is licensed under MPL-2.0.
