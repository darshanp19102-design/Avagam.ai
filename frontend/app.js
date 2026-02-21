const app = document.getElementById('app');
const API_URL = window.__APP_ENV__?.API_URL;

const state = {
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  dashboardMenuOpen: false,
  domainResult: null,
  companyResult: null,
  domainLoading: false,
  companyLoading: false,
  isLoading: false,
  lastEvaluation: null,
};

async function api(path, method = 'GET', body) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || 'Request failed');
  return data;
}

function go(path) {
  history.pushState({}, '', path);
  render();
}
window.onpopstate = () => render();

function bindLinks() {
  document.querySelectorAll('[data-link]').forEach((a) => {
    a.onclick = (e) => {
      e.preventDefault();
      go(a.getAttribute('href'));
    };
  });
}

function logoHtml() {
  return 'Avagama<span>.AI</span><sup>TM</sup>';
}

function topNav(active) {
  return `
  <header class="topbar">
    <div class="logo">${logoHtml()}</div>
    <nav>
      <a href="/" data-link class="${active === 'dashboard' ? 'active' : ''}">Dashboard</a>
      <a href="/my-evaluations" data-link class="${active === 'evaluations' ? 'active' : ''}">My evaluations</a>
      <a href="/use-cases/domain" data-link class="${active === 'usecases' ? 'active' : ''}">AI use-case discovery</a>
    </nav>
    <div class="top-meta">
      <div class="pill">Growth pack&nbsp;|&nbsp;94 Evaluation remaining&nbsp;|&nbsp;8 Days left</div>
      <div class="user">${(state.user?.company_name || 'K').slice(0, 1).toUpperCase()}</div>
    </div>
  </header>`;
}

function shell(active, title, body, withFilter = true) {
  return `${topNav(active)}
  <main class="page fade-in">
    <div class="head-row"><h1>${title}</h1>${withFilter ? '<button class="ghost">Last 30 days</button>' : ''}</div>
    ${body}
  </main>`;
}

function authPage(signup) {
  app.innerHTML = `
  <div class="auth-layout">
    <section class="left-pane">
      <div class="logo auth-logo">${logoHtml()}</div>
      <h2>Avagama.ai</h2>
      <h3>AI-powered process evaluation<br/>for your enterprise</h3>
      <p>Helps enterprises evaluate and prioritize business processes using AI-driven insights, risk analysis and intelligent decision making.</p>
      <ul>
        <li><i></i>AI-Powered process evaluation</li>
        <li><i></i>Automation & augmentations readiness scoring</li>
        <li><i></i>Enterprise-grade security & compliance</li>
      </ul>
    </section>
    <section class="right-pane">
      <div class="help">Help & Support</div>
      <div class="auth-card float-in">
        <div class="tabs">
          <button id="goSignIn" class="${signup ? '' : 'on'}">Sign in</button>
          <button id="goSignUp" class="${signup ? 'on' : ''}">Sign up</button>
        </div>
        <h4>${signup ? 'Get started!' : 'Welcome back!'}</h4>
        <small>${signup ? 'Create your Avagama.ai account' : 'Sign in with your Avagama.ai account'}</small>
        <form id="authForm">
          ${signup ? '<label>Company Name</label><input name="company_name" placeholder="Company Inc." required />' : ''}
          <label>Email address</label><input name="email" placeholder="you@company.com" required />
          <label>${signup ? 'Enter password' : 'Password'}</label><input type="password" name="password" placeholder="********" required />
          ${signup ? '<label>Re-enter password</label><input type="password" name="confirm" placeholder="********" required />' : '<div class="forgot">Forget Password?</div>'}
          <div id="authError" class="error"></div>
          <button class="cta">${signup ? 'Create your workspace' : 'Access your workspace'}</button>
        </form>
      </div>
      <div class="copy">Powered by Avaali | © 2026, All Rights Reserved</div>
    </section>
  </div>`;

  document.getElementById('goSignIn').onclick = () => go('/login');
  document.getElementById('goSignUp').onclick = () => go('/signup');
  document.getElementById('authForm').onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      if (signup && f.get('password') !== f.get('confirm')) throw new Error('Passwords do not match');
      const payload = signup
        ? { company_name: f.get('company_name'), email: f.get('email'), password: f.get('password') }
        : { email: f.get('email'), password: f.get('password') };
      const data = await api(signup ? '/api/auth/signup' : '/api/auth/login', 'POST', payload);
      state.token = data.access_token;
      state.user = data.user;
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      go('/');
    } catch (err) {
      document.getElementById('authError').textContent = err.message;
    }
  };
}

