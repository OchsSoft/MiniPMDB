#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoMemoryServer } from "mongodb-memory-server-core";
import { startMiniPMDBServer } from "../src/api.js";

process.env.MINIPMDB_MONGODB_DOWNLOAD_DIR ||= path.join(os.tmpdir(), "minipmdb-test-binaries");
import { MANAGED_MONGODB_VERSION } from "../src/constants.js";
import { loadSnapshotFile } from "../src/service.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const directory = await fs.mkdtemp(path.join(os.tmpdir(), "minipmdb-judge-"));
const binaryDirectory = process.env.MINIPMDB_MONGODB_DOWNLOAD_DIR || path.join(os.tmpdir(), "minipmdb-mongodb-binaries");
const projectAPath = path.join(directory, "paper-crane-cli");
const projectBPath = path.join(directory, "release-relay");
let running;
let externalMongo;

try {
  await Promise.all([fs.mkdir(projectAPath), fs.mkdir(projectBPath), fs.mkdir(binaryDirectory, { recursive: true })]);
  const [projectARealPath, projectBRealPath] = await Promise.all([fs.realpath(projectAPath), fs.realpath(projectBPath)]);
  const seed = await loadSnapshotFile(path.join(root, "examples", "release-guard", "initial.json"));
  seed.projects.find((item) => item.key === "paper-crane-cli").repo_path = projectAPath;
  seed.projects.find((item) => item.key === "paper-crane-cli").repo_root = canonical(projectARealPath);
  seed.projects.find((item) => item.key === "release-relay").repo_path = projectBPath;
  seed.projects.find((item) => item.key === "release-relay").repo_root = canonical(projectBRealPath);
  process.stdout.write("MiniPMDB judge dry run\n");

  running = await startMiniPMDBServer({ home: path.join(directory, "managed-home"), port: 0, seed });
  assert.equal((await get(running.url, "/api/runtime")).mode, "managed");
  const failing = await get(running.url, "/api/audit", { strict: true });
  assert.equal(failing.passed, false);
  assert(new Set(failing.issues.map((item) => item.code)).has("broken_touchpoint"));
  const context = await get(running.url, "/api/context", { project_key: "paper-crane-cli", profile: "compact", task: "prepare release authentication" });
  assert.match(context.context_pack, /PROJECT release-relay.*Release Relay accepts OIDC identity/is);
  assert.match(context.context_pack, /TOUCHPOINT BROKEN/);
  assert.deepEqual(context.context_selection.omitted_broken_touchpoint_ids, []);
  pass("managed Mongo serves cross-project touchpoint context without hiding the broken contract");

  await post(running.url, "/api/demo/fix");
  const passing = await get(running.url, "/api/audit", { strict: true });
  assert.equal(passing.passed, true, JSON.stringify(passing.issues));
  pass("the governed resolution makes the shared strict audit pass without deleting history");

  const draft = await runMcp(running.url, projectAPath, "project-draft", [
    { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26" } },
    { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
    { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "memory_remember", arguments: { kind: "constraint", confidence: "high", title: "Use the supported Node runtime", body: "MiniPMDB requires Node.js 20.19 or newer." } } }
  ]);
  const memory = responseFor(draft, 3).result.structuredContent.memory;
  assert.equal(memory.project_key, "paper-crane-cli");
  assert.equal(memory.status, "unreviewed");
  const attached = await runMcp(running.url, projectAPath, "project-draft", [
    { jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "source_attach", arguments: { memory_id: memory.id, type: "file", label: "Runtime declaration", ref: "package.json#engines" } } }
  ]);
  assert.equal(responseFor(attached, 4).result.structuredContent.memory.status, "unreviewed");
  await post(running.url, `/api/memories/${memory.id}/review`, { status: "reviewed", reviewer: "judge", note: "Verified." });
  const crossProjectAttach = await runMcp(running.url, projectAPath, "project-draft", [
    { jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "source_attach", arguments: { memory_id: "mem-relay-oidc", type: "file", label: "Wrong project", ref: "README.md" } } }
  ]);
  assert.match(responseFor(crossProjectAttach, 5).error.message, /outside paper-crane-cli/i);
  pass("project-draft creates only unreviewed local candidates and cannot write the other project");

  const readOnly = await runMcp(running.url, projectAPath, "read-only", [
    { jsonrpc: "2.0", id: 6, method: "tools/list", params: {} }
  ]);
  assert.deepEqual(responseFor(readOnly, 6).result.tools.map((item) => item.name), ["memory_context", "memory_audit", "memory_list"]);
  pass("strict read-only exposes no write tools");

  const runtimeTest = await post(running.url, "/api/runtime/test", { uri: running.runtime.database.uri, db_name: running.runtime.database.dbName });
  assert.equal(runtimeTest.ok, true);
  await running.close();
  running = await startMiniPMDBServer({ home: path.join(directory, "managed-home"), port: 0 });
  assert((await get(running.url, "/api/memories", { project_key: "paper-crane-cli", status: "reviewed" })).memories.some((item) => item.id === memory.id));
  pass("managed Mongo data survives a clean service restart");
  await running.close();
  running = null;

  externalMongo = await MongoMemoryServer.create({ binary: { version: MANAGED_MONGODB_VERSION, downloadDir: binaryDirectory }, instance: { ip: "127.0.0.1" } });
  running = await startMiniPMDBServer({
    home: path.join(directory, "external-home"),
    port: 0,
    config: { mode: "external", db_name: "minipmdb_external", managed_version: MANAGED_MONGODB_VERSION, external_uri: externalMongo.getUri() },
    seed
  });
  assert.equal((await get(running.url, "/api/runtime")).mode, "external");
  assert.equal((await get(running.url, "/api/runtime")).version, MANAGED_MONGODB_VERSION);
  assert.equal((await get(running.url, "/api/audit")).summary.projects, 2);
  pass("the same application works against an external MongoDB URI");

  process.stdout.write("Judge dry run: PASS\n");
} catch (error) {
  process.stderr.write(`Judge dry run: FAIL\n${error.stack || error.message}\n`);
  process.exitCode = 1;
} finally {
  if (running) await running.close().catch(() => undefined);
  if (externalMongo) await externalMongo.stop().catch(() => undefined);
  await fs.rm(directory, { recursive: true, force: true });
}

async function get(base, pathname, query = {}) {
  const url = new URL(`${base}${pathname}`);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, String(value));
  const response = await fetch(url);
  const text = await response.text();
  assert.equal(response.status, 200, text);
  return JSON.parse(text);
}

async function post(base, pathname, body = {}) {
  const response = await fetch(`${base}${pathname}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const value = await response.json();
  assert.equal(response.status, 200, JSON.stringify(value));
  return value;
}

function runMcp(apiUrl, cwd, mode, messages) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(root, "src", "mcp.js")], { cwd, env: { ...process.env, MINIPMDB_API_URL: apiUrl, MINIPMDB_MCP_MODE: mode }, stdio: ["pipe", "pipe", "pipe"], windowsHide: true });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => { child.kill(); reject(new Error(`MCP timed out. ${stderr}`)); }, 10_000);
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(`MCP exited ${code}: ${stderr}`));
      resolve(stdout.trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line)));
    });
    child.stdin.end(`${messages.map(JSON.stringify).join("\n")}\n`);
  });
}

function canonical(value) {
  const resolved = path.resolve(value);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function responseFor(responses, id) {
  const response = responses.find((item) => item.id === id);
  assert(response, `Missing JSON-RPC response ${id}: ${JSON.stringify(responses)}`);
  return response;
}

function pass(message) {
  process.stdout.write(`[PASS] ${message}\n`);
}
