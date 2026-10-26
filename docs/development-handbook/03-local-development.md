# Local development and setup

## Start with a safe checkout

Use a topic branch based on the repository's merged `master`, keep the working tree's unrelated changes, and read `package.json` before installing. Node 20 or newer is the documented baseline; use the actual dependency lockfile and the project's supported current Node release when qualifying a build. Do not install a second package manager just for the handbook.

```bash
git status --short
git branch --show-current
node --version
npm ci
npm run check
npm test
npm run smoke
```

These commands are instructions for local qualification, not a claim that application tests were executed during documentation authoring. `check` runs the repository checker; `test` uses the built-in Node runner serially; `smoke` audits the resolved synthetic fixture and checks snapshot context. Read the scripts before expanding the gate. Keep routine hosted validation disabled under the repository owner's local-first policy.

## Decide which MongoDB mode you intend

The ordinary source default is managed mode. `RuntimeManager.start` creates the application home, `data/`, and binary-download cache. It requests MongoDB 8.2.6, MD5 verification, loopback binding, persistent WiredTiger storage, and a managed child process. The first start downloads a platform-specific server binary. Network success does not prove binary compatibility on NixOS.

On NixOS, a downloaded generic Linux executable can fail because its dynamic loader or shared libraries are absent from the expected filesystem paths. This repository does not provide a checked-in Nix flake establishing managed-mode compatibility. Treat that path as unverified until a real start, persistence restart, and shutdown have been demonstrated on the target environment. Do not respond to a loader failure by deleting the database.

The external mode avoids having the Node process own a downloaded MongoDB binary. The supplied `compose.yaml` describes only a MongoDB service with image `mongo:8.2.6-noble`, a named data volume, and host mapping `127.0.0.1:27017:27017`. Use Podman and an available Compose provider; do not use Docker. Check the port before starting because another database may already own it.

```bash
podman compose -f compose.yaml up -d mongodb
MINIPMDB_MONGODB_URI='mongodb://127.0.0.1:27017' npm start
```

The example explicitly matches the Compose host port. The persisted external-mode default URI is port 27019; copying that default while starting the supplied port-27017 service will fail. Do not change an unrelated existing MongoDB service to compensate. The container's healthcheck pings MongoDB; the application still needs its own readiness check and database name verification.

## Configuration and precedence

| Setting | Source default or behavior | Operational consequence |
|---|---|---|
| `MINIPMDB_HOME` | OS application data directory | Contains config and managed state, never a repository backup substitute |
| `XDG_DATA_HOME` | Linux fallback `~/.local/share` | Default Linux application subdirectory is `minipmdb` |
| `MINIPMDB_API_URL` | Client loopback URL, default port 8797 | CLI/MCP must address the same service |
| `MINIPMDB_MONGODB_URI` | Unset | When set, forces external mode regardless of saved mode |
| `MINIPMDB_DB_NAME` | `minipmdb` before saved-config merge | Verify database identity before creating records |
| `MINIPMDB_MONGODB_VERSION` | 8.2.6 before saved-config merge | Managed binary version; changing it is an upgrade decision |
| `MINIPMDB_MONGODB_DOWNLOAD_DIR` | Managed `binaries/` directory | Binary cache location, distinct from canonical `data/` |
| `MINIPMDB_MCP_MODE` | `project-draft` | Candidate-only writes by resolved repository scope |

`config.json` contains mode, database name, managed version, and a credential-free external URI. Saved values are merged over defaults, while the explicit MongoDB URI environment variable takes precedence at runtime. Saving runtime configuration returns `restart_required: true`; it does not hot-switch a live connection. Credentialed URIs are rejected by the persisted-config validator and must come from the environment. Do not paste credential values into a command that will be saved in shared shell history or documentation.

## Confirm readiness before writing

Start the service in a terminal you control. Open the loopback dashboard manually if desired, inspect runtime status, and verify mode, endpoint, database, and MongoDB version. A reachable HTML page alone is not the full readiness proof. Read `/api/health` and `/api/runtime` or use the CLI:

```bash
node src/cli.js runtime
node src/cli.js list --project sample-workshop
```

The list command assumes that synthetic project has already been registered. An empty result is different from a refused connection or unknown registration. The dashboard's project selector is driven by stored projects; creating a browser bookmark does not register one.

For an isolated demonstration use a separate `MINIPMDB_HOME`, database name, and intended port. Demo reset is destructive to the selected database. Never run a demo reset against an existing personal database merely to populate the interface. Synthetic fixtures are available for offline checks without modifying a live service.
