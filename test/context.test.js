import test from "node:test";
import assert from "node:assert/strict";
import { buildContextPack } from "../src/context.js";
import { fixture } from "../test-support/fixtures.js";

test("context exposes linked cross-project truth and broken touchpoint", async () => {
  const context = buildContextPack(await fixture("initial.json"), { projectKey: "paper-crane-cli", profile: "compact", task: "release auth" });
  assert.match(context.context_pack, /PROJECT release-relay.*Release Relay accepts OIDC identity/is);
  assert.match(context.context_pack, /TOUCHPOINT BROKEN/);
  assert.doesNotMatch(context.context_pack, /\[ACTIVE\] mem-registry-token/);
  assert.match(context.context_pack, /\[WARNING\] mem-registry-token/);
  assert.deepEqual(context.context_selection.omitted_broken_touchpoint_ids, []);
  assert.deepEqual(context.context_selection.omitted_critical_warning_ids, []);
});

test("rejected memories never leak into project or cross-project context", async () => {
  const snapshot = await fixture("resolved.json");
  snapshot.memories.push({ ...snapshot.memories[0], id: "mem-rejected", status: "rejected", title: "Never include me", metadata: { review_state: "rejected" } });
  snapshot.touchpoints[0].memory_ids.push("mem-rejected");
  const context = buildContextPack(snapshot, { projectKey: "release-relay", profile: "compact" });
  assert.doesNotMatch(context.context_pack, /Never include me/);
});

test("removing the touchpoint removes the other project's memory", async () => {
  const snapshot = await fixture("resolved.json");
  snapshot.touchpoints = [];
  const context = buildContextPack(snapshot, { projectKey: "paper-crane-cli", profile: "balanced" });
  assert.doesNotMatch(context.context_pack, /Release Relay accepts OIDC identity/);
});
