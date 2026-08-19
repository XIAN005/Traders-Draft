/**
 * Traft — Seed initial
 */
const Seed = (() => {
  const DEFAULT_CHECKLIST = [
    { label: 'Stop-Loss placement verified before execution', category: 'risk', order: 1 },
    { label: 'Position size matches max risk threshold', category: 'risk', order: 2 },
    { label: 'No high-impact economic news within 15 minutes', category: 'market', order: 3 },
    { label: 'Setup fully complies with written trading plan', category: 'strategy', order: 4 },
    { label: 'Not influenced by recent trade results (No Revenge Trading)', category: 'psychology', order: 5 },
    { label: 'Calm, focused, and free from FOMO', category: 'psychology', order: 6 },
    { label: 'Daily drawdown limit respected', category: 'risk', order: 7 }
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