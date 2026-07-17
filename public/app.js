const elements = {
  auditDot: document.querySelector("#audit-dot"),
  auditLabel: document.querySelector("#audit-label"),
  projectTitle: document.querySelector("#project-title"),
  projectKey: document.querySelector("#project-key"),
  memoryCount: document.querySelector("#memory-count"),
  sourceCount: document.querySelector("#source-count"),
  linkCount: document.querySelector("#link-count"),
  errorCount: document.querySelector("#error-count"),
  issues: document.querySelector("#issues"),
  rows: document.querySelector("#memory-rows"),
  contextOutput: document.querySelector("#context-output"),
  contextSize: document.querySelector("#context-size"),
  contextWarningCount: document.querySelector("#context-warning-count"),
  profile: document.querySelector("#profile"),
  task: document.querySelector("#task"),
  form: document.querySelector("#context-form"),
  reset: document.querySelector("#reset-demo"),
  fix: document.querySelector("#fix-demo"),
  refresh: document.querySelector("#refresh")
};

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  refreshContext().catch(showError);
});
elements.reset.addEventListener("click", () => mutateDemo("reset"));
elements.fix.addEventListener("click", () => mutateDemo("fix"));
elements.refresh.addEventListener("click", () => refreshAll().catch(showError));

refreshAll().catch(showError);

async function refreshAll() {
  setBusy(true);
  try {
    const [store, audit] = await Promise.all([request("/api/state"), request("/api/audit?strict=true")]);
    renderStore(store);
    renderAudit(audit);
    await refreshContext();
  } finally {
    setBusy(false);
  }
}

async function refreshContext() {
  const query = new URLSearchParams({ profile: elements.profile.value, task: elements.task.value });
  const context = await request(`/api/context?${query}`);
  elements.contextOutput.textContent = context.context_pack;
  elements.contextSize.textContent = `${context.context_selection.actual_chars.toLocaleString()} / ${context.context_selection.max_chars.toLocaleString()} chars`;
  elements.contextWarningCount.textContent = `${context.context_selection.warning_count} warnings retained`;
}

async function mutateDemo(action) {
  setBusy(true);
  try {
    await request(`/api/demo/${action}`, { method: "POST" });
    await refreshAll();
  } catch (error) {
    showError(error);
  } finally {
    setBusy(false);
  }
}

function renderStore(store) {
  elements.projectTitle.textContent = store.project.name;
  elements.projectKey.textContent = store.project.key;
  elements.memoryCount.textContent = store.memories.length;
  elements.sourceCount.textContent = store.sources.length;
  elements.linkCount.textContent = store.links.length;
  elements.rows.replaceChildren(...store.memories.map(memoryRow));
}

function renderAudit(audit) {
  elements.auditDot.className = `audit-dot ${audit.passed ? "pass" : "fail"}`;
  elements.auditLabel.textContent = audit.passed ? "Strict audit passing" : "Strict audit blocked";
  elements.errorCount.textContent = audit.summary.errors;
  if (!audit.issues.length) {
    const empty = node("div", "empty");
    empty.append(node("strong", "", "Ready for agent context"), document.createTextNode("No governance violations found."));
    elements.issues.replaceChildren(empty);
    return;
  }
  elements.issues.replaceChildren(...audit.issues.map(issueRow));
}

function issueRow(issue) {
  const item = node("article", "issue");
  const head = node("div", "issue-head");
  head.append(node("span", `badge ${issue.severity}`, issue.severity.toUpperCase()), node("code", "", issue.code));
  item.append(head, node("p", "", issue.message));
  return item;
}

function memoryRow(memory) {
  const row = document.createElement("tr");
  const status = node("td", "status", memory.status);
  const title = document.createElement("td");
  title.append(node("strong", "", memory.title), node("small", "", memory.id));
  const confidence = node("td", "", memory.confidence);
  const evidence = node("td", "", memory.source_ids.length ? `${memory.source_ids.length} source${memory.source_ids.length === 1 ? "" : "s"}` : "None");
  row.append(status, title, confidence, evidence);
  return row;
}

async function request(url, options) {
  const response = await fetch(url, options);
  const value = await response.json();
  if (!response.ok) throw new Error(value.message || value.error || "Request failed");
  return value;
}

function setBusy(busy) {
  for (const button of [elements.reset, elements.fix, elements.refresh]) button.disabled = busy;
}

function showError(error) {
  elements.auditDot.className = "audit-dot fail";
  elements.auditLabel.textContent = "Dashboard error";
  elements.issues.replaceChildren(node("div", "empty", error.message));
}

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
