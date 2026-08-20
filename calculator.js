/**
 * Traft — Calculator Engine
 */
const Calculator = (() => {

  const ASSET_CLASSES = {
    forex: { labelKey: 'assetForex', sizeUnitKey: 'unitLots', defaultPipValue: 10, pipSize: 0.0001, pipSizeJPY: 0.01 },
    crypto: { labelKey: 'assetCrypto', sizeUnitKey: 'unitCoins' },
    indices: { labelKey: 'assetIndices', sizeUnitKey: 'unitContracts', defaultPointValue: 1 },
    gold: { labelKey: 'assetGold', sizeUnitKey: 'unitLots', defaultPointValue: 100 }
  };

  // Majeures + croisées populaires. pipValue = valeur approximative en USD
  // pour 1 lot standard (100k unités) au taux de change moyen — reste
  // éditable dans l'UI pour une précision parfaite selon le compte/devise.
  const FOREX_PAIRS = [
    { symbol: 'EURUSD', isJPY: false, pipValue: 10 },
    { symbol: 'GBPUSD', isJPY: false, pipValue: 10 },
    { symbol: 'USDJPY', isJPY: true, pipValue: 9.3 },
    { symbol: 'USDCHF', isJPY: false, pipValue: 11.2 },
    { symbol: 'USDCAD', isJPY: false, pipValue: 7.4 },
    { symbol: 'AUDUSD', isJPY: false, pipValue: 10 },
    { symbol: 'NZDUSD', isJPY: false, pipValue: 10 },
    { symbol: 'EURJPY', isJPY: true, pipValue: 9.3 },
    { symbol: 'GBPJPY', isJPY: true, pipValue: 9.3 },
    { symbol: 'EURGBP', isJPY: false, pipValue: 12.6 },
    { symbol: 'AUDJPY', isJPY: true, pipValue: 9.3 }
  ];

  // Cryptos populaires — juste pour identifier le symbole au journal,
  // le calcul lui-même (riskAmount / slDistance) ne dépend pas de la paire.
  const CRYPTO_PAIRS = [
    'BTCUSD', 'ETHUSD', 'SOLUSD', 'XRPUSD', 'BNBUSD',
    'ADAUSD', 'DOGEUSD', 'LTCUSD', 'AVAXUSD', 'LINKUSD'
  ];

  // Indices majeurs avec leur valeur de point approximative en USD
  // pour 1 contrat standard — varie selon le broker, reste éditable.
  const INDEX_PAIRS = [
    { symbol: 'US30', pointValue: 1 },
    { symbol: 'NAS100', pointValue: 1 },
    { symbol: 'SPX500', pointValue: 1 },
    { symbol: 'GER40', pointValue: 1 },
    { symbol: 'UK100', pointValue: 1 },
    { symbol: 'JPN225', pointValue: 1 },
    { symbol: 'FRA40', pointValue: 1 },
    { symbol: 'AUS200', pointValue: 1 }
  ];

  function calculate(input) {
    const {
      assetClass, capital, riskPercent, entry, sl, tp, direction = 'long',
      isJPYPair = false, pipValueOverride, pointValueOverride, leverage,
      symbol
    } = input;

    const errors = [];
    if (!capital || capital <= 0) errors.push('errCapital');
    if (!riskPercent || riskPercent <= 0) errors.push('errRisk');
    if (!entry || entry <= 0) errors.push('errEntry');
    if (!sl || sl <= 0) errors.push('errSl');
    if (!tp || tp <= 0) errors.push('errTp');
    if (entry === sl) errors.push('errEntrySlEqual');

    if (direction === 'long' && sl >= entry) errors.push('errLongSl');
    if (direction === 'short' && sl <= entry) errors.push('errShortSl');
    if (direction === 'long' && tp <= entry) errors.push('errLongTp');
    if (direction === 'short' && tp >= entry) errors.push('errShortTp');

    // Guard against float-precision near-equality (e.g. entry=1.10000000000001,
    // sl=1.1): entry !== sl passes but slDistance collapses toward 0, which
    // blows positionSize up toward Infinity/absurd values further down.
    if (entry && sl && Math.abs(entry - sl) / entry < 1e-9) errors.push('errEntrySlEqual');

    const hasPipOverride = pipValueOverride !== undefined && pipValueOverride !== null && pipValueOverride !== '' && !isNaN(pipValueOverride);
    const hasPointOverride = pointValueOverride !== undefined && pointValueOverride !== null && pointValueOverride !== '' && !isNaN(pointValueOverride);
    if (assetClass === 'forex' && hasPipOverride && pipValueOverride <= 0) errors.push('errPipValue');
    if ((assetClass === 'indices' || assetClass === 'gold') && hasPointOverride && pointValueOverride <= 0) errors.push('errPointValue');

    if (errors.length) return { valid: false, errors };

    const riskAmount = capital * (riskPercent / 100);
    const slDistance = Math.abs(entry - sl);
    const tpDistance = Math.abs(tp - entry);
    const rrRatio = tpDistance / slDistance;
    const potentialProfit = riskAmount * rrRatio;

    let positionSize = 0;
    let sizeUnit = '';
    let extra = {};

    switch (assetClass) {
      case 'forex': {
        const pipSize = isJPYPair ? 0.01 : 0.0001;
        const pipValue = hasPipOverride ? pipValueOverride : (isJPYPair ? 9.3 : 10);
        const slPips = slDistance / pipSize;
        positionSize = riskAmount / (slPips * pipValue);
        sizeUnit = 'unitLots';
        extra = { slPips: round(slPips, 1), pipValue };
        break;
      }
      case 'crypto': {
        positionSize = riskAmount / slDistance;
        sizeUnit = 'unitCoins';
        extra = { notional: round(positionSize * entry, 2) };
        break;
      }
      case 'indices': {
        const pointValue = hasPointOverride ? pointValueOverride : ASSET_CLASSES.indices.defaultPointValue;
        positionSize = riskAmount / (slDistance * pointValue);
        sizeUnit = 'unitContracts';
        extra = { pointValue, notional: round(positionSize * entry * pointValue, 2) };
        break;
      }
      case 'gold': {
        const pointValue = hasPointOverride ? pointValueOverride : ASSET_CLASSES.gold.defaultPointValue;
        positionSize = riskAmount / (slDistance * pointValue);
        sizeUnit = 'unitLots';
        extra = { pointValue, notional: round(positionSize * entry * pointValue, 2) };
        break;
      }
      default:
        return { valid: false, errors: ['errUnknownAsset'] };
    }

    // Forex notional in USD depends on whether USD is the base or the quote
    // currency of the pair — multiplying by entry price unconditionally (as
    // before) is only correct for XXXUSD pairs and wildly overstates notional
    // (and therefore margin/liquidation figures) for USDXXX pairs, and is
    // simply wrong for cross pairs like EURJPY that have no USD leg at all.
    if (assetClass === 'forex') {
      const sym = (symbol || '').toUpperCase();
      const base = sym.slice(0, 3);
      const quote = sym.slice(3, 6);
      const lotUnits = 100000;

      if (quote === 'USD') {
        // XXXUSD: 1 lot = 100,000 base units; notional in USD = units * entry price
        extra.notional = round(positionSize * lotUnits * entry, 2);
      } else if (base === 'USD') {
        // USDXXX: 1 lot = 100,000 USD; notional in USD is fixed, independent of entry
        extra.notional = round(positionSize * lotUnits, 2);
      } else if (typeof input.baseToUsdRate === 'number' && input.baseToUsdRate > 0) {
        // Cross pair (no USD leg): notional needs the base currency's own
        // USD rate, which the caller resolves live via FxRates and passes in.
        // pipValue (quote->USD) alone cannot give us this — using it would
        // silently produce a wrong number, so we require the real rate.
        extra.notional = round(positionSize * lotUnits * input.baseToUsdRate, 2);
      } else {
        // No live base rate available yet: don't fabricate a notional figure
        // (and therefore skip margin/leverage math below, which depends on it).
        extra.notional = null;
      }
    }

    // Leverage: required margin, % of capital used as margin, and a simple
    // liquidation-distance estimate (rough — ignores swaps/fees/broker-specific
    // stop-out rules, which vary; treat as an educational approximation).
    let leverageInfo = {};
    if (leverage && leverage > 0 && extra.notional) {
      const marginRequired = extra.notional / leverage;
      const marginPercentOfCapital = (marginRequired / capital) * 100;
      // Distance (in % of entry price) the market can move against the position
      // before the free capital (capital - marginRequired) is wiped out.
      const freeCapital = capital - marginRequired;
      const liquidationDistancePercent = freeCapital > 0
        ? (freeCapital / extra.notional) * 100
        : 0;

      let riskLevel = 'low';
      if (marginPercentOfCapital >= 50 || freeCapital <= 0) riskLevel = 'extreme';
      else if (marginPercentOfCapital >= 25) riskLevel = 'high';
      else if (marginPercentOfCapital >= 10) riskLevel = 'moderate';

      leverageInfo = {
        leverage,
        marginRequired: round(marginRequired, 2),
        marginPercentOfCapital: round(marginPercentOfCapital, 2),
        liquidationDistancePercent: round(liquidationDistancePercent, 2),
        riskLevel
      };
    }

    return {
      valid: true,
      errors: [],
      riskAmount: round(riskAmount, 2),
      slDistance: round(slDistance, 6),
      tpDistance: round(tpDistance, 6),
      rrRatio: round(rrRatio, 2),
      potentialProfit: round(potentialProfit, 2),
      positionSize: round(positionSize, assetClass === 'crypto' ? 6 : 4),
      sizeUnit,
      assetClass,
      ...extra,
      ...leverageInfo
    };
  }

  function round(num, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round((num + Number.EPSILON) * factor) / factor;
  }

  return { calculate, ASSET_CLASSES, FOREX_PAIRS, CRYPTO_PAIRS, INDEX_PAIRS };
})();