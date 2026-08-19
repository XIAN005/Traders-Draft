/**
 * Trader$ Draft — Virtual Instructor (Rules Engine)
 * Pure function: takes calculator result + context, returns an array of
 * { level: 'good'|'warn'|'bad', message } feedback items.
 */
const Instructor = (() => {

  function analyze(calcResult, context = {}) {
    if (!calcResult || !calcResult.valid) return [];

    const messages = [];
    const { rrRatio, riskAmount } = calcResult;
    const { riskPercent, capital, dailyLossUsed = 0, dailyLossLimit = null, isHighVolatilityWindow = false } = context;

    // R:R checks
    if (rrRatio < 1) {
      messages.push({
        level: 'bad',
        message: `R:R of ${rrRatio}:1 means you're risking more than you can gain. Reconsider this setup — most profitable strategies use at least 1:1.5.`
      });
    } else if (rrRatio < 1.5) {
      messages.push({
        level: 'warn',
        message: `R:R of ${rrRatio}:1 is below the recommended 1:1.5 minimum. You'll need a high win-rate to be profitable long-term.`
      });
    } else if (rrRatio >= 2) {
      messages.push({
        level: 'good',
        message: `Strong R:R of ${rrRatio}:1 — this setup only needs a ${Math.round(100 / (rrRatio + 1))}% win rate to break even.`
      });
    } else {
      messages.push({
        level: 'good',
        message: `R:R of ${rrRatio}:1 meets the recommended minimum.`
      });
    }

    // Risk % checks
    if (riskPercent > 2) {
      messages.push({
        level: 'bad',
        message: `Risking ${riskPercent}% of capital on a single trade is aggressive. A string of losses could severely damage your account. Consider ≤1-2%.`
      });
    } else if (riskPercent > 1.5) {
      messages.push({
        level: 'warn',
        message: `${riskPercent}% risk is on the higher side. 1% is the common professional default.`
      });
    }

    // Volatility window
    if (isHighVolatilityWindow) {
      messages.push({
        level: 'bad',
        message: `High-impact news event detected nearby. Spreads may widen and price can gap — consider waiting until volatility settles.`
      });
    }

    // Prop firm daily loss limit
    if (dailyLossLimit !== null) {
      const projectedLoss = dailyLossUsed + riskAmount;
      const pctOfLimit = (projectedLoss / dailyLossLimit) * 100;
      if (projectedLoss >= dailyLossLimit) {
        messages.push({
          level: 'bad',
          message: `This trade's risk would breach your daily loss limit ($${dailyLossLimit.toFixed(2)}). Do not take this trade.`
        });
      } else if (pctOfLimit >= 80) {
        messages.push({
          level: 'warn',
          message: `This trade would use ${pctOfLimit.toFixed(0)}% of your daily loss limit. Trade carefully — little room left today.`
        });
      }
    }

    return messages;
  }

  return { analyze };
})();
