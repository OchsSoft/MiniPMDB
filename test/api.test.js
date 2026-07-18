import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { startMiniPMDBServer } from "../src/api.js";
import { fixture } from "../test-support/fixtures.js";

test("loopback API serves runtime, dashboard, audit, context, and review", async (t) => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), "minipmdb-api-test-"));
  const running = await startMiniPMDBServer({ home, port: 0, seed: await fixture("initial.json") });
  t.after(async () => { await running.close(); await fs.rm(home, { recursive: true, force: true }); });
  const health = await json(`${running.url}/api/health`);
  assert.equal(health.local_only, true);
  assert.equal(health.runtime.status, "ready");
  assert.equal(health.runtime.version, "8.2.6");
  assert.match(await (await fetch(`${running.url}/`)).text(), /MiniPMDB/);
  assert.equal((await json(`${running.url}/api/audit?strict=true`)).passed, false);
  assert.match((await json(`${running.url}/api/context?project_key=paper-crane-cli&profile=compact`)).context_pack, /PROJECT release-relay/);
  await json(`${running.url}/api/demo/fix`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  assert.equal((await json(`${running.url}/api/audit?strict=true`)).passed, true);
  assert.equal((await fetch(`${running.url}/api/context?project_key=missing-project`)).status, 400);

  await assert.rejects(
    startMiniPMDBServer({ home: path.join(home, "occupied"), port: running.server.address().port, seed: await fixture("resolved.json") }),
    /EADDRINUSE/
  );
});

async function json(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  assert.equal(response.status, 200, text);
  return JSON.parse(text);
}
