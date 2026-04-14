

<style>
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@400;500&display=swap');
  .card-root { font-family: 'Syne', sans-serif; background: #0a0f1e; color: #e8ecf4; padding: 2.5rem; border-radius: 20px; max-width: 700px; margin: 0 auto; position: relative; overflow: hidden; }
  .grid-bg { position: absolute; inset: 0; background-image: linear-gradient(rgba(99,102,241,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.07) 1px, transparent 1px); background-size: 40px 40px; pointer-events: none; }
  .accent-circle { position: absolute; top: -80px; right: -80px; width: 260px; height: 260px; border-radius: 50%; background: radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%); pointer-events: none; }
  .badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.35); color: #a5b4fc; font-size: 11px; font-family: 'DM Mono', monospace; padding: 4px 12px; border-radius: 100px; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 1.2rem; }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: #6366f1; display: inline-block; }
  .title { font-size: 26px; font-weight: 800; line-height: 1.15; margin: 0 0 0.4rem; color: #fff; }
  .subtitle { font-size: 14px; color: #94a3b8; margin: 0 0 1.8rem; font-weight: 400; }
  .flow { display: flex; align-items: center; gap: 0; margin-bottom: 2rem; flex-wrap: wrap; gap: 6px; }
  .flow-step { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 10px 14px; text-align: center; flex: 1; min-width: 90px; }
  .flow-step .icon { font-size: 18px; margin-bottom: 4px; }
  .flow-step .label { font-size: 11px; color: #94a3b8; font-family: 'DM Mono', monospace; }
  .flow-step .name { font-size: 13px; font-weight: 700; color: #e2e8f0; }
  .arrow { color: #4f46e5; font-size: 18px; font-weight: 700; flex-shrink: 0; }
  .features { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 2rem; }
  .feat { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px 14px; display: flex; align-items: flex-start; gap: 10px; }
  .feat-icon { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
  .feat-text .ft { font-size: 13px; font-weight: 700; color: #e2e8f0; margin: 0 0 2px; }
  .feat-text .fd { font-size: 11px; color: #64748b; font-family: 'DM Mono', monospace; margin: 0; }
  .tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 2rem; }
  .tag { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; font-size: 11px; font-family: 'DM Mono', monospace; color: #94a3b8; padding: 4px 10px; }
  .footer { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 1rem; }
  .author { font-size: 13px; color: #64748b; }
  .author strong { color: #e2e8f0; display: block; font-size: 14px; }
  .stat-row { display: flex; gap: 16px; }
  .stat { text-align: center; }
  .stat .val { font-size: 20px; font-weight: 800; color: #818cf8; display: block; }
  .stat .lbl { font-size: 10px; color: #475569; font-family: 'DM Mono', monospace; text-transform: uppercase; letter-spacing: 0.06em; }
  .code-snip { background: #0d1424; border: 1px solid rgba(99,102,241,0.2); border-radius: 10px; padding: 12px 16px; font-family: 'DM Mono', monospace; font-size: 11px; color: #7c85a2; margin-bottom: 1.5rem; line-height: 1.7; }
  .kw { color: #c084fc; }
  .fn { color: #60a5fa; }
  .str { color: #34d399; }
  .cm { color: #475569; }
</style>

<div class="card-root">
  <div class="grid-bg"></div>
  <div class="accent-circle"></div>

  <div class="badge"><span class="dot"></span> Automation Project</div>

  <p class="title">Jira Ticket Automation<br>from Excel</p>
  <p class="subtitle">Automated bulk task creation — from spreadsheet to Jira in seconds</p>

  <div class="flow">
    <div class="flow-step">
      <div class="icon">📊</div>
      <div class="name">Excel File</div>
      <div class="label">.xlsx input</div>
    </div>
    <div class="arrow">→</div>
    <div class="flow-step">
      <div class="icon">⚙️</div>
      <div class="name">Node.js</div>
      <div class="label">parser + API</div>
    </div>
    <div class="arrow">→</div>
    <div class="flow-step">
      <div class="icon">🔗</div>
      <div class="name">Jira API v3</div>
      <div class="label">REST calls</div>
    </div>
    <div class="arrow">→</div>
    <div class="flow-step" style="border-color: rgba(99,102,241,0.4); background: rgba(99,102,241,0.1);">
      <div class="icon">✅</div>
      <div class="name">Tasks Live</div>
      <div class="label">auto-created</div>
    </div>
  </div>

  <div class="code-snip">
    <span class="cm">// reads rows → creates Jira tickets</span><br>
    <span class="kw">const</span> rows = xlsx.<span class="fn">utils</span>.sheet_to_json(ws);<br>
    <span class="kw">for</span> (<span class="kw">const</span> row <span class="kw">of</span> rows) {<br>
    &nbsp;&nbsp;<span class="kw">await</span> <span class="fn">createTicket</span>(row); <span class="cm">// POST /rest/api/3/issue</span><br>
    &nbsp;&nbsp;<span class="kw">await</span> <span class="fn">delay</span>(<span class="str">300</span>); <span class="cm">// rate-limit safe</span><br>
    }
  </div>

  <div class="features">
    <div class="feat">
      <div class="feat-icon" style="background:rgba(99,102,241,0.15);">🗂️</div>
      <div class="feat-text">
        <p class="ft">Bulk creation</p>
        <p class="fd">All rows → tickets</p>
      </div>
    </div>
    <div class="feat">
      <div class="feat-icon" style="background:rgba(52,211,153,0.12);">🔐</div>
      <div class="feat-text">
        <p class="ft">Secure .env config</p>
        <p class="fd">API token auth</p>
      </div>
    </div>
    <div class="feat">
      <div class="feat-icon" style="background:rgba(251,191,36,0.12);">⚡</div>
      <div class="feat-text">
        <p class="ft">Priority mapping</p>
        <p class="fd">From sheet column</p>
      </div>
    </div>
    <div class="feat">
      <div class="feat-icon" style="background:rgba(239,68,68,0.12);">🛡️</div>
      <div class="feat-text">
        <p class="ft">Error handling</p>
        <p class="fd">Per-row logging</p>
      </div>
    </div>
  </div>

  <div class="tags">
    <span class="tag">Node.js</span>
    <span class="tag">Jira REST API v3</span>
    <span class="tag">xlsx</span>
    <span class="tag">dotenv</span>
    <span class="tag">Automation</span>
    <span class="tag">Project Management</span>
    <span class="tag">DevOps</span>
  </div>

  <div class="footer">
    <div class="author">
      <strong>Jira Automation Tool</strong>
      Built with Node.js · Jira Cloud API
    </div>
    <div class="stat-row">
      <div class="stat"><span class="val">∞</span><span class="lbl">rows</span></div>
      <div class="stat"><span class="val">0</span><span class="lbl">manual work</span></div>
      <div class="stat"><span class="val">1</span><span class="lbl">command</span></div>
    </div>
  </div>
</div>