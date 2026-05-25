import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, ChevronRight, CheckCircle2, Clock } from 'lucide-react';
import { api } from '../api';
import { useUser } from '../App';
import type { Program, WorkoutLog } from '../types';

const FOCUS_COLORS: Record<string, string> = {
  Push: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  Pull: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Legs: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  Shoulders: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  TBD: 'bg-zinc-700/50 text-zinc-400 border-zinc-700',
};

function focusBadge(focus: string) {
  const cls = FOCUS_COLORS[focus] || FOCUS_COLORS.TBD;
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cls}`}>{focus}</span>;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function Home() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [program, setProgram] = useState<Program | null>(null);
  const [recentLogs, setRecentLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.programs.list(),
      user ? api.workoutLogs.list(user.id) : Promise.resolve([]),
    ]).then(async ([programs, logs]) => {
      if (programs.length > 0) {
        const full = await api.programs.get(programs[0].id);
        setProgram(full);
      }
      setRecentLogs(logs.slice(0, 5));
    }).finally(() => setLoading(false));
  }, [user]);

  // Find the next incomplete session in order
  const completedSessionIds = new Set(
    recentLogs.filter(l => l.completed).map(l => l.program_session_id)
  );

  const nextSession = program?.sessions?.find(s => !completedSessionIds.has(s.id));
  const today = new Date().toISOString().split('T')[0];

  async function startWorkout(sessionId: number) {
    if (!user || starting) return;
    setStarting(true);
    try {
      const log = await api.workoutLogs.create(user.id, sessionId, today);
      navigate(`/workout/${log.id}`);
    } finally {
      setStarting(false);
    }
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center pb-nav">
        <div className="text-zinc-500 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pb-nav overflow-y-auto">
      {/* Header */}
      <div className="px-4 pt-12 pb-6 safe-top">
        <div className="text-zinc-400 text-sm">{greeting()},</div>
        <div className="text-2xl font-bold">{user?.display_name ?? 'Athlete'} 💪</div>
        <div className="text-zinc-500 text-sm mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="px-4 space-y-5">
        {/* Next Workout Card */}
        {nextSession ? (
          <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                  Up Next · Wk {nextSession.week_number} S{nextSession.session_number}
                </span>
                {focusBadge(nextSession.focus)}
              </div>
              <div className="text-xl font-bold mt-1">{nextSession.name}</div>
              {nextSession.exercises && nextSession.exercises.length > 0 ? (
                <div className="mt-2 text-sm text-zinc-400">
                  {nextSession.exercises.length} exercise{nextSession.exercises.length !== 1 ? 's' : ''} &middot;{' '}
                  {nextSession.exercises.map(e => e.name).slice(0, 3).join(', ')}
                  {(nextSession.exercises?.length ?? 0) > 3 && ' ...'}
                </div>
              ) : (
                <div className="mt-2 text-sm text-zinc-500">No exercises defined yet</div>
              )}
            </div>
            <button
              onClick={() => startWorkout(nextSession.id)}
              disabled={starting}
              className="w-full mt-2 bg-green-500 hover:bg-green-400 active:bg-green-600 text-black font-bold text-lg py-4 transition-colors disabled:opacity-60"
            >
              {starting ? 'Starting...' : 'Start Workout'}
            </button>
          </div>
        ) : (
          <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 text-center">
            <CheckCircle2 size={36} className="text-green-400 mx-auto mb-2" />
            <div className="font-semibold text-lg">Program Complete!</div>
            <div className="text-zinc-400 text-sm mt-1">You've finished all sessions in the program.</div>
          </div>
        )}

        {/* Pick a different session */}
        {program?.sessions && (
          <div>
            <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-2">
              Or pick a session
            </div>
            <div className="space-y-2">
              {program.sessions
                .filter(s => s.focus !== 'TBD' && s.id !== nextSession?.id)
                .slice(0, 4)
                .map(s => (
                  <button
                    key={s.id}
                    onClick={() => startWorkout(s.id)}
                    className="w-full flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 active:bg-zinc-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Dumbbell size={18} className="text-zinc-400" />
                      <div className="text-left">
                        <div className="text-sm font-medium">{s.name}</div>
                        <div className="text-xs text-zinc-500">Wk {s.week_number} S{s.session_number}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {focusBadge(s.focus)}
                      <ChevronRight size={16} className="text-zinc-600" />
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Recent History */}
        {recentLogs.length > 0 && (
          <div>
            <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-2">
              Recent Workouts
            </div>
            <div className="space-y-2">
              {recentLogs.slice(0, 3).map(log => (
                <div
                  key={log.id}
                  className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    {log.completed ? (
                      <CheckCircle2 size={18} className="text-green-400 shrink-0" />
                    ) : (
                      <Clock size={18} className="text-zinc-500 shrink-0" />
                    )}
                    <div>
                      <div className="text-sm font-medium">{log.session_name}</div>
                      <div className="text-xs text-zinc-500">{formatDate(log.date)}</div>
                    </div>
                  </div>
                  {log.focus && focusBadge(log.focus)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
