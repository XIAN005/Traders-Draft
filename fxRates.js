/**
 * Traft — Live FX Rates
 * Fetches exchange rates from Frankfurter (api.frankfurter.dev), a free,
 * no-key exchange rate API sourced from 84 central banks (ECB reference
 * rates, updated once per business day — plenty fresh for position sizing).
 */
const FxRates = (() => {
  const API_BASE = 'https://api.frankfurter.dev/v2';
  const CACHE_TTL_MS = 60 * 60 * 1000; // 1h, since ECB rates only move once/day anyway

  const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
  const CRYPTO_CACHE_TTL_MS = 15 * 1000; // 15s — this one is a real live ticker, not a daily rate
  // Traft's CRYPTO_PAIRS uses broker-style symbols (BTCUSD); CoinGecko needs its own coin ids.
  const COINGECKO_IDS = {
    BTCUSD: 'bitcoin', ETHUSD: 'ethereum', SOLUSD: 'solana', XRPUSD: 'ripple',
    BNBUSD: 'binancecoin', ADAUSD: 'cardano', DOGEUSD: 'dogecoin', LTCUSD: 'litecoin',
    AVAXUSD: 'avalanche-2', LINKUSD: 'chainlink'
  };

  let cache = { base: null, rates: null, fetchedAt: 0 };
  let inflight = null;
  let cryptoCache = {}; // symbol -> { price, fetchedAt }
  let cryptoInflight = {}; // symbol -> promise

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

  /**
   * Resolves the USD value of 1 unit of a given base currency (e.g. 'EUR' -> ~1.10),
   * used to compute accurate USD notional for cross pairs (no USD leg, e.g. EURJPY).
   * Returns null if not resolvable (offline, unknown currency, etc.) — callers
   * should treat that as "notional unavailable" rather than guessing.
   */
  async function getBaseToUsdRate(baseCurrency) {
    if (baseCurrency === 'USD') return 1;
    try {
      const rates = await fetchRates(baseCurrency);
      const rate = rates['USD'];
      return (typeof rate === 'number' && rate > 0) ? rate : null;
    } catch (err) {
      console.warn('FxRates: base->USD rate fetch failed', err);
      return null;
    }
  }

  /**
   * Returns the current live USD price for a crypto symbol in Traft's
   * broker-style format (e.g. 'BTCUSD'), fetched from CoinGecko's free,
   * no-key public endpoint — a real live ticker, unlike the daily FX rates
   * above, so it's cached for 15s instead of 1h.
   * Returns null if unavailable (unknown symbol, offline, rate-limited,
   * etc.) — caller should leave the entry price for the user to fill in.
   */
  async function getCryptoPrice(symbol) {
    const coinId = COINGECKO_IDS[symbol];
    if (!coinId) return null;

    const now = Date.now();
    const cached = cryptoCache[symbol];
    if (cached && (now - cached.fetchedAt) < CRYPTO_CACHE_TTL_MS) {
      return cached.price;
    }
    if (cryptoInflight[symbol]) return cryptoInflight[symbol];

    cryptoInflight[symbol] = fetch(`${COINGECKO_BASE}/simple/price?ids=${coinId}&vs_currencies=usd`)
      .then(res => {
        if (!res.ok) throw new Error(`Crypto price fetch failed: ${res.status}`);
        return res.json();
      })
      .then(data => {
        const price = data[coinId] && data[coinId].usd;
        delete cryptoInflight[symbol];
        if (typeof price !== 'number') return null;
        cryptoCache[symbol] = { price, fetchedAt: Date.now() };
        return price;
      })
      .catch(err => {
        delete cryptoInflight[symbol];
        console.warn('FxRates: live crypto price fetch failed', err);
        return null;
      });

    return cryptoInflight[symbol];
  }

  function round(num, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round((num + Number.EPSILON) * factor) / factor;
  }

  return { fetchRates, getForexPipValueUSD, getBaseToUsdRate, getCryptoPrice };
})();
