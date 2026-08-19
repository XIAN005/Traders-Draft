/**
 * Traft — Seed initial
 */
const Seed = (() => {
  const DEFAULT_CHECKLIST = [
    { labelKey: 'ruleStopLoss', category: 'risk', order: 1 },
    { labelKey: 'rulePositionSize', category: 'risk', order: 2 },
    { labelKey: 'ruleNoNews', category: 'market', order: 3 },
    { labelKey: 'ruleTradingPlan', category: 'strategy', order: 4 },
    { labelKey: 'ruleNoRevenge', category: 'psychology', order: 5 },
    { labelKey: 'ruleCalmFocused', category: 'psychology', order: 6 },
    { labelKey: 'ruleDailyDrawdown', category: 'risk', order: 7 }
  ];

  async function runIfNeeded() {
    const seeded = await DB.Settings.get('seeded_v1', false);
    if (seeded) return;

    const existingRules = await DB.ChecklistRules.all();
    if (existingRules.length === 0) {
      for (const rule of DEFAULT_CHECKLIST) {
        await DB.ChecklistRules.create({ ...rule, isDefault: true, enabled: true });
      }
    }

    const existingAccounts = await DB.Accounts.all();
    if (existingAccounts.length === 0) {
      const acc = await DB.Accounts.create({
        name: '',
        nameKey: 'defaultAccountName',
        type: 'personal',
        capital: 10000,
        currency: 'USD'
      });
      await DB.Settings.set('activeAccountId', acc.id);
    }

    await DB.Settings.set('seeded_v1', true);
  }

  return { runIfNeeded, DEFAULT_CHECKLIST };
})();