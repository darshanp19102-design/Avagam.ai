const app = document.getElementById('app');
const API_URL = window.__APP_ENV__?.API_URL;

const state = {
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  dashboardMenuOpen: false,
  userMenuOpen: false,
  domainResult: null,
  companyResult: null,
  domainLoading: false,
  companyLoading: false,
  isLoading: false,
  domainFilters: { domain: '', user_role: '', objective: '' },
  companyFilter: '',
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

function logout() {
  state.token = null;
  state.user = null;
  state.userMenuOpen = false;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  go('/login');
}

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
  const initial = (state.user?.first_name || state.user?.company_name || 'K').slice(0, 1).toUpperCase();
  return `
  <header class="topbar">
    <div class="logo">${logoHtml()}</div>
    <nav>
      <a href="/" data-link class="${active === 'dashboard' ? 'active' : ''}">Dashboard</a>
      <a href="/my-evaluations" data-link class="${active === 'evaluations' ? 'active' : ''}">My evaluations</a>
      <a href="/use-cases/domain" data-link class="${active === 'usecases' ? 'active' : ''}">AI use-case discovery</a>
    </nav>
    <div class="top-meta">
      <div class="pill">Growth pack | ${Math.max(0, 100 - (state.dashboardCount || 0))} Evaluation remaining | 8 Days left</div>
      <div class="help-ico">🎧</div>
      <div class="avatar-wrap">
        <button id="userMenuBtn" class="user">${initial}</button>
        <div class="avatar-menu ${state.userMenuOpen ? 'open' : ''}">
          <button id="logoutBtn">Logout</button>
        </div>
      </div>
    </div>
  </header>`;
}

function shell(active, title, body, withFilter = true) {
  return `${topNav(active)}
  <main class="page fade-in">
    <div class="head-row"><h1>${title}</h1>${withFilter ? '<button class="ghost">📅 Last 30 days</button>' : ''}</div>
    ${body}
  </main>`;
}

