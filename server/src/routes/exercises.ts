import { Router, Request, Response } from 'express';
import db from '../db';

const router = Router();

// Last N sets logged for an exercise (for "previous best" display)
router.get('/:id/history', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const history = db.prepare(`
    SELECT sl.*, wl.date, wl.completed_at
    FROM set_logs sl
    JOIN workout_logs wl ON sl.workout_log_id = wl.id
    WHERE sl.exercise_id = ?
    ORDER BY wl.created_at DESC, sl.set_number ASC
    LIMIT ?
  `).all(req.params.id, limit);
  res.json(history);
});

// Best (max weight) for an exercise
router.get('/:id/best', (req: Request, res: Response) => {
  const best = db.prepare(`
    SELECT MAX(weight_lbs) as best_weight, MAX(reps) as best_reps
    FROM set_logs
    WHERE exercise_id = ? AND is_bodyweight = 0
  `).get(req.params.id) as { best_weight: number | null; best_reps: number | null };
  res.json(best);
});

export default router;
