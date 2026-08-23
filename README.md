# Investment Literacy & Risk Copilot

A vernacular-first financial literacy and risk simulation product based on the Round 1 concept for Prasunethon 2.0.

## Product flow
Learn → Simulate → Understand Risk → Apply

## Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Auth: bcrypt + JWT in an HTTP-only cookie
- Simulation: Monte Carlo bootstrap sampling from historical return observations
- Charts: Recharts

## Core features
- Signup, login, logout, protected routes
- SIP, F&O and mixed scenarios
- 10,000 Monte Carlo scenarios
- Probability of loss/profit, percentile range and drawdown
- F&O friction gate
- English/Tamil micro-learning cards
- Per-user simulation history
- Input validation, Helmet and API rate limiting

## Important data note
Historical Nifty 50 annual returns (2000-2025) are bundled locally in `server/data/nifty50_returns.json` — no live API dependency, so a demo never breaks or silently swaps to synthetic data mid-presentation. Only 2008, 2009, and 2016 are exact published TRI figures; other years are a PRI-based approximation (see the dataset's own `_readme` field for full methodology). **Before submitting, verify the 2000-2025 figures against niftyindices.com's historical reports** and correct any year that doesn't match.

## Run locally
1. Install Node.js 20+.
2. Create `server/.env` from `server/.env.example` and set `MONGO_URI` and `JWT_SECRET`.
3. Create `client/.env` from `client/.env.example`.
4. From the repository root run `npm install`.
5. Run `npm run dev`.
6. Open `http://localhost:5173`.

## Security notes
Passwords are hashed with bcrypt. JWTs are stored in HTTP-only cookies. Production should use HTTPS, a strong secret, a production data source, strict CORS, and a managed secrets store.

## Disclaimer
This prototype provides illustrative what-if simulations and educational content. It is not personalized financial advice and should not be used as a substitute for a regulated financial adviser.
