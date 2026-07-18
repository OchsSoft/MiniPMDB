const $ = (selector) => document.querySelector(selector);
const elements = {
  runtimeDot: $("#runtime-dot"), runtimeLabel: $("#runtime-label"), runtimeDetail: $("#runtime-detail"), runtimeMessage: $("#runtime-message"),
  auditDot: $("#audit-dot"), auditLabel: $("#audit-label"), projectTitle: $("#project-title"), projectSelect: $("#project-select"),
  projectCount: $("#project-count"), memoryCount: $("#memory-count"), touchpointCount: $("#touchpoint-count"), reviewCount: $("#review-count"), errorCount: $("#error-count"),
  issues: $("#issues"), rows: $("#memory-rows"), touchpoints: $("#touchpoints"), reviewQueue: $("#review-queue"),
  contextOutput: $("#context-output"), contextSize: $("#context-size"), contextWarningCount: $("#context-warning-count"), contextCrossCount: $("#context-cross-count"),
  profile: $("#profile"), task: $("#task"), contextForm: $("#context-form"), touchpointForm: $("#touchpoint-form"), runtimeForm: $("#runtime-form"),
  reset: $("#reset-demo"), fix: $("#fix-demo"), refresh: $("#refresh")
};

let state = { projects: [], memories: [], touchpoints: [] };
elements.contextForm.addEventListener("submit", (event) => { event.preventDefault(); refreshContext().catch(showError); });
elements.projectSelect.addEventListener("change", () => refreshAll().catch(showError));
elements.reset.addEventListener("click", () => mutateDemo("reset"));
elements.fix.addEventListener("click", () => mutateDemo("fix"));
elements.refresh.addEventListener("click", () => refreshAll().catch(showError));
elements.touchpointForm.addEventListener("submit", saveTouchpoint);
elements.runtimeForm.addEventListener("submit", saveRuntime);
refreshAll().catch(showError);

async function refreshAll() {
  setBusy(true);
  try {
    const [runtime, snapshot] = await Promise.all([request("/api/runtime"), request("/api/state")]);
    state = snapshot;
    renderRuntime(runtime);
    populateProjects(snapshot.projects);
    const projectKey = selectedProject();
    const [audit, touchpoints] = await Promise.all([
      request(`/api/audit?strict=true&project_key=${encodeURIComponent(projectKey)}`),
      request(`/api/touchpoints?project_key=${encodeURIComponent(projectKey)}`)
    ]);
    state.touchpoints = touchpoints.touchpoints;
    renderSnapshot(snapshot, projectKey);
    renderAudit(audit);
    renderTouchpoints(touchpoints.touchpoints);
    await refreshContext();
  } finally { setBusy(false); }
}

async function refreshContext() {
  const query = new URLSearchParams({ project_key: selectedProject(), profile: elements.profile.value, task: elements.task.value });
  const context = await request(`/api/context?${query}`);
  elements.contextOutput.textContent = context.context_pack;
  elements.contextSize.textContent = `${context.context_selection.actual_chars.toLocaleString()} / ${context.context_selection.max_chars.toLocaleString()} chars`;
  elements.contextWarningCount.textContent = `${context.context_selection.warning_count} warnings`;
  elements.contextCrossCount.textContent = `${context.context_selection.cross_project_count} cross-project memories`;
}

function renderRuntime(runtime) {
  elements.runtimeDot.className = `state-dot ${runtime.status === "ready" ? "pass" : "fail"}`;
  elements.runtimeLabel.textContent = runtime.mode === "managed" ? "Managed MongoDB" : "External MongoDB";
  elements.runtimeDetail.textContent = `${runtime.database} · ${runtime.version}`;
  elements.runtimeMessage.textContent = `${runtime.message} ${runtime.endpoint}`;
  elements.runtimeForm.elements.mode.value = runtime.mode;
  elements.runtimeForm.elements.db_name.value = runtime.database;
}

function populateProjects(projects) {
  const current = elements.projectSelect.value;
  elements.projectSelect.replaceChildren(...projects.map((project) => option(project.key, project.name)));
  if (projects.some((item) => item.key === current)) elements.projectSelect.value = current;
}

function renderSnapshot(snapshot, projectKey) {
  const project = snapshot.projects.find((item) => item.key === projectKey);
  elements.projectTitle.textContent = project?.name || "No registered project";
  elements.projectCount.textContent = snapshot.projects.length;
  elements.memoryCount.textContent = snapshot.memories.length;
  elements.touchpointCount.textContent = state.touchpoints.length;
  const queue = snapshot.memories.filter((item) => item.project_key === projectKey && ["draft", "unreviewed"].includes(item.status));
  elements.reviewCount.textContent = queue.length;
  elements.rows.replaceChildren(...snapshot.memories.map(memoryRow));
  elements.reviewQueue.replaceChildren(...(queue.length ? queue.map(reviewCard) : [empty("No unreviewed candidates for this project.")]));
}

