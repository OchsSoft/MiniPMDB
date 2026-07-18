import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { auditSnapshot } from "./audit.js";
import { CANDIDATE_STATUSES, MEMORY_STATUSES, TOUCHPOINT_KINDS, TOUCHPOINT_STATUSES, assertEnum } from "./constants.js";
import { buildContextPack } from "./context.js";
import {
  normalizeMemory,
  normalizeProject,
  normalizeSnapshot,
  normalizeSource,
  normalizeTouchpoint
} from "./schema.js";

export class MiniPMDBService {
  constructor({ database, actor = "human" }) {
    if (!database) throw new Error("MiniPMDBService requires a connected database.");
    this.database = database;
    this.actor = actor;
  }

  snapshot() {
    return this.database.snapshot();
  }

  replaceSnapshot(value) {
    return this.database.replaceSnapshot(value);
  }

  async registerProject(input) {
    const now = new Date().toISOString();
    const repoPath = input.repo_path ? path.resolve(input.repo_path) : "";
    const repoRoot = repoPath ? await canonicalPath(repoPath) : "";
    const existing = await this.database.collection("projects").findOne({ key: String(input.key || "").toLowerCase() });
    const project = normalizeProject({
      id: existing?.id || `project-${String(input.key || "").toLowerCase()}`,
      key: input.key,
      name: input.name,
      repo_path: repoPath,
      repo_root: repoRoot,
      status: input.status || "active",
      tags: list(input.tags),
      created_at: existing?.created_at || now,
      updated_at: now
    });
    await this.database.collection("projects").replaceOne({ key: project.key }, project, { upsert: true });
    return project;
  }

  async resolveProject(repoPath) {
    const repoRoot = await canonicalPath(repoPath);
    const project = await this.database.collection("projects").findOne({ repo_root: repoRoot }, { projection: { _id: 0 } });
    if (!project) throw new Error(`No MiniPMDB project is registered for ${repoPath}.`);
    return project;
  }

  async listMemories({ project_key, status } = {}) {
    const filter = {};
    if (project_key) filter.project_key = project_key;
    if (status) filter.status = status;
    return this.database.collection("memories").find(filter, { projection: { _id: 0 } }).sort({ updated_at: -1 }).toArray();
  }

  async remember(input, { reviewFirst = true, projectScope = "" } = {}) {
    const projectKey = input.project_key || projectScope;
    if (!projectKey) throw new Error("project_key is required.");
    if (projectScope && projectKey !== projectScope) throw new Error(`Project-draft is scoped to ${projectScope}.`);
    await this.requireProject(projectKey);
    const now = new Date().toISOString();
    const status = reviewFirst ? "unreviewed" : assertEnum(input.status || "unreviewed", MEMORY_STATUSES, "memory.status");
    const memory = normalizeMemory({
      id: input.id || `mem-${randomUUID()}`,
      project_key: projectKey,
      kind: input.kind || "note",
      status,
      confidence: input.confidence || "unknown",
      title: input.title,
      body: input.body,
      tags: list(input.tags),
      source_ids: list(input.source_ids),
      critical: input.critical,
      created_at: now,
      updated_at: now,
      metadata: {
        ...(input.metadata || {}),
        review_state: status === "unreviewed" || status === "draft" ? "unreviewed" : "reviewed",
        created_by: input.actor || this.actor
      }
    });
    await this.database.collection("memories").insertOne(memory);
    return memory;
  }

  async attachSource(memoryId, input, { candidateOnly = false, projectScope = "" } = {}) {
    const memories = this.database.collection("memories");
    const memory = await memories.findOne({ id: memoryId }, { projection: { _id: 0 } });
    if (!memory) throw new Error(`Memory not found: ${memoryId}.`);
    if (projectScope && memory.project_key !== projectScope) throw new Error(`Project-draft cannot attach evidence outside ${projectScope}.`);
    if (candidateOnly && !CANDIDATE_STATUSES.has(memory.status)) throw new Error("Evidence can only be attached to a draft or unreviewed candidate in project-draft mode.");
    const source = normalizeSource({
      id: input.id || `src-${randomUUID()}`,
      project_key: memory.project_key,
      type: input.type || "doc",
      label: input.label,
      ref: input.ref,
      created_at: new Date().toISOString()
    });
    await this.database.collection("sources").insertOne(source);
    await memories.updateOne({ id: memoryId }, { $addToSet: { source_ids: source.id }, $set: { updated_at: new Date().toISOString() } });
    return { source, memory: await memories.findOne({ id: memoryId }, { projection: { _id: 0 } }) };
  }

  async review(memoryId, { status = "reviewed", reviewer = "human", note = "" } = {}) {
    if (!["reviewed", "current", "rejected", "archived"].includes(status)) throw new Error("Review status must be reviewed, current, rejected, or archived.");
    const result = await this.database.collection("memories").findOneAndUpdate(
      { id: memoryId },
      { $set: { status, updated_at: new Date().toISOString(), "metadata.review_state": status === "rejected" ? "rejected" : "reviewed", "metadata.reviewed_by": reviewer, "metadata.review_note": note } },
      { returnDocument: "after", projection: { _id: 0 } }
    );
    if (!result) throw new Error(`Memory not found: ${memoryId}.`);
    return result;
  }

