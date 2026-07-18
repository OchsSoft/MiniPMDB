#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createMiniPMDBServer } from "../src/api.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const directory = await fs.mkdtemp(path.join(os.tmpdir(), "minipmdb-judge-"));
const storePath = path.join(directory, "store.json");
let server;

try {
  const nodeMajor = Number(process.versions.node.split(".")[0]);
  assert(nodeMajor >= 20, `Node.js 20 or newer is required; found ${process.versions.node}.`);
  process.stdout.write("MiniPMDB judge dry run\n");

  expectCliSuccess(["demo", "reset", "--store", storePath]);
  const failingAudit = expectCliJson(["audit", "--strict", "--json", "--store", storePath], 1);
  assert.equal(failingAudit.passed, false);
  assert.equal(failingAudit.summary.errors, 3);
  assert.deepEqual(
    new Set(failingAudit.issues.map((issue) => issue.code)),
    new Set(["active_unreviewed", "high_confidence_without_source", "unresolved_conflict"])
  );
  pass("CLI rejects the unsafe memory with the expected nonzero exit and three findings");

  const blockedContext = expectCliJson([
    "context", "--profile", "compact", "--task", "prepare the release", "--json", "--store", storePath
  ]);
  assert.match(blockedContext.context_pack, /\[ACTIVE\].*OIDC/is);
  assert.match(blockedContext.context_pack, /\[WARNING\].*registry token/is);
  assert.deepEqual(blockedContext.context_selection.omitted_critical_warning_ids, []);
  pass("compact context separates reviewed truth from the critical warning");

  expectCliSuccess(["demo", "fix", "--store", storePath]);
  const passingAudit = expectCliJson(["audit", "--strict", "--json", "--store", storePath]);
  assert.equal(passingAudit.passed, true);
  assert.equal(passingAudit.summary.errors, 0);
  pass("the governed resolution and supersession make the same strict CLI audit pass");

  server = createMiniPMDBServer({ storePath });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  const base = `http://127.0.0.1:${address.port}`;
  const homepage = await fetchText(`${base}/`);
  assert.match(homepage, /MiniPMDB/);
  assert.equal((await fetchJson(`${base}/api/health`)).local_only, true);

  await fetchJson(`${base}/api/demo/reset`, { method: "POST" });
  assert.equal((await fetchJson(`${base}/api/audit?strict=true`)).passed, false);
  await fetchJson(`${base}/api/demo/fix`, { method: "POST" });
  assert.equal((await fetchJson(`${base}/api/audit?strict=true`)).passed, true);
  const apiContext = await fetchJson(`${base}/api/context?profile=compact&task=release`);
  assert.match(apiContext.context_pack, /\[WARNING\].*registry token/is);
  pass("the loopback dashboard API reproduces the complete blocked-to-passing flow");

  const draftResponses = await runMcp(storePath, {
    mode: "draft-write",
    messages: [
      { jsonrpc: "2.0", id: 10, method: "initialize", params: { protocolVersion: "2025-03-26" } },
      {
        jsonrpc: "2.0",
        id: 11,
        method: "tools/call",
        params: {
          name: "memory_remember",
          arguments: {
            kind: "constraint",
            confidence: "high",
            title: "Use the supported Node.js runtime",
            body: "This project requires Node.js 20 or newer for its local commands.",
            tags: ["runtime", "node"]
          }
        }
      },
      {
        jsonrpc: "2.0",
        id: 12,
        method: "tools/call",
        params: {
          name: "memory_remember",
          arguments: {
            kind: "note",
            confidence: "low",
            title: "Candidate that should not persist",
            body: "This intentionally disposable observation is not durable project truth."
          }
        }
      }
    ]
  });
  assert.match(draftResponses.find((message) => message.id === 10).result.instructions, /draft records only/i);
  const approvedMemory = draftResponses.find((message) => message.id === 11).result.structuredContent.memory;
  const rejectedMemory = draftResponses.find((message) => message.id === 12).result.structuredContent.memory;
  assert.equal(approvedMemory.status, "draft");
  assert.equal(rejectedMemory.status, "draft");
  const approvedId = approvedMemory.id;
  const rejectedId = rejectedMemory.id;
  const pending = expectCliJson(["list", "--status", "draft", "--json", "--store", storePath]);
  assert(pending.memories.some((memory) => memory.id === approvedId));
  assert(pending.memories.some((memory) => memory.id === rejectedId));
  expectCliSuccess([
    "source", "attach", approvedId,
    "--type", "file",
    "--label", "Runtime declaration",
    "--ref", "package.json#engines",
    "--store", storePath
  ]);
  expectCliSuccess([
    "review", approvedId,
    "--status", "reviewed",
    "--reviewer", "judge",
    "--note", "Verified against the runtime declaration.",
    "--store", storePath
  ]);

  expectCliSuccess([
    "review", rejectedId,
    "--status", "rejected",
    "--reviewer", "judge",
    "--note", "Transient rather than durable.",
    "--store", storePath
  ]);
  const rejected = expectCliJson(["list", "--status", "rejected", "--json", "--store", storePath]);
  assert(rejected.memories.some((memory) => memory.id === rejectedId));
  const reviewedAudit = expectCliJson(["audit", "--strict", "--json", "--store", storePath]);
  assert.equal(reviewedAudit.passed, true);
  const reviewedContext = expectCliJson([
    "context", "--profile", "balanced", "--task", "run the project", "--json", "--store", storePath
  ]);
  assert.match(reviewedContext.context_pack, /Use the supported Node\.js runtime/);
  assert.doesNotMatch(reviewedContext.context_pack, /Candidate that should not persist/);
  pass("draft-write MCP creates only queued drafts; a human can source, approve, or reject them");

  const mcpResponses = await runMcp(storePath);
  const tools = mcpResponses.find((message) => message.id === 2).result.tools;
  assert.deepEqual(tools.map((tool) => tool.name), ["memory_context", "memory_audit", "memory_list"]);
  assert(tools.every((tool) => tool.annotations.readOnlyHint === true));
  const mcpContext = mcpResponses.find((message) => message.id === 3).result;
  assert.match(mcpContext.content[0].text, /Active project truth/);
  assert.match(mcpContext.content[0].text, /Warnings and history/);
  pass("read-only MCP exposes governed context without a self-approval write path");

  process.stdout.write("Judge dry run: PASS\n");
} catch (error) {
  process.stderr.write(`Judge dry run: FAIL\n${error.stack || error.message}\n`);
  process.exitCode = 1;
} finally {
  if (server) await new Promise((resolve) => server.close(resolve));
  await fs.rm(directory, { recursive: true, force: true });
}

