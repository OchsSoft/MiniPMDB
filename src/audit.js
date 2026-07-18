import { ACTIVE_STATUSES, CANDIDATE_STATUSES, EXCLUDED_STATUSES } from "./constants.js";
import { buildContextPack } from "./context.js";
import { normalizeSnapshot } from "./schema.js";

export function auditSnapshot(snapshotValue, { strict = false, projectKey = "" } = {}) {
  const snapshot = normalizeSnapshot(snapshotValue);
  const issues = [];
  const projects = new Map(snapshot.projects.map((item) => [item.key, item]));
  const memories = new Map(snapshot.memories.map((item) => [item.id, item]));
  const sources = new Map(snapshot.sources.map((item) => [item.id, item]));

  for (const memory of snapshot.memories) auditMemory(memory, { projects, sources, issues });
  for (const source of snapshot.sources) {
    if (!projects.has(source.project_key)) add(issues, "unknown_source_project", "error", `Source ${source.id} references unknown project ${source.project_key}.`, { source_ids: [source.id] });
  }
  for (const link of snapshot.links) auditLink(link, { memories, issues });
  for (const touchpoint of snapshot.touchpoints) auditTouchpoint(touchpoint, { projects, memories, issues });

  const contextProjects = projectKey ? [projectKey] : snapshot.projects.map((item) => item.key);
  for (const key of contextProjects) {
    if (!projects.has(key)) {
      add(issues, "unknown_context_project", "error", `Context project does not exist: ${key}.`, { project_keys: [key] });
      continue;
    }
    for (const profile of ["drift_guard", "balanced", "compact"]) {
      try {
        auditContext(buildContextPack(snapshot, { projectKey: key, profile, task: "audit context safety" }), issues);
      } catch (error) {
        add(issues, "context_build_failed", "error", `${key}/${profile} context failed: ${error.message}`, { project_keys: [key], profile });
      }
    }
  }

  const errors = issues.filter((item) => item.severity === "error").length;
  const warnings = issues.filter((item) => item.severity === "warning").length;
  return {
    passed: errors === 0 && (!strict || warnings === 0),
    strict,
    summary: {
      projects: snapshot.projects.length,
      memories: snapshot.memories.length,
      sources: snapshot.sources.length,
      links: snapshot.links.length,
      touchpoints: snapshot.touchpoints.length,
      errors,
      warnings
    },
    issues
  };
}

export function formatAuditReport(report) {
  const state = report.passed ? "PASS" : "FAIL";
  const lines = [`MiniPMDB audit: ${state}`, `Projects ${report.summary.projects} | Memories ${report.summary.memories} | Touchpoints ${report.summary.touchpoints} | Errors ${report.summary.errors} | Warnings ${report.summary.warnings}`];
  for (const item of report.issues) lines.push(`- ${item.severity.toUpperCase()} ${item.code}: ${item.message}`);
  return lines.join("\n");
}

function auditMemory(memory, { projects, sources, issues }) {
  if (!projects.has(memory.project_key)) add(issues, "unknown_memory_project", "error", `Memory ${memory.id} references unknown project ${memory.project_key}.`, { memory_ids: [memory.id] });
  if (CANDIDATE_STATUSES.has(memory.status)) {
    add(issues, "unreviewed_candidate", "warning", `Memory ${memory.id} is awaiting human review.`, { memory_ids: [memory.id] });
    if (memory.confidence === "high" && memory.source_ids.length === 0) add(issues, "candidate_without_source", "warning", `High-confidence candidate ${memory.id} has no source.`, { memory_ids: [memory.id] });
  }
  if (ACTIVE_STATUSES.has(memory.status) && memory.metadata.review_state === "unreviewed") {
    add(issues, "active_unreviewed", "error", `Memory ${memory.id} is active but still marked unreviewed.`, { memory_ids: [memory.id] });
  }
  if (ACTIVE_STATUSES.has(memory.status) && memory.confidence === "high" && memory.source_ids.length === 0) {
    add(issues, "high_confidence_without_source", "error", `High-confidence active memory ${memory.id} has no source.`, { memory_ids: [memory.id] });
  }
  for (const sourceId of memory.source_ids) {
    const source = sources.get(sourceId);
    if (!source) add(issues, "broken_source_reference", "error", `Memory ${memory.id} references missing source ${sourceId}.`, { memory_ids: [memory.id], source_ids: [sourceId] });
    else if (source.project_key !== memory.project_key) add(issues, "cross_project_source_reference", "error", `Memory ${memory.id} references source ${sourceId} owned by ${source.project_key}.`, { memory_ids: [memory.id], source_ids: [sourceId] });
  }
}

