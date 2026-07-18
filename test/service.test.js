import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { RuntimeManager } from "../src/runtime.js";
import { MiniPMDBService } from "../src/service.js";
import { fixture } from "../test-support/fixtures.js";

test("Mongo service governs candidates, evidence, review, and touchpoints", async (t) => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), "minipmdb-service-test-"));
  const runtime = await new RuntimeManager({ home }).start();
  t.after(async () => { await runtime.stop(); await fs.rm(home, { recursive: true, force: true }); });
  const service = new MiniPMDBService({ database: runtime.database });
  await service.replaceSnapshot(await fixture("resolved.json"));
  const candidate = await service.remember({ project_key: "paper-crane-cli", title: "Candidate", body: "Needs review.", kind: "note", status: "reviewed" });
  assert.equal(candidate.status, "unreviewed");
  const attached = await service.attachSource(candidate.id, { label: "README", ref: "README.md" }, { candidateOnly: true, projectScope: "paper-crane-cli" });
  assert.equal(attached.memory.status, "unreviewed");
  await assert.rejects(() => service.attachSource("mem-relay-oidc", { label: "Wrong", ref: "README.md" }, { candidateOnly: true, projectScope: "paper-crane-cli" }), /outside paper-crane-cli/);
  const reviewed = await service.review(candidate.id, { status: "reviewed", reviewer: "test" });
  assert.equal(reviewed.status, "reviewed");
  assert.equal((await service.context({ project_key: "paper-crane-cli", profile: "compact" })).touchpoints.length, 1);
});
