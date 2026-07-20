import { Router } from 'express';
import { getAnalysis, createAnalysis, justifyAnalysis, updateAnalysis, deleteAnalysis } from '../controllers/analysis.controller.js';

const router = Router();

router.get('/', getAnalysis);
router.post('/', createAnalysis);
router.post('/justify', justifyAnalysis);
router.put('/:id', updateAnalysis);
router.delete('/:id', deleteAnalysis);

export default router;
