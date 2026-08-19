/**
 * Traft — Application Controller
 */
(async function App() {
  let state = {
    assetClass: 'forex',
    direction: 'long',
    activeAccount: null,
    accounts: [],
    checklistRules: [],
    checkedItems: new Set(),
    lastCalcResult: null
  };

  await DB.open();
  await Seed.runIfNeeded();
  await loadAccounts();
  await loadChecklist();
  bindEvents();
  setAssetClass('forex');
  setDirection('long');
  updateInterfaceLanguage('fr');

  async function loadAccounts() {
    state.accounts = await DB.Accounts.all();
    const activeId = await DB.Settings.get('activeAccountId');
    state.activeAccount = state.accounts.find(a => a.id === activeId) || state.accounts[0] || null;

    const sel = document.getElementById('accountSelector');
    if (state.accounts.length === 0) {
      sel.innerHTML = `<option value="">${I18n.get('instNoAccount')}</option>`;
      document.getElementById('capitalInput').value = '';
      return;
    }

    sel.innerHTML = state.accounts.map(a =>
      `<option value="${a.id}" ${a.id === state.activeAccount?.id ? 'selected' : ''}>${escapeHtml(a.name)} · $${a.capital.toLocaleString()} (${a.type.toUpperCase()})</option>`
    ).join('');

    if (state.activeAccount) {
      document.getElementById('capitalInput').value = state.activeAccount.capital;
      renderJournal();
    }
  }

  async function loadChecklist() {
    const rules = await DB.ChecklistRules.all();
    state.checklistRules = rules.sort((a, b) => a.order - b.order).filter(r => r.enabled);
    renderChecklist();
  }

  function renderChecklist() {
    const container = document.getElementById('checklistItems');
    container.innerHTML = state.checklistRules.map(rule => `
      <div class="flex items-center justify-between p-2 rounded-lg border border-border bg-panel2/50 hover:bg-panel2 transition group">
        <label class="flex items-start gap-2.5 cursor-pointer flex-1">
          <input type="checkbox" data-rule-id="${rule.id}" class="checklist-checkbox mt-0.5 rounded border-border bg-panel2 accent-good w-4 h-4 flex-shrink-0" />
          <span class="text-xs text-slate-300 group-has-[:checked]:text-slate-500 group-has-[:checked]:line-through">${escapeHtml(rule.label)}</span>
        </label>
        <button data-delete-rule="${rule.id}" class="text-slate-600 hover:text-bad text-xs px-1.5 opacity-0 group-hover:opacity-100 transition">✕</button>
      </div>
    `).join('');

    container.querySelectorAll('.checklist-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = e.target.dataset.ruleId;
        if (e.target.checked) state.checkedItems.add(id);
        else state.checkedItems.delete(id);
        updateLogButton();
      });
    });

    container.querySelectorAll('[data-delete-rule]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        await DB.ChecklistRules.delete(e.target.dataset.deleteRule);
        await loadChecklist();
        recalculate();
      });
    });
  }

  function updateLogButton() {
    const btn = document.getElementById('logTradeBtn');
    const allChecked = state.checklistRules.length > 0 && state.checklistRules.every(r => state.checkedItems.has(r.id));
    const hasValidCalc = state.lastCalcResult && state.lastCalcResult.valid;

    if (!state.activeAccount) {
      btn.disabled = true;
      btn.textContent = I18n.get('logBtnNoAccount');
      btn.className = 'w-full mt-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-700/50 text-slate-500 cursor-not-allowed transition';
      return;
    }

    if (allChecked && hasValidCalc) {
      btn.disabled = false;
      btn.textContent = I18n.get('logBtnUnlocked');
      btn.className = 'w-full mt-5 py-2.5 rounded-xl text-sm font-semibold bg-good text-slate-900 hover:bg-good/90 transition cursor-pointer';
    } else {
      btn.disabled = true;
      btn.textContent = I18n.get('logBtnLocked');
      btn.className = 'w-full mt-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-700/50 text-slate-500 cursor-not-allowed transition';
    }
  }

  function setAssetClass(assetClass) {
    state.assetClass = assetClass;
    document.querySelectorAll('.asset-tab').forEach(btn => {
      const active = btn.dataset.asset === assetClass;
      btn.className = `asset-tab px-3 py-1.5 text-xs font-medium rounded-lg transition ${
        active ? 'bg-accent/10 text-accent border border-accent/30' : 'text-slate-400 hover:text-slate-200 border border-transparent'
      }`;
    });

    const extraField = document.getElementById('assetExtraField');
    const extraInput = document.getElementById('assetExtraInput');
    const jpyWrap = document.getElementById('jpyToggleWrap');

    jpyWrap.classList.add('hidden');
    jpyWrap.classList.remove('flex');
    extraField.classList.remove('hidden');

    if (assetClass === 'forex') {
      extraInput.value = 10;
      jpyWrap.classList.remove('hidden');
      jpyWrap.classList.add('flex');
    } else if (assetClass === 'indices') {
      extraInput.value = 1;
    } else if (assetClass === 'gold') {
      extraInput.value = 100;
    } else {
      extraField.classList.add('hidden');
    }

    recalculate();
  }

  function setDirection(direction) {
    state.direction = direction;
    document.querySelectorAll('.dir-btn').forEach(btn => {
      const active = btn.dataset.dir === direction;
      btn.className = `dir-btn px-3 py-1 text-xs font-medium rounded-md transition ${
        active ? (direction === 'long' ? 'bg-good/20 text-good' : 'bg-bad/20 text-bad') : 'text-slate-500 hover:text-slate-300'
      }`;
    });
    recalculate();
  }

  async function recalculate() {
    if (!state.activeAccount) {
      document.getElementById('instructorMessages').innerHTML = `<div class="p-3 bg-warn/10 border border-warn/30 text-warn rounded-lg text-xs">${I18n.get('instNoAccount')}</div>`;
      document.getElementById('resPositionSize').textContent = '—';
      return;
    }

    const capital = parseFloat(document.getElementById('capitalInput').value);
    const riskPercent = parseFloat(document.getElementById('riskInput').value);
    const entry = parseFloat(document.getElementById('entryInput').value);
    const sl = parseFloat(document.getElementById('slInput').value);
    const tp = parseFloat(document.getElementById('tpInput').value);
    const isJPYPair = document.getElementById('jpyToggle').checked;
    
    const extraRaw = document.getElementById('assetExtraInput').value;
    const extraVal = extraRaw !== '' ? parseFloat(extraRaw) : undefined;

    const input = {
      assetClass: state.assetClass, capital, riskPercent, entry, sl, tp,
      direction: state.direction, isJPYPair,
      pipValueOverride: state.assetClass === 'forex' ? extraVal : undefined,
      pointValueOverride: ['indices', 'gold'].includes(state.assetClass) ? extraVal : undefined
    };

    let dailyLossUsed = 0;
    let dailyLossLimit = null;

    if (state.activeAccount?.type === 'propfirm' && state.activeAccount.propFirmRules) {
      dailyLossLimit = Number(state.activeAccount.propFirmRules.dailyLossLimit) || null;
      const startOfToday = new Date().setHours(0, 0, 0, 0);
      const trades = await DB.Trades.byAccount(state.activeAccount.id);
      dailyLossUsed = trades.filter(t => t.status === 'closed' && t.closedAt >= startOfToday && t.result === 'loss')
                            .reduce((sum, t) => sum + (t.riskAmount || 0), 0);
    }

    const result = Calculator.calculate(input);
    state.lastCalcResult = result;
    renderResults(result);
    renderInstructor(result, { riskPercent, capital, dailyLossUsed, dailyLossLimit });
    updateLogButton();
  }

  function renderResults(result) {
    const errBox = document.getElementById('calcErrors');
    if (!result.valid) {
      document.getElementById('resPositionSize').textContent = '—';
      document.getElementById('resRiskAmount').textContent = '—';
      document.getElementById('resPotentialProfit').textContent = '—';
      document.getElementById('resRR').textContent = '—';
      return;
    }

    errBox.classList.add('hidden');
    document.getElementById('resPositionSize').textContent = result.positionSize.toLocaleString();
    document.getElementById('resSizeUnit').textContent = result.sizeUnit;
    document.getElementById('resRiskAmount').textContent = `$${result.riskAmount.toFixed(2)}`;
    document.getElementById('resPotentialProfit').textContent = `$${result.potentialProfit.toFixed(2)}`;
    document.getElementById('resRR').textContent = `1 : ${result.rrRatio}`;
  }

  function renderInstructor(result, context) {
    const box = document.getElementById('instructorMessages');
    if (!result.valid) {
      box.innerHTML = `<p class="text-xs text-slate-500">${I18n.get('instEmpty')}</p>`;
      return;
    }

    const messages = Instructor.analyze(result, context);
    if (messages.length === 0) {
      box.innerHTML = `<p class="text-xs text-good">${I18n.get('instOk')}</p>`;
      return;
    }

    const styles = { good: 'bg-good/10 border-good/30 text-good', warn: 'bg-warn/10 border-warn/30 text-warn', bad: 'bg-bad/10 border-bad/30 text-bad' };
    box.innerHTML = messages.map(m => `
      <div class="flex items-start gap-2 text-xs border rounded-lg p-2.5 ${styles[m.level]}">
        <span>${escapeHtml(m.message)}</span>
      </div>
    `).join('');
  }

  async function renderJournal() {
    if (!state.activeAccount) return;
    const trades = await DB.Trades.byAccount(state.activeAccount.id);
    const closedTrades = trades.filter(t => t.status === 'closed');
    const wins = closedTrades.filter(t => t.result === 'win').length;
    const winRate = closedTrades.length ? Math.round((wins / closedTrades.length) * 100) : 0;

    document.getElementById('statWinRate').textContent = `${winRate}%`;

    const tbody = document.getElementById('journalTableBody');
    if (trades.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="py-4 text-center text-slate-500">${I18n.get('noTrades')}</td></tr>`;
      return;
    }

    tbody.innerHTML = trades.sort((a, b) => b.createdAt - a.createdAt).map(t => `
      <tr class="hover:bg-panel2/40 border-b border-border/30 text-xs">
        <td class="py-2.5 font-medium text-slate-200">${escapeHtml(t.symbol)}</td>
        <td class="py-2.5 font-semibold ${t.direction === 'long' ? 'text-good' : 'text-bad'}">${t.direction.toUpperCase()}</td>
        <td class="py-2.5">$${t.riskAmount.toFixed(2)}</td>
        <td class="py-2.5">1:${t.rrRatio}</td>
        <td class="py-2.5">${t.status === 'open' ? 'OPEN' : t.result.toUpperCase()}</td>
        <td class="py-2.5">
          ${t.status === 'open' ? `
            <button data-close-id="${t.id}" data-result="win" class="text-good hover:underline font-medium mr-1">Win</button>
            <button data-close-id="${t.id}" data-result="loss" class="text-bad hover:underline font-medium">Loss</button>
          ` : '—'}
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('[data-close-id]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const trade = await DB.Trades.get(e.target.dataset.closeId);
        if (trade) {
          trade.status = 'closed';
          trade.result = e.target.dataset.result;
          trade.closedAt = Date.now();
          await DB.Trades.save(trade);
          await renderJournal();
          await recalculate();
        }
      });
    });
  }

  function updateInterfaceLanguage(lang) {
    I18n.setLanguage(lang);
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = I18n.get(el.dataset.i18n);
    });
    const inputRule = document.getElementById('newRuleInput');
    if (inputRule) inputRule.placeholder = I18n.get('addRulePlaceholder');
    recalculate();
    renderJournal();
  }

  function bindEvents() {
    document.querySelectorAll('.asset-tab').forEach(btn => btn.addEventListener('click', () => setAssetClass(btn.dataset.asset)));
    document.querySelectorAll('.dir-btn').forEach(btn => btn.addEventListener('click', () => setDirection(btn.dataset.dir)));
    ['capitalInput', 'riskInput', 'entryInput', 'slInput', 'tpInput', 'assetExtraInput'].forEach(id => document.getElementById(id).addEventListener('input', recalculate));
    document.getElementById('jpyToggle').addEventListener('change', recalculate);

    document.getElementById('langSelector').addEventListener('change', (e) => updateInterfaceLanguage(e.target.value));

    // Tab Switching
    const tabCalcBtn = document.getElementById('tabCalcBtn');
    const tabEduBtn = document.getElementById('tabEduBtn');
    const mainSec = document.getElementById('mainCalcSection');
    const eduSec = document.getElementById('educationSection');

    tabCalcBtn.addEventListener('click', () => {
      eduSec.classList.add('hidden');
      mainSec.classList.remove('hidden');
      tabCalcBtn.className = "main-tab flex-1 py-2 text-xs font-semibold rounded-lg bg-accent/10 text-accent border border-accent/30 transition";
      tabEduBtn.className = "main-tab flex-1 py-2 text-xs font-semibold rounded-lg text-slate-400 hover:text-slate-200 transition";
    });

    tabEduBtn.addEventListener('click', () => {
      mainSec.classList.add('hidden');
      eduSec.classList.remove('hidden');
      tabEduBtn.className = "main-tab flex-1 py-2 text-xs font-semibold rounded-lg bg-accent/10 text-accent border border-accent/30 transition";
      tabCalcBtn.className = "main-tab flex-1 py-2 text-xs font-semibold rounded-lg text-slate-400 hover:text-slate-200 transition";
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();