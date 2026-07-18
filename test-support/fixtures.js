import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Reuse the large platform MongoDB binary between isolated database homes.
process.env.MINIPMDB_MONGODB_DOWNLOAD_DIR ||= path.join(os.tmpdir(), "minipmdb-test-binaries");

export async function fixture(name) {
  return JSON.parse(await fs.readFile(path.join(root, "examples", "release-guard", name), "utf8"));
}
