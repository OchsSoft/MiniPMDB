#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { formatAuditReport } from "./audit.js";
import { MEMORY_STATUSES, assertEnum } from "./constants.js";
import { MiniPMDBService, applyReleaseDemoFix } from "./service.js";
import { DEFAULT_STORE_PATH } from "./store.js";

const args = parseArgs(process.argv.slice(2));

try {
  await run(args);
} catch (error) {
  process.stderr.write(`MiniPMDB: ${error.message}\n`);
  process.exitCode = 1;
}

async function run(input) {
  const command = input.positionals[0] || "help";
  const storePath = input.flags.store || process.env.MINIPMDB_STORE || DEFAULT_STORE_PATH;
  const service = new MiniPMDBService({ storePath });

  switch (command) {
    case "init": {
      const store = await service.init({
        projectKey: input.flags.project || "my-project",
        projectName: input.flags.name || "My project"
      });
      printJsonOrText(input, store, `Initialized MiniPMDB for ${store.project.name} at ${path.resolve(storePath)}.`);
      return;
    }
    case "list": {
      const store = await service.read();
      const status = input.flags.status
        ? assertEnum(input.flags.status, MEMORY_STATUSES, "status")
        : "";
      const memories = status
        ? store.memories.filter((memory) => memory.status === status)
        : store.memories;
      printJsonOrText(input, { memories }, formatMemoryList(memories, status));
      return;
    }
    case "audit": {
      const report = await service.audit({ strict: Boolean(input.flags.strict) });
      printJsonOrText(input, report, formatAuditReport(report));
      if (!report.passed) process.exitCode = 1;
      return;
    }
    case "context": {
      const context = await service.context({
        task: input.flags.task || "",
        profile: input.flags.profile || "balanced",
        maxChars: input.flags["max-chars"]
      });
      printJsonOrText(input, context, context.context_pack);
      return;
    }
    case "remember": {
      requireFlags(input.flags, ["title", "body"]);
      const store = await service.remember({
        kind: input.flags.kind || "note",
        status: input.flags.status || "unreviewed",
        confidence: input.flags.confidence || "unknown",
        title: input.flags.title,
        body: input.flags.body,
        tags: commaList(input.flags.tags),
        source_ids: commaList(input.flags.sources),
        critical: Boolean(input.flags.critical)
      }, { reviewFirst: false });
      printJsonOrText(input, store, `Recorded ${store.memories.at(-1).id} as ${store.memories.at(-1).status}.`);
      return;
    }
    case "review": {
      const id = requiredPosition(input, 1, "review requires a memory id");
      const store = await service.review(id, {
        status: input.flags.status || "reviewed",
        reviewer: input.flags.reviewer || "human",
        note: input.flags.note || ""
      });
      printJsonOrText(input, store, `Reviewed ${id}.`);
      return;
    }
    case "source": {
      if (input.positionals[1] !== "attach") throw new Error("Use: minipmdb source attach <memory-id> --label ... --ref ...");
      const id = requiredPosition(input, 2, "source attach requires a memory id");
      requireFlags(input.flags, ["label", "ref"]);
      const store = await service.attachSource(id, {
        type: input.flags.type || "doc",
        label: input.flags.label,
        ref: input.flags.ref
      });
      printJsonOrText(input, store, `Attached source to ${id}.`);
      return;
    }
    case "supersede": {
      const oldId = requiredPosition(input, 1, "supersede requires the historical memory id");
      if (!input.flags.with) throw new Error("supersede requires --with <replacement-id>.");
      const store = await service.supersede(oldId, input.flags.with, { reason: input.flags.reason || "" });
      printJsonOrText(input, store, `Marked ${oldId} superseded by ${input.flags.with}.`);
      return;
    }
    case "demo": {
      await runDemo(input, service);
      return;
    }
    case "help":
    case "--help":
    case "-h":
      process.stdout.write(`${helpText()}\n`);
      return;
    default:
      throw new Error(`Unknown command: ${command}. Run minipmdb help.`);
  }
}

async function runDemo(input, service) {
  const action = input.positionals[1] || "reset";
  if (action === "reset") {
    const fixture = await readFixture("initial.json");
    await service.store.write(fixture);
    process.stdout.write("Loaded the intentionally broken release-memory demo. Run: minipmdb audit --strict\n");
    return;
  }
  if (action === "fix") {
    await service.store.update(applyReleaseDemoFix);
    process.stdout.write("Applied a reviewed resolution and supersession. Run: minipmdb audit --strict\n");
    return;
  }
  throw new Error("demo action must be reset or fix.");
}

async function readFixture(name) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const filePath = path.resolve(here, "..", "examples", "release-guard", name);
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

function parseArgs(argv) {
  const positionals = [];
  const flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      positionals.push(token);
      continue;
    }
    const [rawName, inline] = token.slice(2).split(/=(.*)/s, 2);
    if (inline !== undefined) {
      flags[rawName] = inline;
      continue;
    }
    const next = argv[index + 1];
    if (next !== undefined && !next.startsWith("--")) {
      flags[rawName] = next;
      index += 1;
    } else {
      flags[rawName] = true;
    }
  }
  return { positionals, flags };
}

function printJsonOrText(input, value, text) {
  process.stdout.write(input.flags.json ? `${JSON.stringify(value, null, 2)}\n` : `${text}\n`);
}

function commaList(value) {
  return value ? String(value).split(",").map((item) => item.trim()).filter(Boolean) : [];
}

function requiredPosition(input, index, message) {
  const value = input.positionals[index];
  if (!value) throw new Error(message);
  return value;
}

function requireFlags(flags, names) {
  const missing = names.filter((name) => !flags[name]);
  if (missing.length) throw new Error(`Missing required flags: ${missing.map((name) => `--${name}`).join(", ")}.`);
}

function formatMemoryList(memories, status) {
  const heading = status ? `MiniPMDB memories with status ${status}` : "MiniPMDB memories";
  if (!memories.length) return `${heading}: none.`;
  return [
    `${heading}: ${memories.length}`,
    ...memories.map((memory) =>
      `- ${memory.id} | ${memory.status} | ${memory.kind}/${memory.confidence} | ${memory.title}`
    )
  ].join("\n");
}

function helpText() {
  return `MiniPMDB — governed project memory for coding agents

Usage:
  minipmdb init --project <key> --name <name>
  minipmdb list [--status draft|unreviewed|reviewed|rejected|...]
  minipmdb audit [--strict] [--json]
  minipmdb context --task <task> [--profile drift_guard|balanced|compact]
  minipmdb remember --title <title> --body <body> [--kind decision]
  minipmdb source attach <memory-id> --label <label> --ref <reference>
  minipmdb review <memory-id> [--status reviewed] [--reviewer <name>]
  minipmdb supersede <old-id> --with <replacement-id> [--reason <text>]
  minipmdb demo reset
  minipmdb demo fix

Global flags:
  --store <path>   JSON store path (default: ${DEFAULT_STORE_PATH})
  --json           Machine-readable output`;
}