function bindTopNav() {
  const userMenuBtn = document.getElementById('userMenuBtn');
  if (userMenuBtn) {
    userMenuBtn.onclick = () => {
      state.userMenuOpen = !state.userMenuOpen;
      render();
    };
  }
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.onclick = logout;
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
      <div class="help">🎧 Help & Support</div>
      <div class="auth-card float-in">
        <div class="tabs">
          <button id="goSignIn" class="${signup ? '' : 'on'}">Sign in</button>
          <button id="goSignUp" class="${signup ? 'on' : ''}">Sign up</button>
        </div>
        <h4>${signup ? 'Get started!' : 'Welcome back!'}</h4>
        <small>${signup ? 'Create your Avagama.ai account' : 'Sign in with your Avagama.ai account'}</small>
        <form id="authForm">
          ${signup ? '<label>First name</label><input name="first_name" required />' : ''}
          ${signup ? '<label>Last name</label><input name="last_name" required />' : ''}
          ${signup ? '<label>Company Name</label><input name="company_name" placeholder="Company Inc." required />' : ''}
          <label>Email address</label><input name="email" placeholder="you@company.com" required />
          <label>${signup ? 'Enter password' : 'Password'}</label><input type="password" name="password" placeholder="********" required />
          ${signup ? '<label>Re-enter password</label><input type="password" name="confirm" placeholder="********" required />' : '<div class="forgot">Forgot Password?</div>'}
          <div id="authInfo" class="info"></div>
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
    document.getElementById('authError').textContent = '';
    document.getElementById('authInfo').textContent = '';
    try {
      if (signup && f.get('password') !== f.get('confirm')) throw new Error('Passwords do not match');
      const payload = signup
        ? {
          first_name: f.get('first_name'),
          last_name: f.get('last_name'),
          company_name: f.get('company_name'),
          email: f.get('email'),
          password: f.get('password'),
        }
        : { email: f.get('email'), password: f.get('password') };
      const data = await api(signup ? '/api/auth/signup' : '/api/auth/login', 'POST', payload);
      if (signup) {
        document.getElementById('authInfo').textContent = 'Signup successful. Please verify your email and then sign in.';
        go('/login');
        return;
      }
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
  return `<div class="trend-wrap">${points.map((x) => `<div class="trend-item"><div class="trend-bar" style="height:${Math.max(10, (x.count / max) * 120)}px"></div><span>${x.date.slice(5)}</span></div>`).join('')}</div>`;
}

function renderDistributionChart(rows) {
  if (!rows.length) return '<div class="chart-placeholder">No data yet</div>';
  const max = Math.max(...rows.map((x) => x.count), 1);
  return `<div class="dist-wrap">${rows.map((x) => `<div class="dist-row"><label>${x.technology}</label><div class="dist-bar"><i style="width:${(x.count / max) * 100}%"></i></div><span>${x.count}</span></div>`).join('')}</div>`;
}

async function dashboard() {
  const data = await api('/api/dashboard').catch(() => ({ total_evaluations: 0, average_automation_score: 0, charts: { evaluation_trend: [], technology_distribution: [] } }));
  state.dashboardCount = data.total_evaluations || 0;
  const greet = state.user?.first_name || state.user?.company_name || 'Karthik';
  app.innerHTML = shell('dashboard', 'Dashboard', `
    <section class="welcome card fade-up">
      <h2>Hi <span>${greet}</span>, welcome to Avagama.ai!</h2>
      <p>Discover automation opportunities, evaluate business processes, and unlock AI-powered automation for your enterprise.</p>
      <div class="btn-row">
        <button id="startEval" class="btn btn-primary">+ Start new evaluation</button>
        <div class="dropdown-wrap">
          <button id="menuToggle" class="btn btn-light">Discover AI use cases ▾</button>
          <div class="dropdown ${state.dashboardMenuOpen ? 'open' : ''}">
            <button id="domainFocus">Domain Focus</button>
            <button id="companyFocus">Company Focus</button>
          </div>
        </div>
      </div>
    </section>

    <section class="stat-grid">
      <article class="card"><h5>Evaluations completed</h5><div class="num">${data.total_evaluations}</div></article>
      <article class="card"><h5>Avg automation score</h5><div class="num">${data.average_automation_score}</div></article>
      <article class="card"><h5>AI use cases found - Domain</h5><div class="num">${Array.isArray(state.domainResult) ? state.domainResult.length : 0}</div></article>
      <article class="card"><h5>AI use cases found - Company</h5><div class="num">${Array.isArray(state.companyResult) ? state.companyResult.length : 0}</div></article>
    </section>

    <section class="chart-grid">
      <div class="card chart"><h3>Evaluation trends</h3>${renderTrendChart(data.charts?.evaluation_trend || [])}</div>
      <div class="card chart"><h3>Technology distribution</h3>${renderDistributionChart(data.charts?.technology_distribution || [])}</div>
    </section>
  `);

  bindLinks();
  bindTopNav();
  document.getElementById('startEval').onclick = () => go('/evaluate');
  document.getElementById('menuToggle').onclick = () => { state.dashboardMenuOpen = !state.dashboardMenuOpen; dashboard(); };
  document.getElementById('domainFocus').onclick = () => go('/use-cases/domain');
  document.getElementById('companyFocus').onclick = () => go('/use-cases/company');
}

function evaluateForm() {
  app.innerHTML = shell('evaluations', 'Evaluate a process', `
    <div class="top-actions"><button class="ghost">Save as draft</button><button id="submitDetails" class="btn btn-primary">Submit details</button></div>
    <section class="card form-block">
      <label>Process name</label><input id="process_name" placeholder="Enter a clear descriptive name for the process you want to evaluate" />
      <label>Process description</label><textarea id="description" placeholder="Describe the process in details including what it does, key steps, stakeholders involved, current challenges.."></textarea>
      <label>SOP document upload (Optional)</label>
      <div class="upload">Click to upload or drag and drop (PDF, DOC or DOCX up to 10 MB)</div>
      <div class="cols3">
        <div><label>Process volume (transition per month)</label><input id="volume" placeholder="How many processes per month?" /></div>
        <div><label>Process frequency</label><input id="frequency" placeholder="How often the process is executed?" /></div>
        <div><label>Exception rate</label><input id="exception_rate" value="15" /></div>
      </div>
      <div class="cols3">
        <div><label>Process complexity</label><input id="complexity" value="2" /></div>
        <div><label>Risk tolerance</label><input id="risk_tolerance" placeholder="How much is the risk in this process?" /></div>
        <div><label>Compliance sensitivity</label><input id="compliance_sensitivity" placeholder="Does the process adhere to specific standards?" /></div>
      </div>
      <label>Decision point</label><textarea id="decision_points" placeholder="Are there decision points where judgment is required, by a person or AI?"></textarea>
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
  bindTopNav();
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
  app.innerHTML = shell('evaluations', 'Evaluating..', `<section class="card loading-hero"><div class="center">Evaluating your process..</div></section>`, false);
  bindLinks();
  bindTopNav();
}

async function submitEvaluation(payload) {
  state.isLoading = true;
  go('/evaluating');
  try {
    const data = await api('/api/evaluations', 'POST', payload);
    state.isLoading = false;
    go(`/results/${data.id}`);
  } catch (err) {
    state.isLoading = false;
    app.innerHTML = shell('evaluations', 'Evaluate a process', `<section class="card empty">${err.message}. Please try again.</section>`, false);
    bindLinks();
    bindTopNav();
  }
}

function scoreValue(input) {
  const n = Number(String(input).replace('%', '').trim());
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function parseAgentContent(agentResponse) {
  if (!agentResponse || typeof agentResponse !== 'object') return null;
  const content = agentResponse.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string') return null;
  try {
    let text = content.trim();
    if (text.startsWith('```')) {
      text = text.split('\n').slice(1).join('\n').replace(/```$/, '').trim();
    }
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function llmLabel(value) {
  if (value === 'large_LLM') return 'Large LLM';
  if (value === 'small_LLM') return 'Small LLM';
  return value || '-';
}

async function resultsPage(id) {
  if (state.isLoading) return evaluatingScreen();
  const doc = await api(`/api/evaluations/${id}`);
  const data = doc.parsed_content && typeof doc.parsed_content === 'object' ? doc.parsed_content : null;
  if (!data) return evaluatingScreen();
  const recommendations = data.recommendations || {};
  const dims = data.dimensions || {};
  app.innerHTML = shell('evaluations', `Evaluation results: ${doc.process_name}`, `
    <section class="result-cards">
      <article class="grad purple"><h4>Automation score</h4><p>${scoreValue(data.automation_feasibility_score) || 0}%</p></article>
      <article class="grad lilac"><h4>Feasibility score</h4><p>${scoreValue(data.business_benefit_score?.score ?? data.business_benefit_score) || 0}%</p></article>
      <article class="grad aqua"><h4>Fitment recommendation</h4><p>${data.fitment || '-'}</p></article>
      <article class="grad mint"><h4>LLM recommendation</h4><p>${llmLabel(recommendations.llm_recommendation)}</p></article>
    </section>
    <section><h3 class='section-title'>Process Dimensions</h3><div class="dim-grid">${Object.entries(dims).map(([k, v]) => `<article class='card dim'><h6>${k.replace(/_/g, ' ')}</h6><p>${v}</p></article>`).join('')}</div></section>
    <section><h3 class='section-title'>Recommendations</h3><div class='rec-grid'><article class='card rec-list'><h4>Top point solutions</h4>${(recommendations.top_point_solutions || []).map((s) => `<div>${s}</div>`).join('')}</article><article class='card rec-list'><h4>Top language models</h4>${(recommendations.top_models || []).map((m) => `<div>${m}</div>`).join('')}</article></div></section>
  `, false);
  bindLinks();
  bindTopNav();
}

function fitmentBadge(value) {
  const text = value || '-';
  return `<span class="fit-pill">${text}</span>`;
}

async function evaluationsPage() {
  const rows = await api('/api/evaluations');
  app.innerHTML = shell('evaluations', 'My Evaluations', `
    <div class="table-actions"><button id="newEval" class="btn btn-primary">+ Evaluate a process</button></div>
    <table class="table card">
      <thead><tr><th>Process name</th><th>Created on</th><th>Automation score</th><th>Feasibility score</th><th>Fitment type</th><th>Status</th></tr></thead>
      <tbody>${rows.map((r) => `<tr data-id='${r.id}'><td>${r.process_name}</td><td>${new Date(r.created_at).toLocaleString()}</td><td>${r.automation_score ?? '-'}</td><td>${(r.feasibility_score && r.feasibility_score.score) ? r.feasibility_score.score : (r.feasibility_score ?? '-')}</td><td>${fitmentBadge(r.fitment)}</td><td><span class="status ${String(r.status).toLowerCase()}">${r.status}</span></td></tr>`).join('') || '<tr><td colspan="6">No evaluations yet.</td></tr>'}</tbody>
    </table>
  `, false);
  bindLinks();
  bindTopNav();
  document.getElementById('newEval').onclick = () => go('/evaluate');
  document.querySelectorAll('tbody tr[data-id]').forEach((tr) => tr.onclick = () => go(`/results/${tr.dataset.id}`));
}

function extractUseCases(response) {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  const parsed = parseAgentContent(response);
  if (parsed?.use_cases) return parsed.use_cases;
  for (const key of ['use_cases', 'items', 'recommendations', 'results', 'data']) {
    if (Array.isArray(response[key])) return response[key];
  }
  return [];
}

function numericRating(item) {
  const n = Number(item.rating ?? item.score ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function renderUseCaseCards(items, mode) {
  if (!items.length) return '<section class="card empty"><div class="search-icon">⌕</div>Search to discover relevant AI use cases..</section>';
  const sorted = [...items].sort((a, b) => numericRating(b) - numericRating(a));
  return `<div class='ucase card'><div class='uc-head'>${mode === 'company' ? '<span>Use case</span><span>Domain</span><span>Ratings</span>' : '<span>Use case</span><span>Ratings</span>'}</div>${sorted.map((it, idx) => {
    const title = it.title || it.use_case || it.name || '';
    const domain = it.domain || it.category || '';
    const rating = it.rating ?? it.score ?? '';
    const details = it.description || it.benefits || '';
    const row = mode === 'company' ? `<div class='uc-row ${idx === 0 ? 'open' : ''}'><span>${title}</span><span>${domain}</span><span>★ ${rating}</span></div>` : `<div class='uc-row ${idx === 0 ? 'open' : ''}'><span>${title}</span><span>★ ${rating}</span></div>`;
    return `${row}${idx === 0 ? `<div class='uc-detail'>${details}</div>` : ''}`;
  }).join('')}</div>`;
}

async function domainPage() {
  const rows = extractUseCases(state.domainResult);
  app.innerHTML = shell('usecases', 'AI use-case discovery - By domain', `
    <section class='search card'>
      <input id='domain' placeholder='e.g., Finance, Healthcare, Retail' value='${state.domainFilters.domain}'/>
      <input id='role' placeholder='e.g., Operation manager, CTO' value='${state.domainFilters.user_role}'/>
      <input id='objective' placeholder='e.g., Increase process efficiency' value='${state.domainFilters.objective}'/>
      <button id='discoverDomain' class='btn btn-primary'>Discover</button>
    </section>
    ${state.domainLoading ? '<section class="card empty">Loading...</section>' : renderUseCaseCards(rows, 'domain')}
  `, false);
  bindLinks();
  bindTopNav();
  document.getElementById('discoverDomain').onclick = async () => {
    state.domainFilters = {
      domain: document.getElementById('domain').value,
      user_role: document.getElementById('role').value,
      objective: document.getElementById('objective').value,
    };
    state.domainLoading = true;
    domainPage();
    try {
      const response = await api('/api/use-cases/domain', 'POST', state.domainFilters);
      state.domainResult = response.agent_response;
    } catch {
      state.domainResult = [];
    } finally {
      state.domainLoading = false;
    }
    domainPage();
  };
}

async function companyPage() {
  const rows = extractUseCases(state.companyResult);
  app.innerHTML = shell('usecases', 'AI use-case discovery - By company', `
    <section class='search company card'><input id='companyName' placeholder='e.g., Avaali Solutions' value='${state.companyFilter}'/><button id='discoverCompany' class='btn btn-primary'>Discover</button></section>
    ${state.companyLoading ? '<section class="card empty">Loading...</section>' : renderUseCaseCards(rows, 'company')}
  `, false);
  bindLinks();
  bindTopNav();
  document.getElementById('discoverCompany').onclick = async () => {
    state.companyFilter = document.getElementById('companyName').value;
    state.companyLoading = true;
    companyPage();
    try {
      const response = await api('/api/use-cases/company', 'POST', { company_name: state.companyFilter });
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
      const result = await api(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, 'GET');
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
  if (!state.token && !['/login', '/signup', '/verify-email'].includes(path)) return go('/login');
  if (path === '/login') return authPage(false);
  if (path === '/signup') return authPage(true);
  if (path === '/verify-email') return verifyEmailPage();
  if (path === '/') return dashboard();
  if (path === '/evaluate') return evaluateForm();
  if (path === '/evaluating') return evaluatingScreen();
  if (path === '/my-evaluations') return evaluationsPage();
  if (path === '/use-cases/domain') return domainPage();
  if (path === '/use-cases/company') return companyPage();
  if (path.startsWith('/results/')) return resultsPage(path.split('/').pop());
  go('/');
}

render();