function renderAudit(audit) {
  elements.auditDot.className = `state-dot ${audit.passed ? "pass" : "fail"}`;
  elements.auditLabel.textContent = audit.passed ? "Strict audit passing" : "Strict audit blocked";
  elements.errorCount.textContent = audit.summary.errors + audit.summary.warnings;
  elements.issues.replaceChildren(...(audit.issues.length ? audit.issues.map(issueRow) : [empty("Ready for governed agent context.")]));
}

function renderTouchpoints(items) {
  elements.touchpoints.replaceChildren(...(items.length ? items.map((item) => {
    const card = node("article", "stack-card");
    const head = node("div", "card-head");
    head.append(node("strong", "", item.name), node("span", `badge ${item.status === "broken" ? "error" : "success"}`, item.status.toUpperCase()));
    card.append(head, node("p", "connection", item.projects.join(" ↔ ")), node("p", "muted", item.summary), node("small", "", `${item.kind} · ${item.memory_ids.length} governed memories`));
    return card;
  }) : [empty("No touchpoints for the selected project.")]));
}

function reviewCard(memory) {
  const card = node("article", "stack-card");
  const head = node("div", "card-head");
  head.append(node("strong", "", memory.title), node("span", "badge warning", memory.status.toUpperCase()));
  const actions = node("div", "card-actions");
  const approve = node("button", "primary", "Approve");
  const reject = node("button", "secondary danger", "Reject");
  approve.type = reject.type = "button";
  approve.addEventListener("click", () => reviewMemory(memory.id, "reviewed"));
  reject.addEventListener("click", () => reviewMemory(memory.id, "rejected"));
  actions.append(approve, reject);
  card.append(head, node("p", "muted", memory.body), node("small", "", `${memory.kind} · ${memory.confidence} · ${memory.source_ids.length} sources`), actions);
  return card;
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
  const title = document.createElement("td");
  title.append(node("strong", "", memory.title), node("small", "", memory.id));
  row.append(node("td", "status", memory.status), node("td", "", memory.project_key), title, node("td", "", memory.confidence), node("td", "", memory.source_ids.length ? `${memory.source_ids.length} source${memory.source_ids.length === 1 ? "" : "s"}` : "None"));
  return row;
}

async function mutateDemo(action) {
  setBusy(true);
  try { await request(`/api/demo/${action}`, { method: "POST" }); await refreshAll(); }
  catch (error) { showError(error); }
  finally { setBusy(false); }
}

async function reviewMemory(id, status) {
  await request(`/api/memories/${encodeURIComponent(id)}/review`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, reviewer: "dashboard-human", note: "Reviewed in the local dashboard." }) });
  await refreshAll();
}

async function saveTouchpoint(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(elements.touchpointForm));
  data.projects = split(data.projects);
  data.memory_ids = split(data.memory_ids);
  await request("/api/touchpoints", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  elements.touchpointForm.reset();
  await refreshAll();
}

async function saveRuntime(event) {
  event.preventDefault();
  const submitter = event.submitter?.value;
  const data = Object.fromEntries(new FormData(elements.runtimeForm));
  const result = submitter === "test"
    ? await request("/api/runtime/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uri: data.external_uri, db_name: data.db_name }) })
    : await request("/api/runtime/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  elements.runtimeMessage.textContent = result.restart_required ? "Saved. Restart MiniPMDB to use this backend." : `Connection successful: ${result.endpoint}`;
}

function selectedProject() { return elements.projectSelect.value || state.projects[0]?.key || ""; }
function split(value) { return String(value || "").split(",").map((item) => item.trim()).filter(Boolean); }
function option(value, text) { const item = document.createElement("option"); item.value = value; item.textContent = `${text} (${value})`; return item; }
function empty(text) { return node("div", "empty", text); }
function setBusy(busy) { for (const button of [elements.reset, elements.fix, elements.refresh]) button.disabled = busy; }
function showError(error) { elements.auditDot.className = "state-dot fail"; elements.auditLabel.textContent = "Dashboard error"; elements.issues.replaceChildren(empty(error.message)); }

async function request(url, options) {
  const response = await fetch(url, options);
  const value = await response.json();
  if (!response.ok) throw new Error(value.message || value.error || "Request failed");
  return value;
}

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
