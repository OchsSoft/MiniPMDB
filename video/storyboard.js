const sceneId = new URLSearchParams(location.search).get("scene") || "intro";
const frame = document.querySelector("#frame");

const scenes = {
  intro: {
    number: "01 / 11",
    label: "OPENAI BUILD WEEK · DEVELOPER TOOLS",
    body: `
      <h1>CI for <span class="accent">cross-project agent memory.</span></h1>
      <p class="lede">MiniPMDB makes agents prove what should be trusted—especially where projects share a contract.</p>
      <div class="pill-row"><span class="pill">Local-first MongoDB</span><span class="pill">MCP</span><span class="pill">Strict audit</span><span class="pill">GitHub Action</span></div>
    `
  },
  problem: {
    number: "02 / 11",
    label: "THE CROSS-PROJECT FAILURE MODE",
    body: `
      <h2>Two projects. One contract. Conflicting memory.</h2>
      <div class="split">
        <section class="panel danger"><div class="panel-label">Paper Crane CLI · agent candidate</div><h3>“Release requires a long-lived registry token.”</h3><p>Unreviewed. High confidence. No evidence. Never active truth.</p></section>
        <section class="panel safe"><div class="panel-label">Release Relay · reviewed contract</div><h3>“Publishing accepts short-lived OIDC only.”</h3><p>The shared touchpoint makes this collision visible to both projects.</p></section>
      </div>
    `
  },
  "audit-fail": {
    number: "03 / 11",
    label: "FAIL CLOSED · REAL SNAPSHOT AUDIT",
    body: `
      <div class="terminal"><div class="terminal-bar"><span class="terminal-dot"></span><span class="terminal-dot"></span><span class="terminal-dot"></span><span>snapshot v2 · synthetic projects</span></div><pre>$ node src/cli.js audit-snapshot --strict --snapshot examples/release-guard/initial.json
<span class="error-line">MiniPMDB audit: FAIL
Projects 2 | Memories 3 | Touchpoints 1 | Errors 1 | Warnings 3
- WARNING unreviewed_candidate
- WARNING candidate_without_source
- ERROR unresolved_conflict
- WARNING broken_touchpoint</span>

Process exited with code 1</pre></div>
    `
  },
  "governed-fix": {
    number: "06 / 11",
    label: "FIX THE CONTRACT · KEEP THE HISTORY",
    body: `
      <div class="terminal"><div class="terminal-bar"><span class="terminal-dot"></span><span class="terminal-dot"></span><span class="terminal-dot"></span><span>human-reviewed resolution + explicit supersession</span></div><pre>$ node src/cli.js demo fix
Applied a reviewed resolution and repaired the shared touchpoint.

$ node src/cli.js audit --strict
<span class="pass-line">MiniPMDB audit: PASS
Projects 2 | Memories 4 | Touchpoints 1 | Errors 0 | Warnings 0</span></pre></div>
      <div class="pill-row"><span class="pill">token claim → superseded</span><span class="pill">OIDC → reviewed truth</span><span class="pill">touchpoint → active</span></div>
    `
  },
  mcp: {
    number: "08 / 11",
    label: "CODEX GETS PROJECT-SCOPED MEMORY",
    body: `
      <div class="code-grid">
        <div class="terminal"><div class="terminal-bar">Codex MCP configuration</div><pre>[mcp_servers.minipmdb]
command = "node"
args = ["/path/to/MiniPMDB/src/mcp.js"]
cwd = "/path/to/registered-project"
env = {
  MINIPMDB_API_URL =
    "http://127.0.0.1:8797",
  MINIPMDB_MCP_MODE =
    "project-draft"
}</pre></div>
        <div class="checklist">
          <div class="check"><span>✓</span><span><strong>Project resolved from cwd</strong><br>No caller-selected project escape hatch.</span></div>
          <div class="check"><span>✓</span><span><strong>Unreviewed candidates only</strong><br>Agents can attach local evidence, not approve truth.</span></div>
          <div class="check"><span>✓</span><span><strong>Strict read-only</strong><br>Removes every write tool.</span></div>
        </div>
      </div>
    `
  },
  ci: {
    number: "09 / 11",
    label: "MONGO CANONICAL · JSON AUDIT ARTIFACT",
    body: `
      <div class="code-grid">
        <div class="terminal"><div class="terminal-bar">.github/workflows/memory.yml</div><pre>- uses: OchsSoft/MiniPMDB@v0.1.0
  with:
    snapshot:
      governance/minipmdb.snapshot.json
    strict: "true"</pre></div>
        <div>
          <h2>One policy. Every surface.</h2>
          <div class="metric-row"><div class="metric"><strong>5</strong><span>Mongo collections</span></div><div class="metric"><strong>12</strong><span>focused tests</span></div><div class="metric"><strong>0</strong><span>Mongo needed in the Action</span></div></div>
        </div>
      </div>
    `
  },
  "build-evidence": {
    number: "10 / 11",
    label: "BUILT DURING OPENAI BUILD WEEK",
    body: `
      <h2>Entrant-led architecture. Codex + GPT-5.6 accelerated implementation.</h2>
      <div class="split">
        <section class="panel"><div class="panel-label">Entrant-led product</div><h3>Architecture and functional scope</h3><ul><li>Canonical MongoDB and local-first runtime</li><li>Project-draft permissions and human review</li><li>Shared touchpoints across projects</li></ul></section>
        <section class="panel"><div class="panel-label">Codex + GPT-5.6 assistance</div><h3>Implementation acceleration</h3><ul><li>Sanitized public implementation</li><li>Tests and cross-platform hardening</li><li>Documentation, packaging, and live demo</li></ul></section>
      </div>
    `
  },
  close: {
    number: "11 / 11",
    label: "MINIPMDB",
    body: `
      <div class="quote">Other tools help agents remember.<br><span class="accent">MiniPMDB helps teams decide what agents are allowed to trust—across projects.</span></div>
      <div class="repo">github.com/OchsSoft/MiniPMDB</div>
    `
  }
};

const scene = scenes[sceneId];
if (!scene) throw new Error(`Unknown video scene: ${sceneId}`);

frame.innerHTML = `
  <header class="topline"><span class="brand">MiniPMDB</span><span class="eyebrow">${scene.label}</span><span class="scene-count">${scene.number}</span></header>
  <section class="content">${scene.body}</section>
  <footer class="footerline"><span>Local-first · deterministic · review-first</span><span class="signal">Synthetic demo</span></footer>
`;
