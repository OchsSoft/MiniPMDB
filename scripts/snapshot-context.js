#!/usr/bin/env node
import fs from "node:fs/promises";
import { buildContextPack } from "../src/context.js";

const snapshot = JSON.parse(await fs.readFile("examples/release-guard/resolved.json", "utf8"));
const context = buildContextPack(snapshot, { projectKey: "paper-crane-cli", profile: "compact", task: "prepare release authentication" });
if (!/PROJECT release-relay/.test(context.context_pack) || !/TOUCHPOINT ACTIVE/.test(context.context_pack)) {
  throw new Error("Resolved snapshot did not produce cross-project touchpoint context.");
}
process.stdout.write(`${context.context_pack}\n`);
