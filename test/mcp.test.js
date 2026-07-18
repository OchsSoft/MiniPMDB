import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const storePath = path.join(root, "examples", "release-guard", "resolved.json");

test("read-only MCP lists only read tools and returns governed context", async () => {
  const responses = await runMcp([
    { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26" } },
    { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
    {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "memory_context", arguments: { task: "release", profile: "compact" } }
    }
  ]);
  const listed = responses.find((response) => response.id === 2).result.tools;
  assert.match(responses.find((response) => response.id === 1).result.instructions, /read-only/i);
  assert(!listed.some((tool) => tool.name === "memory_remember"));
  assert(listed.every((tool) => tool.annotations.readOnlyHint === true));
  const context = responses.find((response) => response.id === 3).result;
  assert.match(context.content[0].text, /Active project truth/);
  assert.match(context.content[0].text, /Warnings and history/);
});

test("draft-write MCP advertises constrained memory creation", async () => {
  const responses = await runMcp(
    [
      { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26" } },
      { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }
    ],
    { MINIPMDB_MCP_MODE: "draft-write" }
  );
  assert.match(responses.find((response) => response.id === 1).result.instructions, /permission mode.*unreviewed candidates/i);
  const remembered = responses.find((response) => response.id === 2).result.tools
    .find((tool) => tool.name === "memory_remember");
  assert(remembered);
  assert.equal(remembered.annotations.readOnlyHint, false);
  assert.equal(remembered.annotations.destructiveHint, false);
});

function runMcp(messages, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(root, "src", "mcp.js")], {
      cwd: root,
      env: { ...process.env, MINIPMDB_STORE: storePath, ...extraEnv },
      stdio: ["pipe", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`MCP test timed out. ${stderr}`));
    }, 5_000);
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(`MCP exited ${code}: ${stderr}`));
      resolve(stdout.trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line)));
    });
    child.stdin.end(`${messages.map((message) => JSON.stringify(message)).join("\n")}\n`);
  });
}
