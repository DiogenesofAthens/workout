import { Router } from 'express';
import db from '../db';

const router = Router();

router.get('/', (_req, res) => {
  const programs = db.prepare('SELECT * FROM programs ORDER BY created_at DESC').all();
  res.json(programs);
});

router.get('/:id', (req, res) => {
  const program = db.prepare('SELECT * FROM programs WHERE id = ?').get(req.params.id);
  if (!program) return res.status(404).json({ error: 'Not found' });
  const sessions = db.prepare(
    'SELECT * FROM program_sessions WHERE program_id = ? ORDER BY order_index'
  ).all(req.params.id) as Record<string, unknown>[];
  const exercises = db.prepare(
    'SELECT * FROM exercises WHERE session_id IN (SELECT id FROM program_sessions WHERE program_id = ?) ORDER BY session_id, order_index'
  ).all(req.params.id) as Record<string, unknown>[];

  const exercisesBySession = exercises.reduce<Record<number, Record<string, unknown>[]>>((acc, ex) => {
    const sid = ex.session_id as number;
    if (!acc[sid]) acc[sid] = [];
    acc[sid].push(ex);
    return acc;
  }, {});

  const sessionsWithExercises = sessions.map(s => ({
    ...s,
    exercises: exercisesBySession[s.id as number] ?? [],
  }));

  res.json({ ...(program as object), sessions: sessionsWithExercises });
});

export default router;
