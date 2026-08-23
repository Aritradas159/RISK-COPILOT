# Architecture

```text
Browser / React + Vite
        |
        | HTTPS / JSON API
        v
Node.js + Express
  |       |        |
  |       |        +--> Learning content
  |       +-----------> Monte Carlo simulation
  +-------------------> Auth / protected routes
        |
        v
MongoDB + Mongoose

Market-data path:
Bundled local historical Nifty 50 annual returns (server/data/nifty50_returns.json) -> bootstrap sampling -> 10,000 scenarios -> risk metrics
```

## Authentication flow
Signup/login -> bcrypt password verification -> JWT -> HTTP-only cookie -> auth middleware -> user-scoped resources.

## Simulation flow
User chooses strategy and inputs -> server validates -> historical returns loaded -> Monte Carlo scenarios generated -> risk metrics aggregated -> simulation saved to the authenticated user's history -> JSON returned to React.

## Design decisions

**Loss probability baseline.** For SIP/Mixed strategies, "probability of loss" is measured against total capital invested (initial + all monthly contributions), not just the opening lump sum — otherwise a multi-year SIP reads as ~0% loss probability almost regardless of market outcome, since contributions dwarf the initial amount.

**Mixed strategy risk.** The risky sleeve of a Mixed portfolio (55% core / 45% tactical) carries a 1.6x multiplier on that sleeve's return, so Mixed produces a genuinely wider outcome range and higher drawdown than plain SIP rather than collapsing to the same numbers.

**F&O leverage model.** Each simulated year draws one real historical annual Nifty 50 return (bootstrap resampling, same approach as SIP) and scales it directly by the leverage multiplier, floored at -95% in a single year. This is an explicit simplification: it does not model real margin calls, mark-to-market mechanics, or intraday/expiry dynamics. It's presented as an illustrative proxy for how leverage amplifies a real market year, not a production F&O pricing model.

**Bad Timing Mode.** Replays the actual historical sequence of annual returns starting from a chosen year — no resampling. If the chosen start year doesn't have enough real years of data ahead of it in the dataset (e.g. starting in 2022 with a 5-year horizon, but the dataset ends 2025), the replay stops at the last real year available rather than wrapping around to unrelated earlier years — continuity is never faked.

**Rate limiting.** `POST /api/simulations` and `/bad-timing` are capped separately from general API traffic, since each run does 10,000 Monte Carlo iterations server-side.
