import { Router } from 'express';
import { getAnalysis, createAnalysis, updateAnalysis, deleteAnalysis } from '../controllers/analysis.controller.js';

const router = Router();

router.get('/', getAnalysis);
router.post('/', createAnalysis);
router.put('/:id', updateAnalysis);
router.delete('/:id', deleteAnalysis);

export default router;
