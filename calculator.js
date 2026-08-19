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

  return { calculate, ASSET_CLASSES };
})();