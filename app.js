// État global de l'application
const state = {
  tradeType: 'long',
  lang: 'fr',
  checklist: [
    { id: 1, text_fr: "Placement du Stop-Loss vérifié avant exécution", text_en: "Stop-Loss placement verified before execution", checked: false },
    { id: 2, text_fr: "La taille de position respecte le risque maximum", text_en: "Position size matches max risk threshold", checked: false },
    { id: 3, text_fr: "Pas d'annonce économique majeure dans les 15 minutes", text_en: "No high-impact economic news within 15 minutes", checked: false },
    { id: 4, text_fr: "Le setup est conforme au plan de trading écrit", text_en: "Setup fully complies with written trading plan", checked: false },
    { id: 5, text_fr: "Pas d'influence des trades récents (Pas de Revenge Trading)", text_en: "Not influenced by recent trade results (No Revenge Trading)", checked: false },
    { id: 6, text_fr: "Calme, concentré et libre de toute peur de rater (FOMO)", text_en: "Calm, focused, and free from FOMO", checked: false },
    { id: 7, text_fr: "Limite de perte journalière (drawdown) respectée", text_en: "Daily drawdown limit respected", checked: false }
  ]
};

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  renderChecklist();
  recalculate();
});

function initEventListeners() {
  // Sélecteur Long / Short
  document.querySelectorAll('.trade-type-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.trade-type-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      state.tradeType = e.target.dataset.type;
      recalculate();
    });
  });

  // Écoute dynamique sur les champs de saisie (calcul immédiat)
  ['capitalInput', 'riskInput', 'entryInput', 'slInput', 'tpInput'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      ['input', 'change', 'keyup'].forEach(evt => el.addEventListener(evt, recalculate));
    }
  });

  // Changement de langue
  const langSelect = document.getElementById('langSelect');
  if (langSelect) {
    langSelect.addEventListener('change', (e) => {
      state.lang = e.target.value;
      renderChecklist();
      recalculate();
    });
  }
}

// Fonction de calcul principale
function recalculate() {
  const capital = parseFloat(document.getElementById('capitalInput').value) || 0;
  const riskPct = parseFloat(document.getElementById('riskInput').value) || 0;
  const entry = parseFloat(document.getElementById('entryInput').value) || 0;
  const sl = parseFloat(document.getElementById('slInput').value) || 0;
  const tp = parseFloat(document.getElementById('tpInput').value) || 0;

  const resPositionSize = document.getElementById('resPositionSize');
  const resRiskAmount = document.getElementById('resRiskAmount');
  const resPotentialProfit = document.getElementById('resPotentialProfit');
  const resRR = document.getElementById('resRR');
  const instructorText = document.getElementById('instructorText');

  if (!entry || !sl || !tp || capital <= 0 || riskPct <= 0) {
    resPositionSize.innerText = '—';
    resRiskAmount.innerText = '—';
    resPotentialProfit.innerText = '—';
    resRR.innerText = '—';
    instructorText.innerText = "Remplissez tous les champs avec des valeurs valides pour calculer votre trade.";
    instructorText.className = "";
    return;
  }

  let slDistance = 0;
  let tpDistance = 0;
  let isValid = true;

  if (state.tradeType === 'long') {
    slDistance = entry - sl;
    tpDistance = tp - entry;
    if (sl >= entry) {
      instructorText.innerText = "❌ En mode Long, le Stop Loss doit être inférieur au prix d'entrée.";
      isValid = false;
    } else if (tp <= entry) {
      instructorText.innerText = "❌ En mode Long, le Take Profit doit être supérieur au prix d'entrée.";
      isValid = false;
    }
  } else { // Short
    slDistance = sl - entry;
    tpDistance = entry - tp;
    if (sl <= entry) {
      instructorText.innerText = "❌ En mode Short, le Stop Loss doit être supérieur au prix d'entrée.";
      isValid = false;
    } else if (tp >= entry) {
      instructorText.innerText = "❌ En mode Short, le Take Profit doit être inférieur au prix d'entrée.";
      isValid = false;
    }
  }

  if (!isValid) {
    instructorText.className = "text-red";
    resPositionSize.innerText = '—';
    resRiskAmount.innerText = '—';
    resPotentialProfit.innerText = '—';
    resRR.innerText = '—';
    return;
  }

  // Calculs financiers
  const riskAmount = capital * (riskPct / 100);
  const positionSize = riskAmount / slDistance;
  const potentialProfit = positionSize * tpDistance;
  const rrRatio = tpDistance / slDistance;

  // Affichage des résultats
  resPositionSize.innerText = positionSize.toFixed(2);
  resRiskAmount.innerText = `$${riskAmount.toFixed(2)}`;
  resPotentialProfit.innerText = `$${potentialProfit.toFixed(2)}`;
  resRR.innerText = `1 : ${rrRatio.toFixed(2)}`;

  // Analyse de l'Instructeur Virtuel
  instructorText.className = "text-green";
  if (rrRatio >= 2) {
    instructorText.innerText = `✅ Excellent R:R (1:${rrRatio.toFixed(2)}). Ce setup permet d'être rentable même avec un faible taux de réussite.`;
  } else if (rrRatio >= 1) {
    instructorText.innerText = `⚠️ R:R Modéré (1:${rrRatio.toFixed(2)}). Assurez-vous d'avoir un taux de réussite suffisant sur votre stratégie.`;
  } else {
    instructorText.className = "text-red";
    instructorText.innerText = `❌ R:R Faible (1:${rrRatio.toFixed(2)}). Le risque pris est supérieur au gain potentiel. Trade déconseillé.`;
  }
}

// Rendu dynamique de la checklist selon la langue choisie
function renderChecklist() {
  const container = document.getElementById('checklistItems');
  if (!container) return;

  container.innerHTML = '';
  state.checklist.forEach(item => {
    const text = state.lang === 'fr' ? item.text_fr : item.text_en;
    const div = document.createElement('div');
    div.className = 'checklist-item';
    div.innerHTML = `
      <label>
        <input type="checkbox" ${item.checked ? 'checked' : ''} data-id="${item.id}">
        <span>${text}</span>
      </label>
    `;
    container.appendChild(div);
  });

  // Gestion du coche des règles
  container.querySelectorAll('input[type="checkbox"]').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const id = parseInt(e.target.dataset.id);
      const targetItem = state.checklist.find(i => i.id === id);
      if (targetItem) targetItem.checked = e.target.checked;
      updateSaveButton();
    });
  });

  updateSaveButton();
}

function updateSaveButton() {
  const btn = document.getElementById('saveTradeBtn');
  const allChecked = state.checklist.length > 0 && state.checklist.every(i => i.checked);
  
  if (btn) {
    btn.disabled = !allChecked;
    btn.innerText = allChecked ? "✅ Enregistrer le trade" : "🔒 Complétez la checklist pour enregistrer";
  }
}