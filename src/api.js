#!/usr/bin/env node
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { MiniPMDBService, applyReleaseDemoFix } from "./service.js";
import { DEFAULT_STORE_PATH } from "./store.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const publicDirectory = path.resolve(here, "..", "public");

export function createMiniPMDBServer({ storePath = process.env.MINIPMDB_STORE || DEFAULT_STORE_PATH } = {}) {
  const service = new MiniPMDBService({ storePath });
  return http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url || "/", "http://127.0.0.1");
      if (request.method === "GET" && url.pathname === "/api/health") {
        return sendJson(response, 200, { ok: true, local_only: true });
      }
      if (request.method === "GET" && url.pathname === "/api/state") {
        return sendJson(response, 200, await service.read());
      }
      if (request.method === "GET" && url.pathname === "/api/audit") {
        return sendJson(response, 200, await service.audit({ strict: url.searchParams.get("strict") === "true" }));
      }
      if (request.method === "GET" && url.pathname === "/api/context") {
        return sendJson(response, 200, await service.context({
          task: url.searchParams.get("task") || "release",
          profile: url.searchParams.get("profile") || "compact"
        }));
      }
      if (request.method === "POST" && url.pathname === "/api/demo/reset") {
        const fixturePath = path.resolve(here, "..", "examples", "release-guard", "initial.json");
        const fixture = JSON.parse(await fs.readFile(fixturePath, "utf8"));
        return sendJson(response, 200, await service.store.write(fixture));
      }
      if (request.method === "POST" && url.pathname === "/api/demo/fix") {
        return sendJson(response, 200, await service.store.update(applyReleaseDemoFix));
      }
      if (request.method === "GET") return serveStatic(response, url.pathname);
      return sendJson(response, 404, { error: "not_found" });
    } catch (error) {
      return sendJson(response, 400, { error: "request_failed", message: error.message });
    }
  });
}

async function serveStatic(response, pathname) {
  const requested = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const target = path.resolve(publicDirectory, requested);
  if (target !== publicDirectory && !target.startsWith(`${publicDirectory}${path.sep}`)) {
    return sendJson(response, 403, { error: "forbidden" });
  }
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

function sendJson(response, status, value) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  response.end(JSON.stringify(value, null, 2));
}

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  return "application/octet-stream";
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  const host = "127.0.0.1";
  const port = Number(process.env.MINIPMDB_PORT || 8797);
  const server = createMiniPMDBServer();
  server.listen(port, host, () => process.stdout.write(`MiniPMDB dashboard: http://${host}:${port}\n`));
}
