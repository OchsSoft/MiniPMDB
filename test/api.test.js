import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createMiniPMDBServer } from "../src/api.js";
import { MiniPMDBService } from "../src/service.js";
import { fixture } from "../test-support/fixtures.js";

test("loopback API serves strict audit and governed context", async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "minipmdb-api-"));
  const storePath = path.join(directory, "store.json");
  await new MiniPMDBService({ storePath }).store.write(await fixture("resolved.json"));
  const server = createMiniPMDBServer({ storePath });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(directory, { recursive: true, force: true });
  });
  const address = server.address();
  const base = `http://127.0.0.1:${address.port}`;
  const health = await fetchJson(`${base}/api/health`);
  const audit = await fetchJson(`${base}/api/audit?strict=true`);
  const context = await fetchJson(`${base}/api/context?profile=compact&task=release`);
  assert.equal(health.local_only, true);
  assert.equal(audit.passed, true);
  assert.match(context.context_pack, /OIDC/);
  assert.match(context.context_pack, /WARNING.*registry token/);
});

async function fetchJson(url) {
  const response = await fetch(url);
  assert.equal(response.status, 200);
  return response.json();
}
