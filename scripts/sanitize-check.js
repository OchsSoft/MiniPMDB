#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const excluded = new Set([".git", ".minipmdb", "node_modules", "coverage", "dist"]);
const privateTerms = [
  ["Over", "lair"].join(""),
  ["Hearth", "Loop"].join(""),
  ["Hearth", "Home"].join(""),
  ["Project", "Coordinator"].join(""),
  ["Social", "Seed"].join(""),
  ["Violets", "Studio"].join(""),
  ["Village", "Evidence"].join(""),
  ["Mira", "Evidence"].join("")
];

export async function runSanitizeCheck() {
  const failures = [];
  for (const file of await listFiles(root)) {
    const relative = path.relative(root, file).replaceAll("\\", "/");
    const stat = await fs.stat(file);
    if (stat.size > 250_000 && !relative.endsWith("package-lock.json")) {
      failures.push(`${relative}: file exceeds 250 KB`);
      continue;
    }
    if (!isTextFile(relative)) continue;
    const content = await fs.readFile(file, "utf8");
    for (const term of privateTerms) {
      if (content.toLowerCase().includes(term.toLowerCase())) {
        failures.push(`${relative}: contains private-source term ${term}`);
      }
    }
    if (/[A-Z]:\\Users\\[^\\]+\\/i.test(content)) {
      failures.push(`${relative}: contains an absolute user path`);
    }
    if (/\b(?:api[_-]?key|secret|password)\s*=\s*["']?[^\s"'<>]{8,}/i.test(content)) {
      failures.push(`${relative}: resembles an embedded credential`);
    }
  }
  if (failures.length) throw new Error(`Sanitization check failed:\n${failures.join("\n")}`);
  return { ok: true };
}

async function listFiles(directory) {
  const output = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (excluded.has(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await listFiles(target));
    else if (entry.isFile()) output.push(target);
  }
  return output;
}

function isTextFile(filePath) {
  return /\.(?:js|json|md|yml|yaml|html|css|toml|txt|example)$/i.test(filePath) || path.basename(filePath) === "LICENSE";
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  runSanitizeCheck()
    .then(() => process.stdout.write("Sanitization check passed.\n"))
    .catch((error) => {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 1;
    });
}
