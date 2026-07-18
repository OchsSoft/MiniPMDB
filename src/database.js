import { MongoClient } from "mongodb";
import { COLLECTION_NAMES } from "./constants.js";
import { normalizeSnapshot } from "./schema.js";

const validators = {
  projects: schema(["id", "key", "name", "status", "created_at", "updated_at"], {
    id: { bsonType: "string" }, key: { bsonType: "string" }, name: { bsonType: "string" },
    repo_path: { bsonType: "string" }, repo_root: { bsonType: "string" }, status: { bsonType: "string" },
    tags: stringArray(), created_at: { bsonType: "string" }, updated_at: { bsonType: "string" }
  }),
  memories: schema(["id", "project_key", "kind", "status", "title", "body", "created_at", "updated_at"], {
    id: { bsonType: "string" }, project_key: { bsonType: "string" }, kind: { bsonType: "string" },
    status: { bsonType: "string" }, confidence: { bsonType: "string" }, title: { bsonType: "string" },
    body: { bsonType: "string" }, tags: stringArray(), source_ids: stringArray(), critical: { bsonType: "bool" },
    metadata: { bsonType: "object" }, created_at: { bsonType: "string" }, updated_at: { bsonType: "string" }
  }),
  sources: schema(["id", "project_key", "type", "label", "ref", "created_at"], {
    id: { bsonType: "string" }, project_key: { bsonType: "string" }, type: { bsonType: "string" },
    label: { bsonType: "string" }, ref: { bsonType: "string" }, created_at: { bsonType: "string" }
  }),
  links: schema(["id", "relationship", "from", "to", "status", "created_at", "updated_at"], {
    id: { bsonType: "string" }, relationship: { bsonType: "string" }, from: { bsonType: "string" },
    to: { bsonType: "string" }, reason: { bsonType: "string" }, status: { bsonType: "string" },
    resolution_memory_id: { bsonType: "string" }, created_at: { bsonType: "string" }, updated_at: { bsonType: "string" }
  }),
  touchpoints: schema(["id", "name", "projects", "kind", "status", "created_at", "updated_at"], {
    id: { bsonType: "string" }, name: { bsonType: "string" }, projects: stringArray(), kind: { bsonType: "string" },
    status: { bsonType: "string" }, summary: { bsonType: "string" }, memory_ids: stringArray(), tags: stringArray(),
    last_verified_at: { bsonType: "string" }, created_at: { bsonType: "string" }, updated_at: { bsonType: "string" }
  })
};

export class MiniPMDBDatabase {
  constructor({ uri, dbName = "minipmdb" }) {
    this.uri = uri;
    this.dbName = dbName;
    this.client = new MongoClient(uri, { serverSelectionTimeoutMS: 3_000 });
  }

  async connect() {
    await this.client.connect();
    this.db = this.client.db(this.dbName);
    await initDatabase(this.db);
    return this;
  }

  async close() {
    await this.client.close();
  }

  async serverVersion() {
    const info = await this.db.admin().command({ buildInfo: 1 });
    return String(info.version || "unknown");
  }

  collection(name) {
    if (!COLLECTION_NAMES.includes(name)) throw new Error(`Unknown collection: ${name}`);
    return this.db.collection(name);
  }

  async snapshot() {
    const entries = await Promise.all(COLLECTION_NAMES.map(async (name) => [name, await this.collection(name).find({}, { projection: { _id: 0 } }).toArray()]));
    return normalizeSnapshot({ version: 2, exported_at: new Date().toISOString(), ...Object.fromEntries(entries) });
  }

  async replaceSnapshot(value) {
    const snapshot = normalizeSnapshot(value);
    for (const name of COLLECTION_NAMES) {
      const collection = this.collection(name);
      await collection.deleteMany({});
      if (snapshot[name].length) await collection.insertMany(snapshot[name]);
    }
    return this.snapshot();
  }
}

export async function testMongoConnection(uri, dbName = "minipmdb") {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5_000 });
  try {
    await client.connect();
    await client.db(dbName).command({ ping: 1 });
    return { ok: true, endpoint: redactMongoUri(uri), database: dbName };
  } finally {
    await client.close();
  }
}

export function redactMongoUri(uri) {
  try {
    const parsed = new URL(uri);
    if (parsed.username || parsed.password) {
      parsed.username = "***";
      parsed.password = "***";
    }
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return "invalid MongoDB URI";
  }
}

async function initDatabase(db) {
  const existing = new Set((await db.listCollections().toArray()).map((item) => item.name));
  for (const name of COLLECTION_NAMES) {
    if (!existing.has(name)) {
      await db.createCollection(name, { validator: validators[name], validationLevel: "moderate", validationAction: "error" });
    } else {
      await db.command({ collMod: name, validator: validators[name], validationLevel: "moderate", validationAction: "error" });
    }
  }
  const projectIndexes = await db.collection("projects").indexes();
  const legacyRepoRootIndex = projectIndexes.find((index) => index.name === "repo_root_1" && index.unique);
  if (legacyRepoRootIndex) await db.collection("projects").dropIndex(legacyRepoRootIndex.name);
  await Promise.all([
    db.collection("projects").createIndex({ id: 1 }, { unique: true }),
    db.collection("projects").createIndex({ key: 1 }, { unique: true }),
    db.collection("projects").createIndex(
      { repo_root: 1 },
      { name: "repo_root_unique_nonempty", unique: true, partialFilterExpression: { repo_root: { $gt: "" } } }
    ),
    db.collection("memories").createIndex({ id: 1 }, { unique: true }),
    db.collection("memories").createIndex({ project_key: 1, status: 1, updated_at: -1 }),
    db.collection("sources").createIndex({ id: 1 }, { unique: true }),
    db.collection("sources").createIndex({ project_key: 1 }),
    db.collection("links").createIndex({ id: 1 }, { unique: true }),
    db.collection("links").createIndex({ from: 1, to: 1 }),
    db.collection("touchpoints").createIndex({ id: 1 }, { unique: true }),
    db.collection("touchpoints").createIndex({ projects: 1, status: 1, updated_at: -1 })
  ]);
}

function schema(required, properties) {
  return { $jsonSchema: { bsonType: "object", required, properties } };
}

function stringArray() {
  return { bsonType: "array", items: { bsonType: "string" } };
}
