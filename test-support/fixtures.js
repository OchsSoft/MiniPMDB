import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export async function fixture(name) {
  return JSON.parse(await fs.readFile(path.join(root, "examples", "release-guard", name), "utf8"));
}
