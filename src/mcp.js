#!/usr/bin/env node
import readline from "node:readline";
import { MiniPMDBService } from "./service.js";
import { DEFAULT_STORE_PATH } from "./store.js";

const mode = String(process.env.MINIPMDB_MCP_MODE || "read-only").toLowerCase();
if (!["read-only", "draft-write"].includes(mode)) {
  throw new Error("MINIPMDB_MCP_MODE must be read-only or draft-write.");
}

const service = new MiniPMDBService({ storePath: process.env.MINIPMDB_STORE || DEFAULT_STORE_PATH });
const tools = buildTools(mode);
const instructions = mode === "draft-write"
  ? "Read governed context before project work. Draft-write is a permission mode; memory_remember persists unreviewed candidates only. Record durable, non-secret project facts, never invent source IDs, and return created IDs plus proposed evidence for human review. Never claim that a candidate is approved. A human must attach evidence and approve or reject it with the MiniPMDB CLI."
  : "Read governed context before project work. Treat warnings and history separately from active project truth. This server is read-only; do not claim that you recorded, approved, rejected, or changed a memory.";
const input = readline.createInterface({ input: process.stdin, terminal: false });

input.on("line", async (line) => {
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
    if (message.id !== undefined) {
      write({ jsonrpc: "2.0", id: message.id, error: { code: -32000, message: error.message } });
    }
  }
});

async function handle(message) {
  switch (message.method) {
    case "initialize":
      return {
        protocolVersion: message.params?.protocolVersion || "2025-03-26",
        capabilities: { tools: {} },
        serverInfo: { name: "minipmdb", version: "0.1.0" },
        instructions
      };
    case "ping":
      return {};
    case "tools/list":
      return { tools };
    case "tools/call":
      return callTool(message.params?.name, message.params?.arguments || {});
    case "resources/list":
      return { resources: [] };
    case "prompts/list":
      return { prompts: [] };
    default:
      throw new Error(`Unsupported method: ${message.method}`);
  }
}

async function callTool(name, args) {
  if (name === "memory_context") {
    const context = await service.context({
      task: args.task || "",
      profile: args.profile || "balanced",
      maxChars: args.max_chars
    });
    return result(context.context_pack, context);
  }
  if (name === "memory_audit") {
    const report = await service.audit({ strict: Boolean(args.strict) });
    return result(JSON.stringify(report, null, 2), report);
  }
  if (name === "memory_list") {
    const store = await service.read();
    const memories = args.status
      ? store.memories.filter((memory) => memory.status === args.status)
      : store.memories;
    return result(JSON.stringify(memories, null, 2), { memories });
  }
  if (name === "memory_remember" && mode === "draft-write") {
    const store = await service.remember(args, { reviewFirst: true });
    const memory = store.memories.at(-1);
    return result(`Recorded ${memory.id} as ${memory.status}; human review is still required.`, { memory });
  }
  throw new Error(`Unknown or disabled tool: ${name}`);
}

function buildTools(mcpMode) {
  const definitions = [
    {
      name: "memory_context",
      description: "Return a budgeted context pack that separates reviewed project truth from warnings and history.",
      inputSchema: objectSchema({
        task: { type: "string" },
        profile: { type: "string", enum: ["drift_guard", "balanced", "compact"] },
        max_chars: { type: "number", minimum: 500 }
      }),
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false }
    },
    {
      name: "memory_audit",
      description: "Audit memory provenance, review state, conflicts, supersession, and context-profile safety.",
      inputSchema: objectSchema({ strict: { type: "boolean" } }),
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false }
    },
    {
      name: "memory_list",
      description: "List local project memories, optionally filtered by lifecycle status.",
      inputSchema: objectSchema({ status: { type: "string" } }),
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false }
    }
  ];
  if (mcpMode === "draft-write") {
    definitions.push({
      name: "memory_remember",
      description: "Record an unreviewed project-memory candidate. This tool cannot self-approve agent claims.",
      inputSchema: objectSchema({
        title: { type: "string" },
        body: { type: "string" },
        kind: { type: "string" },
        confidence: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        source_ids: { type: "array", items: { type: "string" } },
        critical: { type: "boolean" }
      }, ["title", "body"]),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false }
    });
  }
  return definitions;
}

function objectSchema(properties, required = []) {
  return { type: "object", properties, required, additionalProperties: false };
}

function result(text, structuredContent) {
  return { content: [{ type: "text", text }], structuredContent };
}

function write(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}
