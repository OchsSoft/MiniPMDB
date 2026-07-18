import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { MANAGED_MONGODB_VERSION } from "./constants.js";

export function miniHome(override = process.env.MINIPMDB_HOME) {
  if (override) return path.resolve(override);
  if (process.platform === "win32") return path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"), "MiniPMDB");
  if (process.platform === "darwin") return path.join(os.homedir(), "Library", "Application Support", "MiniPMDB");
  return path.join(process.env.XDG_DATA_HOME || path.join(os.homedir(), ".local", "share"), "minipmdb");
}

export async function loadRuntimeConfig(home = miniHome()) {
  const defaults = {
    mode: "managed",
    db_name: process.env.MINIPMDB_DB_NAME || "minipmdb",
    managed_version: process.env.MINIPMDB_MONGODB_VERSION || MANAGED_MONGODB_VERSION,
    external_uri: "mongodb://127.0.0.1:27019"
  };
  try {
    const value = JSON.parse(await fs.readFile(path.join(home, "config.json"), "utf8"));
    return validateRuntimeConfig({ ...defaults, ...value });
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return defaults;
  }
}

export async function saveRuntimeConfig(input, home = miniHome()) {
  const config = validateRuntimeConfig(input);
  const target = path.join(home, "config.json");
  await fs.mkdir(home, { recursive: true });
  await fs.writeFile(target, `${JSON.stringify(config, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  return config;
}

export function validateRuntimeConfig(input) {
  const mode = input.mode === "external" ? "external" : "managed";
  const dbName = String(input.db_name || "minipmdb").trim();
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(dbName)) throw new Error("Database name may contain letters, numbers, underscores, and hyphens only.");
  const externalUri = String(input.external_uri || "mongodb://127.0.0.1:27019").trim();
  const parsed = parseMongoUri(externalUri);
  if (parsed.username || parsed.password) throw new Error("Credentialed MongoDB URIs must be supplied through MINIPMDB_MONGODB_URI and are never persisted.");
  return {
    mode,
    db_name: dbName,
    managed_version: String(input.managed_version || MANAGED_MONGODB_VERSION),
    external_uri: externalUri
  };
}

export function parseMongoUri(uri) {
  let parsed;
  try {
    parsed = new URL(uri);
  } catch {
    throw new Error("MongoDB URI is invalid.");
  }
  if (!["mongodb:", "mongodb+srv:"].includes(parsed.protocol)) throw new Error("MongoDB URI must use mongodb:// or mongodb+srv://.");
  return parsed;
}
