/**
 * Trader$ Draft — Position Size Calculator
 *
 * Supports: Forex (pip-based), Crypto, Stock Indices, Gold/Commodities.
 * All math is pure/stateless — pass in inputs, get back a result object.
 *
 * IMPORTANT ASSUMPTIONS (surfaced to user in UI, not hidden):
 * - Forex: standard lot = 100,000 units. Pip value approximated for USD-quote pairs
 *   (e.g. EUR/USD, GBP/USD) as $10/pip/lot. For JPY pairs, pip = 0.01 and value
 *   approximated at $9.3/pip/lot (varies with live rate — user can override).
 * - Crypto: sized in base-asset units (e.g. BTC), risk computed directly from
 *   entry/SL price distance × position size in units.
 * - Indices/Gold: sized in "contracts" or "units" using $-per-point, user-supplied
 *   or defaulted per common instrument (e.g. XAUUSD = $1/0.01 lot/pip... simplified
 *   to $ per point of movement).
 */
const Calculator = (() => {

  const ASSET_CLASSES = {
    forex: {
      label: 'Forex',
      sizeUnit: 'lots',
      defaultPipValue: 10,      // $ per pip per standard lot (USD quote pairs)
      pipSize: 0.0001,
      pipSizeJPY: 0.01
    },
    crypto: {
      label: 'Crypto',
      sizeUnit: 'units (coin)',
    },
    indices: {
      label: 'Stock Indices',
      sizeUnit: 'contracts',
      defaultPointValue: 1      // $ per point per 1 contract — user-adjustable
    },
    gold: {
      label: 'Gold / Commodities',
      sizeUnit: 'lots',
      defaultPointValue: 100    // $ per $1 move per standard lot (XAUUSD ~ $100/point/lot)
    }
  };

  /**
   * @param {Object} input
   * @param {string} input.assetClass - 'forex' | 'crypto' | 'indices' | 'gold'
   * @param {number} input.capital - account capital in account currency
   * @param {number} input.riskPercent - e.g. 1 for 1%
   * @param {number} input.entry - entry price
   * @param {number} input.sl - stop loss price
   * @param {number} input.tp - take profit price
   * @param {string} input.direction - 'long' | 'short'
   * @param {boolean} [input.isJPYPair] - forex only
   * @param {number} [input.pipValueOverride] - forex only, $ per pip per lot
   * @param {number} [input.pointValueOverride] - indices/gold only, $ per point per unit
   * @returns {Object} result
   */
  function calculate(input) {
    const {
      assetClass, capital, riskPercent, entry, sl, tp, direction = 'long',
      isJPYPair = false, pipValueOverride, pointValueOverride
    } = input;

    const errors = [];
    if (!capital || capital <= 0) errors.push('Account capital must be greater than 0.');
    if (!riskPercent || riskPercent <= 0) errors.push('Risk % must be greater than 0.');
    if (!entry || entry <= 0) errors.push('Entry price must be greater than 0.');
    if (!sl || sl <= 0) errors.push('Stop-loss price must be greater than 0.');
    if (!tp || tp <= 0) errors.push('Take-profit price must be greater than 0.');
    if (entry === sl) errors.push('Entry and Stop-Loss cannot be equal.');

    if (direction === 'long' && sl >= entry) {
      errors.push('For a LONG trade, Stop-Loss must be below Entry.');
    }
    if (direction === 'short' && sl <= entry) {
      errors.push('For a SHORT trade, Stop-Loss must be above Entry.');
    }
    if (direction === 'long' && tp <= entry) {
      errors.push('For a LONG trade, Take-Profit must be above Entry.');
    }
    if (direction === 'short' && tp >= entry) {
      errors.push('For a SHORT trade, Take-Profit must be below Entry.');
    }

    if (errors.length) {
      return { valid: false, errors };
    }

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
        const pipValue = pipValueOverride || (isJPYPair ? 9.3 : 10);
        const slPips = slDistance / pipSize;
        // riskAmount = lots * slPips * pipValue  =>  lots = riskAmount / (slPips * pipValue)
        positionSize = riskAmount / (slPips * pipValue);
        sizeUnit = 'lots';
        extra = { slPips: round(slPips, 1), pipValue };
        break;
      }
      case 'crypto': {
        // positionSize (units of base asset) * slDistance = riskAmount
        positionSize = riskAmount / slDistance;
        sizeUnit = 'units';
        extra = { notional: round(positionSize * entry, 2) };
        break;
      }
      case 'indices': {
        const pointValue = pointValueOverride || ASSET_CLASSES.indices.defaultPointValue;
        positionSize = riskAmount / (slDistance * pointValue);
        sizeUnit = 'contracts';
        extra = { pointValue };
        break;
      }
      case 'gold': {
        const pointValue = pointValueOverride || ASSET_CLASSES.gold.defaultPointValue;
        positionSize = riskAmount / (slDistance * pointValue);
        sizeUnit = 'lots';
        extra = { pointValue };
        break;
      }
      default:
        return { valid: false, errors: ['Unknown asset class.'] };
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
