import fs from "node:fs/promises";
import path from "node:path";
import { createEmptyStore, normalizeStore } from "./schema.js";

export const DEFAULT_STORE_PATH = ".minipmdb/store.json";

export class JsonStore {
  #queue = Promise.resolve();

  constructor(filePath = DEFAULT_STORE_PATH) {
    this.filePath = path.resolve(filePath);
  }

  async read({ create = false, projectKey, projectName } = {}) {
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      return normalizeStore(JSON.parse(raw));
    } catch (error) {
      if (error.code !== "ENOENT" || !create) {
        throw error;
      }
      const initial = createEmptyStore({ projectKey, projectName });
      await this.write(initial);
      return initial;
    }
  }

  async write(value) {
    const normalized = normalizeStore(value);
    const operation = this.#queue.then(() => atomicWrite(this.filePath, normalized));
    this.#queue = operation.catch(() => undefined);
    await operation;
    return normalized;
  }

  async update(mutator) {
    const operation = this.#queue.then(async () => {
      const current = await this.read();
      const draft = structuredClone(current);
      const result = await mutator(draft);
      const next = normalizeStore(result || draft);
      await atomicWrite(this.filePath, next);
      return next;
    });
    this.#queue = operation.catch(() => undefined);
    return operation;
  }
}

async function atomicWrite(filePath, value) {
  const directory = path.dirname(filePath);
  await fs.mkdir(directory, { recursive: true });
  const temporary = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  const payload = `${JSON.stringify(value, null, 2)}\n`;
  try {
    await fs.writeFile(temporary, payload, { encoding: "utf8", flag: "wx" });
    await fs.rename(temporary, filePath);
  } catch (error) {
    await fs.rm(temporary, { force: true }).catch(() => undefined);
    throw error;
  }
}
