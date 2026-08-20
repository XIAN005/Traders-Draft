/**
 * Traft — Virtual Instructor
 * Analyzes a trade setup across R:R quality, breakeven win rate, position
 * risk %, leverage/margin exposure, and daily loss limits, then produces
 * a weighted quality score (A–D) with detailed, reasoned feedback.
 */
const Instructor = (() => {

  // Minimum win rate (%) needed to break even at a given R:R ratio,
  // assuming equal win/loss size — the standard expectancy formula:
  // breakeven WR = 1 / (1 + RR)
  function breakevenWinRate(rrRatio) {
    if (!rrRatio || rrRatio <= 0) return 100;
    return round(100 / (1 + rrRatio), 1);
  }

  function analyze(calcResult, context = {}) {
    if (!calcResult || !calcResult.valid) return { messages: [], score: null };

    const messages = [];
    const { rrRatio, riskAmount, marginPercentOfCapital, riskLevel, leverage } = calcResult;
    const { riskPercent, dailyLossUsed = 0, dailyLossLimit = null } = context;

    // Track deductions for the overall quality score (starts at 100)
    let score = 100;

    // --- R:R quality + breakeven win rate ---
    const bewr = breakevenWinRate(rrRatio);
    if (rrRatio < 1) {
      messages.push({
        level: 'bad',
        message: I18n.get('instBadRR', { rr: rrRatio, bewr })
      });
      score -= 35;
    } else if (rrRatio < 1.5) {
      messages.push({
        level: 'warn',
        message: I18n.get('instWarnRR', { rr: rrRatio, bewr })
      });
      score -= 15;
    } else if (rrRatio < 2.5) {
      messages.push({
        level: 'good',
        message: I18n.get('instGoodRR', { rr: rrRatio, bewr })
      });
    } else {
      messages.push({
        level: 'good',
        message: I18n.get('instExcellentRR', { rr: rrRatio, bewr })
      });
    }

    // --- Risk per trade ---
    if (riskPercent > 5) {
      messages.push({ level: 'bad', message: I18n.get('instExtremeRisk', { pct: riskPercent }) });
      score -= 30;
    } else if (riskPercent > 2) {
      messages.push({ level: 'bad', message: I18n.get('instHighRisk', { pct: riskPercent }) });
      score -= 20;
    } else if (riskPercent > 1) {
      messages.push({ level: 'warn', message: I18n.get('instModerateRisk', { pct: riskPercent }) });
      score -= 5;
    }

    // --- Leverage / margin exposure (only if leverage was set) ---
    if (leverage && marginPercentOfCapital !== undefined) {
      if (riskLevel === 'extreme') {
        messages.push({ level: 'bad', message: I18n.get('instLeverageExtreme', { lev: leverage, pct: marginPercentOfCapital }) });
        score -= 45;
      } else if (riskLevel === 'high') {
        messages.push({ level: 'bad', message: I18n.get('instLeverageHigh', { lev: leverage, pct: marginPercentOfCapital }) });
        score -= 15;
      } else if (riskLevel === 'moderate') {
        messages.push({ level: 'warn', message: I18n.get('instLeverageModerate', { lev: leverage, pct: marginPercentOfCapital }) });
        score -= 5;
      } else {
        messages.push({ level: 'good', message: I18n.get('instLeverageLow', { lev: leverage, pct: marginPercentOfCapital }) });
      }
    }

    // --- Daily loss limit ---
    if (dailyLossLimit !== null && dailyLossLimit > 0) {
      const projectedLoss = dailyLossUsed + riskAmount;
      const remainingBefore = dailyLossLimit - dailyLossUsed;
      if (projectedLoss >= dailyLossLimit) {
        messages.push({
          level: 'bad',
          message: I18n.get('instDailyLossBreached', {
            risk: riskAmount.toFixed(2),
            remaining: Math.max(remainingBefore, 0).toFixed(2),
            limit: dailyLossLimit.toFixed(2)
          })
        });
        score -= 40;
      } else {
        const usagePercent = round((projectedLoss / dailyLossLimit) * 100, 0);
        if (usagePercent >= 70) {
          messages.push({
            level: 'warn',
            message: I18n.get('instDailyLossWarning', {
              usagePercent,
              remaining: (dailyLossLimit - projectedLoss).toFixed(2),
              limit: dailyLossLimit.toFixed(2)
            })
          });
          score -= 10;
        }
      }
    }

    score = Math.max(0, Math.min(100, score));
    const grade = score >= 85 ? 'A' : score >= 65 ? 'B' : score >= 40 ? 'C' : 'D';

    return { messages, score, grade, breakevenWinRate: bewr };
  }

  function round(num, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round((num + Number.EPSILON) * factor) / factor;
  }

  return { analyze, breakevenWinRate };
})();