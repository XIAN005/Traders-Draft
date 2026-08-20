/**
 * Traft (Traders Draft) — Dictionnaire i18n
 */
const I18n = (() => {
  const dictionary = {
    fr: {
      appTitle: "Traft",
      appSubtitle: "Traders Draft — Risk Manager & Checklist",
      tabCalc: "Calculateur & Checklist",
      tabEdu: "Guide & Éducation",
      addAccountBtn: "+ Compte",

      newAccountTitle: "Nouveau Compte",
      accNameLabel: "Nom du compte",
      accNamePlaceholder: "ex. Compte FTMO 100k",
      accTypeLabel: "Type de compte",
      accTypePersonal: "Personnel",
      accTypePropfirm: "Prop Firm",
      accCapitalLabel: "Capital initial ($)",
      accCurrencyLabel: "Devise",
      accDailyLossLabel: "Limite de perte journalière ($)",
      accDailyLossHint: "Utilisée par l'Instructeur Virtuel pour vous alerter avant de la dépasser.",
      accCreateBtn: "Créer le compte",
      accCancelBtn: "Annuler",
      accNameRequired: "Veuillez saisir un nom de compte.",

      delAccountTitle: "Supprimer le compte",
      delAccountConfirmBtn: "Supprimer",
      delAccountText: "Cette action supprimera définitivement le compte « {name} » ainsi que tous ses trades enregistrés. Cette action est irréversible.",
      delAccountLastOne: "Vous ne pouvez pas supprimer votre dernier compte.",

      resultCloseTitle: "Clôturer le trade",
      resultRMultipleLabel: "Résultat en R (ex. 2 = +2R, -1 = stop touché)",
      resultConfirmBtn: "Confirmer",

      tradeNotesLabel: "Note (optionnel)",
      tradeNotesPlaceholder: "ex. Setup A+ sur retest du support, respect strict du plan...",
      tradeNoteTitle: "Note du trade",
      tradeNoteSaveBtn: "Enregistrer",
      tradeNoteAddBtn: "+ Note",
      tradeNoteViewBtn: "Note",

      expectancyUnit: "R / trade",

      analyticsTitle: "Statistiques",
      analyticsEmpty: "Clôturez des trades pour voir vos statistiques apparaître ici.",
      statTotalTrades: "Trades clôturés",
      statAvgWin: "Gain moyen",
      statAvgLoss: "Perte moyenne",
      statMaxDrawdown: "Drawdown Max",
      equityCurveTitle: "Courbe de Capital (en R cumulés)",
      byAssetTitle: "Performance par Classe d'Actif",
      byRuleTitle: "Rigueur de Checklist vs Résultat",
      byRuleEmpty: "Pas encore assez de trades clôturés pour ce comparatif.",
      byRuleDesc: "Compare le nombre de règles actives au moment du trade avec le résultat obtenu.",
      colTrades: "Trades",
      colWinRate: "Win Rate",
      colExpectancy: "Espérance",

      calculatorTitle: "Calculateur de Position",
      capitalLabel: "Capital du compte ($)",
      riskLabel: "Risque %",
      entryLabel: "Prix Entrée",
      slLabel: "Stop Loss",
      tpLabel: "Take Profit",
      pipValueLabel: "Valeur Point/Pip ($)",
      jpyLabel: "Paire en JPY (pip = 0.01)",
      pairLabel: "Paire de devises",
      pairLabelCrypto: "Paire Crypto",
      pairLabelIndex: "Indice",
      pairOther: "Autre / Personnalisé",
      
      resPositionSize: "Taille de position",
      resRiskAmount: "Montant risqué",
      resPotentialProfit: "Profit potentiel",
      resRR: "Ratio R:R",
      atStopLoss: "au stop-loss",
      atTakeProfit: "au take-profit",
      rewardRisk: "rendement : risque",

      instTitle: "Instructeur Virtuel",
      instEmpty: "Remplissez les détails du trade pour recevoir une analyse du risque en direct.",
      instNoAccount: "Aucun compte sélectionné. Veuillez créer ou sélectionner un compte.",
      instOk: "✓ Aucun problème détecté avec cette configuration.",
      instBadRR: "Ratio R:R défavorable. Vous risquez plus que ce que vous pouvez gagner.",
      instWarnRR: "R:R inférieur au minimum recommandé de 1:1.5.",
      instGoodRR: "Excellent R:R. Ce setup nécessite un faible taux de réussite pour être rentable.",
      instHighRisk: "Risquer plus de 2% par trade est agressif. Réduisez votre risque.",
      instDailyLossBreached: "Ce trade dépasse votre limite de perte journalière imposée par votre Prop Firm !",

      checklistTitle: "Checklist Pré-Trade",
      checklistSub: "Toutes les cases doivent être cochées pour enregistrer le trade.",
      addRulePlaceholder: "Ajouter une règle personnalisée...",
      logBtnLocked: "Complétez la checklist pour enregistrer",
      logBtnUnlocked: "Enregistrer le trade au journal",
      logBtnNoAccount: "Créez un compte d'abord",

      journalTitle: "Journal de Trading",
      winRateLabel: "Win Rate :",
      expectancyLabel: "Espérance :",
      colDate: "Date",
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
      revengeDesc: "Revenge Trading : Ouvrir un trade impulsif après une perte pour « se refaire ».",

      assetForex: "Forex",
      assetCrypto: "Crypto",
      assetIndices: "Indices",
      assetGold: "Or",
      dirLong: "Long",
      dirShort: "Short",

      unitLots: "lots",
      unitUnits: "unités",
      unitContracts: "contrats",

      statusOpen: "OUVERT",
      statusWin: "GAGNÉ",
      statusLoss: "PERDU",
      actionWin: "Gain",
      actionLoss: "Perte",

      addRuleBtn: "Ajouter",

      defaultAccountName: "Compte Démo",
      ruleStopLoss: "Placement du Stop-Loss vérifié avant exécution",
      rulePositionSize: "Taille de position conforme au seuil de risque max",
      ruleNoNews: "Aucune actualité économique à fort impact dans les 15 minutes",
      ruleTradingPlan: "Le setup respecte pleinement le plan de trading écrit",
      ruleNoRevenge: "Non influencé par les derniers résultats (pas de Revenge Trading)",
      ruleCalmFocused: "Calme, concentré et sans FOMO",
      ruleDailyDrawdown: "Limite de perte journalière respectée",

      errCapital: "Le capital du compte doit être supérieur à 0.",
      errRisk: "Le risque % doit être supérieur à 0.",
      errEntry: "Le prix d'entrée doit être supérieur à 0.",
      errSl: "Le prix du stop-loss doit être supérieur à 0.",
      errTp: "Le prix du take-profit doit être supérieur à 0.",
      errEntrySlEqual: "L'entrée et le stop-loss ne peuvent pas être égaux.",
      errLongSl: "Pour un trade LONG, le Stop-Loss doit être inférieur au prix d'Entrée.",
      errShortSl: "Pour un trade SHORT, le Stop-Loss doit être supérieur au prix d'Entrée.",
      errLongTp: "Pour un trade LONG, le Take-Profit doit être supérieur au prix d'Entrée.",
      errShortTp: "Pour un trade SHORT, le Take-Profit doit être inférieur au prix d'Entrée.",
      errUnknownAsset: "Classe d'actif inconnue.",
      calcErrorsTitle: "Corrigez les points suivants :"
    },

    en: {
      appTitle: "Traft",
      appSubtitle: "Traders Draft — Risk Manager & Checklist",
      tabCalc: "Calculator & Checklist",
      tabEdu: "Guide & Education",
      addAccountBtn: "+ Account",

      newAccountTitle: "New Account",
      accNameLabel: "Account name",
      accNamePlaceholder: "e.g. FTMO 100k Account",
      accTypeLabel: "Account type",
      accTypePersonal: "Personal",
      accTypePropfirm: "Prop Firm",
      accCapitalLabel: "Starting capital ($)",
      accCurrencyLabel: "Currency",
      accDailyLossLabel: "Daily loss limit ($)",
      accDailyLossHint: "Used by the Virtual Instructor to warn you before you breach it.",
      accCreateBtn: "Create account",
      accCancelBtn: "Cancel",
      accNameRequired: "Please enter an account name.",

      delAccountTitle: "Delete account",
      delAccountConfirmBtn: "Delete",
      delAccountText: "This will permanently delete the account \"{name}\" and all of its logged trades. This cannot be undone.",
      delAccountLastOne: "You can't delete your last remaining account.",

      resultCloseTitle: "Close trade",
      resultRMultipleLabel: "Result in R (e.g. 2 = +2R, -1 = stop hit)",
      resultConfirmBtn: "Confirm",

      tradeNotesLabel: "Note (optional)",
      tradeNotesPlaceholder: "e.g. A+ setup on support retest, strict plan compliance...",
      tradeNoteTitle: "Trade note",
      tradeNoteSaveBtn: "Save",
      tradeNoteAddBtn: "+ Note",
      tradeNoteViewBtn: "Note",

      expectancyUnit: "R / trade",

      analyticsTitle: "Analytics",
      analyticsEmpty: "Close some trades to see your stats here.",
      statTotalTrades: "Closed trades",
      statAvgWin: "Avg win",
      statAvgLoss: "Avg loss",
      statMaxDrawdown: "Max Drawdown",
      equityCurveTitle: "Equity Curve (cumulative R)",
      byAssetTitle: "Performance by Asset Class",
      byRuleTitle: "Checklist Rigor vs Outcome",
      byRuleEmpty: "Not enough closed trades yet for this comparison.",
      byRuleDesc: "Compares how many rules were active at trade time against the outcome.",
      colTrades: "Trades",
      colWinRate: "Win Rate",
      colExpectancy: "Expectancy",

      calculatorTitle: "Position Size Calculator",
      capitalLabel: "Account Capital ($)",
      riskLabel: "Risk %",
      entryLabel: "Entry Price",
      slLabel: "Stop Loss",
      tpLabel: "Take Profit",
      pipValueLabel: "Pip/Point Value ($)",
      jpyLabel: "JPY pair (pip = 0.01)",
      pairLabel: "Currency Pair",
      pairLabelCrypto: "Crypto Pair",
      pairLabelIndex: "Index",
      pairOther: "Other / Custom",
      
      resPositionSize: "Position Size",
      resRiskAmount: "Risk Amount",
      resPotentialProfit: "Potential Profit",
      resRR: "R:R Ratio",
      atStopLoss: "at stop-loss",
      atTakeProfit: "at take-profit",
      rewardRisk: "reward : risk",

      instTitle: "Virtual Instructor",
      instEmpty: "Fill in trade details to receive live risk feedback.",
      instNoAccount: "No active account selected. Please create or select an account.",
      instOk: "✓ No issues detected with this setup.",
      instBadRR: "Unfavorable R:R. You are risking more than you can gain.",
      instWarnRR: "R:R is below the recommended 1:1.5 minimum.",
      instGoodRR: "Strong R:R setup. Only requires a low win rate to break even.",
      instHighRisk: "Risking more than 2% per trade is aggressive. Reduce your risk.",
      instDailyLossBreached: "This trade's risk breaches your daily loss limit!",

      checklistTitle: "Pre-Trade Checklist",
      checklistSub: "All items must be checked to unlock trade logging.",
      addRulePlaceholder: "Add custom rule...",
      logBtnLocked: "Complete checklist to log trade",
      logBtnUnlocked: "Log trade to journal",
      logBtnNoAccount: "Create an account first",

      journalTitle: "Trade Journal",
      winRateLabel: "Win Rate:",
      expectancyLabel: "Expectancy:",
      colDate: "Date",
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
      revengeDesc: "Revenge Trading: Impulsively opening a trade after a loss to try to get even.",

      assetForex: "Forex",
      assetCrypto: "Crypto",
      assetIndices: "Indices",
      assetGold: "Gold",
      dirLong: "Long",
      dirShort: "Short",

      unitLots: "lots",
      unitUnits: "units",
      unitContracts: "contracts",

      statusOpen: "OPEN",
      statusWin: "WIN",
      statusLoss: "LOSS",
      actionWin: "Win",
      actionLoss: "Loss",

      addRuleBtn: "Add",

      defaultAccountName: "Demo Account",
      ruleStopLoss: "Stop-Loss placement verified before execution",
      rulePositionSize: "Position size matches max risk threshold",
      ruleNoNews: "No high-impact economic news within 15 minutes",
      ruleTradingPlan: "Setup fully complies with written trading plan",
      ruleNoRevenge: "Not influenced by recent trade results (No Revenge Trading)",
      ruleCalmFocused: "Calm, focused, and free from FOMO",
      ruleDailyDrawdown: "Daily drawdown limit respected",

      errCapital: "Account capital must be greater than 0.",
      errRisk: "Risk % must be greater than 0.",
      errEntry: "Entry price must be greater than 0.",
      errSl: "Stop-loss price must be greater than 0.",
      errTp: "Take-profit price must be greater than 0.",
      errEntrySlEqual: "Entry and Stop-Loss cannot be equal.",
      errLongSl: "For a LONG trade, Stop-Loss must be below Entry.",
      errShortSl: "For a SHORT trade, Stop-Loss must be above Entry.",
      errLongTp: "For a LONG trade, Take-Profit must be above Entry.",
      errShortTp: "For a SHORT trade, Take-Profit must be below Entry.",
      errUnknownAsset: "Unknown asset class.",
      calcErrorsTitle: "Please fix the following:"
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