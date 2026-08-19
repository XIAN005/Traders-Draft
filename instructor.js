/**
 * Traft — Virtual Instructor
 */
const Instructor = (() => {

  function analyze(calcResult, context = {}) {
    if (!calcResult || !calcResult.valid) return [];

    const messages = [];
    const { rrRatio, riskAmount } = calcResult;
    const { riskPercent, dailyLossUsed = 0, dailyLossLimit = null } = context;

    if (rrRatio < 1) {
      messages.push({ level: 'bad', message: I18n.get('instBadRR') });
    } else if (rrRatio < 1.5) {
      messages.push({ level: 'warn', message: I18n.get('instWarnRR') });
    } else {
      messages.push({ level: 'good', message: I18n.get('instGoodRR') });
    }

    if (riskPercent > 2) {
      messages.push({ level: 'bad', message: I18n.get('instHighRisk') });
    }

    if (dailyLossLimit !== null && dailyLossLimit > 0) {
      const projectedLoss = dailyLossUsed + riskAmount;
      if (projectedLoss >= dailyLossLimit) {
        messages.push({ level: 'bad', message: I18n.get('instDailyLossBreached') });
      }
    }

    return messages;
  }

  return { analyze };
})();