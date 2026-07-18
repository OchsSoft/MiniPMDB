#!/usr/bin/env node
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { RuntimeManager } from "./runtime.js";
import { MiniPMDBService, loadSnapshotFile } from "./service.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const publicDirectory = path.join(root, "public");

export function createMiniPMDBServer({ runtime, service }) {
  if (!runtime || !service) throw new Error("A running MiniPMDB runtime and service are required.");
  return http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url || "/", "http://127.0.0.1");
      if (request.method === "GET" && url.pathname === "/api/health") return sendJson(response, 200, { ok: true, local_only: true, runtime: runtime.status() });
      if (request.method === "GET" && url.pathname === "/api/runtime") return sendJson(response, 200, runtime.status());
      if (request.method === "POST" && url.pathname === "/api/runtime/test") {
        const body = await readJson(request);
        return sendJson(response, 200, await runtime.testExternal(body.uri, body.db_name));
      }
      if (request.method === "POST" && url.pathname === "/api/runtime/config") return sendJson(response, 200, await runtime.configure(await readJson(request)));
      if (request.method === "GET" && url.pathname === "/api/state") return sendJson(response, 200, await service.snapshot());
      if (request.method === "GET" && url.pathname === "/api/projects/resolve") return sendJson(response, 200, await service.resolveProject(url.searchParams.get("repo_path") || ""));
      if (request.method === "POST" && url.pathname === "/api/projects") return sendJson(response, 200, await service.registerProject(await readJson(request)));
      if (request.method === "GET" && url.pathname === "/api/memories") return sendJson(response, 200, { memories: await service.listMemories(query(url)) });
      if (request.method === "POST" && url.pathname === "/api/memories") {
        const body = await readJson(request);
        return sendJson(response, 200, { memory: await service.remember(body, { reviewFirst: body.review_first !== false, projectScope: body.project_scope || "" }) });
      }
      const sourceMatch = url.pathname.match(/^\/api\/memories\/([^/]+)\/sources$/);
      if (request.method === "POST" && sourceMatch) {
        const body = await readJson(request);
        return sendJson(response, 200, await service.attachSource(decodeURIComponent(sourceMatch[1]), body, { candidateOnly: Boolean(body.candidate_only), projectScope: body.project_scope || "" }));
      }
      const reviewMatch = url.pathname.match(/^\/api\/memories\/([^/]+)\/review$/);
      if (request.method === "POST" && reviewMatch) return sendJson(response, 200, { memory: await service.review(decodeURIComponent(reviewMatch[1]), await readJson(request)) });
      const supersedeMatch = url.pathname.match(/^\/api\/memories\/([^/]+)\/supersede$/);
      if (request.method === "POST" && supersedeMatch) {
        const body = await readJson(request);
        return sendJson(response, 200, await service.supersede(decodeURIComponent(supersedeMatch[1]), body.replacement_id, body.reason));
      }
      if (request.method === "GET" && url.pathname === "/api/touchpoints") return sendJson(response, 200, { touchpoints: await service.listTouchpoints(query(url)) });
      if (request.method === "POST" && url.pathname === "/api/touchpoints") return sendJson(response, 200, { touchpoint: await service.upsertTouchpoint(await readJson(request)) });
      if (request.method === "GET" && url.pathname === "/api/audit") return sendJson(response, 200, await service.audit({ ...query(url), strict: url.searchParams.get("strict") === "true" }));
      if (request.method === "GET" && url.pathname === "/api/context") return sendJson(response, 200, await service.context(query(url)));
      if (request.method === "GET" && url.pathname === "/api/export") return sendJson(response, 200, await service.snapshot());
      if (request.method === "POST" && url.pathname === "/api/demo/reset") {
        return sendJson(response, 200, await service.replaceSnapshot(await loadSnapshotFile(path.join(root, "examples", "release-guard", "initial.json"))));
      }
      if (request.method === "POST" && url.pathname === "/api/demo/fix") return sendJson(response, 200, await service.applyDemoFix());
      if (request.method === "GET") return serveStatic(response, url.pathname);
      return sendJson(response, 404, { error: "not_found" });
    } catch (error) {
      return sendJson(response, 400, { error: "request_failed", message: error.message });
    }
  });
}

export async function startMiniPMDBServer({ home, config, port = Number(process.env.MINIPMDB_PORT || 8797), seed } = {}) {
  const runtime = await new RuntimeManager({ home, config }).start();
  const service = new MiniPMDBService({ database: runtime.database });
  let server;
  try {
    if (seed) await service.replaceSnapshot(seed);
    server = createMiniPMDBServer({ runtime, service });
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(port, "127.0.0.1", resolve);
    });
  } catch (error) {
    if (server?.listening) await new Promise((resolve) => server.close(resolve));
    await runtime.stop();
    throw error;
  }
  const address = server.address();
  return {
    runtime,
    service,
    server,
    url: `http://127.0.0.1:${address.port}`,
    async close() {
      await new Promise((resolve) => server.close(resolve));
      await runtime.stop();
    }
  };
}

async function serveStatic(response, pathname) {
  const requested = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const target = path.resolve(publicDirectory, requested);
  if (target !== publicDirectory && !target.startsWith(`${publicDirectory}${path.sep}`)) return sendJson(response, 403, { error: "forbidden" });
  try {
    const body = await fs.readFile(target);
    response.writeHead(200, {
      "Content-Type": contentType(target),
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; frame-ancestors 'none'"
    });
    response.end(body);
  } catch {
    sendJson(response, 404, { error: "not_found" });
  }
}

function query(url) {
  return Object.fromEntries(url.searchParams.entries());
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 1_000_000) throw new Error("Request body is too large.");
  }
  return body ? JSON.parse(body) : {};
}

function sendJson(response, status, value) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  response.end(JSON.stringify(value, null, 2));
}

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  return "application/octet-stream";
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  let running;
  try {
    running = await startMiniPMDBServer();
    process.stdout.write(`MiniPMDB dashboard: ${running.url}\n${running.runtime.status().message}\n`);
    const stop = async () => {
      await running.close();
      process.exit();
    };
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
  } catch (error) {
    process.stderr.write(`MiniPMDB failed to start: ${error.message}\n`);
    process.exitCode = 1;
  }
}
