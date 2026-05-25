import { Router } from 'express';
import db from '../db';

const router = Router();

router.get('/:id', (req, res) => {
  const session = db.prepare('SELECT * FROM program_sessions WHERE id = ?').get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Not found' });
  const exercises = db.prepare(
    'SELECT * FROM exercises WHERE session_id = ? ORDER BY order_index'
  ).all(req.params.id);
  res.json({ ...session as object, exercises });
});

router.get('/:id/exercises', (req, res) => {
  const exercises = db.prepare(
    'SELECT * FROM exercises WHERE session_id = ? ORDER BY order_index'
  ).all(req.params.id);
  res.json(exercises);
});

export default router;
