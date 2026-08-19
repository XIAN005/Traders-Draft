/**
 * Traft (Traders Draft) — Dictionnaire i18n
 */
const I18n = (() => {
  const dictionary = {
    fr: {
      appTitle: "Traft",
      appSubtitle: "Traders Draft — Risk Manager & Checklist",
      tabCalc: "📊 Calculateur & Checklist",
      tabEdu: "📚 Guide & Éducation",
      addAccountBtn: "+ Compte",
      
      calculatorTitle: "Calculateur de Position",
      capitalLabel: "Capital du compte ($)",
      riskLabel: "Risque %",
      entryLabel: "Prix Entrée",
      slLabel: "Stop Loss",
      tpLabel: "Take Profit",
      pipValueLabel: "Valeur Point/Pip ($)",
      jpyLabel: "Paire en JPY (pip = 0.01)",
      
      resPositionSize: "Taille de position",
      resRiskAmount: "Montant risqué",
      resPotentialProfit: "Profit potentiel",
      resRR: "Ratio R:R",
      atStopLoss: "au stop-loss",
      atTakeProfit: "au take-profit",
      rewardRisk: "rendement : risque",

      instTitle: "Instructeur Virtuel",
      instEmpty: "Remplissez les détails du trade pour recevoir une analyse du risque en direct.",
      instNoAccount: "⚠️ Aucun compte sélectionné. Veuillez créer ou sélectionner un compte.",
      instOk: "✓ Aucun problème détecté avec cette configuration.",
      instBadRR: "Ratio R:R défavorable. Vous risquez plus que ce que vous pouvez gagner.",
      instWarnRR: "R:R inférieur au minimum recommandé de 1:1.5.",
      instGoodRR: "Excellent R:R. Ce setup nécessite un faible taux de réussite pour être rentable.",
      instHighRisk: "Risquer plus de 2% par trade est agressif. Réduisez votre risque.",
      instDailyLossBreached: "Ce trade dépasse votre limite de perte journalière imposée par votre Prop Firm !",

      checklistTitle: "Checklist Pré-Trade",
      checklistSub: "Toutes les cases doivent être cochées pour enregistrer le trade.",
      addRulePlaceholder: "Ajouter une règle personnalisée...",
      logBtnLocked: "🔒 Complétez la checklist pour enregistrer",
      logBtnUnlocked: "✅ Enregistrer le trade au journal",
      logBtnNoAccount: "🔒 Créez un compte d'abord",

      journalTitle: "Journal de Trading",
      winRateLabel: "Win Rate :",
      expectancyLabel: "Espérance :",
      colSymbol: "Symbole",
      colDir: "Sens",
      colRisk: "Risque",
      colRR: "R:R",
      colStatus: "Statut",
      colAction: "Action",
      noTrades: "Aucun trade enregistré pour le moment.",

      eduTitle: "Lexique & Concepts Clés",
      eduSub: "Comprendre les bases fondamentales de la gestion du risque et des marchés.",
      
      eduSlTpTitle: "Stop-Loss (SL) & Take-Profit (TP)",
      eduSlTpDesc: "• Stop-Loss : Clôture automatiquement le trade en perte pour protéger le capital.\n• Take-Profit : Clôture le trade en gain lorsque l'objectif est atteint.",
      
      eduRRTitle: "Ratio Risque / Rendement (R:R)",
      eduRRDesc: "Rapport entre le montant risqué et le gain potentiel. Un ratio de 1:2 signifie que si vous risquez 100 $, vous visiez 200 $ de profit.",
      
      eduLotsTitle: "Lots, Pips & Points",
      eduLotsDesc: "• Lot : Unité de volume (1 lot = 100 000 unités de la devise de base).\n• Pip : Plus petite variation de prix standard (0.0001 sur la plupart des paires, 0.01 en JPY).",
      
      eduPropTitle: "Drawdown Max & Daily Loss Limit",
      eduPropDesc: "• Daily Loss Limit : Perte maximale autorisée par jour (Prop Firm).\n• Max Drawdown : Seuil de perte maximale absolue avant fermeture du compte.",

      eduBiaisTitle: "Biais Psychologiques en Trading",
      fomoDesc: "FOMO (Fear Of Missing Out) : Peur de rater une opportunité qui pousse à entrer de façon impulsive.",
      revengeDesc: "Revenge Trading : Ouvrir un trade impulsif après une perte pour « se refaire »."
    },

    en: {
      appTitle: "Traft",
      appSubtitle: "Traders Draft — Risk Manager & Checklist",
      tabCalc: "📊 Calculator & Checklist",
      tabEdu: "📚 Guide & Education",
      addAccountBtn: "+ Account",
      
      calculatorTitle: "Position Size Calculator",
      capitalLabel: "Account Capital ($)",
      riskLabel: "Risk %",
      entryLabel: "Entry Price",
      slLabel: "Stop Loss",
      tpLabel: "Take Profit",
      pipValueLabel: "Pip/Point Value ($)",
      jpyLabel: "JPY pair (pip = 0.01)",
      
      resPositionSize: "Position Size",
      resRiskAmount: "Risk Amount",
      resPotentialProfit: "Potential Profit",
      resRR: "R:R Ratio",
      atStopLoss: "at stop-loss",
      atTakeProfit: "at take-profit",
      rewardRisk: "reward : risk",

      instTitle: "Virtual Instructor",
      instEmpty: "Fill in trade details to receive live risk feedback.",
      instNoAccount: "⚠️ No active account selected. Please create or select an account.",
      instOk: "✓ No issues detected with this setup.",
      instBadRR: "Unfavorable R:R. You are risking more than you can gain.",
      instWarnRR: "R:R is below the recommended 1:1.5 minimum.",
      instGoodRR: "Strong R:R setup. Only requires a low win rate to break even.",
      instHighRisk: "Risking more than 2% per trade is aggressive. Reduce your risk.",
      instDailyLossBreached: "This trade's risk breaches your daily loss limit!",

      checklistTitle: "Pre-Trade Checklist",
      checklistSub: "All items must be checked to unlock trade logging.",
      addRulePlaceholder: "Add custom rule...",
      logBtnLocked: "🔒 Complete checklist to log trade",
      logBtnUnlocked: "✅ Log Trade to Journal",
      logBtnNoAccount: "🔒 Create an account first",

      journalTitle: "Trade Journal",
      winRateLabel: "Win Rate:",
      expectancyLabel: "Expectancy:",
      colSymbol: "Symbol",
      colDir: "Dir",
      colRisk: "Risk",
      colRR: "R:R",
      colStatus: "Status",
      colAction: "Action",
      noTrades: "No trades logged yet.",

      eduTitle: "Glossary & Key Concepts",
      eduSub: "Understanding core risk management fundamentals.",
      
      eduSlTpTitle: "Stop-Loss (SL) & Take-Profit (TP)",
      eduSlTpDesc: "• Stop-Loss: Automatically closes the trade at a loss to protect capital.\n• Take-Profit: Closes the trade in profit when target is hit.",
      
      eduRRTitle: "Risk / Reward Ratio (R:R)",
      eduRRDesc: "Ratio between risk and potential gain. A 1:2 ratio means risking $100 to target $200 in profit.",
      
      eduLotsTitle: "Lots, Pips & Points",
      eduLotsDesc: "• Lot: Standard volume unit (1 lot = 100,000 base currency units).\n• Pip: Smallest standard price movement (0.0001 for most pairs, 0.01 for JPY).",
      
      eduPropTitle: "Max Drawdown & Daily Loss Limit",
      eduPropDesc: "• Daily Loss Limit: Max allowed loss per day on a Prop Firm account.\n• Max Drawdown: Absolute loss limit before account breach.",

      eduBiaisTitle: "Psychological Biases in Trading",
      fomoDesc: "FOMO (Fear Of Missing Out): Fear of missing an opportunity leading to impulsive entries.",
      revengeDesc: "Revenge Trading: Impulsively opening a trade after a loss to try to get even."
    }
  };

  let currentLang = 'fr';

  function setLanguage(lang) {
    if (dictionary[lang]) currentLang = lang;
  }

  function get(key) {
    return dictionary[currentLang][key] || key;
  }

  return { setLanguage, get, getCurrentLang: () => currentLang };
})();