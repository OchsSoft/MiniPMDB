import {
  CONFIDENCE_LEVELS,
  LINK_RELATIONSHIPS,
  MEMORY_KINDS,
  MEMORY_STATUSES,
  STORE_VERSION,
  assertEnum
} from "./constants.js";

export function createEmptyStore({ projectKey = "demo-project", projectName = "Demo project", now } = {}) {
  const timestamp = now || new Date().toISOString();
  return {
    version: STORE_VERSION,
    project: {
      key: cleanRequired(projectKey, "project.key", 120),
      name: cleanRequired(projectName, "project.name", 160),
      created_at: timestamp,
      updated_at: timestamp
    },
    memories: [],
    sources: [],
    links: []
  };
}

export function normalizeStore(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("MiniPMDB store must be a JSON object.");
  }
  if (Number(value.version) !== STORE_VERSION) {
    throw new Error(`Unsupported MiniPMDB store version: ${value.version}.`);
  }
  const project = normalizeProject(value.project);
  const memories = array(value.memories, "memories").map(normalizeMemory);
  const sources = array(value.sources, "sources").map(normalizeSource);
  const links = array(value.links, "links").map(normalizeLink);
  assertUnique(memories, "memory");
  assertUnique(sources, "source");
  assertUnique(links, "link");
  return { version: STORE_VERSION, project, memories, sources, links };
}

export function normalizeMemory(value) {
  const memory = object(value, "memory");
  return {
    id: cleanRequired(memory.id, "memory.id", 160),
    kind: assertEnum(cleanRequired(memory.kind, "memory.kind", 40), MEMORY_KINDS, "memory.kind"),
    status: assertEnum(
      cleanRequired(memory.status, "memory.status", 40),
      MEMORY_STATUSES,
      "memory.status"
    ),
    confidence: assertEnum(
      cleanRequired(memory.confidence || "unknown", "memory.confidence", 40),
      CONFIDENCE_LEVELS,
      "memory.confidence"
    ),
    title: cleanRequired(memory.title, "memory.title", 240),
    body: cleanRequired(memory.body, "memory.body", 8_000),
    tags: stringArray(memory.tags, "memory.tags", 40),
    source_ids: stringArray(memory.source_ids, "memory.source_ids", 160),
    critical: Boolean(memory.critical),
    created_at: isoDate(memory.created_at, "memory.created_at"),
    updated_at: isoDate(memory.updated_at, "memory.updated_at"),
    metadata: plainMetadata(memory.metadata)
  };
}

export function normalizeSource(value) {
  const source = object(value, "source");
  return {
    id: cleanRequired(source.id, "source.id", 160),
    type: cleanRequired(source.type || "doc", "source.type", 40),
    label: cleanRequired(source.label, "source.label", 240),
    ref: cleanRequired(source.ref, "source.ref", 1_000),
    created_at: isoDate(source.created_at, "source.created_at")
  };
}

export function normalizeLink(value) {
  const link = object(value, "link");
  const relationship = assertEnum(
    cleanRequired(link.relationship, "link.relationship", 40),
    LINK_RELATIONSHIPS,
    "link.relationship"
  );
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

function normalizeProject(value) {
  const project = object(value, "project");
  return {
    key: cleanRequired(project.key, "project.key", 120),
    name: cleanRequired(project.name, "project.name", 160),
    created_at: isoDate(project.created_at, "project.created_at"),
    updated_at: isoDate(project.updated_at, "project.updated_at")
  };
}

function assertUnique(items, label) {
  const seen = new Set();
  for (const item of items) {
    if (seen.has(item.id)) {
      throw new Error(`Duplicate ${label} id: ${item.id}.`);
    }
    seen.add(item.id);
  }
}

function object(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${field} must be an object.`);
  }
  return value;
}

function array(value, field) {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new Error(`${field} must be an array.`);
  }
  return value;
}

function stringArray(value, field, maxLength) {
  return array(value, field).map((item) => cleanRequired(item, field, maxLength));
}

function cleanRequired(value, field, maxLength) {
  const output = cleanOptional(value, field, maxLength);
  if (!output) {
    throw new Error(`${field} is required.`);
  }
  return output;
}

function cleanOptional(value, field, maxLength) {
  if (value === undefined || value === null) {
    return "";
  }
  if (typeof value !== "string") {
    throw new Error(`${field} must be a string.`);
  }
  const output = value.trim();
  if (output.length > maxLength) {
    throw new Error(`${field} must be ${maxLength} characters or fewer.`);
  }
  return output;
}

function isoDate(value, field) {
  const input = cleanRequired(value, field, 80);
  const timestamp = new Date(input);
  if (Number.isNaN(timestamp.getTime())) {
    throw new Error(`${field} must be an ISO date.`);
  }
  return timestamp.toISOString();
}

function plainMetadata(value) {
  if (value === undefined) {
    return {};
  }
  const metadata = object(value, "memory.metadata");
  return JSON.parse(JSON.stringify(metadata));
}
