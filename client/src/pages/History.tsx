import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, ChevronDown, ChevronUp, Award, Dumbbell } from 'lucide-react';
import { api } from '../api';
import { useUser } from '../App';
import type { WorkoutLog, SetLog } from '../types';

const FOCUS_COLORS: Record<string, string> = {
  Push: 'bg-orange-500/20 text-orange-300',
  Pull: 'bg-blue-500/20 text-blue-300',
  Legs: 'bg-purple-500/20 text-purple-300',
  Shoulders: 'bg-yellow-500/20 text-yellow-300',
  TBD: 'bg-zinc-700/50 text-zinc-400',
};

function groupSetsByExercise(sets: SetLog[]) {
  const map = new Map<string, { name: string; group: string; sets: SetLog[] }>();
  for (const s of sets) {
    const key = s.exercise_id?.toString() ?? s.exercise_name ?? '';
    if (!map.has(key)) {
      map.set(key, { name: s.exercise_name ?? 'Unknown', group: s.group_label ?? '', sets: [] });
    }
    map.get(key)!.sets.push(s);
  }
  return Array.from(map.values()).sort((a, b) => (a.sets[0].order_index ?? 0) - (b.sets[0].order_index ?? 0));
}

function LogCard({ log }: { log: WorkoutLog }) {
  const [expanded, setExpanded] = useState(false);
  const [sets, setSets] = useState<SetLog[] | null>(null);
  const [loadingSets, setLoadingSets] = useState(false);

  async function toggle() {
    if (!expanded && !sets) {
      setLoadingSets(true);
      const data = await api.workoutLogs.sets(log.id);
      setSets(data);
      setLoadingSets(false);
    }
    setExpanded(v => !v);
  }

  const date = new Date(log.date).toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
  });

  const focusCls = FOCUS_COLORS[log.focus ?? 'TBD'] ?? FOCUS_COLORS.TBD;

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-4 active:bg-zinc-800 transition-colors text-left"
        onClick={toggle}
      >
        {log.completed ? (
          <CheckCircle2 size={20} className="text-green-400 shrink-0" />
        ) : (
          <Clock size={20} className="text-zinc-500 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold truncate">{log.session_name}</span>
            {log.focus && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${focusCls}`}>
                {log.focus}
              </span>
            )}
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">
            Wk {log.week_number} S{log.session_number} · {date}
          </div>
        </div>
        {expanded ? <ChevronUp size={18} className="text-zinc-600 shrink-0" /> : <ChevronDown size={18} className="text-zinc-600 shrink-0" />}
      </button>

      {expanded && (
        <div className="border-t border-zinc-800 px-4 py-3 space-y-3">
          {loadingSets && <div className="text-zinc-500 text-sm py-2">Loading...</div>}
          {sets && sets.length === 0 && (
            <div className="text-zinc-500 text-sm py-2">No sets logged.</div>
          )}
          {sets && sets.length > 0 && (
            <>
              {groupSetsByExercise(sets).map(({ name, sets: exSets }) => (
                <div key={name}>
                  <div className="text-xs font-semibold text-zinc-400 mb-1.5">{name}</div>
                  <div className="flex flex-wrap gap-2">
                    {exSets.map(s => (
                      <div key={s.id} className={`flex items-center gap-1 bg-zinc-800 rounded-lg px-2.5 py-1.5 text-sm ${s.is_pr ? 'ring-1 ring-yellow-500/50' : ''}`}>
                        {s.is_pr && <Award size={12} className="text-yellow-400 shrink-0" />}
                        {s.is_bodyweight ? (
                          <span className="text-zinc-300">BW × {s.reps}</span>
                        ) : (
                          <span className="text-zinc-300">{s.weight_lbs} × {s.reps}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {log.notes && (
                <div className="bg-zinc-800/60 rounded-xl px-3 py-2 text-sm text-zinc-400">
                  {log.notes}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function History() {
  const { user } = useUser();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.workoutLogs.list(user.id)
      .then(setLogs)
      .finally(() => setLoading(false));
  }, [user]);

  const completed = logs.filter(l => l.completed).length;

  return (
    <div className="flex-1 flex flex-col pb-nav overflow-y-auto">
      <div className="px-4 pt-12 pb-4 safe-top">
        <div className="text-2xl font-bold">History</div>
        {logs.length > 0 && (
          <div className="text-sm text-zinc-400 mt-1">
            {completed} workout{completed !== 1 ? 's' : ''} completed · {logs.length} total
          </div>
        )}
      </div>

      <div className="px-4 space-y-3">
        {loading && (
          <div className="text-zinc-500 text-sm py-8 text-center">Loading...</div>
        )}
        {!loading && logs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Dumbbell size={40} className="text-zinc-700 mb-3" />
            <div className="text-zinc-400 font-semibold">No workouts yet</div>
            <div className="text-zinc-600 text-sm mt-1">Start a workout on the Home tab</div>
          </div>
        )}
        {logs.map(log => (
          <LogCard key={log.id} log={log} />
        ))}
      </div>
    </div>
  );
}
