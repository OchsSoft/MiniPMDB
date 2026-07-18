const sceneId = new URLSearchParams(location.search).get("scene") || "intro";
const frame = document.querySelector("#frame");

const scenes = {
  intro: {
    number: "01 / 11",
    label: "OPENAI BUILD WEEK · DEVELOPER TOOLS",
    body: `
      <h1>CI for <span class="accent">agent memory.</span></h1>
      <p class="lede">MiniPMDB stops unreviewed, unsourced, contradictory, or obsolete memories from silently becoming project truth.</p>
      <div class="pill-row"><span class="pill">Local-first</span><span class="pill">MCP</span><span class="pill">Strict audit</span><span class="pill">GitHub Action</span></div>
    `
  },
  problem: {
    number: "02 / 11",
    label: "THE FAILURE MODE",
    body: `
      <h2>Remembered does not mean trusted.</h2>
      <div class="split">
        <section class="panel danger"><div class="panel-label">Agent note · unreviewed</div><h3>“Release requires a long-lived registry token.”</h3><p>High confidence. No source. Still marked active.</p></section>
        <section class="panel safe"><div class="panel-label">Reviewed evidence</div><h3>“Release uses trusted publishing with OIDC.”</h3><p>Source-backed workflow. The claims cannot both be active truth.</p></section>
      </div>
    `
  },
  "audit-fail": {
    number: "03 / 11",
    label: "FAIL CLOSED",
    body: `
      <div class="terminal"><div class="terminal-bar"><span class="terminal-dot"></span><span class="terminal-dot"></span><span class="terminal-dot"></span><span>real CLI output · synthetic project</span></div><pre>$ npm run demo:reset
Loaded the intentionally broken release-memory demo.

$ node src/cli.js audit --strict
<span class="error-line">MiniPMDB audit: FAIL
Errors: 3; warnings: 0; strict: yes
ERROR active_unreviewed
ERROR high_confidence_without_source
ERROR unresolved_conflict</span>

Process exited with code 1</pre></div>
    `
  },
  "governed-fix": {
    number: "06 / 11",
    label: "FIX THE MEMORY · KEEP THE HISTORY",
    body: `
      <div class="terminal"><div class="terminal-bar"><span class="terminal-dot"></span><span class="terminal-dot"></span><span class="terminal-dot"></span><span>reviewed resolution + explicit supersession</span></div><pre>$ npm run demo:fix
Applied a reviewed resolution and supersession.

$ node src/cli.js audit --strict
<span class="pass-line">MiniPMDB audit: PASS
Errors: 0; warnings: 0; strict: yes
No governance violations found.</span></pre></div>
      <div class="pill-row"><span class="pill">old claim → superseded</span><span class="pill">OIDC → reviewed truth</span><span class="pill">conflict → resolved</span></div>
    `
  },
  mcp: {
    number: "08 / 11",
    label: "CODEX GETS GOVERNED CONTEXT",
    body: `
      <div class="code-grid">
        <div class="terminal"><div class="terminal-bar">Codex MCP configuration</div><pre>[mcp_servers.minipmdb]
command = "node"
args = ["/path/to/MiniPMDB/src/mcp.js"]
cwd = "/path/to/your-project"
env = { MINIPMDB_STORE =
  ".minipmdb/store.json" }</pre></div>
        <div class="checklist">
          <div class="check"><span>✓</span><span><strong>Read-only by default</strong><br>Context, audit, and lifecycle inspection.</span></div>
          <div class="check"><span>✓</span><span><strong>Draft-write is review-first</strong><br>An agent cannot approve its own claim.</span></div>
          <div class="check"><span>✓</span><span><strong>Compact without silent risk</strong><br>Critical warnings survive token budgets.</span></div>
        </div>
      </div>
    `
  },
  ci: {
    number: "09 / 11",
    label: "ONE POLICY · EVERY SURFACE",
    body: `
      <div class="code-grid">
        <div class="terminal"><div class="terminal-bar">.github/workflows/memory.yml</div><pre>- uses: OchsSoft/MiniPMDB@v0.1.0
  with:
    store: governance/project-memory.json
    strict: "true"</pre></div>
        <div>
          <h2>CLI. MCP. Dashboard. CI.</h2>
          <div class="metric-row"><div class="metric"><strong>0</strong><span>runtime dependencies</span></div><div class="metric"><strong>11</strong><span>passing tests</span></div><div class="metric"><strong>1</strong><span>deterministic policy</span></div></div>
        </div>
      </div>
    `
  },
  "build-evidence": {
    number: "10 / 11",
    label: "BUILT DURING OPENAI BUILD WEEK",
    body: `
      <h2>Codex + GPT-5.6 built the public extraction.</h2>
      <div class="split">
        <section class="panel"><div class="panel-label">Primary build thread</div><h3>Product thesis → implementation → validation</h3><ul><li>Audit-first competitive positioning</li><li>Sanitized architecture and MCP contracts</li><li>Tests, public docs, CI, and this demo</li></ul></section>
        <section class="panel"><div class="panel-label">Public boundary</div><h3>Small on purpose.</h3><ul><li>New Git history</li><li>Synthetic data only</li><li>No private integrations or payloads</li><li>MPL-2.0 open source</li></ul></section>
      </div>
    `
  },
  close: {
    number: "11 / 11",
    label: "MINIPMDB",
    body: `
      <div class="quote">Other tools help agents remember.<br><span class="accent">MiniPMDB helps teams decide what agents are allowed to trust.</span></div>
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
