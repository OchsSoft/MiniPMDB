import test from "node:test";
import assert from "node:assert/strict";
import { auditSnapshot } from "../src/audit.js";
import { fixture } from "../test-support/fixtures.js";

test("strict audit blocks the synthetic cross-project conflict", async () => {
  const report = auditSnapshot(await fixture("initial.json"), { strict: true });
  assert.equal(report.passed, false);
  assert.deepEqual(
    new Set(report.issues.map((item) => item.code)),
    new Set(["unreviewed_candidate", "candidate_without_source", "unresolved_conflict", "broken_touchpoint"])
  );
});

test("resolved snapshot is strict-clean", async () => {
  const report = auditSnapshot(await fixture("resolved.json"), { strict: true });
  assert.equal(report.passed, true, JSON.stringify(report.issues));
});

test("touchpoint validation catches missing and wrong-project records", async () => {
  const snapshot = await fixture("resolved.json");
  snapshot.touchpoints[0].memory_ids.push("missing-memory");
  const report = auditSnapshot(snapshot);
  assert(report.issues.some((item) => item.code === "broken_touchpoint_memory_reference"));
});