  async supersede(oldId, replacementId, reason = "") {
    const collection = this.database.collection("memories");
    const [oldMemory, replacement] = await Promise.all([collection.findOne({ id: oldId }), collection.findOne({ id: replacementId })]);
    if (!oldMemory || !replacement) throw new Error("Both superseded and replacement memories must exist.");
    const now = new Date().toISOString();
    await collection.updateOne({ id: oldId }, { $set: { status: "superseded", updated_at: now, "metadata.superseded_by": replacementId, "metadata.supersession_reason": reason } });
    const link = { id: `link-${randomUUID()}`, relationship: "supersedes", from: replacementId, to: oldId, reason, status: "current", resolution_memory_id: "", created_at: now, updated_at: now };
    await this.database.collection("links").insertOne(link);
    return { old_memory: await collection.findOne({ id: oldId }, { projection: { _id: 0 } }), replacement, link };
  }

  async upsertTouchpoint(input) {
    const now = new Date().toISOString();
    const id = input.id || `touch-${slugify(input.name)}`;
    const existing = await this.database.collection("touchpoints").findOne({ id });
    const touchpoint = normalizeTouchpoint({
      id,
      name: input.name,
      projects: list(input.projects),
      kind: assertEnum(input.kind || "other", TOUCHPOINT_KINDS, "touchpoint.kind"),
      status: assertEnum(input.status || "active", TOUCHPOINT_STATUSES, "touchpoint.status"),
      summary: input.summary || "",
      memory_ids: list(input.memory_ids),
      tags: list(input.tags),
      last_verified_at: input.last_verified_at || now,
      created_at: existing?.created_at || now,
      updated_at: now
    });
    await this.validateTouchpointReferences(touchpoint);
    await this.database.collection("touchpoints").replaceOne({ id }, touchpoint, { upsert: true });
    return touchpoint;
  }

  async listTouchpoints({ project_key, status } = {}) {
    const filter = {};
    if (project_key) filter.projects = project_key;
    if (status) filter.status = status;
    return this.database.collection("touchpoints").find(filter, { projection: { _id: 0 } }).sort({ updated_at: -1 }).toArray();
  }

  async context(input) {
    return buildContextPack(await this.snapshot(), {
      projectKey: input.project_key || input.project,
      task: input.task,
      profile: input.profile,
      maxChars: input.max_chars || input.maxChars
    });
  }

  async audit(input = {}) {
    return auditSnapshot(await this.snapshot(), { strict: Boolean(input.strict), projectKey: input.project_key || input.project || "" });
  }

  async applyDemoFix() {
    const existing = await this.database.collection("memories").findOne({ id: "mem-release-resolution" });
    if (!existing) {
      await this.database.collection("memories").insertOne(normalizeMemory({
        id: "mem-release-resolution",
        project_key: "paper-crane-cli",
        kind: "decision",
        status: "reviewed",
        confidence: "high",
        title: "Resolve the shared release authentication contract",
        body: "Paper Crane and Release Relay use short-lived OIDC identity; a long-lived registry token is prohibited.",
        tags: ["release", "oidc", "touchpoint"],
        source_ids: ["src-workflow"],
        critical: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: { review_state: "reviewed", reviewed_by: "demo-maintainer" }
      }));
    }
    const now = new Date().toISOString();
    await this.database.collection("memories").updateOne({ id: "mem-registry-token" }, { $set: { status: "superseded", updated_at: now, "metadata.superseded_by": "mem-release-resolution" } });
    await this.database.collection("links").updateOne({ id: "link-auth-conflict" }, { $set: { status: "resolved", resolution_memory_id: "mem-release-resolution", updated_at: now } });
    await this.database.collection("links").updateOne(
      { id: "link-resolution-supersedes-token" },
      { $setOnInsert: { id: "link-resolution-supersedes-token", relationship: "supersedes", from: "mem-release-resolution", to: "mem-registry-token", reason: "Reviewed shared contract", status: "current", resolution_memory_id: "", created_at: now, updated_at: now } },
      { upsert: true }
    );
    await this.database.collection("touchpoints").updateOne({ id: "touch-release-auth" }, { $set: { status: "active", memory_ids: ["mem-release-resolution", "mem-relay-oidc"], updated_at: now, last_verified_at: now } });
    return this.snapshot();
  }

  async validateTouchpointReferences(touchpoint) {
    if (touchpoint.projects.length < 2) throw new Error("A touchpoint must connect at least two projects.");
    const projectCount = await this.database.collection("projects").countDocuments({ key: { $in: touchpoint.projects } });
    if (projectCount !== touchpoint.projects.length) throw new Error("Every touchpoint project must be registered.");
    const memories = await this.database.collection("memories").find({ id: { $in: touchpoint.memory_ids } }, { projection: { _id: 0, id: 1, project_key: 1 } }).toArray();
    if (memories.length !== touchpoint.memory_ids.length) throw new Error("Every touchpoint memory must exist.");
    const wrong = memories.find((memory) => !touchpoint.projects.includes(memory.project_key));
    if (wrong) throw new Error(`Touchpoint memory ${wrong.id} belongs to non-participant ${wrong.project_key}.`);
  }

  async requireProject(projectKey) {
    const project = await this.database.collection("projects").findOne({ key: projectKey }, { projection: { _id: 0 } });
    if (!project) throw new Error(`Project not found: ${projectKey}.`);
    return project;
  }
}

export async function loadSnapshotFile(filePath) {
  return normalizeSnapshot(JSON.parse(await fs.readFile(filePath, "utf8")));
}

async function canonicalPath(value) {
  const resolved = path.resolve(value);
  const real = await fs.realpath(resolved).catch(() => resolved);
  return process.platform === "win32" ? real.toLowerCase() : real;
}

function list(value) {
  if (Array.isArray(value)) return [...new Set(value.map(String).map((item) => item.trim()).filter(Boolean))];
  return [...new Set(String(value || "").split(",").map((item) => item.trim()).filter(Boolean))];
}

function slugify(value) {
  return String(value || "touchpoint").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);
}
