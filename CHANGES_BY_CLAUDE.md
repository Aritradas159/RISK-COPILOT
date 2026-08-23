# What I changed (data authenticity + F&O math)

Your `FIXES.md` fixes were good, but two things from earlier review were
still open — fixed both now:

## 1. Real data, no more silent fallback
`server/services/marketData.js` was fetching only the **last 1 year** from
Yahoo Finance, and silently swapped to synthetic sine-wave data if that
fetch failed (which is common mid-demo — flaky endpoint, rate limits, wifi).
Your pitch deck's whole differentiator is "real historical Nifty 50 data."

Fixed: bundled `server/data/nifty50_returns.json` — the same real 2000-2025
annual Nifty 50 dataset from your original repo — directly in the server.
No network call, no fallback needed, `source` field always says the real
thing. Copy this file's contents if you want to sanity-check the numbers
against NSE data yourself before Q&A.

## 2. F&O leverage model was producing nonsense
Old engine summed 21 sampled "daily" returns per month, then compounded
leverage MONTHLY for up to 240 months — this is a daily-rebalanced-ETF decay
model, not F&O, and it mechanically wiped out capital almost every time
(e.g. ₹1,000 → median ₹2 at 5×/20yr — that's not a bug in the code, it's
just the wrong model for what F&O actually is).

Fixed: now bootstraps ONE real historical annual return per year (same
style as your original engine — this is what you already know how to
explain), and leverage scales that real annual return directly, floored at
-95%/year. Same F&O test case (₹1,000, 5×, 5yr) now gives median ₹6,827 —
still genuinely risky (27% loss probability, up to 100% drawdown possible),
but it's a return you can defend as "leverage amplifies a real historical
year's move" instead of an artifact of the model's plumbing.

Both changes tested: server boots clean, client builds clean, and I ran
all three strategies (SIP/F&O/Mixed) against the live endpoint to confirm
sane, non-artifact numbers before handing this back.

**You should be able to explain:** why annual bootstrap (not daily) is the
model, what the -95% floor means, and that leverage is an illustrative
proxy, not real margin/mark-to-market mechanics. That's a fair, honest
answer if asked in Q&A.

## 3. Added the yearly fan chart + Bad Timing Mode + FD comparison
These existed in your original repo but weren't in the rebuilt version you
sent me. Ported the real logic over (not reinvented):

- **Yearly fan chart**: each Monte Carlo run now also tracks P10/median/P90
  balance at the END OF EVERY YEAR (not just the final year), so the
  results panel shows a growing band over time instead of one static
  histogram. New `yearlyBands` field in the simulate response.
- **Bad timing mode**: new `POST /api/simulations/bad-timing` endpoint —
  no randomness, replays the ACTUAL historical sequence of annual returns
  starting from a year you pick (e.g. 2008, 2020), so you can show "here's
  what really happened to someone unlucky enough to start right before a
  crash." New tab in the results panel.
- **FD comparison line**: a plain fixed-deposit baseline (7% p.a., same
  contribution pattern) plotted alongside the median outcome so the fan
  chart shows "safe boring alternative" vs. your strategy.

Verified: hit both endpoints directly with curl before touching the
frontend (yearly bands grow sensibly, 2008 replay shows real
crash-then-recovery shape), then did a full `npm run build` — clean, no
errors.

## 4. Fixed Bad Timing Mode wrap-around bug
Picking a start year near the end of the dataset (e.g. 2022) used to wrap
around and silently splice in unrelated early years (2000) once it ran out
of real data — contradicting the feature's own promise ("no randomness,
just what really happened"). Now it stops at the last real year available
and clearly flags it ("Only 4 years of real historical data are available
from 2022 onward") instead of faking continuity.

Also added an explicit disclaimer line to the Bad Timing tab, matching the
one already on the main Simulation tab.

Verified: curl-tested 2022 (truncates correctly, no fake years) and 2008
(unaffected, full 5-year real sequence) before rebuilding.
