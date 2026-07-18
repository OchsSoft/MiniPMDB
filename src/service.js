import { randomUUID } from "node:crypto";
import { auditStore } from "./audit.js";
import { MEMORY_KINDS, MEMORY_STATUSES, assertEnum } from "./constants.js";
import { buildContextPack } from "./context.js";
import { JsonStore } from "./store.js";

export class MiniPMDBService {
  constructor({ storePath } = {}) {
    this.store = new JsonStore(storePath);
  }

  init(input = {}) {
    return this.store.read({ create: true, projectKey: input.projectKey, projectName: input.projectName });
  }

  read() {
    return this.store.read();
  }

  async audit(options = {}) {
    return auditStore(await this.read(), options);
  }

  async context(options = {}) {
    return buildContextPack(await this.read(), options);
  }

  async remember(input, { reviewFirst = true } = {}) {
    return this.store.update((data) => {
      const now = new Date().toISOString();
      const requestedStatus = input.status || "unreviewed";
      const status = reviewFirst && !["draft", "unreviewed"].includes(requestedStatus)
        ? "unreviewed"
        : assertEnum(requestedStatus, MEMORY_STATUSES, "status");
      const memory = {
        id: input.id || `mem-${randomUUID()}`,
        kind: assertEnum(input.kind || "note", MEMORY_KINDS, "kind"),
        status,
        confidence: input.confidence || "unknown",
        title: input.title,
        body: input.body,
        tags: input.tags || [],
        source_ids: input.source_ids || [],
        critical: Boolean(input.critical),
        created_at: now,
        updated_at: now,
        metadata: {
          ...(input.metadata || {}),
          review_state: ["draft", "unreviewed"].includes(status) ? "unreviewed" : "reviewed"
        }
      };
      data.memories.push(memory);
      data.project.updated_at = now;
      return data;
    });
  }

  async attachSource(memoryId, input) {
    return this.store.update((data) => {
      const memory = findMemory(data, memoryId);
      const now = new Date().toISOString();
      const source = {
        id: input.id || `src-${randomUUID()}`,
        type: input.type || "doc",
        label: input.label,
        ref: input.ref,
        created_at: now
      };
      data.sources.push(source);
      memory.source_ids = [...new Set([...memory.source_ids, source.id])];
      memory.updated_at = now;
      data.project.updated_at = now;
      return data;
    });
  }

  async review(memoryId, { status = "reviewed", reviewer = "human", note = "" } = {}) {
    return this.store.update((data) => {
      const memory = findMemory(data, memoryId);
      const now = new Date().toISOString();
      memory.status = assertEnum(status, MEMORY_STATUSES, "status");
      memory.metadata = {
        ...memory.metadata,
        review_state: "reviewed",
        reviewed_by: reviewer,
        review_note: note,
        reviewed_at: now
      };
      memory.updated_at = now;
      data.project.updated_at = now;
      return data;
    });
  }

  async supersede(oldMemoryId, replacementMemoryId, { reason = "" } = {}) {
    return this.store.update((data) => {
      const oldMemory = findMemory(data, oldMemoryId);
      findMemory(data, replacementMemoryId);
      const now = new Date().toISOString();
      oldMemory.status = "superseded";
      oldMemory.metadata = { ...oldMemory.metadata, review_state: "reviewed" };
      oldMemory.updated_at = now;
      upsertLink(data, {
        id: `link-${replacementMemoryId}-supersedes-${oldMemoryId}`,
        relationship: "supersedes",
        from: replacementMemoryId,
        to: oldMemoryId,
        reason,
        status: "current",
        resolution_memory_id: "",
        created_at: now,
        updated_at: now
      });
      data.project.updated_at = now;
      return data;
    });
  }

  async resolveConflict(linkId, resolutionMemoryId) {
    return this.store.update((data) => {
      const link = data.links.find((item) => item.id === linkId && item.relationship === "conflicts_with");
      if (!link) throw new Error(`Conflict link not found: ${linkId}.`);
      findMemory(data, resolutionMemoryId);
      const now = new Date().toISOString();
      link.status = "resolved";
      link.resolution_memory_id = resolutionMemoryId;
      link.updated_at = now;
      data.project.updated_at = now;
      return data;
    });
  }
}

export function applyReleaseDemoFix(dataValue) {
  const data = structuredClone(dataValue);
  const now = new Date().toISOString();
  const oldMemory = findMemory(data, "mem-registry-token");
  const replacement = findMemory(data, "mem-oidc-release");
  oldMemory.status = "superseded";
  oldMemory.metadata = { ...oldMemory.metadata, review_state: "reviewed" };
  oldMemory.updated_at = now;
  let resolution = data.memories.find((memory) => memory.id === "mem-release-resolution");
  if (!resolution) {
    resolution = {
      id: "mem-release-resolution",
      kind: "decision",
      status: "reviewed",
      confidence: "high",
      title: "Release authentication conflict resolved",
      body: "The reviewed workflow and platform documentation establish OIDC as the release path; the token note is historical only.",
      tags: ["release", "security", "resolution"],
      source_ids: replacement.source_ids,
      critical: true,
      created_at: now,
      updated_at: now,
      metadata: { review_state: "reviewed", reviewed_by: "demo-maintainer", reviewed_at: now }
    };
    data.memories.push(resolution);
  }
  const conflict = data.links.find((link) => link.id === "link-release-auth-conflict");
  if (!conflict) throw new Error("Synthetic conflict link is missing.");
  conflict.status = "resolved";
  conflict.resolution_memory_id = resolution.id;
  conflict.updated_at = now;
  upsertLink(data, {
    id: "link-oidc-supersedes-token",
    relationship: "supersedes",
    from: replacement.id,
    to: oldMemory.id,
    reason: "Reviewed OIDC release decision supersedes the unsourced token note.",
    status: "current",
    resolution_memory_id: "",
    created_at: now,
    updated_at: now
  });
  data.project.updated_at = now;
  return data;
}

function findMemory(data, id) {
  const memory = data.memories.find((item) => item.id === id);
  if (!memory) throw new Error(`Memory not found: ${id}.`);
  return memory;
}

function upsertLink(data, link) {
  const index = data.links.findIndex((item) => item.id === link.id);
  if (index >= 0) data.links[index] = link;
  else data.links.push(link);
}
