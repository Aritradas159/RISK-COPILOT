import Simulation from '../models/Simulation.js';
import { isDemoMode, demoCreateSimulation, demoFindSimulationsByUser } from '../services/store.js';
import { getHistoricalReturns } from '../services/marketData.js';
import { runMonteCarlo, simulateHistoricalSequence } from '../services/monteCarlo.js';

export async function simulate(req, res) {
  const { strategy, initialInvestment, monthlyInvestment, durationYears, leverage } = req.body;
  if (!['sip', 'fno', 'mixed'].includes(strategy)) return res.status(400).json({ message: 'Invalid strategy.' });
  if (!Number.isFinite(initialInvestment) || initialInvestment < 1000 || initialInvestment > 10000000) return res.status(400).json({ message: 'Initial investment must be between ₹1,000 and ₹1 crore.' });
  if (!Number.isFinite(durationYears) || durationYears < 1 || durationYears > 30) return res.status(400).json({ message: 'Duration must be between 1 and 30 years.' });
  const monthly = Number.isFinite(monthlyInvestment) ? monthlyInvestment : 0;
  const lev = Number.isFinite(leverage) ? leverage : 1;
  if (strategy === 'fno' && (lev < 1 || lev > 5)) return res.status(400).json({ message: 'F&O leverage must be between 1× and 5× for this prototype.' });

  const market = await getHistoricalReturns();
  const result = runMonteCarlo({
    strategy,
    initialInvestment,
    monthlyInvestment: monthly,
    durationYears,
    leverage: lev,
    historicalReturns: market.returns,
    simulations: 10000
  });

  const simulationPayload = {
    userId: req.user.id || req.user._id,
    strategy,
    initialInvestment,
    monthlyInvestment: monthly,
    durationYears,
    leverage: lev,
    probabilityOfLoss: result.probabilityOfLoss,
    probabilityOfProfit: result.probabilityOfProfit,
    medianOutcome: result.medianOutcome,
    percentile5: result.percentile5,
    percentile95: result.percentile95,
    maxDrawdown: result.maxDrawdown,
    totalInvested: result.totalInvested,
    source: market.source
  };
  if (isDemoMode()) demoCreateSimulation(simulationPayload); else await Simulation.create(simulationPayload);

  res.json({ ...result, source: market.source, disclaimer: 'Illustrative what-if simulation, not personalized financial advice.' });
}

