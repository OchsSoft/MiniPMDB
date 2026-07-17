import test from "node:test";
import assert from "node:assert/strict";
import { auditStore } from "../src/audit.js";
import { fixture } from "../test-support/fixtures.js";

test("strict audit fails on unreviewed, unsourced, conflicting active truth", async () => {
  const report = auditStore(await fixture("initial.json"), { strict: true });
  assert.equal(report.passed, false);
  const codes = new Set(report.issues.map((issue) => issue.code));
  assert(codes.has("active_unreviewed"));
  assert(codes.has("high_confidence_without_source"));
  assert(codes.has("unresolved_conflict"));
});

test("strict audit passes after reviewed resolution and supersession", async () => {
  const report = auditStore(await fixture("resolved.json"), { strict: true });
  assert.equal(report.passed, true, JSON.stringify(report.issues, null, 2));
  assert.equal(report.summary.errors, 0);
  assert.equal(report.summary.warnings, 0);
});

test("broken supersession references fail the audit", async () => {
  const store = await fixture("resolved.json");
  store.links.find((link) => link.relationship === "supersedes").from = "mem-missing";
  const report = auditStore(store, { strict: true });
  assert(report.issues.some((issue) => issue.code === "broken_supersession_reference"));
});
