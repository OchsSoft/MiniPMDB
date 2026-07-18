import {
  COLLECTION_NAMES,
  CONFIDENCE_LEVELS,
  LINK_RELATIONSHIPS,
  MEMORY_KINDS,
  MEMORY_STATUSES,
  SNAPSHOT_VERSION,
  TOUCHPOINT_KINDS,
  TOUCHPOINT_STATUSES,
  assertEnum
} from "./constants.js";

export function createEmptySnapshot(now = new Date().toISOString()) {
  return {
    version: SNAPSHOT_VERSION,
    exported_at: isoDate(now, "exported_at"),
    projects: [],
    memories: [],
    sources: [],
    links: [],
    touchpoints: []
  };
}

export function normalizeSnapshot(value) {
  const snapshot = object(value, "snapshot");
  if (Number(snapshot.version) !== SNAPSHOT_VERSION) {
    throw new Error(`Unsupported MiniPMDB snapshot version: ${snapshot.version}.`);
  }
  const output = {
    version: SNAPSHOT_VERSION,
    exported_at: isoDate(snapshot.exported_at || new Date().toISOString(), "exported_at"),
    projects: array(snapshot.projects, "projects").map(normalizeProject),
    memories: array(snapshot.memories, "memories").map(normalizeMemory),
    sources: array(snapshot.sources, "sources").map(normalizeSource),
    links: array(snapshot.links, "links").map(normalizeLink),
    touchpoints: array(snapshot.touchpoints, "touchpoints").map(normalizeTouchpoint)
  };
  for (const name of COLLECTION_NAMES) assertUnique(output[name], name);
  return output;
}

export function normalizeProject(value) {
  const project = object(value, "project");
  return {
    id: cleanRequired(project.id || `project-${project.key}`, "project.id", 160),
    key: key(project.key, "project.key"),
    name: cleanRequired(project.name, "project.name", 160),
    repo_path: cleanOptional(project.repo_path, "project.repo_path", 1_000),
    repo_root: cleanOptional(project.repo_root || project.repo_path, "project.repo_root", 1_000),
    status: cleanOptional(project.status, "project.status", 40) || "active",
    tags: uniqueStrings(project.tags, "project.tags", 40),
    created_at: isoDate(project.created_at, "project.created_at"),
    updated_at: isoDate(project.updated_at || project.created_at, "project.updated_at")
  };
}

export function normalizeMemory(value) {
  const memory = object(value, "memory");
  return {
    id: cleanRequired(memory.id, "memory.id", 160),
    project_key: key(memory.project_key, "memory.project_key"),
    kind: assertEnum(cleanRequired(memory.kind, "memory.kind", 40), MEMORY_KINDS, "memory.kind"),
    status: assertEnum(cleanRequired(memory.status, "memory.status", 40), MEMORY_STATUSES, "memory.status"),
    confidence: assertEnum(cleanOptional(memory.confidence, "memory.confidence", 40) || "unknown", CONFIDENCE_LEVELS, "memory.confidence"),
    title: cleanRequired(memory.title, "memory.title", 240),
    body: cleanRequired(memory.body, "memory.body", 8_000),
    tags: uniqueStrings(memory.tags, "memory.tags", 40),
    source_ids: uniqueStrings(memory.source_ids, "memory.source_ids", 160),
    critical: Boolean(memory.critical),
    created_at: isoDate(memory.created_at, "memory.created_at"),
    updated_at: isoDate(memory.updated_at || memory.created_at, "memory.updated_at"),
    metadata: plainMetadata(memory.metadata)
  };
}

export function normalizeSource(value) {
  const source = object(value, "source");
  return {
    id: cleanRequired(source.id, "source.id", 160),
    project_key: key(source.project_key, "source.project_key"),
    type: cleanOptional(source.type, "source.type", 40) || "doc",
    label: cleanRequired(source.label, "source.label", 240),
    ref: cleanRequired(source.ref, "source.ref", 1_000),
    created_at: isoDate(source.created_at, "source.created_at")
  };
}

export function normalizeLink(value) {
  const link = object(value, "link");
  const relationship = assertEnum(cleanRequired(link.relationship, "link.relationship", 40), LINK_RELATIONSHIPS, "link.relationship");
  return {
    id: cleanRequired(link.id, "link.id", 160),
    relationship,
    from: cleanRequired(link.from, "link.from", 160),
    to: cleanRequired(link.to, "link.to", 160),
    reason: cleanOptional(link.reason, "link.reason", 1_000),
    status: cleanOptional(link.status, "link.status", 40) || (relationship === "conflicts_with" ? "open" : "current"),
    resolution_memory_id: cleanOptional(link.resolution_memory_id, "link.resolution_memory_id", 160),
    created_at: isoDate(link.created_at, "link.created_at"),
    updated_at: isoDate(link.updated_at || link.created_at, "link.updated_at")
  };
}

export function normalizeTouchpoint(value) {
  const touchpoint = object(value, "touchpoint");
  return {
    id: cleanRequired(touchpoint.id, "touchpoint.id", 160),
    name: cleanRequired(touchpoint.name, "touchpoint.name", 240),
    projects: uniqueStrings(touchpoint.projects, "touchpoint.projects", 120),
    kind: assertEnum(cleanOptional(touchpoint.kind, "touchpoint.kind", 40) || "other", TOUCHPOINT_KINDS, "touchpoint.kind"),
    status: assertEnum(cleanOptional(touchpoint.status, "touchpoint.status", 40) || "active", TOUCHPOINT_STATUSES, "touchpoint.status"),
    summary: cleanOptional(touchpoint.summary, "touchpoint.summary", 2_000),
    memory_ids: uniqueStrings(touchpoint.memory_ids, "touchpoint.memory_ids", 160),
    tags: uniqueStrings(touchpoint.tags, "touchpoint.tags", 40),
    last_verified_at: touchpoint.last_verified_at ? isoDate(touchpoint.last_verified_at, "touchpoint.last_verified_at") : "",
    created_at: isoDate(touchpoint.created_at, "touchpoint.created_at"),
    updated_at: isoDate(touchpoint.updated_at || touchpoint.created_at, "touchpoint.updated_at")
  };
}

function assertUnique(items, label) {
  const seen = new Set();
  for (const item of items) {
    if (seen.has(item.id)) throw new Error(`Duplicate ${label} id: ${item.id}.`);
    seen.add(item.id);
  }
}

function object(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${field} must be an object.`);
  return value;
}

function array(value, field) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error(`${field} must be an array.`);
  return value;
}

function uniqueStrings(value, field, maxLength) {
  return [...new Set(array(value, field).map((item) => cleanRequired(item, field, maxLength)))];
}

function key(value, field) {
  const output = cleanRequired(value, field, 120).toLowerCase();
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(output)) throw new Error(`${field} must be a lowercase project key.`);
  return output;
}

function cleanRequired(value, field, maxLength) {
  const output = cleanOptional(value, field, maxLength);
  if (!output) throw new Error(`${field} is required.`);
  return output;
}

function cleanOptional(value, field, maxLength) {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") throw new Error(`${field} must be a string.`);
  const output = value.trim();
  if (output.length > maxLength) throw new Error(`${field} must be ${maxLength} characters or fewer.`);
  return output;
}

function isoDate(value, field) {
  const input = cleanRequired(value, field, 80);
  const timestamp = new Date(input);
  if (Number.isNaN(timestamp.getTime())) throw new Error(`${field} must be an ISO date.`);
  return timestamp.toISOString();
}

function plainMetadata(value) {
  if (value === undefined) return {};
  return JSON.parse(JSON.stringify(object(value, "memory.metadata")));
}