function renderTrendChart(points) {
  if (!points.length) return '<div class="chart-placeholder">No data yet</div>';
  const max = Math.max(...points.map((x) => x.count), 1);
  return `<div class="trend-wrap">${points.map((x) => `<div class="trend-item"><div class="trend-bar" style="height:${Math.max(10, (x.count / max) * 122)}px"></div><span>${x.date.slice(5)}</span></div>`).join('')}</div>`;
}

function renderDistributionChart(rows) {
  if (!rows.length) return '<div class="chart-placeholder">No data yet</div>';
  const max = Math.max(...rows.map((x) => x.count), 1);
  return `<div class="dist-wrap">${rows.map((x) => `<div class="dist-row"><label>${x.technology}</label><div class="dist-bar"><i style="width:${(x.count / max) * 100}%"></i></div><span>${x.count}</span></div>`).join('')}</div>`;
}

async function dashboard() {
  const data = await api('/api/dashboard').catch(() => ({ total_evaluations: 0, average_automation_score: 0, charts: { evaluation_trend: [], technology_distribution: [] } }));
  app.innerHTML = shell('dashboard', 'Dashboard', `
    <section class="welcome card fade-up">
      <h2>Hi <span>${state.user?.company_name || 'Karthik'}</span>, welcome to Avagama.ai!</h2>
      <p>Discover automation opportunities, evaluate business processes, and unlock AI-powered automation for your enterprise.</p>
      <div class="btn-row">
        <button id="startEval" class="btn btn-primary">+ Start new evaluation</button>
        <div class="dropdown-wrap">
          <button id="menuToggle" class="btn btn-light">Discover AI use cases</button>
          <div class="dropdown ${state.dashboardMenuOpen ? 'open' : ''}">
            <button id="domainFocus">Domain Focus</button>
            <button id="companyFocus">Company Focus</button>
          </div>
        </div>
      </div>
    </section>

    <section class="stat-grid">
      <article class="card"><h5>Evaluations completed</h5><div class="num">${data.total_evaluations}</div></article>
      <article class="card"><h5>Average automation score</h5><div class="num">${data.average_automation_score}</div></article>
      <article class="card"><h5>AI use cases found - Domain</h5><div class="num">${(Array.isArray(state.domainResult) ? state.domainResult.length : (state.domainResult ? 1 : 0))}</div></article>
      <article class="card"><h5>AI use cases found - Company</h5><div class="num">${(Array.isArray(state.companyResult) ? state.companyResult.length : (state.companyResult ? 1 : 0))}</div></article>
    </section>

    <section class="chart-grid">
      <div class="card chart"><h3>Evaluation trends</h3>${renderTrendChart(data.charts?.evaluation_trend || [])}</div>
      <div class="card chart"><h3>Technology distribution</h3>${renderDistributionChart(data.charts?.technology_distribution || [])}</div>
    </section>
  `);

  bindLinks();
  document.getElementById('startEval').onclick = () => go('/evaluate');
  document.getElementById('menuToggle').onclick = () => { state.dashboardMenuOpen = !state.dashboardMenuOpen; dashboard(); };
  const df = document.getElementById('domainFocus'); if (df) df.onclick = () => go('/use-cases/domain');
  const cf = document.getElementById('companyFocus'); if (cf) cf.onclick = () => go('/use-cases/company');
}

