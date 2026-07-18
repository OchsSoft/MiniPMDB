export const SNAPSHOT_VERSION = 2;
export const MANAGED_MONGODB_VERSION = "8.2.6";
export const DEFAULT_API_URL = "http://127.0.0.1:8797";

export const COLLECTION_NAMES = ["projects", "memories", "sources", "links", "touchpoints"];

export const MEMORY_KINDS = [
  "decision",
  "constraint",
  "pattern",
  "bug",
  "integration",
  "todo",
  "note",
  "command",
  "environment",
  "risk"
];

export const MEMORY_STATUSES = [
  "draft",
  "unreviewed",
  "current",
  "reviewed",
  "open",
  "resolved",
  "stale",
  "superseded",
  "archived",
  "rejected"
];

export const ACTIVE_STATUSES = new Set(["current", "reviewed", "open", "resolved"]);
export const WARNING_STATUSES = new Set(["draft", "unreviewed", "stale", "superseded"]);
export const EXCLUDED_STATUSES = new Set(["archived", "rejected"]);
export const CANDIDATE_STATUSES = new Set(["draft", "unreviewed"]);
export const CONFIDENCE_LEVELS = ["high", "medium", "low", "unknown"];
export const LINK_RELATIONSHIPS = ["supersedes", "conflicts_with", "supports"];
export const TOUCHPOINT_KINDS = [
  "api-contract",
  "shared-library",
  "data-contract",
  "workflow",
  "deployment",
  "other"
];
export const TOUCHPOINT_STATUSES = ["active", "stale", "broken", "planned", "archived"];

export const CONTEXT_PROFILES = {
  drift_guard: {
    name: "drift_guard",
    description: "Maximum governance context and warning visibility.",
    max_chars: 12_000,
    warning_limit: 12,
    body_chars: 420,
    touchpoint_limit: 8,
    cross_project_limit: 10
  },
  balanced: {
    name: "balanced",
    description: "A practical default for coding-agent work.",
    max_chars: 7_000,
    warning_limit: 8,
    body_chars: 280,
    touchpoint_limit: 5,
    cross_project_limit: 6
  },
  compact: {
    name: "compact",
    description: "A small pack that still preserves critical warnings.",
    max_chars: 3_500,
    warning_limit: 4,
    body_chars: 160,
    touchpoint_limit: 3,
    cross_project_limit: 4
  }
};

export function resolveProfile(name = "balanced") {
  const aliases = { default: "balanced", token_saver: "compact", token: "compact", drift: "drift_guard" };
  const normalized = String(name || "balanced").trim().toLowerCase().replace(/[-\s]+/g, "_");
  const profile = CONTEXT_PROFILES[aliases[normalized] || normalized];
  if (!profile) throw new Error(`Unknown context profile: ${name}`);
  return { ...profile };
}

export function assertEnum(value, allowed, field) {
  if (!allowed.includes(value)) throw new Error(`${field} must be one of: ${allowed.join(", ")}.`);
  return value;
}
