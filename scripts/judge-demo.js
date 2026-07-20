#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { startMiniPMDBServer } from "../src/api.js";
import { miniHome } from "../src/runtime-config.js";
import { loadSnapshotFile } from "../src/service.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let running;

try {
  assertRuntime();
  const options = parseOptions(process.argv.slice(2));
  const home = process.env.MINIPMDB_HOME || path.join(miniHome(), "judge-demo");
  const expectedUrl = options.port === 0 ? "an OS-assigned 127.0.0.1 port" : `http://127.0.0.1:${options.port}`;
  process.stdout.write([
    "",
    "Starting the MiniPMDB judge demo.",
    `Dashboard: ${expectedUrl}${options.open && options.port !== 0 ? " (opens automatically when ready)" : ""}`,
    "Keep this terminal open. The first managed start downloads MongoDB before the dashboard becomes available.",
    ""
  ].join("\n"));
  const seed = await loadSnapshotFile(path.join(root, "examples", "release-guard", "initial.json"));
  running = await startMiniPMDBServer({ home, port: options.port, seed });
  process.stdout.write([
    "",
    "MiniPMDB judge demo is ready.",
    `Open: ${running.url}`,
    `Storage: ${running.runtime.status().mode} MongoDB ${running.runtime.status().version}`,
    "The synthetic cross-project touchpoint starts broken. Apply the governed fix to make the strict audit pass.",
    "Press Ctrl+C here when finished.",
    ""
  ].join("\n"));
  if (options.open) openBrowser(running.url);
  const stop = async () => {
    await running.close();
    process.exit();
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
} catch (error) {
  if (running) await running.close().catch(() => undefined);
  process.stderr.write(`MiniPMDB judge demo: ${error.message}\n`);
  process.exitCode = 1;
}

function assertRuntime() {
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 20 || (major === 20 && minor < 19)) throw new Error(`Node.js 20.19 or newer is required; found ${process.versions.node}.`);
}

function parseOptions(argv) {
  let port = Number(process.env.MINIPMDB_PORT || 8797);
  let open = true;
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--no-open") open = false;
    else if (argv[index] === "--port") port = Number(argv[++index]);
    else throw new Error(`Unknown option: ${argv[index]}`);
  }
  if (!Number.isInteger(port) || port < 0 || port > 65_535) throw new Error("Port must be an integer from 0 through 65535.");
  return { open, port };
}

function openBrowser(url) {
  const [command, args] = process.platform === "win32"
    ? ["cmd.exe", ["/d", "/s", "/c", "start", "", url]]
    : process.platform === "darwin" ? ["open", [url]] : ["xdg-open", [url]];
  const child = spawn(command, args, { detached: true, stdio: "ignore", windowsHide: true });
  child.once("error", () => process.stdout.write(`The browser did not open automatically. Visit ${url}.\n`));
  child.unref();
}
