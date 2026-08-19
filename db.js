/**
 * Trader$ Draft — Data Layer (IndexedDB)
 * Zero-backend persistence: accounts, trades, checklist rules, settings.
 * All methods return Promises. No external deps.
 */
const DB = (() => {
  const DB_NAME = 'smarttrade_db';
  const DB_VERSION = 1;
  const STORES = {
    accounts: 'accounts',       // { id, name, type, capital, currency, propFirmRules, createdAt }
    trades: 'trades',           // { id, accountId, assetClass, symbol, direction, entry, sl, tp, riskPercent, riskAmount, rrRatio, lotSize, status, result, rMultiple, createdAt, closedAt, notes }
    checklistRules: 'checklistRules', // { id, label, category, isDefault, enabled, order }
    settings: 'settings'        // { key, value }  (singleton-style k/v store)
  };

  let dbInstance = null;

  function open() {
    if (dbInstance) return Promise.resolve(dbInstance);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;

        if (!db.objectStoreNames.contains(STORES.accounts)) {
          const s = db.createObjectStore(STORES.accounts, { keyPath: 'id' });
          s.createIndex('createdAt', 'createdAt');
        }
        if (!db.objectStoreNames.contains(STORES.trades)) {
          const s = db.createObjectStore(STORES.trades, { keyPath: 'id' });
          s.createIndex('accountId', 'accountId');
          s.createIndex('createdAt', 'createdAt');
          s.createIndex('status', 'status');
        }
        if (!db.objectStoreNames.contains(STORES.checklistRules)) {
          const s = db.createObjectStore(STORES.checklistRules, { keyPath: 'id' });
          s.createIndex('order', 'order');
        }
        if (!db.objectStoreNames.contains(STORES.settings)) {
          db.createObjectStore(STORES.settings, { keyPath: 'key' });
        }
      };

      req.onsuccess = (e) => {
        dbInstance = e.target.result;
        resolve(dbInstance);
      };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  function tx(storeName, mode = 'readonly') {
    return open().then(db => db.transaction(storeName, mode).objectStore(storeName));
  }

  // Generic CRUD -------------------------------------------------------

  async function put(storeName, value) {
    const store = await tx(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(value);
      req.onsuccess = () => resolve(value);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async function get(storeName, key) {
    const store = await tx(storeName);
    return new Promise((resolve, reject) => {
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async function getAll(storeName) {
    const store = await tx(storeName);
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async function remove(storeName, key) {
    const store = await tx(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async function getByIndex(storeName, indexName, value) {
    const store = await tx(storeName);
    return new Promise((resolve, reject) => {
      const idx = store.index(indexName);
      const req = idx.getAll(value);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  // Domain helpers -------------------------------------------------------

  const uid = (prefix = 'id') =>
    `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  const Accounts = {
    all: () => getAll(STORES.accounts),
    get: (id) => get(STORES.accounts, id),
    save: (acc) => put(STORES.accounts, acc),
    create: (data) => put(STORES.accounts, {
      id: uid('acc'),
      name: data.name || 'Main Account',
      type: data.type || 'personal', // 'personal' | 'propfirm'
      capital: Number(data.capital) || 10000,
      currency: data.currency || 'USD',
      propFirmRules: data.propFirmRules || null, // { dailyLossLimit, maxDrawdown, profitTarget }
      createdAt: Date.now()
    }),
    delete: (id) => remove(STORES.accounts, id)
  };

  const Trades = {
    all: () => getAll(STORES.trades),
    byAccount: (accountId) => getByIndex(STORES.trades, 'accountId', accountId),
    get: (id) => get(STORES.trades, id),
    save: (trade) => put(STORES.trades, trade),
    create: (data) => put(STORES.trades, {
      id: uid('trade'),
      accountId: data.accountId,
      assetClass: data.assetClass,
      symbol: data.symbol,
      direction: data.direction, // 'long' | 'short'
      entry: Number(data.entry),
      sl: Number(data.sl),
      tp: Number(data.tp),
      riskPercent: Number(data.riskPercent),
      riskAmount: Number(data.riskAmount),
      rrRatio: Number(data.rrRatio),
      lotSize: Number(data.lotSize),
      status: 'open', // 'open' | 'closed'
      result: null,   // 'win' | 'loss' | 'breakeven'
      rMultiple: null,
      createdAt: Date.now(),
      closedAt: null,
      notes: data.notes || ''
    }),
    delete: (id) => remove(STORES.trades, id)
  };

  const ChecklistRules = {
    all: () => getAll(STORES.checklistRules),
    save: (rule) => put(STORES.checklistRules, rule),
    create: (data) => put(STORES.checklistRules, {
      id: uid('rule'),
      label: data.label,
      category: data.category || 'general',
      isDefault: !!data.isDefault,
      enabled: data.enabled !== false,
      order: data.order ?? 999
    }),
    delete: (id) => remove(STORES.checklistRules, id)
  };

  const Settings = {
    get: async (key, fallback = null) => {
      const row = await get(STORES.settings, key);
      return row ? row.value : fallback;
    },
    set: (key, value) => put(STORES.settings, { key, value })
  };

  return { open, Accounts, Trades, ChecklistRules, Settings, STORES };
})();
