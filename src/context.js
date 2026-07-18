import { ACTIVE_STATUSES, EXCLUDED_STATUSES, WARNING_STATUSES, resolveProfile } from "./constants.js";
import { normalizeSnapshot } from "./schema.js";

export function buildContextPack(snapshotValue, { projectKey, task = "", profile = "balanced", maxChars } = {}) {
  const snapshot = normalizeSnapshot(snapshotValue);
  const project = snapshot.projects.find((item) => item.key === projectKey);
  if (!project) throw new Error(`Project not found: ${projectKey}.`);
  const policy = resolveProfile(profile);
  if (maxChars) policy.max_chars = Math.max(500, Number(maxChars));
  const terms = tokenize(task);
  const links = snapshot.links;
  const own = snapshot.memories.filter((item) => item.project_key === projectKey && !EXCLUDED_STATUSES.has(item.status));
  const touchpoints = snapshot.touchpoints
    .filter((item) => item.projects.includes(projectKey) && item.status !== "archived")
    .map((item) => ({ ...item, score: scoreTouchpoint(item, terms) }))
    .sort(compareScore);
  const linkedIds = new Set(touchpoints.flatMap((item) => item.memory_ids));
  const cross = snapshot.memories.filter((item) => item.project_key !== projectKey && linkedIds.has(item.id) && !EXCLUDED_STATUSES.has(item.status));
  const rankedOwn = own.map((item) => ({ ...item, score: scoreMemory(item, terms, links) })).sort(compareScore);
  const rankedCross = cross.map((item) => ({ ...item, score: scoreMemory(item, terms, links) + 18 })).sort(compareScore);
  const criticalWarnings = rankedOwn.filter((item) => isCriticalWarning(item, links));
  const active = rankedOwn.filter(isGovernedActive);
  const warnings = rankedOwn.filter(isWarningMemory);
  const selectedWarnings = uniqueById([...criticalWarnings, ...warnings]).slice(0, Math.max(policy.warning_limit, criticalWarnings.length));
  const selectedActive = active.slice(0, 12);
  const selectedTouchpoints = takeRequiredFirst(touchpoints, policy.touchpoint_limit, (item) => item.status === "broken");
  const selectedCross = takeRequiredFirst(rankedCross, policy.cross_project_limit, (item) => isCriticalWarning(item, links));

  const sections = [
    ["Active project truth", selectedActive.map((item) => formatMemory(item, snapshot.sources, policy.body_chars, "ACTIVE"))],
    ["Cross-project touchpoint context", selectedCross.map((item) => formatMemory(item, snapshot.sources, policy.body_chars, `PROJECT ${item.project_key}${isWarningMemory(item) ? " WARNING" : ""}`))],
    ["Warnings and history", selectedWarnings.map((item) => formatMemory(item, snapshot.sources, policy.body_chars, "WARNING"))],
    ["Project touchpoints", selectedTouchpoints.map((item) => formatTouchpoint(item, snapshot.memories, policy.body_chars))]
  ];
  const header = `# MiniPMDB Context\nProject: ${project.name} (${project.key})\nTask: ${task || "general project work"}\nProfile: ${policy.name}`;
  let pack = render(header, sections);
  while (pack.length > policy.max_chars && trimOptional(sections, selectedWarnings, criticalWarnings, selectedTouchpoints)) pack = render(header, sections);
  if (pack.length > policy.max_chars) pack = pack.slice(0, policy.max_chars - 16) + "\n[TRUNCATED]\n";

  const selectedWarningIds = new Set(selectedWarnings.map((item) => item.id));
  const selectedTouchpointIds = new Set(selectedTouchpoints.map((item) => item.id));
  return {
    project,
    task,
    profile: policy.name,
    active: selectedActive,
    cross_project_memories: selectedCross,
    warnings: selectedWarnings,
    touchpoints: selectedTouchpoints,
    context_pack: pack,
    context_selection: {
      profile: policy.name,
      max_chars: policy.max_chars,
      actual_chars: pack.length,
      active_count: selectedActive.length,
      cross_project_count: selectedCross.length,
      warning_count: selectedWarnings.length,
      touchpoint_count: selectedTouchpoints.length,
      omitted_critical_warning_ids: criticalWarnings.filter((item) => !selectedWarningIds.has(item.id)).map((item) => item.id),
      omitted_broken_touchpoint_ids: touchpoints.filter((item) => item.status === "broken" && !selectedTouchpointIds.has(item.id)).map((item) => item.id)
    }
  };
}

