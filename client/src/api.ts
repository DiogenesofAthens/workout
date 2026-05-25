import type { User, Program, ProgramSession, Exercise, WorkoutLog, SetLog, ExerciseHistory } from './types';

const BASE = '/api';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json();
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.status}`);
  return res.json();
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status}`);
  return res.json();
}

async function del(path: string): Promise<void> {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
}

export const api = {
  users: {
    default: () => get<User>('/users/default'),
    list: () => get<User[]>('/users'),
    create: (displayName: string) => post<User>('/users', { displayName }),
  },
  programs: {
    list: () => get<Program[]>('/programs'),
    get: (id: number) => get<Program>(`/programs/${id}`),
  },
  sessions: {
    get: (id: number) => get<ProgramSession>(`/sessions/${id}`),
    exercises: (id: number) => get<Exercise[]>(`/sessions/${id}/exercises`),
  },
  exercises: {
    history: (id: number, limit = 10) => get<ExerciseHistory[]>(`/exercises/${id}/history?limit=${limit}`),
    best: (id: number) => get<{ best_weight: number | null; best_reps: number | null }>(`/exercises/${id}/best`),
  },
  workoutLogs: {
    list: (userId?: number) => get<WorkoutLog[]>(`/workout-logs${userId ? `?userId=${userId}` : ''}`),
    get: (id: number) => get<WorkoutLog>(`/workout-logs/${id}`),
    create: (userId: number, sessionId: number, date: string) =>
      post<WorkoutLog>('/workout-logs', { userId, sessionId, date }),
    complete: (id: number, notes?: string) =>
      patch<WorkoutLog>(`/workout-logs/${id}`, { completed: true, notes }),
    update: (id: number, data: Partial<WorkoutLog>) =>
      patch<WorkoutLog>(`/workout-logs/${id}`, data),
    sets: (id: number) => get<SetLog[]>(`/workout-logs/${id}/sets`),
    addSet: (
      workoutLogId: number,
      data: {
        exerciseId: number;
        setNumber: number;
        weightLbs?: number | null;
        reps?: number | null;
        isBodyweight?: boolean;
        notes?: string;
      }
    ) => post<SetLog>(`/workout-logs/${workoutLogId}/sets`, data),
    updateSet: (workoutLogId: number, setId: number, data: Partial<SetLog>) =>
      put<SetLog>(`/workout-logs/${workoutLogId}/sets/${setId}`, data),
    deleteSet: (workoutLogId: number, setId: number) =>
      del(`/workout-logs/${workoutLogId}/sets/${setId}`),
  },
};