function auditLink(link, { memories, issues }) {
  const from = memories.get(link.from);
  const to = memories.get(link.to);
  if (!from || !to) add(issues, "broken_link_reference", "error", `Link ${link.id} references a missing memory.`, { link_ids: [link.id] });
  if (link.relationship === "conflicts_with" && link.status === "open") {
    add(issues, "unresolved_conflict", "error", `Conflict ${link.id} has no reviewed resolution.`, { link_ids: [link.id], memory_ids: [link.from, link.to] });
  }
  if (link.relationship === "conflicts_with" && link.status === "resolved") {
    const resolution = memories.get(link.resolution_memory_id);
    if (!resolution || !isGovernedActive(resolution)) add(issues, "invalid_conflict_resolution", "error", `Conflict ${link.id} does not reference an active reviewed resolution.`, { link_ids: [link.id] });
  }
}

function isGovernedActive(memory) {
  return ACTIVE_STATUSES.has(memory.status) && memory.metadata?.review_state !== "unreviewed" && memory.metadata?.review_state !== "rejected";
}

function auditTouchpoint(touchpoint, { projects, memories, issues }) {
  if (touchpoint.projects.length < 2) add(issues, "touchpoint_needs_multiple_projects", "error", `Touchpoint ${touchpoint.id} must connect at least two projects.`, { touchpoint_ids: [touchpoint.id] });
  for (const key of touchpoint.projects) {
    if (!projects.has(key)) add(issues, "unknown_touchpoint_project", "error", `Touchpoint ${touchpoint.id} references unknown project ${key}.`, { touchpoint_ids: [touchpoint.id], project_keys: [key] });
  }
  const participating = new Set();
  for (const memoryId of touchpoint.memory_ids) {
    const memory = memories.get(memoryId);
    if (!memory) {
      add(issues, "broken_touchpoint_memory_reference", "error", `Touchpoint ${touchpoint.id} references missing memory ${memoryId}.`, { touchpoint_ids: [touchpoint.id], memory_ids: [memoryId] });
      continue;
    }
    if (!touchpoint.projects.includes(memory.project_key)) add(issues, "touchpoint_memory_wrong_project", "error", `Touchpoint ${touchpoint.id} references ${memoryId} from non-participant ${memory.project_key}.`, { touchpoint_ids: [touchpoint.id], memory_ids: [memoryId] });
    if (!EXCLUDED_STATUSES.has(memory.status)) participating.add(memory.project_key);
  }
  if (["active", "broken"].includes(touchpoint.status)) {
    for (const key of touchpoint.projects) {
      if (!participating.has(key)) add(issues, "touchpoint_missing_project_memory", "error", `Touchpoint ${touchpoint.id} has no governed memory from ${key}.`, { touchpoint_ids: [touchpoint.id], project_keys: [key] });
    }
  }
  if (touchpoint.status === "broken") add(issues, "broken_touchpoint", "warning", `Touchpoint ${touchpoint.id} is marked broken.`, { touchpoint_ids: [touchpoint.id] });
  if (touchpoint.status === "stale") add(issues, "stale_touchpoint", "warning", `Touchpoint ${touchpoint.id} needs verification.`, { touchpoint_ids: [touchpoint.id] });
}

function auditContext(context, issues) {
  if (context.context_pack.length > context.context_selection.max_chars) add(issues, "context_budget_exceeded", "error", `${context.project.key}/${context.profile} context exceeds its character budget.`, { project_keys: [context.project.key], profile: context.profile });
  if (context.context_selection.omitted_critical_warning_ids.length) add(issues, "critical_warning_omitted", "error", `${context.project.key}/${context.profile} omitted critical warnings.`, { memory_ids: context.context_selection.omitted_critical_warning_ids, profile: context.profile });
  if (context.context_selection.omitted_broken_touchpoint_ids.length) add(issues, "broken_touchpoint_omitted", "error", `${context.project.key}/${context.profile} omitted broken touchpoints.`, { touchpoint_ids: context.context_selection.omitted_broken_touchpoint_ids, profile: context.profile });
}

function add(issues, code, severity, message, details = {}) {
  issues.push({ code, severity, message, ...details });
}
