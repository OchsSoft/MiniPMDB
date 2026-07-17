import {
  ACTIVE_STATUSES,
  EXCLUDED_STATUSES,
  WARNING_STATUSES,
  resolveProfile
} from "./constants.js";
import { normalizeStore } from "./schema.js";

const STATUS_SCORE = {
  reviewed: 40,
  current: 34,
  open: 30,
  resolved: 18,
  unreviewed: 4,
  draft: 2,
  stale: -8,
  superseded: -14
};

export function buildContextPack(storeValue, { task = "", profile = "balanced", maxChars } = {}) {
  const store = normalizeStore(storeValue);
  const policy = resolveProfile(profile);
  if (maxChars !== undefined) {
    const parsed = Number(maxChars);
    if (!Number.isInteger(parsed) || parsed < 500) {
      throw new Error("maxChars must be an integer of at least 500.");
    }
    policy.max_chars = parsed;
  }

  const terms = tokenize(task);
  const sourceById = new Map(store.sources.map((source) => [source.id, source]));
  const ranked = store.memories
    .filter((memory) => !EXCLUDED_STATUSES.has(memory.status))
    .map((memory) => ({ ...memory, score: scoreMemory(memory, terms) }))
    .sort(compareMemories);
  const active = ranked.filter(isGovernedActive);
  const warnings = ranked.filter((memory) => isWarning(memory) || isReviewMismatch(memory));
  const criticalWarnings = warnings.filter((memory) => isCriticalWarning(memory, store.links));
  const otherWarnings = warnings.filter((memory) => !criticalWarnings.some((item) => item.id === memory.id));

  const header = [
    "# MiniPMDB Context",
    `Project: ${store.project.name} (${store.project.key})`,
    `Task: ${task || "(not specified)"}`,
    `Profile: ${policy.name} — ${policy.description}`,
    ""
  ].join("\n");
  const selected = [];
  let used = header.length;

  for (const memory of [...criticalWarnings, ...active, ...otherWarnings.slice(0, policy.warning_limit)]) {
    if (selected.some((item) => item.id === memory.id)) {
      continue;
    }
    const line = formatMemory(memory, sourceById, policy.body_chars, isGovernedActive(memory) ? "ACTIVE" : "WARNING");
    if (used + line.length + 1 <= policy.max_chars) {
      selected.push({ memory, line });
      used += line.length + 1;
    }
  }

  const selectedIds = new Set(selected.map((item) => item.memory.id));
  const selectedActive = active.filter((memory) => selectedIds.has(memory.id));
  const selectedWarnings = warnings.filter((memory) => selectedIds.has(memory.id));
  const pack = formatPack(header, selected, selectedActive, selectedWarnings);
  const omittedCritical = criticalWarnings.filter((memory) => !selectedIds.has(memory.id)).map((memory) => memory.id);

  return {
    project: store.project,
    task,
    profile: policy.name,
    active: selectedActive,
    warnings: selectedWarnings,
    context_pack: pack,
    context_selection: {
      profile: policy.name,
      candidate_count: store.memories.length,
      selected_count: selected.length,
      active_count: selectedActive.length,
      warning_count: selectedWarnings.length,
      max_chars: policy.max_chars,
      actual_chars: pack.length,
      dropped_count: ranked.length - selected.length,
      omitted_critical_warning_ids: omittedCritical
    }
  };
}

export function isGovernedActive(memory) {
  return ACTIVE_STATUSES.has(memory.status) && !isReviewMismatch(memory);
}

export function isReviewMismatch(memory) {
  return String(memory.metadata?.review_state || "").toLowerCase() === "unreviewed";
}

function isWarning(memory) {
  return WARNING_STATUSES.has(memory.status);
}

function isCriticalWarning(memory, links) {
  if (memory.critical) {
    return true;
  }
  return links.some(
    (link) =>
      [link.from, link.to].includes(memory.id) &&
      ["conflicts_with", "supersedes"].includes(link.relationship)
  );
}

function scoreMemory(memory, terms) {
  let score = STATUS_SCORE[memory.status] || 0;
  if (memory.kind === "constraint") score += 22;
  if (memory.kind === "decision") score += 16;
  if (["risk", "todo"].includes(memory.kind)) score += 12;
  if (memory.confidence === "high") score += 8;
  if (memory.source_ids.length) score += 8;
  const haystack = `${memory.title} ${memory.body} ${memory.tags.join(" ")}`.toLowerCase();
  score += terms.filter((term) => haystack.includes(term)).length * 12;
  return score;
}

function compareMemories(left, right) {
  return right.score - left.score || right.updated_at.localeCompare(left.updated_at) || left.id.localeCompare(right.id);
}

function formatMemory(memory, sourceById, bodyChars, label) {
  const body = truncate(memory.body, bodyChars);
  const refs = memory.source_ids
    .map((id) => sourceById.get(id))
    .filter(Boolean)
    .map((source) => source.ref);
  const evidence = refs.length ? ` sources=${refs.join(", ")}` : " sources=none";
  return `- [${label}] ${memory.id} | ${memory.kind}/${memory.status}/${memory.confidence} | ${memory.title}: ${body} |${evidence}`;
}

function formatPack(header, selected, selectedActive, selectedWarnings) {
  const lines = [header.trimEnd(), "", "## Active project truth"];
  const activeIds = new Set(selectedActive.map((memory) => memory.id));
  const warningIds = new Set(selectedWarnings.map((memory) => memory.id));
  const activeLines = selected.filter((item) => activeIds.has(item.memory.id)).map((item) => item.line);
  lines.push(...(activeLines.length ? activeLines : ["- None selected."]));
  lines.push("", "## Warnings and history");
  const warningLines = selected.filter((item) => warningIds.has(item.memory.id)).map((item) => item.line);
  lines.push(...(warningLines.length ? warningLines : ["- None selected."]));
  return lines.join("\n");
}

function truncate(value, max) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length <= max ? text : `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

function tokenize(value) {
  return [...new Set(String(value || "").toLowerCase().split(/[^a-z0-9_-]+/).filter((term) => term.length > 2))];
}
