/**
 * Trader$ Draft — App Controller
 */
(async function App() {
  // ---------- State ----------
  let state = {
    assetClass: 'forex',
    direction: 'long',
    activeAccount: null,
    accounts: [],
    checklistRules: [],
    checkedItems: new Set(),
    lastCalcResult: null
  };

  // ---------- Init ----------
  await DB.open();
  await Seed.runIfNeeded();
  await loadAccounts();
  await loadChecklist();
  bindEvents();
  setAssetClass('forex');
  setDirection('long');
  recalculate();

  // ---------- Data loading ----------
  async function loadAccounts() {
    state.accounts = await DB.Accounts.all();
    const activeId = await DB.Settings.get('activeAccountId');
    state.activeAccount = state.accounts.find(a => a.id === activeId) || state.accounts[0] || null;

    const sel = document.getElementById('accountSelector');
    sel.innerHTML = state.accounts.map(a =>
      `<option value="${a.id}" ${a.id === state.activeAccount?.id ? 'selected' : ''}>${escapeHtml(a.name)} · $${a.capital.toLocaleString()}</option>`
    ).join('');

    if (state.activeAccount) {
      document.getElementById('capitalInput').value = state.activeAccount.capital;
    }
  }

  async function loadChecklist() {
    const rules = await DB.ChecklistRules.all();
    state.checklistRules = rules.sort((a, b) => a.order - b.order).filter(r => r.enabled);
    renderChecklist();
  }

  // ---------- Rendering ----------
  function renderChecklist() {
    const container = document.getElementById('checklistItems');
    container.innerHTML = state.checklistRules.map(rule => `
      <label class="flex items-start gap-2.5 p-2.5 rounded-lg border border-border bg-panel2/50 hover:bg-panel2 cursor-pointer transition group">
        <input type="checkbox" data-rule-id="${rule.id}" class="checklist-checkbox mt-0.5 rounded border-border bg-panel2 accent-good w-4 h-4 flex-shrink-0" />
        <span class="text-xs text-slate-300 group-has-[:checked]:text-slate-500 group-has-[:checked]:line-through">${escapeHtml(rule.label)}</span>
      </label>
    `).join('');

    container.querySelectorAll('.checklist-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = e.target.dataset.ruleId;
        if (e.target.checked) state.checkedItems.add(id);
        else state.checkedItems.delete(id);
        updateLogButton();
      });
    });
  }

  function updateLogButton() {
    const btn = document.getElementById('logTradeBtn');
    const allChecked = state.checklistRules.length > 0 &&
      state.checklistRules.every(r => state.checkedItems.has(r.id));
    const hasValidCalc = state.lastCalcResult && state.lastCalcResult.valid;

    if (allChecked && hasValidCalc) {
      btn.disabled = false;
      btn.textContent = '✅ Log Trade to Journal';
      btn.className = 'w-full mt-5 py-2.5 rounded-xl text-sm font-semibold bg-good text-slate-900 hover:bg-good/90 transition cursor-pointer';
    } else {
      btn.disabled = true;
      btn.textContent = hasValidCalc ? '🔒 Complete checklist to log trade' : '🔒 Enter valid trade details first';
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
    const extraLabel = document.getElementById('assetExtraLabel');
    const extraInput = document.getElementById('assetExtraInput');
    const jpyWrap = document.getElementById('jpyToggleWrap');

    jpyWrap.classList.add('hidden');
    jpyWrap.classList.remove('flex');
    extraField.classList.remove('hidden');

    if (assetClass === 'forex') {
      extraLabel.textContent = 'Pip Value ($/pip/lot)';
      extraInput.value = 10;
      jpyWrap.classList.remove('hidden');
      jpyWrap.classList.add('flex');
    } else if (assetClass === 'indices') {
      extraLabel.textContent = 'Point Value ($/point/contract)';
      extraInput.value = 1;
    } else if (assetClass === 'gold') {
      extraLabel.textContent = 'Point Value ($/point/lot)';
      extraInput.value = 100;
    } else {
      extraField.classList.add('hidden'); // crypto: no extra field needed
    }

    recalculate();
  }

  function setDirection(direction) {
    state.direction = direction;
    document.querySelectorAll('.dir-btn').forEach(btn => {
      const active = btn.dataset.dir === direction;
      btn.className = `dir-btn px-3 py-1 text-xs font-medium rounded-md transition ${
        active
          ? (direction === 'long' ? 'bg-good/20 text-good' : 'bg-bad/20 text-bad')
          : 'text-slate-500 hover:text-slate-300'
      }`;
    });
    recalculate();
  }

  // ---------- Calculation ----------
  function recalculate() {
    const capital = parseFloat(document.getElementById('capitalInput').value);
    const riskPercent = parseFloat(document.getElementById('riskInput').value);
    const entry = parseFloat(document.getElementById('entryInput').value);
    const sl = parseFloat(document.getElementById('slInput').value);
    const tp = parseFloat(document.getElementById('tpInput').value);
    const isJPYPair = document.getElementById('jpyToggle').checked;
    const extraVal = parseFloat(document.getElementById('assetExtraInput').value);

    const input = {
      assetClass: state.assetClass,
      capital, riskPercent, entry, sl, tp,
      direction: state.direction,
      isJPYPair,
      pipValueOverride: state.assetClass === 'forex' ? extraVal : undefined,
      pointValueOverride: ['indices', 'gold'].includes(state.assetClass) ? extraVal : undefined
    };

    const result = Calculator.calculate(input);
    state.lastCalcResult = result;
    renderResults(result);
    renderInstructor(result);
    updateLogButton();
  }

  function renderResults(result) {
    const errBox = document.getElementById('calcErrors');
    if (!result.valid) {
      if (entry_or_sl_or_tp_empty()) {
        errBox.classList.add('hidden');
      } else {
        errBox.classList.remove('hidden');
        errBox.innerHTML = result.errors.map(e => `<p>⚠ ${escapeHtml(e)}</p>`).join('');
      }
      document.getElementById('resPositionSize').textContent = '—';
      document.getElementById('resRiskAmount').textContent = '—';
      document.getElementById('resPotentialProfit').textContent = '—';
      document.getElementById('resRR').textContent = '—';
      return;
    }

    errBox.classList.add('hidden');
    document.getElementById('resPositionSize').textContent = result.positionSize.toLocaleString(undefined, { maximumFractionDigits: 6 });
    document.getElementById('resSizeUnit').textContent = result.sizeUnit;
    document.getElementById('resRiskAmount').textContent = `$${result.riskAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('resPotentialProfit').textContent = `$${result.potentialProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('resRR').textContent = `1 : ${result.rrRatio}`;
  }

  function entry_or_sl_or_tp_empty() {
    return !document.getElementById('entryInput').value ||
           !document.getElementById('slInput').value ||
           !document.getElementById('tpInput').value;
  }

  function renderInstructor(result) {
    const box = document.getElementById('instructorMessages');
    if (!result.valid) {
      box.innerHTML = `<p class="text-xs text-slate-500">Fill in your trade details above to receive live risk feedback.</p>`;
      return;
    }

    const riskPercent = parseFloat(document.getElementById('riskInput').value);
    const messages = Instructor.analyze(result, { riskPercent });

    if (messages.length === 0) {
      box.innerHTML = `<p class="text-xs text-good">✓ No issues detected with this setup.</p>`;
      return;
    }

    const styles = {
      good: 'bg-good/10 border-good/30 text-good',
      warn: 'bg-warn/10 border-warn/30 text-warn',
      bad: 'bg-bad/10 border-bad/30 text-bad'
    };
    const icons = { good: '✓', warn: '⚠', bad: '✕' };

    box.innerHTML = messages.map(m => `
      <div class="flex items-start gap-2 text-xs border rounded-lg p-2.5 ${styles[m.level]}">
        <span class="flex-shrink-0">${icons[m.level]}</span>
        <span>${escapeHtml(m.message)}</span>
      </div>
    `).join('');
  }

  // ---------- Trade logging ----------
  async function logTrade() {
    if (!state.lastCalcResult?.valid || !state.activeAccount) return;

    const entry = parseFloat(document.getElementById('entryInput').value);
    const sl = parseFloat(document.getElementById('slInput').value);
    const tp = parseFloat(document.getElementById('tpInput').value);
    const riskPercent = parseFloat(document.getElementById('riskInput').value);

    await DB.Trades.create({
      accountId: state.activeAccount.id,
      assetClass: state.assetClass,
      symbol: state.assetClass.toUpperCase(),
      direction: state.direction,
      entry, sl, tp,
      riskPercent,
      riskAmount: state.lastCalcResult.riskAmount,
      rrRatio: state.lastCalcResult.rrRatio,
      lotSize: state.lastCalcResult.positionSize,
      notes: ''
    });

    // Reset checklist + inputs for next trade
    state.checkedItems.clear();
    document.querySelectorAll('.checklist-checkbox').forEach(cb => cb.checked = false);
    ['entryInput', 'slInput', 'tpInput'].forEach(id => document.getElementById(id).value = '');
    recalculate();

    showToast('Trade logged to journal ✅');
  }

  function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-good text-slate-900 text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg z-50 animate-pulse';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2200);
  }

  // ---------- Events ----------
  function bindEvents() {
    document.querySelectorAll('.asset-tab').forEach(btn => {
      btn.addEventListener('click', () => setAssetClass(btn.dataset.asset));
    });
    document.querySelectorAll('.dir-btn').forEach(btn => {
      btn.addEventListener('click', () => setDirection(btn.dataset.dir));
    });
    ['capitalInput', 'riskInput', 'entryInput', 'slInput', 'tpInput', 'assetExtraInput'].forEach(id => {
      document.getElementById(id).addEventListener('input', recalculate);
    });
    document.getElementById('jpyToggle').addEventListener('change', recalculate);
    document.getElementById('logTradeBtn').addEventListener('click', logTrade);

    document.getElementById('accountSelector').addEventListener('change', async (e) => {
      const acc = state.accounts.find(a => a.id === e.target.value);
      if (acc) {
        state.activeAccount = acc;
        await DB.Settings.set('activeAccountId', acc.id);
        document.getElementById('capitalInput').value = acc.capital;
        recalculate();
      }
    });
  }

  // ---------- Utils ----------
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