export async function badTiming(req, res) {
  const { initialInvestment, monthlyInvestment, durationYears, startYear } = req.body;
  if (!Number.isFinite(initialInvestment) || initialInvestment < 1000) return res.status(400).json({ message: 'Initial investment must be at least ₹1,000.' });
  if (!Number.isFinite(durationYears) || durationYears < 1 || durationYears > 30) return res.status(400).json({ message: 'Duration must be between 1 and 30 years.' });
  if (!Number.isInteger(startYear)) return res.status(400).json({ message: 'startYear is required.' });

  const market = await getHistoricalReturns();
  try {
    const result = simulateHistoricalSequence({
      initialInvestment,
      monthlyInvestment: Number.isFinite(monthlyInvestment) ? monthlyInvestment : 0,
      durationYears,
      startYear,
      historicalReturnsByYear: market.returnsByYear
    });
    res.json({ ...result, source: market.source });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}

export async function history(req, res) {
  const items = isDemoMode() ? demoFindSimulationsByUser(req.user.id || req.user._id) : await Simulation.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(20);
  res.json({ simulations: items });
}

// ── Scenario Lab: stress-test via the EXISTING Monte Carlo engine ────
const SCENARIO_PRESETS = {
  crash:          { label: 'Market Crash',           returnScale: 0.35,  volScale: 1.0, returnShift: -0.12 },
  decline:        { label: 'Moderate Market Decline', returnScale: 0.60,  volScale: 1.0, returnShift: -0.04 },
  highVolatility: { label: 'High Volatility',        returnScale: 1.0,   volScale: 2.2, returnShift: 0 },
  inflationShock: { label: 'Inflation Shock',        returnScale: 1.0,   volScale: 1.0, returnShift: -0.06 },
};

function applyScenario(returns, preset, custom) {
  if (preset && SCENARIO_PRESETS[preset]) {
    const s = SCENARIO_PRESETS[preset];
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    return returns.map(r => {
      const deviation = r - mean;
      return (mean + deviation * s.volScale) * s.returnScale + s.returnShift;
    });
  }
  // Custom scenario: user supplies returnAdjustment (-0.20 = -20pp) and volatilityMultiplier
  if (custom) {
    const adj = Number.isFinite(custom.returnAdjustment) ? custom.returnAdjustment : 0;
    const vol = Number.isFinite(custom.volatilityMultiplier) ? Math.max(0.1, Math.min(custom.volatilityMultiplier, 5)) : 1;
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    return returns.map(r => {
      const deviation = r - mean;
      return mean + deviation * vol + adj;
    });
  }
  return returns;
}

export async function scenario(req, res) {
  const { strategy, initialInvestment, monthlyInvestment, durationYears, leverage, scenarioType, custom } = req.body;
  if (!['sip', 'fno', 'mixed'].includes(strategy)) return res.status(400).json({ message: 'Invalid strategy.' });
  if (!Number.isFinite(initialInvestment) || initialInvestment < 1000 || initialInvestment > 10000000) return res.status(400).json({ message: 'Initial investment must be between ₹1,000 and ₹1 crore.' });
  if (!Number.isFinite(durationYears) || durationYears < 1 || durationYears > 30) return res.status(400).json({ message: 'Duration must be between 1 and 30 years.' });
  const validScenarios = ['crash', 'decline', 'highVolatility', 'inflationShock', 'custom'];
  if (!validScenarios.includes(scenarioType)) return res.status(400).json({ message: 'Invalid scenario type.' });

  const monthly = Number.isFinite(monthlyInvestment) ? monthlyInvestment : 0;
  const lev = Number.isFinite(leverage) ? leverage : 1;
  const market = await getHistoricalReturns();

  const commonParams = { strategy, initialInvestment, monthlyInvestment: monthly, durationYears, leverage: lev, simulations: 10000 };

  // Base case: real historical returns (unchanged)
  const base = runMonteCarlo({ ...commonParams, historicalReturns: market.returns });

  // Stress case: modified returns via scenario
  const stressedReturns = applyScenario(market.returns, scenarioType === 'custom' ? null : scenarioType, scenarioType === 'custom' ? custom : null);
  const stress = runMonteCarlo({ ...commonParams, historicalReturns: stressedReturns });

  const scenarioLabel = scenarioType === 'custom' ? 'Custom Scenario' : (SCENARIO_PRESETS[scenarioType]?.label || scenarioType);

  res.json({
    base, stress, scenarioLabel,
    source: market.source,
    disclaimer: 'Illustrative stress-test scenario, not personalized financial advice.'
  });
}

// ── Portfolio Comparison: run all 3 strategies through the SAME engine ──
export async function compare(req, res) {
  const { initialInvestment, monthlyInvestment, durationYears, leverage } = req.body;
  if (!Number.isFinite(initialInvestment) || initialInvestment < 1000 || initialInvestment > 10000000) return res.status(400).json({ message: 'Initial investment must be between ₹1,000 and ₹1 crore.' });
  if (!Number.isFinite(durationYears) || durationYears < 1 || durationYears > 30) return res.status(400).json({ message: 'Duration must be between 1 and 30 years.' });

  const monthly = Number.isFinite(monthlyInvestment) ? monthlyInvestment : 0;
  const lev = Number.isFinite(leverage) ? Math.max(1, Math.min(leverage, 5)) : 2;
  const market = await getHistoricalReturns();

  const common = { initialInvestment, monthlyInvestment: monthly, durationYears, historicalReturns: market.returns, simulations: 10000 };

  const sip   = runMonteCarlo({ ...common, strategy: 'sip',   leverage: 1 });
  const fno   = runMonteCarlo({ ...common, strategy: 'fno',   leverage: lev, monthlyInvestment: 0 });
  const mixed = runMonteCarlo({ ...common, strategy: 'mixed', leverage: 1 });

  res.json({
    sip, fno, mixed,
    leverage: lev,
    source: market.source,
    disclaimer: 'Illustrative comparison, not personalized financial advice.'
  });
}
