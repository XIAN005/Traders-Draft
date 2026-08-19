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
    lastCalcResult: null,
    newAccountType: 'personal',
    pendingCloseTradeId: null
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
      `<option value="${a.id}" ${a.id === state.activeAccount?.id ? 'selected' : ''}>${escapeHtml(a.nameKey ? I18n.get(a.nameKey) : a.name)} · $${a.capital.toLocaleString()}</option>`
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
          <span class="text-xs text-slate-300 group-has-[:checked]:text-slate-500 group-has-[:checked]:line-through">${escapeHtml(rule.labelKey ? I18n.get(rule.labelKey) : rule.label)}</span>
        </label>
        <button data-delete-rule="${rule.id}" aria-label="Delete rule" class="text-slate-600 hover:text-bad p-1 rounded-md transition shrink-0">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M2 2l8 8M10 2l-8 8"/></svg>
        </button>
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

      const hasUserInput = ['entryInput', 'slInput', 'tpInput'].some(id => document.getElementById(id).value !== '');
      if (hasUserInput && result.errors && result.errors.length) {
        errBox.innerHTML = `<p class="font-medium mb-1">${escapeHtml(I18n.get('calcErrorsTitle'))}</p><ul class="list-disc list-inside space-y-0.5">${
          result.errors.map(code => `<li>${escapeHtml(I18n.get(code))}</li>`).join('')
        }</ul>`;
        errBox.classList.remove('hidden');
      } else {
        errBox.classList.add('hidden');
      }
      return;
    }

    errBox.classList.add('hidden');
    document.getElementById('resPositionSize').textContent = result.positionSize.toLocaleString();
    document.getElementById('resSizeUnit').textContent = I18n.get(result.sizeUnit);
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

    const rMultiples = closedTrades.map(t => t.rMultiple).filter(r => r !== null && r !== undefined && !isNaN(r));
    const expectancyEl = document.getElementById('statExpectancy');
    if (rMultiples.length) {
      const avgR = rMultiples.reduce((sum, r) => sum + r, 0) / rMultiples.length;
      expectancyEl.textContent = `${avgR >= 0 ? '+' : ''}${avgR.toFixed(2)} ${I18n.get('expectancyUnit')}`;
      expectancyEl.className = `mono font-semibold ${avgR >= 0 ? 'text-good' : 'text-bad'}`;
    } else {
      expectancyEl.textContent = '—';
      expectancyEl.className = 'mono text-accent font-semibold';
    }

    const tbody = document.getElementById('journalTableBody');
    if (trades.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="py-4 text-center text-slate-500">${I18n.get('noTrades')}</td></tr>`;
      return;
    }

    tbody.innerHTML = trades.sort((a, b) => b.createdAt - a.createdAt).map(t => `
      <tr class="hover:bg-panel2/40 border-b border-border/30 text-xs">
        <td class="py-2.5 text-slate-400 whitespace-nowrap">${formatDateTime(t.createdAt)}</td>
        <td class="py-2.5 font-medium text-slate-200">${escapeHtml(t.symbol)}</td>
        <td class="py-2.5 font-semibold ${t.direction === 'long' ? 'text-good' : 'text-bad'}">${I18n.get(t.direction === 'long' ? 'dirLong' : 'dirShort').toUpperCase()}</td>
        <td class="py-2.5">$${t.riskAmount.toFixed(2)}</td>
        <td class="py-2.5">1:${t.rrRatio}</td>
        <td class="py-2.5">${t.status === 'open' ? I18n.get('statusOpen') : I18n.get(t.result === 'win' ? 'statusWin' : 'statusLoss')}</td>
        <td class="py-2.5">
          ${t.status === 'open'
            ? `<button data-close-id="${t.id}" class="text-accent hover:underline font-medium">${I18n.get('resultCloseTitle')}</button>`
            : `<span class="mono ${t.rMultiple >= 0 ? 'text-good' : 'text-bad'}">${t.rMultiple !== null && t.rMultiple !== undefined ? (t.rMultiple >= 0 ? '+' : '') + t.rMultiple + 'R' : '—'}</span>
               <button data-delete-trade="${t.id}" aria-label="Delete trade" class="text-slate-600 hover:text-bad ml-2 align-middle">
                 <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M2 2l8 8M10 2l-8 8"/></svg>
               </button>`
          }
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('[data-close-id]').forEach(btn => {
      btn.addEventListener('click', () => openCloseTradeModal(btn.dataset.closeId));
    });

    tbody.querySelectorAll('[data-delete-trade]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        await DB.Trades.delete(e.currentTarget.dataset.deleteTrade);
        await renderJournal();
      });
    });
  }

  // ---- Close-trade modal (captures R-multiple) ----
  function openCloseTradeModal(tradeId) {
    state.pendingCloseTradeId = tradeId;
    document.getElementById('closeTradeRInput').value = '';
    const modal = document.getElementById('closeTradeModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.getElementById('closeTradeRInput').focus();
  }

  function closeCloseTradeModal() {
    state.pendingCloseTradeId = null;
    const modal = document.getElementById('closeTradeModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  async function confirmCloseTrade() {
    const tradeId = state.pendingCloseTradeId;
    if (!tradeId) return;
    const rRaw = document.getElementById('closeTradeRInput').value;
    const rMultiple = parseFloat(rRaw);
    if (isNaN(rMultiple)) return;

    const trade = await DB.Trades.get(tradeId);
    if (trade) {
      trade.status = 'closed';
      trade.result = rMultiple >= 0 ? 'win' : 'loss';
      trade.rMultiple = rMultiple;
      trade.closedAt = Date.now();
      await DB.Trades.save(trade);
      closeCloseTradeModal();
      await renderJournal();
      await recalculate();
    }
  }

  // ---- New-account modal ----
  function setNewAccountType(type) {
    state.newAccountType = type;
    document.querySelectorAll('.acc-type-btn').forEach(btn => {
      const active = btn.dataset.accType === type;
      btn.className = `acc-type-btn flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
        active ? 'bg-accent/10 text-accent border border-accent/30' : 'text-slate-400 hover:text-slate-200'
      }`;
    });
    const dailyLossField = document.getElementById('newAccDailyLossField');
    if (type === 'propfirm') dailyLossField.classList.remove('hidden');
    else dailyLossField.classList.add('hidden');
  }

  function openNewAccountModal() {
    document.getElementById('newAccName').value = '';
    document.getElementById('newAccCapital').value = 10000;
    document.getElementById('newAccCurrency').value = 'USD';
    document.getElementById('newAccDailyLoss').value = '';
    document.getElementById('newAccError').classList.add('hidden');
    setNewAccountType('personal');
    const modal = document.getElementById('newAccountModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.getElementById('newAccName').focus();
  }

  function closeNewAccountModal() {
    const modal = document.getElementById('newAccountModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  async function confirmCreateAccount() {
    const name = document.getElementById('newAccName').value.trim();
    const errorEl = document.getElementById('newAccError');
    if (!name) {
      errorEl.textContent = I18n.get('accNameRequired');
      errorEl.classList.remove('hidden');
      return;
    }

    const capital = parseFloat(document.getElementById('newAccCapital').value) || 10000;
    const currency = (document.getElementById('newAccCurrency').value || 'USD').trim().toUpperCase();
    const type = state.newAccountType;

    let propFirmRules = null;
    if (type === 'propfirm') {
      const dailyLossLimit = parseFloat(document.getElementById('newAccDailyLoss').value);
      propFirmRules = { dailyLossLimit: isNaN(dailyLossLimit) ? null : dailyLossLimit };
    }

    const acc = await DB.Accounts.create({ name, type, capital, currency, propFirmRules });
    await DB.Settings.set('activeAccountId', acc.id);
    closeNewAccountModal();
    await loadAccounts();
    await recalculate();
  }

  function updateInterfaceLanguage(lang) {
    I18n.setLanguage(lang);
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = I18n.get(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = I18n.get(el.dataset.i18nPlaceholder);
    });
    const inputRule = document.getElementById('newRuleInput');
    if (inputRule) inputRule.placeholder = I18n.get('addRulePlaceholder');
    loadAccounts();
    renderChecklist();
    recalculate();
    renderJournal();
  }

  function bindEvents() {
    document.querySelectorAll('.asset-tab').forEach(btn => btn.addEventListener('click', () => setAssetClass(btn.dataset.asset)));
    document.querySelectorAll('.dir-btn').forEach(btn => btn.addEventListener('click', () => setDirection(btn.dataset.dir)));
    ['capitalInput', 'riskInput', 'entryInput', 'slInput', 'tpInput', 'assetExtraInput'].forEach(id => document.getElementById(id).addEventListener('input', recalculate));
    document.getElementById('jpyToggle').addEventListener('change', recalculate);

    document.getElementById('langSelector').addEventListener('change', (e) => updateInterfaceLanguage(e.target.value));

    // New account modal
    document.getElementById('addAccountBtn').addEventListener('click', openNewAccountModal);
    document.getElementById('newAccCancelBtn').addEventListener('click', closeNewAccountModal);
    document.getElementById('newAccountBackdrop').addEventListener('click', closeNewAccountModal);
    document.getElementById('newAccCreateBtn').addEventListener('click', confirmCreateAccount);
    document.querySelectorAll('.acc-type-btn').forEach(btn => btn.addEventListener('click', () => setNewAccountType(btn.dataset.accType)));

    // Close trade modal
    document.getElementById('closeTradeCancelBtn').addEventListener('click', closeCloseTradeModal);
    document.getElementById('closeTradeBackdrop').addEventListener('click', closeCloseTradeModal);
    document.getElementById('closeTradeConfirmBtn').addEventListener('click', confirmCloseTrade);
    document.getElementById('closeTradeRInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') confirmCloseTrade();
    });

    document.getElementById('accountSelector').addEventListener('change', async (e) => {
      const acc = state.accounts.find(a => a.id === e.target.value);
      if (acc) {
        state.activeAccount = acc;
        await DB.Settings.set('activeAccountId', acc.id);
        document.getElementById('capitalInput').value = acc.capital;
        await renderJournal();
        await recalculate();
      }
    });

    document.getElementById('logTradeBtn').addEventListener('click', async () => {
      if (!state.activeAccount || !state.lastCalcResult || !state.lastCalcResult.valid) return;
      const allChecked = state.checklistRules.length > 0 && state.checklistRules.every(r => state.checkedItems.has(r.id));
      if (!allChecked) return;

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
        lotSize: state.lastCalcResult.positionSize
      });

      state.checkedItems.clear();
      renderChecklist();
      updateLogButton();
      await renderJournal();
    });

    document.getElementById('addRuleBtn').addEventListener('click', async () => {
      const input = document.getElementById('newRuleInput');
      const label = input.value.trim();
      if (!label) return;
      const nextOrder = state.checklistRules.length > 0 ? Math.max(...state.checklistRules.map(r => r.order)) + 1 : 1;
      await DB.ChecklistRules.create({ label, category: 'general', isDefault: false, enabled: true, order: nextOrder });
      input.value = '';
      await loadChecklist();
      recalculate();
    });

    document.getElementById('newRuleInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('addRuleBtn').click();
    });

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

  function formatDateTime(timestamp) {
    if (!timestamp) return '—';
    const locale = I18n.getCurrentLang() === 'fr' ? 'fr-FR' : 'en-US';
    const date = new Date(timestamp);
    return date.toLocaleString(locale, {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();