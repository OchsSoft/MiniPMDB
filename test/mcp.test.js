import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startMiniPMDBServer } from "../src/api.js";
import { fixture } from "../test-support/fixtures.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("MCP defaults to project-draft and strict read-only removes writes", async (t) => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), "minipmdb-mcp-test-"));
  const repo = path.join(home, "repo");
  await fs.mkdir(repo);
  const seed = await fixture("resolved.json");
  const project = seed.projects.find((item) => item.key === "paper-crane-cli");
  project.repo_path = repo;
  project.repo_root = process.platform === "win32" ? repo.toLowerCase() : repo;
  const running = await startMiniPMDBServer({ home: path.join(home, "runtime"), port: 0, seed });
  t.after(async () => { await running.close(); await fs.rm(home, { recursive: true, force: true }); });

  const drafted = await runMcp(running.url, repo, "project-draft", [
    { jsonrpc: "2.0", id: 1, method: "initialize", params: {} },
    { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
    { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "memory_remember", arguments: { title: "Candidate", body: "Needs review." } } }
  ]);
  assert.match(drafted[0].result.instructions, /Project-draft/);
  assert(drafted[1].result.tools.some((item) => item.name === "memory_remember"));
  assert.equal(drafted[2].result.structuredContent.memory.status, "unreviewed");
  const readOnly = await runMcp(running.url, repo, "read-only", [{ jsonrpc: "2.0", id: 4, method: "tools/list", params: {} }]);
  assert.deepEqual(readOnly[0].result.tools.map((item) => item.name), ["memory_context", "memory_audit", "memory_list"]);
});

function runMcp(apiUrl, cwd, mode, messages) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(root, "src", "mcp.js")], { cwd, env: { ...process.env, MINIPMDB_API_URL: apiUrl, MINIPMDB_MCP_MODE: mode }, stdio: ["pipe", "pipe", "pipe"], windowsHide: true });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => { child.kill(); reject(new Error(stderr || "MCP timeout")); }, 10_000);
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(stderr));
      resolve(stdout.trim().split(/\r?\n/).filter(Boolean).map(JSON.parse));
    });
    child.stdin.end(`${messages.map(JSON.stringify).join("\n")}\n`);
  });
}