function evaluateForm(filled = false) {
  const d = filled ? {
    process_name: 'Vendor invoice approval',
    description: 'The vendor invoice approval process involves receiving invoices from suppliers, validating invoice details against purchase orders and goods receipt notes, checking tax and compliance requirements, resolving discrepancies, and routing invoices through multiple approval levels before posting for payment in the ERP system.',
    volume: '4,500', frequency: 'Daily', exception_rate: '30', complexity: '7', risk: 'Medium (moderate risk acceptable)', compliance: 'Subject to tax regulations and internal financial controls', decision: 'Manual judgment is required when invoices do not match purchase orders, tax values differ from expectations, or approvals exceed predefined thresholds.'
  } : { process_name: '', description: '', volume: '', frequency: '', exception_rate: '15', complexity: '2', risk: '', compliance: '', decision: '' };

  app.innerHTML = shell('evaluations', 'Evaluate a process', `
    <div class="top-actions"><button class="ghost">Save as draft</button><button id="submitDetails" class="btn btn-primary">Submit details</button></div>
    <section class="card form-block">
      <label>Process name</label><input id="process_name" value="${d.process_name}" placeholder="Enter a clear descriptive name for the process you want to evaluate" />
      <label>Process description</label><textarea id="description">${d.description}</textarea>
      <label>SOP document upload (Optional)</label>
      <div class="upload ${filled ? 'done' : ''}">${filled ? 'Vendor_Invoice_Approval_SOP_v2.3.pdf | 8 MB | Successfully uploaded' : 'Click to upload or drag and drop (PDF, DOC or DOCX up to 10 MB)'}</div>
      <div class="cols3">
        <div><label>Process volume</label><input id="volume" value="${d.volume}" /></div>
        <div><label>Process frequency</label><input id="frequency" value="${d.frequency}" /></div>
        <div><label>Exception rate</label><input id="exception_rate" value="${d.exception_rate}" /></div>
      </div>
      <div class="cols3">
        <div><label>Process complexity</label><input id="complexity" value="${d.complexity}" /></div>
        <div><label>Risk tolerance</label><input id="risk_tolerance" value="${d.risk}" /></div>
        <div><label>Compliance sensitivity</label><input id="compliance_sensitivity" value="${d.compliance}" /></div>
      </div>
      <label>Decision point</label><textarea id="decision_points">${d.decision}</textarea>
    </section>

    <div id="confirmModal" class="modal hidden">
      <div class="modal-card float-in">
        <h3>Confirm Submission</h3>
        <p>Are you sure you want to submit this evaluation?</p>
        <div><button id="cancelSubmit">Cancel</button><button id="confirmSubmit" class="btn btn-primary">Confirm</button></div>
      </div>
    </div>
  `, false);

  bindLinks();
  document.getElementById('submitDetails').onclick = () => document.getElementById('confirmModal').classList.remove('hidden');
  document.getElementById('cancelSubmit').onclick = () => document.getElementById('confirmModal').classList.add('hidden');
  document.getElementById('confirmSubmit').onclick = async () => {
    const payload = {
      process_name: document.getElementById('process_name').value,
      description: document.getElementById('description').value,
      volume: document.getElementById('volume').value,
      frequency: document.getElementById('frequency').value,
      exception_rate: Number(document.getElementById('exception_rate').value || 0),
      complexity: Number(document.getElementById('complexity').value || 0),
      risk_tolerance: document.getElementById('risk_tolerance').value,
      compliance_sensitivity: document.getElementById('compliance_sensitivity').value,
      decision_points: document.getElementById('decision_points').value,
      sop_metadata: null,
    };
    await submitEvaluation(payload);
  };
}

function evaluatingScreen() {
  app.innerHTML = shell('evaluations', 'Evaluating..', `
    <section class="card loading-hero official-loader">
      <div class="orbit-wrap">
        <div class="orbit">
          <div class="node n1"></div><div class="node n2"></div><div class="node n3"></div><div class="node n4"></div>
          <div class="node n5"></div><div class="node n6"></div><div class="node n7"></div><div class="node n8"></div>
          <div class="center">Evaluating<br/>your process..</div>
        </div>
      </div>
    </section>
  `, false);
  bindLinks();
}

async function submitEvaluation(payload) {
  state.isLoading = true;
  go('/evaluating');
  try {
    const data = await api('/api/evaluations', 'POST', payload);
    state.lastEvaluation = data;
    state.isLoading = false;
    go(`/results/${data.id}`);
  } catch (err) {
    state.isLoading = false;
    app.innerHTML = shell('evaluations', 'Evaluate a process', `<section class="card empty">${err.message}. Please try again.</section>`, false);
    bindLinks();
  }
}

