import { Router, Request, Response } from 'express';
import db from '../db';

const router = Router();

router.get('/', (_req, res) => {
  const users = db.prepare('SELECT * FROM users ORDER BY created_at').all();
  res.json(users);
});

router.get('/default', (_req: Request, res: Response) => {
  let user = db.prepare('SELECT * FROM users ORDER BY id LIMIT 1').get() as { id: number; display_name: string } | undefined;
  if (!user) {
    const result = db.prepare('INSERT INTO users (display_name) VALUES (?)').run('Kirk');
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(result.lastInsertRowid)) as { id: number; display_name: string };
  }
  res.json(user);
});

router.post('/', (req: Request, res: Response) => {
  const { displayName } = req.body;
  if (!displayName) return res.status(400).json({ error: 'displayName is required' });
  const result = db.prepare('INSERT INTO users (display_name) VALUES (?)').run(displayName);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(result.lastInsertRowid));
  res.status(201).json(user);
});

export default router;
