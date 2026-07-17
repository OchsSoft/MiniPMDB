import test from "node:test";
import assert from "node:assert/strict";
import { buildContextPack } from "../src/context.js";
import { fixture } from "../test-support/fixtures.js";

test("unreviewed claim cannot become active project truth", async () => {
  const context = buildContextPack(await fixture("initial.json"), { task: "release", profile: "balanced" });
  assert(!context.active.some((memory) => memory.id === "mem-registry-token"));
  assert(context.warnings.some((memory) => memory.id === "mem-registry-token"));
});

test("compact context preserves critical historical warning within budget", async () => {
  const context = buildContextPack(await fixture("resolved.json"), { task: "release", profile: "compact" });
  assert(context.warnings.some((memory) => memory.id === "mem-registry-token"));
  assert.deepEqual(context.context_selection.omitted_critical_warning_ids, []);
  assert(context.context_pack.length <= context.context_selection.max_chars);
});

test("archived and rejected memories never enter a context pack", async () => {
  const store = await fixture("resolved.json");
  const template = structuredClone(store.memories[0]);
  store.memories.push({ ...template, id: "mem-archived", status: "archived" });
  store.memories.push({ ...template, id: "mem-rejected", status: "rejected" });
  const context = buildContextPack(store, { task: "release" });
  const ids = [...context.active, ...context.warnings].map((memory) => memory.id);
  assert(!ids.includes("mem-archived"));
  assert(!ids.includes("mem-rejected"));
});