function scoreValue(input) {
  const n = Number(String(input).replace('%', '').trim());
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function scoreSubtitle(score) {
  if (score <= 40) return 'Low automation potential';
  if (score <= 70) return 'Medium automation potential';
  return 'High automation potential';
}

function circularScoreCard(title, score, subtitle, cls) {
  const pct = score || 0;
  const ring = `conic-gradient(#f4e85c ${pct * 3.6}deg, rgba(255,255,255,.35) 0deg)`;
  return `<article class="grad ${cls} score-card"><h4>${title}</h4><div class="ring" style="background:${ring}"><span>${pct}%</span></div><p>${subtitle}</p></article>`;
}

function getDimensionMeta(value) {
  const text = String(value).trim();
  const lowered = text.toLowerCase();
  const numeric = scoreValue(text);
  if (numeric !== null) {
    if (numeric >= 67) return { pct: numeric, tone: 'red' };
    if (numeric >= 34) return { pct: numeric, tone: 'orange' };
    return { pct: numeric, tone: 'green' };
  }
  if (lowered.includes('high')) return { pct: 100, tone: 'red' };
  if (lowered.includes('medium') || lowered.includes('moderate')) return { pct: 50, tone: 'orange' };
  if (lowered.includes('structured') || lowered.includes('low')) return { pct: 25, tone: 'green' };
  return { pct: 40, tone: 'orange' };
}

function formatLabel(input) {
  return input.split('_').map((x) => x.charAt(0).toUpperCase() + x.slice(1)).join(' ');
}

function dimensionCards(chars) {
  const order = [
    'knowledge_intensity', 'decision_intensity', 'data_structure', 'context_awareness', 'exception_handling',
    'orchestration_complexity', 'process_volume', 'process_frequency', 'risk_tolerance', 'compliance_sensitivity', 'business_criticality',
  ];
  if (!chars || typeof chars !== 'object') return '';
  return order.filter((k) => k in chars).map((k) => {
    const v = chars[k];
    const display = typeof v === 'object' ? JSON.stringify(v) : String(v);
    const meta = getDimensionMeta(display);
    return `<article class='card dim'><h6>${formatLabel(k)}</h6><p>${display}</p><div class='dim-track'><i class='${meta.tone}' style='width:${meta.pct}%'></i></div></article>`;
  }).join('');
}

function llmLabel(value) {
  if (value === 'large_LLM') return 'Large LLM';
  if (value === 'small_LLM') return 'Small LLM';
  return value || '';
}

function parseAgentContent(agentResponse) {
  if (!agentResponse || typeof agentResponse !== 'object') return null;
  try {
    const content = agentResponse.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') return null;
    let text = content.trim();
    if (text.startsWith('```')) {
      text = text.split('\n').slice(1).join('\n');
      if (text.endsWith('```')) text = text.slice(0, -3);
      text = text.trim();
    }
    try {
      return JSON.parse(text);
    } catch {
      const first = text.indexOf('{');
      const last = text.lastIndexOf('}');
      if (first !== -1 && last !== -1 && last > first) {
        return JSON.parse(text.slice(first, last + 1));
      }
      throw new Error('not-json');
    }
  } catch {
    return null;
  }
}

async function resultsPage(id) {
  if (state.isLoading) return evaluatingScreen();
  const doc = await api(`/api/evaluations/${id}`);
  const data = (doc.parsed_content && typeof doc.parsed_content === 'object') ? doc.parsed_content : null;
  if (!data || !data.dimensions) return evaluatingScreen();
  const automationScore = scoreValue(data.automation_feasibility_score) || 0;
  const feasibilityScore = scoreValue(data.business_benefit_score?.score ?? data.business_benefit_score) || 0;
  const dimensions = dimensionCards(data.dimensions);
  const parameters = data.parameters && typeof data.parameters === 'object' ? data.parameters : {};
  const recommendations = data.recommendations && typeof data.recommendations === 'object' ? data.recommendations : {};
  const assumptions = Array.isArray(data.assumptions) ? data.assumptions : [];

  app.innerHTML = shell('evaluations', `Evaluation results: ${doc.process_name}`, `
    <section class="result-cards">
      ${circularScoreCard('Automation score', automationScore, scoreSubtitle(automationScore), 'purple')}
      ${circularScoreCard('Feasibility score', feasibilityScore, scoreSubtitle(feasibilityScore), 'lilac')}
      <article class="grad aqua reco-card"><h4>Fitment recommendation</h4><strong>${data.fitment || ''}</strong></article>
      <article class="grad mint reco-card"><h4>LLM recommendation</h4><strong>${llmLabel(recommendations.llm_recommendation)}</strong></article>
    </section>
    <section><h3 class='section-title'>Process Dimensions</h3><div class="dim-grid three-col">${dimensions}</div></section>
    <section><h3 class='section-title'>Business Impact Breakdown</h3><div class='impact-grid'>${Object.entries(parameters).map(([name, val]) => {
      const score = Number(val?.score || 0);
      const pct = Math.max(0, Math.min(100, (score / 5) * 100));
      return `<article class='card impact-card'><h4>${name}</h4><div class='impact-score'>${score}</div><div class='impact-track'><i style='width:${pct}%'></i></div><p>${val?.justification || ''}</p></article>`;
    }).join('')}</div></section>
    <section><h3 class='section-title'>Recommendations</h3><div class='rec-grid'><article class='card rec-list'><h4>Top point solutions</h4>${(recommendations.top_point_solutions || []).map((s)=>`<div>${s}</div>`).join('')}</article><article class='card rec-list'><h4>Top language models</h4>${(recommendations.top_models || []).map((m)=>`<div>${m}</div>`).join('')}</article></div></section>
    ${recommendations.notes ? `<section class='card notes-block'><h3>Implementation Notes</h3><p>${recommendations.notes}</p></section>` : ''}
    ${assumptions.length ? `<details class='card assumptions-block'><summary>Assumptions</summary><ul>${assumptions.map((x)=>`<li>${x}</li>`).join('')}</ul></details>` : ''}
  `, false);
  bindLinks();
}

async function evaluationsPage() {
  const rows = await api('/api/evaluations');
  app.innerHTML = shell('evaluations', 'My Evaluations', `
    <div class="table-actions"><button id="newEval" class="btn btn-primary">+ Evaluate a process</button></div>
    <table class="table card">
      <thead><tr><th>Process name</th><th>Created on</th><th>Automation score</th><th>Feasibility score</th><th>Fitment type</th><th>Status</th></tr></thead>
      <tbody>${rows.map((r) => `<tr data-id='${r.id}'><td>${r.process_name}</td><td>${new Date(r.created_at).toLocaleString()}</td><td>${r.automation_score ?? '-'}</td><td>${r.feasibility_score ?? '-'}</td><td>${r.fitment ?? '-'}</td><td>${r.status}</td></tr>`).join('') || '<tr><td colspan="6">No evaluations yet.</td></tr>'}</tbody>
    </table>
  `, false);
  bindLinks();
  document.getElementById('newEval').onclick = () => go('/evaluate');
  document.querySelectorAll('tbody tr[data-id]').forEach((tr) => tr.onclick = () => go(`/results/${tr.dataset.id}`));
}

function extractUseCases(response) {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (typeof response === 'object') {
    const parsed = parseAgentContent(response);
    if (parsed && Array.isArray(parsed.use_cases)) return parsed.use_cases;
    for (const key of ['use_cases', 'items', 'recommendations', 'results', 'data']) {
      if (Array.isArray(response[key])) return response[key];
    }
  }
  return [];
}

function numericRating(item) {
  const v = item.rating ?? item.score ?? 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function renderUseCaseCards(items, mode) {
  if (!items.length) return '<section class="card empty">No use cases found.</section>';
  const sorted = [...items].sort((a, b) => numericRating(b) - numericRating(a));
  return `<div class='ucase card'><div class='uc-head'>${mode === 'company' ? '<span>Use case</span><span>Domain</span><span>Ratings</span>' : '<span>Use case</span><span>Ratings</span>'}</div>${sorted.map((it, idx) => {
    const title = it.title || it.use_case || it.name || '';
    const domain = it.domain || it.category || '';
    const rating = it.rating ?? it.score ?? '';
    const row = mode === 'company'
      ? `<div class='uc-row ${idx===0?'open':''}'><span>${title}</span><span>${domain}</span><span>★ ${rating}</span></div>`
      : `<div class='uc-row ${idx===0?'open':''}'><span>${title}</span><span>★ ${rating}</span></div>`;
    const detailParts = [it.description, it.benefits, it.implementation_steps, it.ai_type, it.complexity, it.roi_estimate, it.implementation_roadmap].filter(Boolean);
    return `${row}${idx===0 && detailParts.length ? `<div class='uc-detail'>${detailParts.map((x)=>`<p>${x}</p>`).join('')}</div>` : ''}`;
  }).join('')}</div>`;
}

function renderDomainRows(items) {
  if (state.domainLoading) return '<section class="card empty"><div class="search-icon">⌕</div>Search by domain, role or objective to discover relevant AI use cases..</section>';
  return renderUseCaseCards(items, 'domain');
}

async function domainPage() {
  const rows = extractUseCases(state.domainResult);
  app.innerHTML = shell('usecases', 'AI use-case discovery - By domain', `
    <section class='search card'><input id='domain' placeholder='Domain'/><input id='role' placeholder='User role'/><input id='objective' placeholder='Objective'/><button id='discoverDomain' class='btn btn-primary'>Discover</button></section>
    ${renderDomainRows(rows)}
  `, false);
  bindLinks();
  document.getElementById('discoverDomain').onclick = async () => {
    const domain = document.getElementById('domain').value;
    const user_role = document.getElementById('role').value;
    const objective = document.getElementById('objective').value;
    state.domainLoading = true;
    domainPage();
    try {
      const response = await api('/api/use-cases/domain', 'POST', {
        domain,
        user_role,
        objective,
      });
      state.domainResult = response.agent_response;
    } catch {
      state.domainResult = [];
    } finally {
      state.domainLoading = false;
    }
    domainPage();
  };
}

function renderCompanyRows(items) {
  if (state.companyLoading) return '<section class="card empty">Discovering use cases.. please wait.</section>';
  return renderUseCaseCards(items, 'company');
}

async function companyPage() {
  const rows = extractUseCases(state.companyResult);
  app.innerHTML = shell('usecases', 'AI use-case discovery - By company', `
    <section class='search company card'><input id='companyName' placeholder='Company name'/><button id='discoverCompany' class='btn btn-primary'>Discover</button></section>
    ${renderCompanyRows(rows)}
  `, false);
  bindLinks();
  document.getElementById('discoverCompany').onclick = async () => {
    const company_name = document.getElementById('companyName').value;
    state.companyLoading = true;
    companyPage();
    try {
      const response = await api('/api/use-cases/company', 'POST', { company_name });
      state.companyResult = response.agent_response;
    } catch {
      state.companyResult = [];
    } finally {
      state.companyLoading = false;
    }
    companyPage();
  };
}


async function verifyEmailPage() {
  const token = new URLSearchParams(location.search).get('token');
  let message = 'Missing verification token';
  if (token) {
    try {
      const result = await api(`/api/auth/verify-email?token=${encodeURIComponent(token)}`,'GET');
      message = result.message || 'Email verified successfully';
    } catch (err) {
      message = err.message;
    }
  }
  app.innerHTML = `<main class="page fade-in"><section class="card empty"><h2>Email verification</h2><p>${message}</p><button class='btn btn-primary' id='goLogin'>Go to login</button></section></main>`;
  document.getElementById('goLogin').onclick = () => go('/login');
}

async function render() {
  const path = location.pathname;
  if (!state.token && !['/login', '/signup'].includes(path)) return go('/login');
  if (path === '/login') return authPage(false);
  if (path === '/signup') return authPage(true);
  if (path === '/verify-email') return verifyEmailPage();
  if (path === '/') return dashboard();
  if (path === '/dashboard/open-menu') { state.dashboardMenuOpen = true; return dashboard(); }
  if (path === '/evaluate') return evaluateForm(false);
  if (path === '/evaluating') return evaluatingScreen();
  if (path === '/evaluate/filled') return evaluateForm(true);
  if (path === '/my-evaluations') return evaluationsPage();
  if (path === '/use-cases/domain') return domainPage();
  if (path === '/use-cases/company') return companyPage();
  if (path.startsWith('/results/')) return resultsPage(path.split('/').pop());
  go('/');
}

render();
