import express from 'express';
import cors from 'cors';
import path from 'path';
import db from './db';
import programsRouter from './routes/programs';
import sessionsRouter from './routes/sessions';
import logsRouter from './routes/logs';
import exercisesRouter from './routes/exercises';
import usersRouter from './routes/users';

// Auto-seed if empty
const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
if (userCount === 0) {
  require('./seed');
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/programs', programsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/workout-logs', logsRouter);
app.use('/api/exercises', exercisesRouter);
app.use('/api/users', usersRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
