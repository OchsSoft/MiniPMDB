#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createMiniPMDBServer } from "../src/api.js";
import { MiniPMDBService } from "../src/service.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

try {
  const nodeMajor = Number(process.versions.node.split(".")[0]);
  if (!Number.isInteger(nodeMajor) || nodeMajor < 20) {
    throw new Error(`Node.js 20 or newer is required; found ${process.versions.node}.`);
  }
  const options = parseOptions(process.argv.slice(2));
  const storePath = process.env.MINIPMDB_STORE || path.join(root, ".minipmdb", "judge-demo.json");
  const fixturePath = path.join(root, "examples", "release-guard", "initial.json");
  const fixture = JSON.parse(await fs.readFile(fixturePath, "utf8"));
  await new MiniPMDBService({ storePath }).store.write(fixture);

  const server = createMiniPMDBServer({ storePath });
  server.once("error", (error) => {
    process.stderr.write(`MiniPMDB judge demo could not start: ${error.message}\n`);
    process.exitCode = 1;
  });
  server.listen(options.port, "127.0.0.1", () => {
    const address = server.address();
    const url = `http://127.0.0.1:${address.port}`;
    process.stdout.write([
      "",
      "MiniPMDB judge demo is ready.",
      `Open: ${url}`,
      "The synthetic project starts blocked. Select Apply governed fix to make the strict audit pass.",
      "Press Ctrl+C here when finished.",
      ""
    ].join("\n"));
    if (options.open) openBrowser(url);
  });

  const stop = () => server.close(() => process.exit());
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
} catch (error) {
  process.stderr.write(`MiniPMDB judge demo: ${error.message}\n`);
  process.exitCode = 1;
}

function parseOptions(argv) {
  let port = Number(process.env.MINIPMDB_PORT || 8797);
  let open = true;
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--no-open") {
      open = false;
      continue;
    }
    if (argv[index] === "--port") {
      port = Number(argv[index + 1]);
      index += 1;
      continue;
    }
    throw new Error(`Unknown option: ${argv[index]}`);
  }
  if (!Number.isInteger(port) || port < 0 || port > 65_535) {
    throw new Error("Port must be an integer from 0 through 65535.");
  }
  return { open, port };
}

function openBrowser(url) {
  let command;
  let args;
  if (process.platform === "win32") {
    command = "cmd.exe";
    args = ["/d", "/s", "/c", "start", "", url];
  } else if (process.platform === "darwin") {
    command = "open";
    args = [url];
  } else {
    command = "xdg-open";
    args = [url];
  }
  const child = spawn(command, args, { detached: true, stdio: "ignore", windowsHide: true });
  child.once("error", () => {
    process.stdout.write(`The browser did not open automatically. Visit ${url}.\n`);
  });
  child.unref();
}
