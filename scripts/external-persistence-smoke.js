#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startMiniPMDBServer } from "../src/api.js";
import { MANAGED_MONGODB_VERSION } from "../src/constants.js";
import { loadSnapshotFile } from "../src/service.js";

const phase = process.argv[2];
assert(["seed", "verify"].includes(phase), "Usage: external-persistence-smoke.js <seed|verify>");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const home = await fs.mkdtemp(path.join(os.tmpdir(), "minipmdb-external-smoke-"));
const uri = process.env.MINIPMDB_MONGODB_URI || "mongodb://127.0.0.1:27017";
const dbName = process.env.MINIPMDB_DB_NAME || "minipmdb_podman_smoke";
let running;

try {
  const seed = phase === "seed"
    ? await loadSnapshotFile(path.join(root, "examples", "release-guard", "resolved.json"))
    : undefined;
  running = await startMiniPMDBServer({
    home,
    port: 0,
    config: {
      mode: "external",
      db_name: dbName,
      managed_version: MANAGED_MONGODB_VERSION,
      external_uri: uri
    },
    seed
  });

  const runtime = await request(running.url, "/api/runtime");
  const audit = await request(running.url, "/api/audit", { strict: true });
  assert.equal(runtime.mode, "external");
  assert.equal(audit.passed, true, JSON.stringify(audit.issues));
  assert.equal(audit.summary.projects, 2);
  assert.equal(audit.summary.touchpoints, 1);
  process.stdout.write(`External Mongo ${phase} phase: PASS (${runtime.version})\n`);
} finally {
  if (running) await running.close().catch(() => undefined);
  await fs.rm(home, { recursive: true, force: true });
}

async function request(base, pathname, query = {}) {
  const url = new URL(`${base}${pathname}`);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, String(value));
  const response = await fetch(url);
  const text = await response.text();
  assert.equal(response.status, 200, text);
  return JSON.parse(text);
}
