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
      slPercentLabel: "Distance SL (%)",
      rrTargetLabel: "Ratio R:R visé",
      autoTag: "AUTO",
      leverageLabel: "Levier (optionnel)",
      leverageInfoTitle: "Impact du Levier",
      marginRequiredLabel: "Marge requise",
      marginPercentLabel: "% du capital en marge",
      liquidationDistanceLabel: "Distance jusqu'à liquidation estimée",
      leverageInfoNote: "Estimation éducative simplifiée (hors frais de financement/swap et règles spécifiques du broker). Le montant risqué par trade reste toujours le même quel que soit le levier — c'est la taille de position qui détermine le risque réel, pas le levier affiché.",
      leverageRiskLow: "Faible",
      leverageRiskModerate: "Modéré",
      leverageRiskHigh: "Élevé",
      leverageRiskExtreme: "Extrême",
      pipValueLabel: "Valeur Point/Pip ($)",
      jpyLabel: "Paire en JPY (pip = 0.01)",
      pairLabel: "Paire de devises",
      pairLabelCrypto: "Paire Crypto",
      pairLabelIndex: "Indice",
      pairOther: "Autre / Personnalisé",
      pipLiveTag: "● TAUX EN DIRECT",
      
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
      instScoreLabel: "Qualité du setup",

      instBadRR: "Ratio R:R de 1:{rr} défavorable — vous risquez plus que ce que vous pouvez gagner. À ce ratio, il vous faudrait gagner au moins {bewr}% de vos trades juste pour ne pas perdre d'argent sur la durée, ce qui est très difficile à tenir statistiquement. Cherchez un take-profit plus ambitieux ou un stop-loss plus serré avant d'entrer.",
      instWarnRR: "Ratio R:R de 1:{rr}, sous le minimum recommandé de 1:1.5. Ce setup exige un taux de réussite d'au moins {bewr}% pour être rentable à long terme — c'est jouable, mais ça laisse peu de marge d'erreur face aux frais et au slippage.",
      instGoodRR: "Bon ratio R:R de 1:{rr}. Avec ce setup, un taux de réussite de seulement {bewr}% suffit à être rentable sur la durée, ce qui vous laisse une marge de sécurité confortable face aux pertes normales d'une stratégie.",
      instExcellentRR: "Excellent ratio R:R de 1:{rr}. Un taux de réussite de seulement {bewr}% suffit ici à être rentable — c'est le genre de setup asymétrique qui permet de rester profitable même avec plus de pertes que de gains.",

      instModerateRisk: "Risque de {pct}% du capital sur ce trade. C'est raisonnable, mais rester à 1% ou moins par trade donne encore plus de marge pour absorber une série de pertes sans entamer significativement le compte.",
      instHighRisk: "Risquer {pct}% du capital sur un seul trade est agressif. La plupart des traders professionnels limitent leur risque à 1-2% par trade — au-delà, une simple série de 4-5 pertes consécutives (statistiquement normale) peut sérieusement endommager le compte.",
      instExtremeRisk: "Risquer {pct}% du capital sur un seul trade est extrêmement dangereux. À ce niveau, quelques pertes consécutives suffisent à détruire le compte — ce n'est plus de la gestion du risque, c'est du pari. Réduisez drastiquement la taille de position.",

      instLeverageLow: "Levier de 1:{lev} utilisant seulement {pct}% du capital en marge. Exposition saine — il reste beaucoup de capital libre pour absorber les fluctuations du marché sans risque d'appel de marge.",
      instLeverageModerate: "Levier de 1:{lev} mobilisant {pct}% du capital en marge. C'est gérable, mais surveillez la position : une baisse de capital disponible plus importante rapprocherait d'un appel de marge.",
      instLeverageHigh: "Levier de 1:{lev} mobilisant {pct}% du capital en marge — c'est élevé. Une part importante du compte est immobilisée, laissant peu de coussin avant un appel de marge en cas de mouvement défavorable prolongé.",
      instLeverageExtreme: "Levier de 1:{lev} mobilisant {pct}% du capital en marge — niveau extrême. Le compte est à la merci d'un mouvement de marché relativement faible pour déclencher une liquidation forcée. Rappel : le levier ne change pas le montant risqué en dollars, mais il réduit dangereusement le coussin de sécurité du compte.",

      instDailyLossWarning: "Ce trade utiliserait {usagePercent}% de votre limite de perte journalière, laissant seulement {remaining}$ de marge avant d'atteindre les {limit}$ autorisés. Une perte sur ce trade limiterait fortement vos possibilités de trading pour le reste de la journée.",
      instDailyLossBreached: "Ce trade dépasserait votre limite de perte journalière ! Il ne vous reste que {remaining}$ de marge avant les {limit}$ autorisés, mais ce trade risque {risk}$. Réduisez la taille de position ou attendez demain — dépasser cette limite peut entraîner la clôture forcée du compte sur un compte Prop Firm.",

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

      eduLeverageTitle: "Le Levier (Leverage)",
      eduLeverageDesc: "Le levier permet de contrôler une position bien plus grande que votre capital réel. Un levier de 1:100 signifie que 1 000 $ de capital contrôlent 100 000 $ de position (1 lot standard en forex).\n\n• Marge requise : Le montant que le broker bloque sur votre compte pour ouvrir la position. Marge = Taille de position ÷ Levier. Avec 100 000 $ de position et un levier 1:100, la marge requise n'est que de 1 000 $.\n• Le levier amplifie les gains ET les pertes dans les mêmes proportions. Un levier élevé ne rend pas un trade plus risqué en soi — c'est la TAILLE DE POSITION permise par ce levier qui détermine le risque réel en dollars.\n• Erreur classique de débutant : confondre 'levier élevé' et 'risque élevé'. Le vrai risque dépend de la distance de votre Stop-Loss et de la taille de votre position, pas du levier affiché par le broker.\n• Appel de marge (Margin Call) : Si vos pertes flottantes réduisent votre capital disponible sous le seuil de marge requise, le broker vous demande d'ajouter des fonds ou ferme automatiquement vos positions.\n• Liquidation (Stop Out) : Si le capital disponible tombe encore plus bas, le broker ferme de force vos positions pour éviter un solde négatif, souvent au pire moment possible.\n• Un levier élevé (1:500, 1:1000) permet d'ouvrir des positions énormes avec peu de capital, ce qui pousse souvent les débutants à sur-trader (position trop grosse pour le compte), et non le levier lui-même qui pose problème.\n• Règle d'or : Utilisez toujours le calculateur de position ci-dessus avec un Risque % fixe (1-2% max) — cela vous protège automatiquement contre les excès de levier, peu importe le levier proposé par votre broker.\n• Le levier varie selon l'instrument et la réglementation : souvent plus faible sur les indices/actions (1:5 à 1:20) que sur le forex majeur (1:30 à 1:500+ selon le broker et la juridiction).",

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
      slPercentLabel: "SL Distance (%)",
      rrTargetLabel: "Target R:R Ratio",
      autoTag: "AUTO",
      leverageLabel: "Leverage (optional)",
      leverageInfoTitle: "Leverage Impact",
      marginRequiredLabel: "Required margin",
      marginPercentLabel: "% of capital as margin",
      liquidationDistanceLabel: "Estimated distance to liquidation",
      leverageInfoNote: "Simplified educational estimate (excludes financing/swap fees and broker-specific rules). The dollar amount risked per trade stays the same regardless of leverage — it's the position size that determines real risk, not the leverage number.",
      leverageRiskLow: "Low",
      leverageRiskModerate: "Moderate",
      leverageRiskHigh: "High",
      leverageRiskExtreme: "Extreme",
      pipValueLabel: "Pip/Point Value ($)",
      jpyLabel: "JPY pair (pip = 0.01)",
      pairLabel: "Currency Pair",
      pairLabelCrypto: "Crypto Pair",
      pairLabelIndex: "Index",
      pairOther: "Other / Custom",
      pipLiveTag: "● LIVE RATE",
      
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
      instScoreLabel: "Setup Quality",

      instBadRR: "Unfavorable 1:{rr} R:R ratio — you're risking more than you can gain. At this ratio you'd need to win at least {bewr}% of your trades just to break even, which is statistically very hard to sustain. Look for a more ambitious take-profit or a tighter stop-loss before entering.",
      instWarnRR: "1:{rr} R:R ratio, below the recommended 1:1.5 minimum. This setup requires at least a {bewr}% win rate to be profitable long-term — doable, but it leaves little margin against fees and slippage.",
      instGoodRR: "Solid 1:{rr} R:R ratio. With this setup, a win rate of just {bewr}% is enough to be profitable over time, giving you a comfortable buffer against the normal losing streaks of any strategy.",
      instExcellentRR: "Excellent 1:{rr} R:R ratio. Only a {bewr}% win rate is needed here to be profitable — this is the kind of asymmetric setup that lets you stay profitable even with more losses than wins.",

      instModerateRisk: "Risking {pct}% of capital on this trade. That's reasonable, but staying at 1% or less per trade gives you even more room to absorb a losing streak without meaningfully denting the account.",
      instHighRisk: "Risking {pct}% of capital on a single trade is aggressive. Most professional traders cap risk at 1-2% per trade — beyond that, a simple streak of 4-5 consecutive losses (statistically normal) can seriously damage the account.",
      instExtremeRisk: "Risking {pct}% of capital on a single trade is extremely dangerous. At this level, a few consecutive losses are enough to wipe out the account — this isn't risk management anymore, it's gambling. Drastically reduce your position size.",

      instLeverageLow: "1:{lev} leverage using only {pct}% of capital as margin. Healthy exposure — plenty of free capital remains to absorb normal market fluctuations without risk of a margin call.",
      instLeverageModerate: "1:{lev} leverage tying up {pct}% of capital as margin. Manageable, but keep an eye on the position — a further drop in available capital would bring you closer to a margin call.",
      instLeverageHigh: "1:{lev} leverage tying up {pct}% of capital as margin — that's high. A large share of the account is locked up, leaving little cushion before a margin call if the market moves against you for long.",
      instLeverageExtreme: "1:{lev} leverage tying up {pct}% of capital as margin — extreme level. The account is at the mercy of a relatively small market move triggering forced liquidation. Reminder: leverage doesn't change the dollar amount risked, but it dangerously shrinks the account's safety cushion.",

      instDailyLossWarning: "This trade would use {usagePercent}% of your daily loss limit, leaving only ${remaining} of room before hitting the ${limit} allowed. A loss on this trade would sharply limit your trading options for the rest of the day.",
      instDailyLossBreached: "This trade would breach your daily loss limit! You only have ${remaining} of room left before the ${limit} allowed, but this trade risks ${risk}. Reduce position size or wait until tomorrow — exceeding this limit can trigger a forced account closure on a Prop Firm account.",

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

      eduLeverageTitle: "Leverage",
      eduLeverageDesc: "Leverage lets you control a position much larger than your actual capital. A leverage of 1:100 means $1,000 of capital controls a $100,000 position (1 standard lot in forex).\n\n• Required margin: The amount your broker locks up on your account to open the position. Margin = Position size ÷ Leverage. With a $100,000 position and 1:100 leverage, the required margin is only $1,000.\n• Leverage amplifies both gains AND losses in the same proportion. High leverage doesn't make a trade riskier by itself — it's the POSITION SIZE that leverage allows which determines the real dollar risk.\n• Classic beginner mistake: confusing 'high leverage' with 'high risk'. Real risk depends on your Stop-Loss distance and position size, not the leverage number your broker displays.\n• Margin Call: If your floating losses reduce your available capital below the required margin threshold, the broker asks you to add funds or automatically closes your positions.\n• Liquidation (Stop Out): If available capital drops even further, the broker force-closes your positions to prevent a negative balance, often at the worst possible moment.\n• High leverage (1:500, 1:1000) allows opening huge positions with little capital, which often pushes beginners into over-trading (position too large for the account) — it's the oversized position that's the problem, not leverage itself.\n• Golden rule: Always use the position size calculator above with a fixed Risk % (1-2% max) — this automatically protects you from leverage excess, regardless of what leverage your broker offers.\n• Leverage varies by instrument and regulation: often lower on indices/stocks (1:5 to 1:20) than on major forex pairs (1:30 to 1:500+ depending on broker and jurisdiction).",

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

  function get(key, params) {
    let text = dictionary[currentLang][key] || key;
    if (params) {
      Object.keys(params).forEach(p => {
        text = text.replaceAll(`{${p}}`, params[p]);
      });
    }
    return text;
  }

  return { setLanguage, get, getCurrentLang: () => currentLang };
})();