function expectCliSuccess(args) {
  const result = runCli(args);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result;
}

function expectCliJson(args, expectedStatus = 0) {
  const result = runCli(args);
  assert.equal(result.status, expectedStatus, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

function runCli(args) {
  const result = spawnSync(process.execPath, [path.join(root, "src", "cli.js"), ...args], {
    cwd: root,
    encoding: "utf8",
    windowsHide: true
  });
  if (result.error) throw result.error;
  return result;
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  assert.equal(response.status, 200, `${response.status} from ${url}`);
  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url);
  assert.equal(response.status, 200, `${response.status} from ${url}`);
  return response.text();
}

function runMcp(mcpStorePath, { mode = "read-only", messages } = {}) {
  const requests = messages || [
    { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26" } },
    { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
    {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "memory_context", arguments: { task: "release", profile: "compact" } }
    }
  ];
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(root, "src", "mcp.js")], {
      cwd: root,
      env: { ...process.env, MINIPMDB_STORE: mcpStorePath, MINIPMDB_MCP_MODE: mode },
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`MCP dry run timed out. ${stderr}`));
    }, 5_000);
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(`MCP exited ${code}: ${stderr}`));
      resolve(stdout.trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line)));
    });
    child.stdin.end(`${requests.map((message) => JSON.stringify(message)).join("\n")}\n`);
  });
}

function pass(message) {
  process.stdout.write(`[PASS] ${message}\n`);
}
