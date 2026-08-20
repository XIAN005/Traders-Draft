/**
 * Traft — Live FX Rates
 * Fetches exchange rates from Frankfurter (api.frankfurter.dev), a free,
 * no-key exchange rate API sourced from 84 central banks (ECB reference
 * rates, updated once per business day — plenty fresh for position sizing).
 */
const FxRates = (() => {
  const API_BASE = 'https://api.frankfurter.dev/v2';
  const CACHE_TTL_MS = 60 * 60 * 1000; // 1h, since ECB rates only move once/day anyway

  let cache = { base: null, rates: null, fetchedAt: 0 };
  let inflight = null;

  async function fetchRates(base = 'USD') {
    const now = Date.now();
    if (cache.base === base && cache.rates && (now - cache.fetchedAt) < CACHE_TTL_MS) {
      return cache.rates;
    }
    if (inflight) return inflight;

    inflight = fetch(`${API_BASE}/rates?base=${base}`)
      .then(res => {
        if (!res.ok) throw new Error(`FX fetch failed: ${res.status}`);
        return res.json();
      })
      .then(data => {
        cache = { base, rates: data.rates, fetchedAt: Date.now() };
        inflight = null;
        return cache.rates;
      })
      .catch(err => {
        inflight = null;
        throw err;
      });

    return inflight;
  }

  /**
   * Returns the pip/point value in USD for 1 standard lot (100,000 units)
   * of a given forex pair, e.g. 'USDJPY', 'EURJPY', 'EURUSD'.
   * Returns null if rates aren't available (caller should fall back to a
   * static default and let the user edit it manually).
   */
  async function getForexPipValueUSD(symbol, isJPY) {
    const base = symbol.slice(0, 3);
    const quote = symbol.slice(3, 6);
    const pipSize = isJPY ? 0.01 : 0.0001;
    const lotUnits = 100000;

    try {
      if (quote === 'USD') {
        // XXXUSD pairs: pip value is always exactly $10/lot (or $1 for JPY-quoted, rare)
        return round(pipSize * lotUnits, 2);
      }

      if (base === 'USD') {
        // USDXXX pairs: pip value = pipSize / rate(USD->XXX) * lotUnits
        const rates = await fetchRates('USD');
        const rate = rates[quote];
        if (!rate) return null;
        return round((pipSize / rate) * lotUnits, 2);
      }

      // Cross pairs without USD, e.g. EURJPY, GBPJPY, AUDJPY, EURGBP:
      // pip value in quote currency = pipSize * lotUnits, then convert quote->USD
      const rates = await fetchRates(quote);
      const rateToUSD = rates['USD'];
      if (!rateToUSD) return null;
      return round(pipSize * lotUnits * rateToUSD, 2);
    } catch (err) {
      console.warn('FxRates: live pip value fetch failed, caller should use static fallback', err);
      return null;
    }
  }

  function round(num, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round((num + Number.EPSILON) * factor) / factor;
  }

  return { fetchRates, getForexPipValueUSD };
})();
