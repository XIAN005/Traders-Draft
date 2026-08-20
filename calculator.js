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
      isJPYPair = false, pipValueOverride, pointValueOverride
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
        const pipValue = (pipValueOverride !== undefined && pipValueOverride !== null && !isNaN(pipValueOverride)) 
          ? pipValueOverride 
          : (isJPYPair ? 9.3 : 10);
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
        const pointValue = (pointValueOverride !== undefined && pointValueOverride !== null && !isNaN(pointValueOverride))
          ? pointValueOverride
          : ASSET_CLASSES.indices.defaultPointValue;
        positionSize = riskAmount / (slDistance * pointValue);
        sizeUnit = 'unitContracts';
        extra = { pointValue };
        break;
      }
      case 'gold': {
        const pointValue = (pointValueOverride !== undefined && pointValueOverride !== null && !isNaN(pointValueOverride))
          ? pointValueOverride
          : ASSET_CLASSES.gold.defaultPointValue;
        positionSize = riskAmount / (slDistance * pointValue);
        sizeUnit = 'unitLots';
        extra = { pointValue };
        break;
      }
      default:
        return { valid: false, errors: ['errUnknownAsset'] };
    }

    return {
      valid: true,
      errors: [],
      riskAmount: round(riskAmount, 2),
      slDistance: round(slDistance, 6),
      tpDistance: round(tpDistance, 6),
      rrRatio: round(rrRatio, 2),
      potentialProfit: round(potentialProfit, 2),
      positionSize: round(positionSize, assetClass === 'crypto' ? 6 : 2),
      sizeUnit,
      assetClass,
      ...extra
    };
  }

  function round(num, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round((num + Number.EPSILON) * factor) / factor;
  }

  return { calculate, ASSET_CLASSES, FOREX_PAIRS, CRYPTO_PAIRS, INDEX_PAIRS };
})();