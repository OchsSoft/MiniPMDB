import fs from "node:fs/promises";
import path from "node:path";
import { MongoMemoryServer } from "mongodb-memory-server-core";
import { MiniPMDBDatabase, redactMongoUri, testMongoConnection } from "./database.js";
import { loadRuntimeConfig, miniHome, saveRuntimeConfig } from "./runtime-config.js";

export class RuntimeManager {
  constructor({ home = miniHome(), config, managedFactory = MongoMemoryServer } = {}) {
    this.home = path.resolve(home);
    this.configOverride = config;
    this.managedFactory = managedFactory;
    this.state = { status: "starting", mode: "managed", endpoint: "", database: "", version: "", message: "Starting MiniPMDB storage." };
  }

  async start() {
    await fs.mkdir(this.home, { recursive: true });
    this.config = this.configOverride || await loadRuntimeConfig(this.home);
    const envUri = process.env.MINIPMDB_MONGODB_URI;
    const mode = envUri ? "external" : this.config.mode;
    this.state = { ...this.state, status: "starting", mode, database: this.config.db_name };
    try {
      let uri;
      if (mode === "managed") {
        const dataPath = path.join(this.home, "data");
        const downloadDir = process.env.MINIPMDB_MONGODB_DOWNLOAD_DIR
          ? path.resolve(process.env.MINIPMDB_MONGODB_DOWNLOAD_DIR)
          : path.join(this.home, "binaries");
        await fs.mkdir(dataPath, { recursive: true });
        await fs.mkdir(downloadDir, { recursive: true });
        this.state.message = `Preparing MongoDB ${this.config.managed_version}; the first run downloads the server binary.`;
        this.managed = await this.managedFactory.create({
          binary: { version: this.config.managed_version, downloadDir, checkMD5: true },
          instance: { dbPath: dataPath, dbName: this.config.db_name, ip: "127.0.0.1", storageEngine: "wiredTiger" }
        });
        uri = this.managed.getUri();
      } else {
        uri = envUri || this.config.external_uri;
      }
      this.database = await new MiniPMDBDatabase({ uri, dbName: this.config.db_name }).connect();
      const serverVersion = await this.database.serverVersion();
      this.state = {
        status: "ready",
        mode,
        endpoint: redactMongoUri(uri),
        database: this.config.db_name,
        version: serverVersion,
        message: mode === "managed" ? "Managed local MongoDB is ready." : "External MongoDB is connected."
      };
      return this;
    } catch (error) {
      this.state = { ...this.state, status: "error", message: error.message };
      await this.stop().catch(() => undefined);
      throw error;
    }
  }

  status() {
    return { ...this.state };
  }

  async testExternal(uri, dbName = this.config?.db_name || "minipmdb") {
    return testMongoConnection(uri, dbName);
  }

  async configure(input) {
    const config = await saveRuntimeConfig(input, this.home);
    return { config: { ...config, external_uri: redactMongoUri(config.external_uri) }, restart_required: true };
  }

  async stop() {
    if (this.database) {
      await this.database.close().catch(() => undefined);
      this.database = null;
    }
    if (this.managed) {
      await this.managed.stop({ doCleanup: false, force: false }).catch(() => undefined);
      this.managed = null;
    }
  }
}
