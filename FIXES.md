# Fixes applied (Round 2 review)

1. **`probabilityOfLoss` now compares against total invested capital**
   (`server/services/monteCarlo.js`, `simulationController.js`, `models/Simulation.js`)
   Previously compared final value only against the initial lump sum, so a
   5yr SIP showed 0% loss probability regardless of market outcome. Now
   compares against `initialInvestment + monthlyInvestment × months`.
   The API response and UI now also surface `totalInvested` so the
   percentage has a visible baseline.

2. **"Mixed" strategy is no longer identical to plain SIP**
   (`server/services/monteCarlo.js`)
   The risky sleeve's leverage factor only ever triggered for `strategy
   === 'fno'`, so the mixed-strategy blend `0.55×market + 0.45×risky`
   collapsed algebraically to plain market growth. Added a
   `MIXED_RISK_MULTIPLIER` (1.6×) applied to the risky sleeve so Mixed now
   produces a genuinely wider outcome distribution and higher drawdown
   than SIP, matching what the product claims.

3. **CSS `@import` moved to the top of `styles.css`**
   It was previously placed after other rules, which is invalid CSS
   (imports must precede all other rules) and triggered a Vite build
   warning — some browsers would silently skip the Google Fonts load.

4. **Rate limiting added to `POST /api/simulations`**
   (`server/routes/simulations.js`)
   Each run does 10,000 Monte Carlo iterations server-side. Previously
   only `/api/auth` routes were throttled. Now capped at 12 runs/minute
   per client via `express-rate-limit` (already a listed dependency).

5. **Fallback data is now visibly flagged in the UI**
   (`client/src/main.jsx`, `styles.css`)
   If the live Yahoo Finance fetch fails and the app falls back to
   synthetic sample data, a visible amber banner now appears above the
   results ("Live Nifty 50 data was unavailable for this run...") instead
   of only a small grey source-note string easy to miss in a demo.

## Verified locally
- `npm install` at root — clean, 0 vulnerabilities
- `npm run build -w client` — clean build, no warnings
- Server boots in demo mode (no `MONGO_URI`) without errors
- Signup → SIP simulation → confirmed `probabilityOfLoss` now non-zero
  and scaled to a realistic value (~31% in test run vs. 0% before)
- Signup → Mixed vs SIP simulation with identical inputs → confirmed
  outputs now diverge (wider percentile range, higher max drawdown for Mixed)

## Not changed (still worth doing later, lower priority)
- Live Nifty data source (Yahoo undocumented endpoint) is still fragile —
  consider a more reliable data provider before relying on it for a
  real demo.
- `zod` is still an unused dependency; validation is hand-rolled in
  controllers. Fine to leave for now, but flagged in case you want to
  either use it or drop it.
- No route-based code splitting yet — single 612KB JS bundle. Not a
  correctness issue, just a possible load-time optimization.
