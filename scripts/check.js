#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { runSanitizeCheck } from "./sanitize-check.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDirectories = ["src", "scripts", "test", "test-support", "public", "video"];
const files = [];
for (const directory of sourceDirectories) {
  files.push(...await javascriptFiles(path.join(root, directory)));
}

for (const file of files) {
  const content = await fs.readFile(file, "utf8");
  const lines = content.split(/\r?\n/).length;
  if (lines > 1_000) throw new Error(`${path.relative(root, file)} exceeds 1,000 lines.`);
  const check = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (check.status !== 0) throw new Error(check.stderr || `Syntax check failed: ${file}`);
}

await runSanitizeCheck();
process.stdout.write(`Checked ${files.length} JavaScript files and the public-source boundary.\n`);

async function javascriptFiles(directory) {
  try {
    const output = [];
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) output.push(...await javascriptFiles(target));
      else if (entry.isFile() && /\.m?js$/.test(entry.name)) output.push(target);
    }
    return output;
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}
