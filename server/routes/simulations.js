import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { history, simulate, badTiming, scenario, compare } from '../controllers/simulationController.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();

// Each run does 10,000 Monte Carlo paths server-side — throttle it
// separately from the general API so it can't be used to burn CPU.
const simulateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many simulations run in a short time. Please wait a moment and try again.' }
});

router.use(requireAuth);
router.post('/', simulateLimiter, simulate);
router.post('/bad-timing', simulateLimiter, badTiming);
router.post('/scenario', simulateLimiter, scenario);
router.post('/compare', simulateLimiter, compare);
router.get('/history', history);
export default router;
