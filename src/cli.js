#!/usr/bin/env node
import fs from "node:fs/promises";
import { auditSnapshot, formatAuditReport } from "./audit.js";
import { MiniPMDBClient } from "./api-client.js";
import { normalizeSnapshot } from "./schema.js";

try {
  const input = parse(process.argv.slice(2));
  const client = new MiniPMDBClient(input.flags.api || process.env.MINIPMDB_API_URL);
  const value = await run(input, client);
  if (value !== undefined) print(value, input.flags.json);
} catch (error) {
  process.stderr.write(`MiniPMDB: ${error.message}\n`);
  process.exitCode = error.exitCode || 1;
}

async function run(input, client) {
  const [command, subcommand] = input.positionals;
  switch (command) {
    case "project":
      if (subcommand !== "add") throw new Error("Use: minipmdb project add --key KEY --name NAME --repo PATH");
      requireFlags(input, ["key", "name", "repo"]);
      return client.post("/api/projects", { key: input.flags.key, name: input.flags.name, repo_path: input.flags.repo, tags: list(input.flags.tags) });
    case "list":
      return client.get("/api/memories", { project_key: input.flags.project, status: input.flags.status });
    case "remember":
      requireFlags(input, ["project", "title", "body"]);
      return client.post("/api/memories", {
        project_key: input.flags.project,
        title: input.flags.title,
        body: input.flags.body,
        kind: input.flags.kind || "note",
        confidence: input.flags.confidence || "unknown",
        tags: list(input.flags.tags),
        critical: Boolean(input.flags.critical),
        review_first: true
      });
    case "source": {
      if (subcommand !== "attach") throw new Error("Use: minipmdb source attach MEMORY_ID --label LABEL --ref REF");
      const memoryId = input.positionals[2];
      if (!memoryId) throw new Error("Memory ID is required.");
      requireFlags(input, ["label", "ref"]);
      return client.post(`/api/memories/${encodeURIComponent(memoryId)}/sources`, { type: input.flags.type || "doc", label: input.flags.label, ref: input.flags.ref });
    }
    case "review": {
      const memoryId = subcommand;
      if (!memoryId) throw new Error("Memory ID is required.");
      return client.post(`/api/memories/${encodeURIComponent(memoryId)}/review`, { status: input.flags.status || "reviewed", reviewer: input.flags.reviewer || "human", note: input.flags.note || "" });
    }
    case "supersede": {
      const oldId = subcommand;
      requireFlags(input, ["with"]);
      return client.post(`/api/memories/${encodeURIComponent(oldId)}/supersede`, { replacement_id: input.flags.with, reason: input.flags.reason || "" });
    }
    case "touchpoint":
      if ((subcommand || "list") === "list") return client.get("/api/touchpoints", { project_key: input.flags.project, status: input.flags.status });
      if (subcommand === "upsert") {
        requireFlags(input, ["name", "projects"]);
        return client.post("/api/touchpoints", {
          id: input.flags.id,
          name: input.flags.name,
          projects: list(input.flags.projects),
          kind: input.flags.kind || "other",
          status: input.flags.status || "active",
          summary: input.flags.summary || "",
          memory_ids: list(input.flags.memories),
          tags: list(input.flags.tags)
        });
      }
      throw new Error("Use: minipmdb touchpoint upsert|list");
    case "context":
      requireFlags(input, ["project"]);
      return client.get("/api/context", { project_key: input.flags.project, task: input.flags.task || "", profile: input.flags.profile || "balanced", max_chars: input.flags.max_chars });
    case "audit": {
      const report = await client.get("/api/audit", { project_key: input.flags.project, strict: Boolean(input.flags.strict) });
      if (!report.passed) process.exitCode = 1;
      return input.flags.json ? report : formatAuditReport(report);
    }
    case "audit-snapshot": {
      requireFlags(input, ["snapshot"]);
      const snapshot = normalizeSnapshot(JSON.parse(await fs.readFile(input.flags.snapshot, "utf8")));
      const report = auditSnapshot(snapshot, { strict: Boolean(input.flags.strict), projectKey: input.flags.project || "" });
      if (!report.passed) process.exitCode = 1;
      return input.flags.json ? report : formatAuditReport(report);
    }
    case "export": {
      requireFlags(input, ["out"]);
      const snapshot = await client.get("/api/export");
      await fs.writeFile(input.flags.out, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
      return `Exported MiniPMDB snapshot to ${input.flags.out}.`;
    }
    case "runtime":
      return client.get("/api/runtime");
    case "demo":
      if (!['reset', 'fix'].includes(subcommand)) throw new Error("Use: minipmdb demo reset|fix");
      return client.post(`/api/demo/${subcommand}`);
    case "help":
    case undefined:
      return help();
    default:
      throw new Error(`Unknown command: ${command}. Run minipmdb help.`);
  }
}

function parse(argv) {
  const positionals = [];
  const flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      positionals.push(token);
      continue;
    }
    const key = token.slice(2).replace(/-/g, "_");
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) flags[key] = true;
    else {
      flags[key] = next;
      index += 1;
    }
  }
  return { positionals, flags };
}

function requireFlags(input, names) {
  const missing = names.filter((name) => !input.flags[name]);
  if (missing.length) throw new Error(`Missing flags: ${missing.map((item) => `--${item}`).join(", ")}.`);
}

function list(value) {
  return String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
}

function print(value, json) {
  if (typeof value === "string" && !json) process.stdout.write(`${value}\n`);
  else process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function help() {
  return `MiniPMDB — CI for governed cross-project agent memory

Start the loopback service first with: npm start

Commands:
  project add --key KEY --name NAME --repo PATH
  list [--project KEY] [--status STATUS]
  remember --project KEY --title TITLE --body BODY [--kind KIND]
  source attach MEMORY_ID --label LABEL --ref REF
  review MEMORY_ID [--status reviewed|rejected]
  supersede OLD_ID --with REPLACEMENT_ID
  touchpoint upsert --name NAME --projects A,B --memories ID_A,ID_B
  touchpoint list [--project KEY]
  context --project KEY [--task TEXT] [--profile compact]
  audit [--project KEY] [--strict] [--json]
  audit-snapshot --snapshot FILE [--strict]
  export --out FILE
  runtime
  demo reset|fix`;
}
