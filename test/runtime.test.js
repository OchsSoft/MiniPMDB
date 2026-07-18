import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { redactMongoUri } from "../src/database.js";
import { RuntimeManager } from "../src/runtime.js";
import { saveRuntimeConfig } from "../src/runtime-config.js";

test("credentialed endpoints are redacted and cannot be persisted", async (t) => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), "minipmdb-config-test-"));
  t.after(() => fs.rm(home, { recursive: true, force: true }));
  assert.equal(redactMongoUri("mongodb://alice:secret@127.0.0.1:27017/minipmdb"), "mongodb://***:***@127.0.0.1:27017/minipmdb");
  await assert.rejects(
    saveRuntimeConfig({ mode: "external", db_name: "minipmdb", external_uri: "mongodb://alice:secret@127.0.0.1:27017" }, home),
    /never persisted/
  );
});

test("managed download failures are surfaced without leaving a runtime", async () => {
  const managedFactory = { create: async () => { throw new Error("synthetic download failure"); } };
  const runtime = new RuntimeManager({
    home: path.join(os.tmpdir(), "minipmdb-failed-download-test"),
    config: { mode: "managed", db_name: "minipmdb", managed_version: "8.2.6", external_uri: "mongodb://127.0.0.1:27019" },
    managedFactory
  });
  await assert.rejects(runtime.start(), /synthetic download failure/);
  assert.equal(runtime.status().status, "error");
});

test("unavailable external MongoDB fails clearly", async (t) => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), "minipmdb-unavailable-test-"));
  t.after(() => fs.rm(home, { recursive: true, force: true }));
  const runtime = new RuntimeManager({ home, config: { mode: "external", db_name: "minipmdb", managed_version: "8.2.6", external_uri: "mongodb://127.0.0.1:1" } });
  await assert.rejects(runtime.start(), /ECONNREFUSED|Server selection/);
  assert.equal(runtime.status().status, "error");
});
