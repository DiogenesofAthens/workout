import { Router, Request, Response } from 'express';
import db from '../db';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const userId = req.query.userId;
  let logs;
  if (userId) {
    logs = db.prepare(`
      SELECT wl.*, ps.name as session_name, ps.focus, ps.week_number, ps.session_number
      FROM workout_logs wl
      JOIN program_sessions ps ON wl.program_session_id = ps.id
      WHERE wl.user_id = ?
      ORDER BY wl.created_at DESC
    `).all(userId);
  } else {
    logs = db.prepare(`
      SELECT wl.*, ps.name as session_name, ps.focus, ps.week_number, ps.session_number
      FROM workout_logs wl
      JOIN program_sessions ps ON wl.program_session_id = ps.id
      ORDER BY wl.created_at DESC
    `).all();
  }
  res.json(logs);
});

router.post('/', (req: Request, res: Response) => {
  const { userId, sessionId, date } = req.body;
  if (!userId || !sessionId || !date) {
    return res.status(400).json({ error: 'userId, sessionId, and date are required' });
  }
  const result = db.prepare(
    'INSERT INTO workout_logs (user_id, program_session_id, date) VALUES (?, ?, ?)'
  ).run(userId, sessionId, date);
  const log = db.prepare('SELECT * FROM workout_logs WHERE id = ?').get(Number(result.lastInsertRowid));
  res.status(201).json(log);
});

router.get('/:id', (req: Request, res: Response) => {
  const log = db.prepare(`
    SELECT wl.*, ps.name as session_name, ps.focus, ps.week_number, ps.session_number
    FROM workout_logs wl
    JOIN program_sessions ps ON wl.program_session_id = ps.id
    WHERE wl.id = ?
  `).get(req.params.id);
  if (!log) return res.status(404).json({ error: 'Not found' });

  const sets = db.prepare(`
    SELECT sl.*, e.name as exercise_name, e.group_label, e.target_sets, e.target_reps, e.order_index
    FROM set_logs sl
    JOIN exercises e ON sl.exercise_id = e.id
    WHERE sl.workout_log_id = ?
    ORDER BY e.order_index, sl.set_number
  `).all(req.params.id);

  res.json({ ...(log as object), sets });
});

router.patch('/:id', (req: Request, res: Response) => {
  const { completed, notes } = req.body;
  const updates: string[] = [];
  const values: unknown[] = [];

  if (completed !== undefined) {
    updates.push('completed = ?');
    values.push(completed ? 1 : 0);
    if (completed) {
      updates.push("completed_at = datetime('now')");
    }
  }
  if (notes !== undefined) {
    updates.push('notes = ?');
    values.push(notes);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(req.params.id);
  db.prepare(`UPDATE workout_logs SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  const log = db.prepare('SELECT * FROM workout_logs WHERE id = ?').get(req.params.id);
  res.json(log);
});

router.get('/:id/sets', (req: Request, res: Response) => {
  const sets = db.prepare(`
    SELECT sl.*, e.name as exercise_name, e.group_label, e.order_index
    FROM set_logs sl
    JOIN exercises e ON sl.exercise_id = e.id
    WHERE sl.workout_log_id = ?
    ORDER BY e.order_index, sl.set_number
  `).all(req.params.id);
  res.json(sets);
});

router.post('/:id/sets', (req: Request, res: Response) => {
  const workoutLogId = req.params.id;
  const { exerciseId, setNumber, weightLbs, reps, isBodyweight, notes } = req.body;

  const prevBest = db.prepare(`
    SELECT MAX(sl.weight_lbs) as best
    FROM set_logs sl
    JOIN workout_logs wl ON sl.workout_log_id = wl.id
    WHERE sl.exercise_id = ? AND wl.id != ? AND sl.is_bodyweight = 0
  `).get(exerciseId, workoutLogId) as { best: number | null } | undefined;

  const isPr = !isBodyweight && weightLbs != null && prevBest?.best != null
    ? (weightLbs > prevBest.best ? 1 : 0)
    : 0;

  const result = db.prepare(`
    INSERT INTO set_logs (workout_log_id, exercise_id, set_number, weight_lbs, reps, is_bodyweight, is_pr, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(workoutLogId, exerciseId, setNumber, weightLbs ?? null, reps ?? null, isBodyweight ? 1 : 0, isPr, notes ?? null);

  const set = db.prepare('SELECT * FROM set_logs WHERE id = ?').get(Number(result.lastInsertRowid));
  res.status(201).json(set);
});

router.put('/:id/sets/:setId', (req: Request, res: Response) => {
  const { weight_lbs, reps, is_bodyweight, notes } = req.body;
  db.prepare(`
    UPDATE set_logs SET weight_lbs = ?, reps = ?, is_bodyweight = ?, notes = ?
    WHERE id = ?
  `).run(weight_lbs ?? null, reps ?? null, is_bodyweight ? 1 : 0, notes ?? null, req.params.setId);
  const set = db.prepare('SELECT * FROM set_logs WHERE id = ?').get(req.params.setId);
  res.json(set);
});

router.delete('/:id/sets/:setId', (req: Request, res: Response) => {
  db.prepare('DELETE FROM set_logs WHERE id = ?').run(req.params.setId);
  res.status(204).end();
});

export default router;
