function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

const annualToMonthlyRate = (annualReturn) => Math.pow(1 + annualReturn, 1 / 12) - 1;

// Risky sleeve of a Mixed portfolio carries this multiplier so Mixed is
// genuinely wider/riskier than plain SIP, not algebraically identical to it.
const MIXED_RISK_MULTIPLIER = 1.6;

function percentile(sorted, p) {
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

/**
 * Bootstrap resampling: each simulated year draws one ACTUAL historical
 * annual Nifty 50 return (with replacement) from real 2000-2025 data,
 * rather than assuming a fixed CAGR or synthesizing daily noise. This
 * matches how the original prototype worked and is straightforward to
 * explain: "we replay real market years in random order, many times."
 *
 * Leverage (F&O) scales that year's real return directly, floored at -95%
 * so a single bad year can hurt badly but can't mathematically imply more
 * than a near-total loss in one step. This is an illustrative proxy for
 * leveraged exposure, not a real margin/mark-to-market simulation.
 */
// Simple fixed-deposit comparison baseline (annualRate default ~ typical
// Indian bank FD rate), same contribution pattern as the chosen strategy,
// so the frontend can plot "what a safe, boring alternative would give you"
// alongside the simulated median line.
export function simulateFixedDeposit({ initialInvestment, monthlyInvestment = 0, durationYears, annualRate = 0.07 }) {
  const years = Math.max(1, Math.round(durationYears));
  const monthlyRate = annualToMonthlyRate(annualRate);
  let value = initialInvestment;
  const path = [];
  for (let y = 0; y < years; y++) {
    for (let m = 0; m < 12; m++) {
      value *= (1 + monthlyRate);
      value += monthlyInvestment;
    }
    path.push({ year: y + 1, balance: Math.round(value) });
  }
  return path;
}

export function runMonteCarlo({ strategy, initialInvestment, monthlyInvestment = 0, durationYears, leverage = 1, historicalReturns, simulations = 10000 }) {
  const years = Math.max(1, Math.round(durationYears));
  const monthlyContribution = (strategy === 'sip' || strategy === 'mixed') ? monthlyInvestment : 0;
  const totalInvested = initialInvestment + monthlyContribution * years * 12;

  const outcomes = [];
  const drawdowns = [];
  // yearlyBalances[y] collects the end-of-year value across every
  // simulated path, so we can compute a P10/median/P90 "fan chart" band
  // per year instead of only a single end-of-run distribution.
  const yearlyBalances = Array.from({ length: years }, () => []);

  for (let s = 0; s < simulations; s++) {
    let value = initialInvestment;
    let peak = value;
    let maxDrawdown = 0;

    for (let y = 0; y < years; y++) {
      const annualReturn = historicalReturns[Math.floor(Math.random() * historicalReturns.length)];

      const leverageFactor = strategy === 'fno'
        ? clamp(leverage, 1, 5)
        : strategy === 'mixed'
          ? MIXED_RISK_MULTIPLIER
          : 1;

      const marketAnnual = clamp(annualReturn, -0.95, 5);
      const riskyAnnual = clamp(annualReturn * leverageFactor, -0.95, 5);
      const blendedAnnual = strategy === 'mixed'
        ? 0.55 * marketAnnual + 0.45 * riskyAnnual
        : riskyAnnual;

      const monthlyRate = annualToMonthlyRate(blendedAnnual);

      for (let m = 0; m < 12; m++) {
        value *= (1 + monthlyRate);
        if (strategy === 'sip' || strategy === 'mixed') value += monthlyInvestment;
        value = Math.max(0, value);
        peak = Math.max(peak, value);
        maxDrawdown = Math.max(maxDrawdown, peak ? (peak - value) / peak : 0);
      }
      yearlyBalances[y].push(value);
    }

    outcomes.push(value);
    drawdowns.push(maxDrawdown);
  }

  const yearlyBands = yearlyBalances.map((balancesThisYear, idx) => {
    const sorted = [...balancesThisYear].sort((a, b) => a - b);
    return {
      year: idx + 1,
      p10: Math.round(percentile(sorted, 0.10)),
      median: Math.round(percentile(sorted, 0.50)),
      p90: Math.round(percentile(sorted, 0.90))
    };
  });
  const fdPath = simulateFixedDeposit({ initialInvestment, monthlyInvestment: monthlyContribution, durationYears: years });

  outcomes.sort((a, b) => a - b);
  const losses = outcomes.filter(v => v < totalInvested).length;
  const profits = outcomes.length - losses;

  return {
    probabilityOfLoss: Number((losses / simulations * 100).toFixed(1)),
    probabilityOfProfit: Number((profits / simulations * 100).toFixed(1)),
    medianOutcome: Math.round(percentile(outcomes, 0.5)),
    percentile5: Math.round(percentile(outcomes, 0.05)),
    percentile95: Math.round(percentile(outcomes, 0.95)),
    maxDrawdown: Number((Math.max(...drawdowns) * 100).toFixed(1)),
    totalInvested: Math.round(totalInvested),
    distribution: buildDistribution(outcomes, 18),
    yearlyBands,
    fdPath,
    simulations
  };
}

/**
 * "Bad timing" mode: no randomness — replays the ACTUAL historical
 * sequence of annual returns starting from a chosen year, so you can see
 * what really happened to someone whose SIP began right before a real
 * crash (e.g. 2008, 2020) instead of a randomized average.
 */
export function simulateHistoricalSequence({ initialInvestment, monthlyInvestment = 0, durationYears, startYear, historicalReturnsByYear }) {
  const years = Math.max(1, Math.round(durationYears));
  const sorted = [...historicalReturnsByYear].sort((a, b) => a.year - b.year);
  const startIdx = sorted.findIndex(r => r.year === startYear);
  if (startIdx === -1) throw new Error(`No historical data for start year ${startYear}`);

  // Only replay real years actually in the dataset — do NOT wrap around
  // to unrelated earlier years once we run past the last one. Wrapping
  // would silently break the feature's whole promise ("no randomness,
  // just what really happened") by splicing in a fake, disconnected year.
  const yearsAvailable = Math.min(years, sorted.length - startIdx);
  const truncated = yearsAvailable < years;

  let value = initialInvestment;
  const path = [];
  for (let y = 0; y < yearsAvailable; y++) {
    const dataPoint = sorted[startIdx + y];
    const monthlyRate = annualToMonthlyRate(dataPoint.return);
    for (let m = 0; m < 12; m++) {
      value *= (1 + monthlyRate);
      value += monthlyInvestment;
    }
    path.push({ year: y + 1, actualYear: dataPoint.year, balance: Math.round(value) });
  }

  return {
    path,
    truncated,
    yearsAvailable,
    totalInvested: Math.round(initialInvestment + monthlyInvestment * yearsAvailable * 12)
  };
}

function buildDistribution(values, bins) {
  const min = values[0];
  const max = values[values.length - 1];
  const width = Math.max((max - min) / bins, 1);
  const counts = Array.from({ length: bins }, () => 0);
  values.forEach(value => {
    const index = Math.min(bins - 1, Math.floor((value - min) / width));
    counts[index]++;
  });
  return counts.map((count, i) => ({
    outcome: Math.round(min + width * (i + 0.5)),
    count
  }));
}
