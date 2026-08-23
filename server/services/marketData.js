import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Primary source: real historical Nifty 50 annual returns, 2000-2025,
// bundled locally so the demo NEVER silently falls back to synthetic data.
// (Sourced from NSE public historical data — see server/data/nifty50_returns.json)
const dataset = JSON.parse(
  readFileSync(path.join(__dirname, '../data/nifty50_returns.json'), 'utf-8')
);
const REAL_ANNUAL_RETURNS = dataset.returns.map(r => r.return);

export async function getHistoricalReturns() {
  // Real, bundled 2000-2025 Nifty 50 annual returns — always available,
  // no network dependency, so a demo never breaks or silently swaps to
  // fake data mid-presentation.
  return {
    returns: REAL_ANNUAL_RETURNS,
    returnsByYear: dataset.returns, // [{ year, return }, ...] — needed for bad-timing replay
    source: 'Historical Nifty 50 annual returns, 2000-2025 (NSE public data)'
  };
}
