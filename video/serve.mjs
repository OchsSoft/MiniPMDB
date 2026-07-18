#!/usr/bin/env node
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const host = "127.0.0.1";
const port = Number(process.env.MINIPMDB_VIDEO_PORT || 8798);

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${host}`);
  const requested = url.pathname === "/" ? "storyboard.html" : url.pathname.replace(/^\/+/, "");
  const target = path.resolve(root, requested);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) return send(response, 403, "Forbidden");
  try {
    const body = await fs.readFile(target);
    response.writeHead(200, {
      "Content-Type": contentType(target),
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    });
    response.end(body);
  } catch {
    send(response, 404, "Not found");
  }
});

server.listen(port, host, () => process.stdout.write(`MiniPMDB video frames: http://${host}:${port}\n`));

function send(response, status, message) {
  response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(message);
}

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".png")) return "image/png";
  return "application/octet-stream";
}
