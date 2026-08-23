import { Router } from 'express';
import { getLessons } from '../controllers/learningController.js';
const router = Router();
router.get('/', getLessons);
export default router;
