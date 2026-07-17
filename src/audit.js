import { ACTIVE_STATUSES, EXCLUDED_STATUSES, WARNING_STATUSES } from "./constants.js";
import { buildContextPack, isGovernedActive, isReviewMismatch } from "./context.js";
import { normalizeStore } from "./schema.js";

const AUDIT_PROFILES = ["drift_guard", "balanced", "compact"];

export function auditStore(storeValue, { strict = false } = {}) {
  const store = normalizeStore(storeValue);
  const issues = [];
  const memoryById = new Map(store.memories.map((memory) => [memory.id, memory]));
  const sourceIds = new Set(store.sources.map((source) => source.id));

  for (const memory of store.memories) {
    if (ACTIVE_STATUSES.has(memory.status) && isReviewMismatch(memory)) {
      issues.push(issue(
        "active_unreviewed",
        "error",
        `Active memory ${memory.id} is still marked unreviewed.`,
        { memory_ids: [memory.id] }
      ));
    }
    if (ACTIVE_STATUSES.has(memory.status) && memory.confidence === "high" && memory.source_ids.length === 0) {
      issues.push(issue(
        "high_confidence_without_source",
        "error",
        `High-confidence active memory ${memory.id} has no source.`,
        { memory_ids: [memory.id] }
      ));
    }
    const missingSources = memory.source_ids.filter((id) => !sourceIds.has(id));
    if (missingSources.length) {
      issues.push(issue(
        "broken_source_reference",
        "error",
        `Memory ${memory.id} references missing sources: ${missingSources.join(", ")}.`,
        { memory_ids: [memory.id] }
      ));
    }
  }

  for (const link of store.links) {
    const from = memoryById.get(link.from);
    const to = memoryById.get(link.to);
    if (!from || !to) {
      issues.push(issue(
        link.relationship === "supersedes" ? "broken_supersession_reference" : "broken_link_reference",
        "error",
        `Link ${link.id} points to a missing memory.`,
        { link_ids: [link.id] }
      ));
      continue;
    }
    if (link.relationship === "supersedes" && to.status !== "superseded") {
      issues.push(issue(
        "superseded_memory_still_active",
        "error",
        `Memory ${to.id} is superseded by ${from.id} but has status ${to.status}.`,
        { memory_ids: [to.id, from.id], link_ids: [link.id] }
      ));
    }
    if (link.relationship === "conflicts_with") {
      const resolution = memoryById.get(link.resolution_memory_id);
      const validResolution =
        link.status === "resolved" &&
        resolution &&
        ["reviewed", "current", "resolved"].includes(resolution.status) &&
        !isReviewMismatch(resolution);
      if (!validResolution) {
        issues.push(issue(
          "unresolved_conflict",
          "error",
          `Conflict ${link.id} lacks a reviewed resolution.`,
          { memory_ids: [from.id, to.id], link_ids: [link.id] }
        ));
      }
    }
  }

  const linkedSuperseded = new Set(
    store.links.filter((link) => link.relationship === "supersedes").map((link) => link.to)
  );
  for (const memory of store.memories.filter((item) => item.status === "superseded")) {
    if (!linkedSuperseded.has(memory.id)) {
      issues.push(issue(
        "unlinked_superseded_memory",
        "warning",
        `Superseded memory ${memory.id} has no supersession link.`,
        { memory_ids: [memory.id] }
      ));
    }
  }

  const contexts = AUDIT_PROFILES.map((profile) => buildContextPack(store, { profile, task: "audit project truth" }));
  for (const context of contexts) {
    auditContext(context, issues);
  }

  const errorCount = issues.filter((item) => item.severity === "error").length;
  const warningCount = issues.filter((item) => item.severity === "warning").length;
  const passed = errorCount === 0 && (!strict || warningCount === 0);
  return {
    passed,
    strict: Boolean(strict),
    generated_at: new Date().toISOString(),
    project: store.project,
    summary: {
      memories: store.memories.length,
      sources: store.sources.length,
      links: store.links.length,
      errors: errorCount,
      warnings: warningCount
    },
    issues,
    profiles: contexts.map((context) => context.context_selection)
  };
}

export function formatAuditReport(report) {
  const lines = [
    `MiniPMDB audit: ${report.passed ? "PASS" : "FAIL"}`,
    `Project: ${report.project.name} (${report.project.key})`,
    `Errors: ${report.summary.errors}; warnings: ${report.summary.warnings}; strict: ${report.strict ? "yes" : "no"}`
  ];
  for (const item of report.issues) {
    lines.push(`${item.severity === "error" ? "ERROR" : "WARN "} ${item.code}: ${item.message}`);
  }
  if (!report.issues.length) {
    lines.push("No governance violations found.");
  }
  return lines.join("\n");
}

function auditContext(context, issues) {
  const profile = context.context_selection.profile;
  const activeLeaks = context.active.filter(
    (memory) => WARNING_STATUSES.has(memory.status) || EXCLUDED_STATUSES.has(memory.status) || isReviewMismatch(memory)
  );
  if (activeLeaks.length) {
    issues.push(issue(
      "warning_leaked_into_active_context",
      "error",
      `${profile} context treated warning records as active truth.`,
      { memory_ids: activeLeaks.map((memory) => memory.id), profile }
    ));
  }
  const excludedLeaks = [...context.active, ...context.warnings].filter((memory) => EXCLUDED_STATUSES.has(memory.status));
  if (excludedLeaks.length) {
    issues.push(issue(
      "excluded_memory_leaked_into_context",
      "error",
      `${profile} context included archived or rejected memories.`,
      { memory_ids: excludedLeaks.map((memory) => memory.id), profile }
    ));
  }
  if (context.context_selection.actual_chars > context.context_selection.max_chars) {
    issues.push(issue(
      "context_budget_exceeded",
      "error",
      `${profile} context exceeded its character budget.`,
      { profile }
    ));
  }
  const omitted = context.context_selection.omitted_critical_warning_ids;
  if (omitted.length) {
    issues.push(issue(
      "critical_warning_omitted",
      "error",
      `${profile} context omitted critical warnings: ${omitted.join(", ")}.`,
      { memory_ids: omitted, profile }
    ));
  }
}

function issue(code, severity, message, details = {}) {
  return { code, severity, message, ...details };
}
