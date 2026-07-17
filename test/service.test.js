import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { MiniPMDBService, applyReleaseDemoFix } from "../src/service.js";
import { fixture } from "../test-support/fixtures.js";

test("demo fix produces a strict-clean store through an atomic update", async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "minipmdb-test-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const service = new MiniPMDBService({ storePath: path.join(directory, "store.json") });
  await service.store.write(await fixture("initial.json"));
  assert.equal((await service.audit({ strict: true })).passed, false);
  await service.store.update(applyReleaseDemoFix);
  assert.equal((await service.audit({ strict: true })).passed, true);
});

test("agent-style writes remain unreviewed even when current is requested", async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "minipmdb-test-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const service = new MiniPMDBService({ storePath: path.join(directory, "store.json") });
  await service.init({ projectKey: "test", projectName: "Test" });
  const store = await service.remember({
    status: "current",
    kind: "decision",
    confidence: "medium",
    title: "Proposed decision",
    body: "This agent-created claim still needs a human review."
  });
  assert.equal(store.memories[0].status, "unreviewed");
  assert.equal(store.memories[0].metadata.review_state, "unreviewed");
});
