#!/usr/bin/env node
import readline from "node:readline";
import { MiniPMDBClient } from "./api-client.js";

const mode = String(process.env.MINIPMDB_MCP_MODE || "project-draft").toLowerCase();
if (!["read-only", "project-draft", "draft-write"].includes(mode)) throw new Error("MINIPMDB_MCP_MODE must be read-only, project-draft, or draft-write.");
const client = new MiniPMDBClient();
const canDraft = mode !== "read-only";
const projectPromise = client.get("/api/projects/resolve", { repo_path: process.cwd() });
const tools = buildTools(canDraft);
const instructions = canDraft
  ? "Project-draft is scoped to the registered project matching this MCP working directory. memory_remember creates only unreviewed candidates and source_attach adds evidence without approval. A human must approve or reject candidates in the MiniPMDB dashboard or CLI."
  : "This MiniPMDB connection is strictly read-only. Treat warnings and cross-project touchpoint context separately from reviewed project truth.";
const input = readline.createInterface({ input: process.stdin, terminal: false });
let messageQueue = Promise.resolve();

input.on("line", (line) => {
  messageQueue = messageQueue.then(() => processLine(line)).catch((error) => {
    write({ jsonrpc: "2.0", id: null, error: { code: -32603, message: error.message } });
  });
});

async function processLine(line) {
  if (!line.trim()) return;
  let message;
  try {
    message = JSON.parse(line);
  } catch (error) {
    return write({ jsonrpc: "2.0", id: null, error: { code: -32700, message: error.message } });
  }
  if (message.method?.startsWith("notifications/")) return;
  try {
    const result = await handle(message);
    if (message.id !== undefined) write({ jsonrpc: "2.0", id: message.id, result });
  } catch (error) {
    if (message.id !== undefined) write({ jsonrpc: "2.0", id: message.id, error: { code: -32000, message: error.message } });
  }
}

async function handle(message) {
  if (message.method === "initialize") return { protocolVersion: message.params?.protocolVersion || "2025-03-26", capabilities: { tools: {} }, serverInfo: { name: "minipmdb", version: "0.1.0" }, instructions };
  if (message.method === "ping") return {};
  if (message.method === "tools/list") return { tools };
  if (message.method === "tools/call") return callTool(message.params?.name, message.params?.arguments || {});
  if (message.method === "resources/list" || message.method === "prompts/list") return { [message.method.startsWith("resources") ? "resources" : "prompts"]: [] };
  throw new Error(`Unsupported method: ${message.method}`);
}

async function callTool(name, args) {
  const project = await projectPromise;
  if (name === "memory_context") {
    const context = await client.get("/api/context", { project_key: project.key, task: args.task || "", profile: args.profile || "balanced", max_chars: args.max_chars });
    return result(context.context_pack, context);
  }
  if (name === "memory_audit") {
    const report = await client.get("/api/audit", { project_key: project.key, strict: Boolean(args.strict) });
    return result(JSON.stringify(report, null, 2), report);
  }
  if (name === "memory_list") {
    const listed = await client.get("/api/memories", { project_key: project.key, status: args.status });
    return result(JSON.stringify(listed.memories, null, 2), listed);
  }
  if (name === "memory_remember" && canDraft) {
    const created = await client.post("/api/memories", { ...args, project_key: project.key, project_scope: project.key, review_first: true });
    return result(`Recorded ${created.memory.id} as unreviewed; human review is required.`, created);
  }
  if (name === "source_attach" && canDraft) {
    const attached = await client.post(`/api/memories/${encodeURIComponent(args.memory_id)}/sources`, { ...args, project_scope: project.key, candidate_only: true });
    return result(`Attached ${attached.source.id} to ${attached.memory.id}; human review is still required.`, attached);
  }
  throw new Error(`Unknown or disabled tool: ${name}`);
}

function buildTools(includeDraft) {
  const definitions = [
    tool("memory_context", "Return governed project truth, warnings, and relevant cross-project touchpoint context.", { task: { type: "string" }, profile: { type: "string", enum: ["drift_guard", "balanced", "compact"] }, max_chars: { type: "number", minimum: 500 } }, [], true),
    tool("memory_audit", "Audit provenance, review state, conflicts, supersession, touchpoints, and context safety.", { strict: { type: "boolean" } }, [], true),
    tool("memory_list", "List lifecycle state for memories owned by this registered project.", { status: { type: "string" } }, [], true)
  ];
  if (includeDraft) {
    definitions.push(tool("memory_remember", "Create an unreviewed candidate in this project; this cannot create reviewed truth.", {
      title: { type: "string" }, body: { type: "string" }, kind: { type: "string" }, confidence: { type: "string" }, tags: { type: "array", items: { type: "string" } }, critical: { type: "boolean" }
    }, ["title", "body"], false));
    definitions.push(tool("source_attach", "Attach evidence to this project's draft or unreviewed candidate without approving it.", {
      memory_id: { type: "string" }, type: { type: "string" }, label: { type: "string" }, ref: { type: "string" }
    }, ["memory_id", "label", "ref"], false));
  }
  return definitions;
}

function tool(name, description, properties, required, readOnlyHint) {
  return { name, description, inputSchema: { type: "object", properties, required, additionalProperties: false }, annotations: { readOnlyHint, destructiveHint: false, openWorldHint: false } };
}

function result(text, structuredContent) {
  return { content: [{ type: "text", text }], structuredContent };
}

function write(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}
