/**
 * Trader$ Draft — First-run seed data
 */
const Seed = (() => {
  const DEFAULT_CHECKLIST = [
    { label: 'Stop-Loss is placed on the chart before entry', category: 'risk', order: 1 },
    { label: 'Position size respects my max risk % per trade', category: 'risk', order: 2 },
    { label: 'No major high-impact news in the next 15 minutes', category: 'market', order: 3 },
    { label: 'Trade aligns with my written strategy / setup criteria', category: 'strategy', order: 4 },
    { label: 'I am not revenge-trading a previous loss', category: 'psychology', order: 5 },
    { label: 'My emotional state is neutral (not FOMO, not angry)', category: 'psychology', order: 6 },
    { label: 'Daily loss limit has not been reached', category: 'risk', order: 7 }
  ];

  async function runIfNeeded() {
    const seeded = await DB.Settings.get('seeded_v1', false);
    if (seeded) return;

    // Seed checklist rules
    const existingRules = await DB.ChecklistRules.all();
    if (existingRules.length === 0) {
      for (const rule of DEFAULT_CHECKLIST) {
        await DB.ChecklistRules.create({ ...rule, isDefault: true, enabled: true });
      }
    }

    // Seed a default account
    const existingAccounts = await DB.Accounts.all();
    if (existingAccounts.length === 0) {
      const acc = await DB.Accounts.create({
        name: 'Demo Account',
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
