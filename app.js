/**
 * Traft — Application Controller
 */
(async function App() {
  let state = {
    assetClass: 'forex',
    selectedSymbol: {},
    pipFetchToken: 0,
    baseRateFetchToken: 0,
    priceFetchToken: 0,
    lastBaseToUsdRate: null,
    lastBaseToUsdSymbol: null,
    direction: 'long',
    activeAccount: null,
    accounts: [],
    checklistRules: [],
    checkedItems: new Set(),
    lastCalcResult: null,
    newAccountType: 'personal',
    pendingCloseTradeId: null,
    pendingDeleteAccountId: null,
    pendingNoteTradeId: null,
    beginnerMode: true
  };

  function isBeginnerMode() {
    return state.beginnerMode;
  }

  function applyBeginnerMode() {
    document.querySelectorAll('.beginner-help').forEach(el => {
      el.classList.toggle('hidden', !state.beginnerMode);
    });
  }

  await DB.open();
  await Seed.runIfNeeded();
  state.beginnerMode = await DB.Settings.get('beginnerMode', true);
  document.getElementById('beginnerModeToggle').checked = state.beginnerMode;
  applyBeginnerMode();
  I18n.setLanguage('fr');
  document.getElementById('langSelector').value = 'fr';
  await loadAccounts();
  await loadChecklist();
  bindEvents();
  applyStaticTranslations();
  setAssetClass('forex');
  setDirection('long');
  await renderJournal();

  async function loadAccounts() {
    state.accounts = await DB.Accounts.all();
    const activeId = await DB.Settings.get('activeAccountId');
    state.activeAccount = state.accounts.find(a => a.id === activeId) || state.accounts[0] || null;

    const sel = document.getElementById('accountSelector');
    if (state.accounts.length === 0) {
      sel.innerHTML = `<option value="">${I18n.get('instNoAccount')}</option>`;
      document.getElementById('capitalInput').value = '';
      const delBtn0 = document.getElementById('deleteAccountBtn');
      delBtn0.disabled = true;
      delBtn0.title = I18n.get('delAccountLastOne');
      return;
    }

    sel.innerHTML = state.accounts.map(a =>
      `<option value="${a.id}" ${a.id === state.activeAccount?.id ? 'selected' : ''}>${escapeHtml(a.nameKey ? I18n.get(a.nameKey) : a.name)} · $${a.capital.toLocaleString()}</option>`
    ).join('');

    if (state.activeAccount) {
      document.getElementById('capitalInput').value = state.activeAccount.capital;
      renderJournal();
    }

    const delBtn = document.getElementById('deleteAccountBtn');
    delBtn.disabled = state.accounts.length <= 1;
    delBtn.title = state.accounts.length <= 1 ? I18n.get('delAccountLastOne') : I18n.get('delAccountTitle');
  }

  async function loadChecklist() {
    const rules = await DB.ChecklistRules.all();
    state.checklistRules = rules.sort((a, b) => a.order - b.order).filter(r => r.enabled);
    renderChecklist();
  }

  function renderChecklist() {
    const container = document.getElementById('checklistItems');
    container.innerHTML = state.checklistRules.map((rule, idx) => `
      <div class="flex items-center justify-between p-2.5 rounded-xl border border-border bg-panel2/50 hover:bg-panel2 transition group">
        <div class="flex flex-col shrink-0 mr-1">
          <button data-move-up="${rule.id}" ${idx === 0 ? 'disabled' : ''} aria-label="Move up" class="text-slate-600 hover:text-accent disabled:opacity-20 disabled:hover:text-slate-600 p-0.5 transition">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 6.5L5 3l3.5 3.5"/></svg>
          </button>
          <button data-move-down="${rule.id}" ${idx === state.checklistRules.length - 1 ? 'disabled' : ''} aria-label="Move down" class="text-slate-600 hover:text-accent disabled:opacity-20 disabled:hover:text-slate-600 p-0.5 transition">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 3.5L5 7l3.5-3.5"/></svg>
          </button>
        </div>
        <label class="flex items-start gap-2.5 cursor-pointer flex-1">
          <input type="checkbox" data-rule-id="${rule.id}" class="checklist-checkbox mt-0.5 rounded border-border bg-panel2 accent-good w-4 h-4 flex-shrink-0" />
          <span class="text-xs text-slate-300 group-has-[:checked]:text-slate-500 group-has-[:checked]:line-through">${escapeHtml(rule.labelKey ? I18n.get(rule.labelKey) : rule.label)}</span>
        </label>
        <button data-delete-rule="${rule.id}" aria-label="Delete rule" class="text-slate-600 hover:text-bad p-1 rounded-lg transition shrink-0">
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
        const ruleId = e.currentTarget.dataset.deleteRule;
        await DB.ChecklistRules.delete(ruleId);
        state.checkedItems.delete(ruleId);
        await loadChecklist();
        recalculate();
      });
    });

    container.querySelectorAll('[data-move-up]').forEach(btn => {
      btn.addEventListener('click', () => reorderRule(btn.dataset.moveUp, -1));
    });
    container.querySelectorAll('[data-move-down]').forEach(btn => {
      btn.addEventListener('click', () => reorderRule(btn.dataset.moveDown, 1));
    });
  }

  async function reorderRule(ruleId, direction) {
    const idx = state.checklistRules.findIndex(r => r.id === ruleId);
    const swapIdx = idx + direction;
    if (idx === -1 || swapIdx < 0 || swapIdx >= state.checklistRules.length) return;

    const a = state.checklistRules[idx];
    const b = state.checklistRules[swapIdx];
    const aOrder = a.order;
    a.order = b.order;
    b.order = aOrder;

    await DB.ChecklistRules.save(a);
    await DB.ChecklistRules.save(b);
    await loadChecklist();
  }

  function updateLogButton() {
    const btn = document.getElementById('logTradeBtn');
    const allChecked = state.checklistRules.length > 0 && state.checklistRules.every(r => state.checkedItems.has(r.id));
    const hasValidCalc = state.lastCalcResult && state.lastCalcResult.valid;

    if (!state.activeAccount) {
      btn.disabled = true;
      btn.textContent = I18n.get('logBtnNoAccount');
      btn.className = 'w-full mt-5 py-3 rounded-2xl text-sm font-semibold bg-slate-700/50 text-slate-500 cursor-not-allowed transition';
      return;
    }

    if (allChecked && hasValidCalc) {
      btn.disabled = false;
      btn.textContent = I18n.get('logBtnUnlocked');
      btn.className = 'w-full mt-5 py-3 rounded-2xl text-sm font-semibold bg-good text-slate-900 hover:bg-good/90 transition cursor-pointer';
    } else {
      btn.disabled = true;
      btn.textContent = I18n.get('logBtnLocked');
      btn.className = 'w-full mt-5 py-3 rounded-2xl text-sm font-semibold bg-slate-700/50 text-slate-500 cursor-not-allowed transition';
    }
  }

  function setAssetClass(assetClass) {
    state.assetClass = assetClass;
    document.querySelectorAll('.asset-tab').forEach(btn => {
      const active = btn.dataset.asset === assetClass;
      btn.className = `asset-tab px-3.5 py-2 text-xs font-medium rounded-xl transition ${
        active ? 'bg-accent/10 text-accent border border-accent/30' : 'text-slate-400 hover:text-slate-200 border border-transparent'
      }`;
    });

    const extraField = document.getElementById('assetExtraField');
    const extraInput = document.getElementById('assetExtraInput');
    const jpyWrap = document.getElementById('jpyToggleWrap');
    const pairField = document.getElementById('pairSelectField');
    const pairLabel = document.getElementById('pairSelectLabel');

    jpyWrap.classList.add('hidden');
    jpyWrap.classList.remove('flex');
    extraField.classList.remove('hidden');
    pairField.classList.add('hidden');
    document.getElementById('pipLiveTag').classList.add('hidden');

    if (assetClass === 'forex') {
      pairField.classList.remove('hidden');
      pairLabel.dataset.i18n = 'pairLabel';
      pairLabel.textContent = I18n.get('pairLabel');
      populatePairSelect();
      applyPairSelection();
    } else if (assetClass === 'crypto') {
      pairField.classList.remove('hidden');
      pairLabel.dataset.i18n = 'pairLabelCrypto';
      pairLabel.textContent = I18n.get('pairLabelCrypto');
      extraField.classList.add('hidden');
      populatePairSelect();
      applyPairSelection();
    } else if (assetClass === 'indices') {
      pairField.classList.remove('hidden');
      pairLabel.dataset.i18n = 'pairLabelIndex';
      pairLabel.textContent = I18n.get('pairLabelIndex');
      populatePairSelect();
      applyPairSelection();
    } else if (assetClass === 'gold') {
      extraInput.value = 100;
    }

    recalculate();
  }

  function populatePairSelect() {
    const pairSelect = document.getElementById('pairSelect');
    let list = [];
    if (state.assetClass === 'forex') list = Calculator.FOREX_PAIRS.map(p => p.symbol);
    else if (state.assetClass === 'crypto') list = Calculator.CRYPTO_PAIRS;
    else if (state.assetClass === 'indices') list = Calculator.INDEX_PAIRS.map(p => p.symbol);

    const options = list.map(sym => {
      const display = state.assetClass === 'forex' ? `${sym.slice(0, 3)}/${sym.slice(3)}` : sym;
      return `<option value="${sym}">${display}</option>`;
    }).join('');
    pairSelect.innerHTML = options + `<option value="OTHER">${I18n.get('pairOther')}</option>`;

    if (!state.selectedSymbol[state.assetClass]) {
      state.selectedSymbol[state.assetClass] = list[0] || 'OTHER';
    }
    pairSelect.value = state.selectedSymbol[state.assetClass];
  }

  function applyPairSelection() {
    const pairSelect = document.getElementById('pairSelect');
    const extraInput = document.getElementById('assetExtraInput');
    const jpyToggle = document.getElementById('jpyToggle');
    const pipLiveTag = document.getElementById('pipLiveTag');
    const symbol = pairSelect.value;
    state.selectedSymbol[state.assetClass] = symbol;

    if (state.assetClass === 'forex') {
      if (symbol === 'OTHER') {
        extraInput.value = 10;
        jpyToggle.checked = false;
        pipLiveTag.classList.add('hidden');
        return;
      }
      const pair = Calculator.FOREX_PAIRS.find(p => p.symbol === symbol);
      if (!pair) return;

      // Instant fill with static fallback so the field is never empty,
      // then silently refine with a live rate if available.
      extraInput.value = pair.pipValue;
      jpyToggle.checked = pair.isJPY;
      pipLiveTag.classList.add('hidden');

      const requestId = ++state.pipFetchToken;
      FxRates.getForexPipValueUSD(symbol, pair.isJPY).then(liveValue => {
        // Ignore stale responses (user switched pair/asset class meanwhile)
        if (requestId !== state.pipFetchToken) return;
        if (liveValue !== null && state.selectedSymbol.forex === symbol) {
          extraInput.value = liveValue;
          pipLiveTag.classList.remove('hidden');
          recalculate();
        }
      });
    } else if (state.assetClass === 'indices') {
      if (symbol === 'OTHER') {
        extraInput.value = 1;
        return;
      }
      const idx = Calculator.INDEX_PAIRS.find(p => p.symbol === symbol);
      if (idx) extraInput.value = idx.pointValue;
    } else if (state.assetClass === 'crypto') {
      const priceLiveTag = document.getElementById('priceLiveTag');
      if (symbol === 'OTHER') {
        priceLiveTag?.classList.add('hidden');
        return;
      }

      // Unlike pip value, there's no static fallback here — we don't ship
      // approximate crypto prices (they'd be stale within hours). Leave
      // whatever the user already typed alone until/unless a live price lands.
      priceLiveTag?.classList.add('hidden');
      const requestId = ++state.priceFetchToken;
      FxRates.getCryptoPrice(symbol).then(price => {
        // Ignore stale responses (user switched pair/asset class meanwhile)
        if (requestId !== state.priceFetchToken) return;
        if (price !== null && state.selectedSymbol.crypto === symbol) {
          document.getElementById('entryInput').value = price;
          priceLiveTag?.classList.remove('hidden');
          autoFillSlTp();
          recalculate();
        }
      });
    }
  }

  function getTradeSymbol() {
    if (state.assetClass === 'gold') return 'XAUUSD';
    if (['forex', 'crypto', 'indices'].includes(state.assetClass)) {
      const sym = state.selectedSymbol[state.assetClass];
      if (sym && sym !== 'OTHER') return sym;
      return I18n.get('pairOther');
    }
    return state.assetClass.toUpperCase();
  }

  function setDirection(direction) {
    state.direction = direction;
    document.querySelectorAll('.dir-btn').forEach(btn => {
      const active = btn.dataset.dir === direction;
      btn.className = `dir-btn px-3.5 py-1.5 text-xs font-medium rounded-lg transition ${
        active ? (direction === 'long' ? 'bg-good/20 text-good' : 'bg-bad/20 text-bad') : 'text-slate-500 hover:text-slate-300'
      }`;
    });
    autoFillSlTp();
    recalculate();
  }

  function syncRrPresetHighlight() {
    const rrValue = document.getElementById('rrTargetInput').value.trim();
    document.querySelectorAll('.rr-preset-btn').forEach(b => {
      const matches = rrValue !== '' && b.dataset.rr === rrValue;
      b.classList.toggle('bg-accent/10', matches);
      b.classList.toggle('text-accent', matches);
      b.classList.toggle('border-accent/40', matches);
    });
  }

  function autoFillSlTp() {
    const entry = parseFloat(document.getElementById('entryInput').value);
    const slPercent = parseFloat(document.getElementById('slPercentInput').value);
    const rr = parseFloat(document.getElementById('rrTargetInput').value);
    const slAutoTag = document.getElementById('slAutoTag');
    const tpAutoTag = document.getElementById('tpAutoTag');

    if (!entry || entry <= 0 || !slPercent || slPercent <= 0) {
      slAutoTag.classList.add('hidden');
      tpAutoTag.classList.add('hidden');
      return;
    }

    const slDistance = entry * (slPercent / 100);
    let sl;
    if (state.direction === 'long') {
      sl = entry - slDistance;
    } else {
      sl = entry + slDistance;
    }

    document.getElementById('slInput').value = round(sl, 6);
    slAutoTag.classList.remove('hidden');

    if (rr && rr > 0) {
      let tp;
      if (state.direction === 'long') {
        tp = entry + slDistance * rr;
      } else {
        tp = entry - slDistance * rr;
      }
      document.getElementById('tpInput').value = round(tp, 6);
      tpAutoTag.classList.remove('hidden');
    } else {
      tpAutoTag.classList.add('hidden');
    }
  }

  function round(num, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round((num + Number.EPSILON) * factor) / factor;
  }

  // Default toLocaleString() caps at 3 fraction digits, which silently displays
  // "0" for legitimate small position sizes (e.g. 0.0005 lots on a small forex
  // account, or fractional crypto below 0.001 coins). This shows the value at
  // the same precision the calculator actually computed it with.
  function formatPositionSize(value, assetClass) {
    const maxDecimals = assetClass === 'crypto' ? 6 : 4;
    return value.toLocaleString(undefined, { maximumFractionDigits: maxDecimals });
  }

  async function recalculate() {
    if (!state.activeAccount) {
      document.getElementById('instructorMessages').innerHTML = `<div class="p-3.5 bg-warn/10 border border-warn/30 text-warn rounded-xl text-xs">${I18n.get('instNoAccount')}</div>`;
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

    const leverageRaw = document.getElementById('leverageInput').value;
    const leverage = leverageRaw !== '' ? parseFloat(leverageRaw) : undefined;

    const symbol = state.assetClass === 'forex' ? getTradeSymbol() : undefined;

    // Cross pairs (no USD leg, e.g. EURJPY) need the base currency's own USD
    // rate to compute accurate notional/margin — pipValue alone only encodes
    // the quote currency's rate and can't derive it (see calculator.js).
    let baseToUsdRate;
    if (state.assetClass === 'forex' && symbol && symbol.length === 6) {
      const base = symbol.slice(0, 3);
      const quote = symbol.slice(3, 6);
      if (base !== 'USD' && quote !== 'USD') {
        const requestId = ++state.baseRateFetchToken;
        FxRates.getBaseToUsdRate(base).then(rate => {
          if (requestId !== state.baseRateFetchToken) return; // stale, symbol/asset changed meanwhile
          if (rate !== null) {
            state.lastBaseToUsdRate = rate;
            recalculate();
          }
        });
        baseToUsdRate = (state.lastBaseToUsdSymbol === base) ? state.lastBaseToUsdRate : undefined;
        state.lastBaseToUsdSymbol = base;
      }
    }

    const input = {
      assetClass: state.assetClass, capital, riskPercent, entry, sl, tp,
      direction: state.direction, isJPYPair, leverage, symbol, baseToUsdRate,
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
    const leverageBox = document.getElementById('leverageInfoBox');
    const summaryBox = document.getElementById('resultsSummary');
    if (!result.valid) {
      document.getElementById('resPositionSize').textContent = '—';
      document.getElementById('resRiskAmount').textContent = '—';
      document.getElementById('resPotentialProfit').textContent = '—';
      document.getElementById('resRR').textContent = '—';
      leverageBox.classList.add('hidden');
      summaryBox.classList.add('hidden');

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

    // Defense in depth: even though calculator.js now rejects the inputs that
    // used to produce these, never render NaN/Infinity as if it were a real result.
    if (!Number.isFinite(result.positionSize) || !Number.isFinite(result.riskAmount)) {
      document.getElementById('resPositionSize').textContent = '—';
      document.getElementById('resRiskAmount').textContent = '—';
      document.getElementById('resPotentialProfit').textContent = '—';
      document.getElementById('resRR').textContent = '—';
      leverageBox.classList.add('hidden');
      summaryBox.classList.add('hidden');
      errBox.innerHTML = `<p class="font-medium mb-1">${escapeHtml(I18n.get('calcErrorsTitle'))}</p><ul class="list-disc list-inside space-y-0.5"><li>${escapeHtml(I18n.get('errUnknownAsset'))}</li></ul>`;
      errBox.classList.remove('hidden');
      return;
    }

    document.getElementById('resPositionSize').textContent = formatPositionSize(result.positionSize, result.assetClass);
    document.getElementById('resSizeUnit').textContent = I18n.get(result.sizeUnit);
    document.getElementById('resRiskAmount').textContent = `$${result.riskAmount.toFixed(2)}`;
    document.getElementById('resPotentialProfit').textContent = `$${result.potentialProfit.toFixed(2)}`;
    document.getElementById('resRR').textContent = `1 : ${result.rrRatio}`;

    // Plain-language recap of what the numbers mean — the single highest-value
    // addition for beginners, since raw labels like "Position Size: 0.42 lots"
    // don't mean anything until translated into a sentence.
    if (isBeginnerMode()) {
      summaryBox.classList.remove('hidden');
      document.getElementById('resultsSummaryText').innerHTML = I18n.get('resultsSummaryTemplate', {
        size: `<strong class="text-slate-100">${formatPositionSize(result.positionSize, result.assetClass)} ${I18n.get(result.sizeUnit)}</strong>`,
        risk: `<strong class="text-bad">$${result.riskAmount.toFixed(2)}</strong>`,
        profit: `<strong class="text-good">$${result.potentialProfit.toFixed(2)}</strong>`,
        rr: `<strong class="text-accent">1:${result.rrRatio}</strong>`
      });
    } else {
      summaryBox.classList.add('hidden');
    }

    if (result.leverage && result.marginRequired !== undefined) {
      leverageBox.classList.remove('hidden');
      document.getElementById('resMarginRequired').textContent = `$${result.marginRequired.toFixed(2)}`;
      document.getElementById('resMarginPercent').textContent = `${result.marginPercentOfCapital.toFixed(2)}%`;
      document.getElementById('resLiquidationDistance').textContent = `${result.liquidationDistancePercent.toFixed(2)}%`;

      const riskStyles = {
        low: { box: 'border-good/30 bg-good/5', badge: 'bg-good/20 text-good', key: 'leverageRiskLow' },
        moderate: { box: 'border-warn/30 bg-warn/5', badge: 'bg-warn/20 text-warn', key: 'leverageRiskModerate' },
        high: { box: 'border-bad/30 bg-bad/5', badge: 'bg-bad/20 text-bad', key: 'leverageRiskHigh' },
        extreme: { box: 'border-bad/50 bg-bad/10', badge: 'bg-bad/30 text-bad', key: 'leverageRiskExtreme' }
      };
      const style = riskStyles[result.riskLevel] || riskStyles.low;
      leverageBox.className = `mt-4 border rounded-2xl p-4 space-y-2.5 ${style.box}`;
      const badge = document.getElementById('leverageRiskBadge');
      badge.className = `text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${style.badge}`;
      badge.textContent = I18n.get(style.key);
    } else {
      leverageBox.classList.add('hidden');
    }
  }

  function renderInstructor(result, context) {
    const box = document.getElementById('instructorMessages');
    const scoreBox = document.getElementById('instructorScoreBox');
    if (!result.valid) {
      box.innerHTML = `<p class="text-xs text-slate-500">${I18n.get('instEmpty')}</p>`;
      if (scoreBox) {
        scoreBox.classList.add('hidden');
        scoreBox.classList.remove('flex');
      }
      return;
    }

    const analysis = Instructor.analyze(result, context);
    const { messages, score, grade } = analysis;

    if (scoreBox) {
      if (score !== null) {
        scoreBox.classList.remove('hidden');
        scoreBox.classList.add('flex');
        const gradeStyles = {
          A: 'bg-good/20 text-good border-good/30',
          B: 'bg-accent/20 text-accent border-accent/30',
          C: 'bg-warn/20 text-warn border-warn/30',
          D: 'bg-bad/20 text-bad border-bad/30'
        };
        scoreBox.innerHTML = `
          <span class="text-[11px] text-slate-500">${I18n.get('instScoreLabel')}</span>
          <span class="mono text-xs font-bold px-2 py-0.5 rounded-full border ${gradeStyles[grade]}">${grade} · ${score}/100</span>
        `;
      } else {
        scoreBox.classList.add('hidden');
        scoreBox.classList.remove('flex');
      }
    }

    if (messages.length === 0) {
      box.innerHTML = `<p class="text-xs text-good">${I18n.get('instOk')}</p>`;
      return;
    }

    const styles = { good: 'bg-good/10 border-good/30 text-good', warn: 'bg-warn/10 border-warn/30 text-warn', bad: 'bg-bad/10 border-bad/30 text-bad' };
    box.innerHTML = messages.map(m => `
      <div class="flex items-start gap-2.5 text-xs border rounded-xl p-3 leading-relaxed ${styles[m.level]}">
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
          <button data-note-trade="${t.id}" aria-label="Trade note" title="${t.notes ? escapeHtml(t.notes) : I18n.get('tradeNoteTitle')}" class="ml-2 align-middle ${t.notes ? 'text-accent' : 'text-slate-600 hover:text-slate-400'}">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="${t.notes ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2h7l3 3v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z"/><path d="M9.5 2v3.5H13"/></svg>
          </button>
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

    tbody.querySelectorAll('[data-note-trade]').forEach(btn => {
      btn.addEventListener('click', () => openTradeNoteModal(btn.dataset.noteTrade));
    });
  }

  // ---- Trade note modal ----
  async function openTradeNoteModal(tradeId) {
    const trade = await DB.Trades.get(tradeId);
    if (!trade) return;
    state.pendingNoteTradeId = tradeId;
    document.getElementById('tradeNoteTextarea').value = trade.notes || '';
    const modal = document.getElementById('tradeNoteModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.getElementById('tradeNoteTextarea').focus();
  }

  function closeTradeNoteModal() {
    state.pendingNoteTradeId = null;
    const modal = document.getElementById('tradeNoteModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  async function confirmSaveTradeNote() {
    const tradeId = state.pendingNoteTradeId;
    if (!tradeId) return;
    const trade = await DB.Trades.get(tradeId);
    if (trade) {
      trade.notes = document.getElementById('tradeNoteTextarea').value.trim();
      await DB.Trades.save(trade);
      closeTradeNoteModal();
      await renderJournal();
    }
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
      if (!document.getElementById('analyticsSection').classList.contains('hidden')) await renderAnalytics();
    }
  }

  // ---- New-account modal ----
  function setNewAccountType(type) {
    state.newAccountType = type;
    document.querySelectorAll('.acc-type-btn').forEach(btn => {
      const active = btn.dataset.accType === type;
      btn.className = `acc-type-btn flex-1 py-2 text-xs font-semibold rounded-lg transition ${
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

  // ---- Delete-account modal ----
  function openDeleteAccountModal() {
    if (!state.activeAccount || state.accounts.length <= 1) return;
    state.pendingDeleteAccountId = state.activeAccount.id;
    const name = state.activeAccount.nameKey ? I18n.get(state.activeAccount.nameKey) : state.activeAccount.name;
    document.getElementById('deleteAccountText').textContent = I18n.get('delAccountText').replace('{name}', name);
    const modal = document.getElementById('deleteAccountModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  function closeDeleteAccountModal() {
    state.pendingDeleteAccountId = null;
    const modal = document.getElementById('deleteAccountModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  async function confirmDeleteAccount() {
    const accountId = state.pendingDeleteAccountId;
    if (!accountId) {
      console.warn('[Traft] No pending account to delete.');
      return;
    }
    if (state.accounts.length <= 1) {
      console.warn('[Traft] Refusing to delete the last remaining account.');
      closeDeleteAccountModal();
      return;
    }

    try {
      const trades = await DB.Trades.byAccount(accountId);
      for (const t of trades) {
        await DB.Trades.delete(t.id);
      }
      await DB.Accounts.delete(accountId);

      const remaining = await DB.Accounts.all();
      const nextActive = remaining[0] || null;
      if (nextActive) await DB.Settings.set('activeAccountId', nextActive.id);
      else await DB.Settings.set('activeAccountId', null);

      closeDeleteAccountModal();
      await loadAccounts();
      await recalculate();
    } catch (err) {
      console.error('[Traft] Failed to delete account:', err);
      closeDeleteAccountModal();
    }
  }

  function applyStaticTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      if (el.id === 'pairSelectLabel') return; // géré par setAssetClass selon la classe d'actif active
      el.textContent = I18n.get(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = I18n.get(el.dataset.i18nPlaceholder);
    });
    const inputRule = document.getElementById('newRuleInput');
    if (inputRule) inputRule.placeholder = I18n.get('addRulePlaceholder');
    const pairLabel = document.getElementById('pairSelectLabel');
    if (pairLabel) pairLabel.textContent = I18n.get(pairLabel.dataset.i18n);
  }

  function updateInterfaceLanguage(lang) {
    I18n.setLanguage(lang);
    applyStaticTranslations();
    if (['forex', 'crypto', 'indices'].includes(state.assetClass)) populatePairSelect();
    loadAccounts();
    renderChecklist();
    recalculate();
    renderJournal();
  }

  function bindEvents() {
    document.querySelectorAll('.asset-tab').forEach(btn => btn.addEventListener('click', () => setAssetClass(btn.dataset.asset)));
    document.querySelectorAll('.dir-btn').forEach(btn => btn.addEventListener('click', () => setDirection(btn.dataset.dir)));
    ['capitalInput', 'riskInput'].forEach(id => document.getElementById(id).addEventListener('input', recalculate));
    document.getElementById('entryInput').addEventListener('input', () => {
      autoFillSlTp();
      recalculate();
    });
    document.getElementById('slPercentInput').addEventListener('input', () => {
      autoFillSlTp();
      recalculate();
    });
    document.getElementById('rrTargetInput').addEventListener('input', () => {
      syncRrPresetHighlight();
      autoFillSlTp();
      recalculate();
    });
    document.getElementById('slInput').addEventListener('input', () => {
      document.getElementById('slAutoTag').classList.add('hidden');
      document.getElementById('tpAutoTag').classList.add('hidden');
      recalculate();
    });
    document.getElementById('tpInput').addEventListener('input', () => {
      document.getElementById('tpAutoTag').classList.add('hidden');
      recalculate();
    });
    document.querySelectorAll('.rr-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('rrTargetInput').value = btn.dataset.rr;
        syncRrPresetHighlight();
        autoFillSlTp();
        recalculate();
      });
    });
    document.getElementById('assetExtraInput').addEventListener('input', () => {
      document.getElementById('pipLiveTag').classList.add('hidden');
      recalculate();
    });
    document.getElementById('jpyToggle').addEventListener('change', recalculate);
    document.getElementById('leverageInput').addEventListener('change', recalculate);

    document.getElementById('beginnerModeToggle').addEventListener('change', async (e) => {
      state.beginnerMode = e.target.checked;
      await DB.Settings.set('beginnerMode', state.beginnerMode);
      applyBeginnerMode();
      recalculate();
    });
    document.getElementById('pairSelect').addEventListener('change', () => {
      if (state.assetClass === 'crypto') {
        state.selectedSymbol.crypto = document.getElementById('pairSelect').value;
      } else {
        applyPairSelection();
      }
      recalculate();
    });

    document.getElementById('langSelector').addEventListener('change', (e) => updateInterfaceLanguage(e.target.value));

    // New account modal
    document.getElementById('addAccountBtn').addEventListener('click', openNewAccountModal);
    document.getElementById('newAccCancelBtn').addEventListener('click', closeNewAccountModal);
    document.getElementById('newAccountBackdrop').addEventListener('click', closeNewAccountModal);
    document.getElementById('newAccCreateBtn').addEventListener('click', confirmCreateAccount);
    document.querySelectorAll('.acc-type-btn').forEach(btn => btn.addEventListener('click', () => setNewAccountType(btn.dataset.accType)));

    // Delete account modal
    document.getElementById('deleteAccountBtn').addEventListener('click', openDeleteAccountModal);
    document.getElementById('deleteAccountCancelBtn').addEventListener('click', closeDeleteAccountModal);
    document.getElementById('deleteAccountBackdrop').addEventListener('click', closeDeleteAccountModal);
    document.getElementById('deleteAccountConfirmBtn').addEventListener('click', confirmDeleteAccount);

    // Close trade modal
    document.getElementById('closeTradeCancelBtn').addEventListener('click', closeCloseTradeModal);
    document.getElementById('closeTradeBackdrop').addEventListener('click', closeCloseTradeModal);
    document.getElementById('closeTradeConfirmBtn').addEventListener('click', confirmCloseTrade);
    document.getElementById('closeTradeRInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') confirmCloseTrade();
    });

    // Trade note modal
    document.getElementById('tradeNoteCancelBtn').addEventListener('click', closeTradeNoteModal);
    document.getElementById('tradeNoteBackdrop').addEventListener('click', closeTradeNoteModal);
    document.getElementById('tradeNoteSaveBtn').addEventListener('click', confirmSaveTradeNote);

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
        symbol: getTradeSymbol(),
        direction: state.direction,
        entry, sl, tp,
        riskPercent,
        riskAmount: state.lastCalcResult.riskAmount,
        rrRatio: state.lastCalcResult.rrRatio,
        lotSize: state.lastCalcResult.positionSize,
        activeRuleCount: state.checklistRules.length,
        notes: document.getElementById('tradeNotesInput').value.trim()
      });

      state.checkedItems.clear();
      document.getElementById('tradeNotesInput').value = '';
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
    const tabAnalyticsBtn = document.getElementById('tabAnalyticsBtn');
    const tabEduBtn = document.getElementById('tabEduBtn');
    const mainSec = document.getElementById('mainCalcSection');
    const analyticsSec = document.getElementById('analyticsSection');
    const eduSec = document.getElementById('educationSection');

    const tabs = [
      { btn: tabCalcBtn, sec: mainSec },
      { btn: tabAnalyticsBtn, sec: analyticsSec },
      { btn: tabEduBtn, sec: eduSec }
    ];

    function activateTab(activeBtn, activeSec) {
      tabs.forEach(({ btn, sec }) => {
        const active = btn === activeBtn;
        sec.classList.toggle('hidden', !active);
        btn.className = active
          ? "main-tab flex-1 py-2.5 sm:py-2.5 text-xs font-semibold rounded-xl bg-accent/10 text-accent border border-accent/30 transition"
          : "main-tab flex-1 py-2.5 sm:py-2.5 text-xs font-semibold rounded-xl text-slate-400 hover:text-slate-200 transition";
      });
      if (activeSec === analyticsSec) renderAnalytics();
    }

    tabCalcBtn.addEventListener('click', () => activateTab(tabCalcBtn, mainSec));
    tabAnalyticsBtn.addEventListener('click', () => activateTab(tabAnalyticsBtn, analyticsSec));
    tabEduBtn.addEventListener('click', () => activateTab(tabEduBtn, eduSec));
  }

  // ---- Analytics ----
  async function renderAnalytics() {
    if (!state.activeAccount) return;
    const trades = await DB.Trades.byAccount(state.activeAccount.id);
    const closed = trades.filter(t => t.status === 'closed' && t.rMultiple !== null && t.rMultiple !== undefined)
                          .sort((a, b) => a.closedAt - b.closedAt);

    const emptyState = document.getElementById('analyticsEmptyState');
    const content = document.getElementById('analyticsContent');

    if (closed.length === 0) {
      emptyState.classList.remove('hidden');
      content.classList.add('hidden');
      return;
    }
    emptyState.classList.add('hidden');
    content.classList.remove('hidden');

    const wins = closed.filter(t => t.rMultiple >= 0);
    const losses = closed.filter(t => t.rMultiple < 0);
    const avgWin = wins.length ? wins.reduce((s, t) => s + t.rMultiple, 0) / wins.length : 0;
    const avgLoss = losses.length ? losses.reduce((s, t) => s + t.rMultiple, 0) / losses.length : 0;

    document.getElementById('statTotalTrades').textContent = closed.length;
    document.getElementById('statAvgWin').textContent = wins.length ? `+${avgWin.toFixed(2)}R` : '—';
    document.getElementById('statAvgLoss').textContent = losses.length ? `${avgLoss.toFixed(2)}R` : '—';

    // Equity curve (cumulative R) + max drawdown
    let cumulative = 0;
    let peak = 0;
    let maxDrawdown = 0;
    const points = [0];
    closed.forEach(t => {
      cumulative += t.rMultiple;
      points.push(cumulative);
      if (cumulative > peak) peak = cumulative;
      const dd = peak - cumulative;
      if (dd > maxDrawdown) maxDrawdown = dd;
    });
    document.getElementById('statMaxDrawdown').textContent = maxDrawdown > 0 ? `-${maxDrawdown.toFixed(2)}R` : '0R';

    renderEquityCurve(points);

    // By asset class
    const assetGroups = {};
    closed.forEach(t => {
      if (!assetGroups[t.assetClass]) assetGroups[t.assetClass] = [];
      assetGroups[t.assetClass].push(t);
    });
    const byAssetBody = document.getElementById('byAssetTableBody');
    byAssetBody.innerHTML = Object.entries(assetGroups).map(([assetClass, list]) => {
      const w = list.filter(t => t.rMultiple >= 0).length;
      const wr = Math.round((w / list.length) * 100);
      const exp = list.reduce((s, t) => s + t.rMultiple, 0) / list.length;
      return `
        <tr class="border-b border-border/30 text-xs">
          <td class="py-2 font-medium text-slate-200">${I18n.get(Calculator.ASSET_CLASSES[assetClass]?.labelKey || assetClass)}</td>
          <td class="py-2">${list.length}</td>
          <td class="py-2">${wr}%</td>
          <td class="py-2 ${exp >= 0 ? 'text-good' : 'text-bad'}">${exp >= 0 ? '+' : ''}${exp.toFixed(2)}R</td>
        </tr>
      `;
    }).join('');

    // Checklist rigor vs outcome
    const ruleGroups = {};
    closed.forEach(t => {
      const key = (t.activeRuleCount === null || t.activeRuleCount === undefined) ? '—' : t.activeRuleCount;
      if (!ruleGroups[key]) ruleGroups[key] = [];
      ruleGroups[key].push(t);
    });
    const byRuleBody = document.getElementById('byRuleTableBody');
    const ruleKeys = Object.keys(ruleGroups).sort((a, b) => (a === '—' ? 1 : b === '—' ? -1 : a - b));
    if (ruleKeys.length < 2) {
      document.getElementById('byRuleContent').innerHTML = `<p class="text-xs text-slate-500">${I18n.get('byRuleEmpty')}</p>`;
    } else {
      byRuleBody.innerHTML = ruleKeys.map(key => {
        const list = ruleGroups[key];
        const w = list.filter(t => t.rMultiple >= 0).length;
        const wr = Math.round((w / list.length) * 100);
        const exp = list.reduce((s, t) => s + t.rMultiple, 0) / list.length;
        return `
          <tr class="border-b border-border/30 text-xs">
            <td class="py-2 font-medium text-slate-200">${key}</td>
            <td class="py-2">${list.length}</td>
            <td class="py-2">${wr}%</td>
            <td class="py-2 ${exp >= 0 ? 'text-good' : 'text-bad'}">${exp >= 0 ? '+' : ''}${exp.toFixed(2)}R</td>
          </tr>
        `;
      }).join('');
    }
  }

  function renderEquityCurve(points) {
    const svg = document.getElementById('equityCurveSvg');
    const w = 600, h = 200, padX = 10, padY = 16;

    const min = Math.min(...points, 0);
    const max = Math.max(...points, 0);
    const range = (max - min) || 1;

    const stepX = points.length > 1 ? (w - padX * 2) / (points.length - 1) : 0;
    const toY = (v) => h - padY - ((v - min) / range) * (h - padY * 2);
    const toX = (i) => padX + i * stepX;

    const pathD = points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`).join(' ');
    const zeroY = toY(0).toFixed(1);
    const last = points[points.length - 1];
    // Same sage/coral tokens as the rest of the UI (good/bad) — keeps the
    // chart from reading as a separate, harsher "trading terminal" widget.
    const lineColor = last >= 0 ? '#7fb8a6' : '#d99a8c';

    const areaD = `${pathD} L ${toX(points.length - 1).toFixed(1)} ${zeroY} L ${toX(0).toFixed(1)} ${zeroY} Z`;

    svg.innerHTML = `
      <line x1="${padX}" y1="${zeroY}" x2="${w - padX}" y2="${zeroY}" stroke="#2e3540" stroke-width="1" stroke-dasharray="3,3" />
      <path d="${areaD}" fill="${lineColor}" fill-opacity="0.1" stroke="none" />
      <path d="${pathD}" fill="none" stroke="${lineColor}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
    `;
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