function trimOptional(sections, selectedWarnings, criticalWarnings, selectedTouchpoints) {
  const criticalIds = new Set(criticalWarnings.map((item) => item.id));
  if (sections[0][1].length > 1) return Boolean(sections[0][1].pop());
  if (sections[1][1].length > 1) return Boolean(sections[1][1].pop());
  const removableWarning = selectedWarnings.findLastIndex((item) => !criticalIds.has(item.id));
  if (removableWarning >= 0) {
    selectedWarnings.splice(removableWarning, 1);
    sections[2][1].splice(removableWarning, 1);
    return true;
  }
  const removableTouchpoint = selectedTouchpoints.findLastIndex((item) => item.status !== "broken");
  if (removableTouchpoint >= 0) {
    selectedTouchpoints.splice(removableTouchpoint, 1);
    sections[3][1].splice(removableTouchpoint, 1);
    return true;
  }
  return false;
}

function render(header, sections) {
  const lines = [header];
  for (const [title, values] of sections) lines.push("", `## ${title}`, ...(values.length ? values : ["- None selected."]));
  return lines.join("\n");
}

function formatMemory(memory, sources, bodyChars, label) {
  const refs = memory.source_ids.map((id) => sources.find((item) => item.id === id)?.ref).filter(Boolean);
  const evidence = refs.length ? ` | sources=${refs.join(", ")}` : " | sources=none";
  return `- [${label}] ${memory.id} | ${memory.kind}/${memory.status}/${memory.confidence} | ${memory.title}: ${truncate(memory.body, bodyChars)}${evidence}`;
}

function formatTouchpoint(touchpoint, memories, bodyChars) {
  const refs = touchpoint.memory_ids.map((id) => {
    const memory = memories.find((item) => item.id === id);
    return memory ? `${memory.project_key}:${memory.id}:${memory.status}` : id;
  });
  return `- [TOUCHPOINT ${touchpoint.status.toUpperCase()}] ${touchpoint.id} | ${touchpoint.projects.join(" <-> ")} | ${touchpoint.name}: ${truncate(touchpoint.summary, bodyChars)} | memories=${refs.join(", ")}`;
}

function scoreMemory(memory, terms, links) {
  const status = { reviewed: 44, current: 42, open: 35, resolved: 32, unreviewed: 24, draft: 20, superseded: 14, stale: 12 }[memory.status] || 0;
  const text = `${memory.title} ${memory.body} ${memory.tags.join(" ")}`.toLowerCase();
  return status + terms.filter((term) => text.includes(term)).length * 12 + (memory.critical ? 35 : 0) + (isCriticalWarning(memory, links) ? 25 : 0);
}

function scoreTouchpoint(item, terms) {
  const text = `${item.name} ${item.summary} ${item.projects.join(" ")} ${item.tags.join(" ")}`.toLowerCase();
  return ({ broken: 60, active: 40, planned: 20, stale: 18 }[item.status] || 0) + terms.filter((term) => text.includes(term)).length * 12;
}

function isCriticalWarning(memory, links) {
  if (!isWarningMemory(memory)) return false;
  return memory.critical || links.some((link) => link.relationship === "conflicts_with" && link.status === "open" && [link.from, link.to].includes(memory.id));
}

function isWarningMemory(memory) {
  return WARNING_STATUSES.has(memory.status) || memory.metadata?.review_state === "unreviewed";
}

function isGovernedActive(memory) {
  return ACTIVE_STATUSES.has(memory.status) && memory.metadata?.review_state !== "unreviewed" && memory.metadata?.review_state !== "rejected";
}

function takeRequiredFirst(items, limit, required) {
  return uniqueById([...items.filter(required), ...items]).slice(0, Math.max(limit, items.filter(required).length));
}

function uniqueById(items) {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

function tokenize(value) {
  return [...new Set(String(value).toLowerCase().match(/[a-z0-9][a-z0-9_-]{2,}/g) || [])];
}

function compareScore(left, right) {
  return right.score - left.score || right.updated_at.localeCompare(left.updated_at) || left.id.localeCompare(right.id);
}

function truncate(value, limit) {
  const text = String(value || "");
  return text.length <= limit ? text : `${text.slice(0, Math.max(0, limit - 1)).trimEnd()}…`;
}
