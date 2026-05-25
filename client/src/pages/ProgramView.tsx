import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, Circle, Dumbbell } from 'lucide-react';
import { api } from '../api';
import { useUser } from '../App';
import type { Program, ProgramSession, WorkoutLog } from '../types';

const FOCUS_COLORS: Record<string, string> = {
  Push: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  Pull: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Legs: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  Shoulders: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  TBD: 'bg-zinc-700/40 text-zinc-500 border-zinc-700',
};

function SessionRow({
  session,
  completed,
  onClick,
}: {
  session: ProgramSession;
  completed: boolean;
  onClick?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const focusCls = FOCUS_COLORS[session.focus] ?? FOCUS_COLORS.TBD;
  const hasExercises = (session.exercises?.length ?? 0) > 0;

  return (
    <div className={`bg-zinc-900 rounded-xl border overflow-hidden ${completed ? 'border-green-500/20' : 'border-zinc-800'}`}>
      <button
        className="w-full flex items-center gap-3 px-3 py-3 active:bg-zinc-800 transition-colors text-left"
        onClick={() => hasExercises && setExpanded(v => !v)}
      >
        {completed ? (
          <CheckCircle2 size={18} className="text-green-400 shrink-0" />
        ) : (
          <Circle size={18} className="text-zinc-700 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">S{session.session_number}: {session.name}</span>
          </div>
          {hasExercises && (
            <div className="text-xs text-zinc-500 mt-0.5">
              {session.exercises!.length} exercise{session.exercises!.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${focusCls}`}>
            {session.focus}
          </span>
          {hasExercises && (
            expanded
              ? <ChevronUp size={14} className="text-zinc-600" />
              : <ChevronDown size={14} className="text-zinc-600" />
          )}
        </div>
      </button>

      {expanded && hasExercises && (
        <div className="border-t border-zinc-800 px-3 py-2 space-y-1">
          {session.exercises!.map(ex => (
            <div key={ex.id} className="flex items-center gap-2 py-1.5">
              <span className="text-xs font-bold text-zinc-600 w-5 shrink-0">{ex.group_label}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-zinc-200">{ex.name}</div>
                <div className="text-xs text-zinc-500">
                  {ex.target_sets}×{ex.target_reps}
                  {ex.is_bodyweight
                    ? ' · Bodyweight'
                    : ex.starting_weight
                    ? ` · ${ex.starting_weight} lbs`
                    : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProgramView() {
  const { user } = useUser();
  const [program, setProgram] = useState<Program | null>(null);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1, 2, 3]));

  useEffect(() => {
    Promise.all([
      api.programs.list(),
      user ? api.workoutLogs.list(user.id) : Promise.resolve([]),
    ]).then(async ([programs, userLogs]) => {
      if (programs.length > 0) {
        const full = await api.programs.get(programs[0].id);
        // Load exercises for each session
        const sessionsWithEx = await Promise.all(
          (full.sessions ?? []).map(async s => {
            const exercises = await api.sessions.exercises(s.id);
            return { ...s, exercises };
          })
        );
        setProgram({ ...full, sessions: sessionsWithEx });
      }
      setLogs(userLogs);
    }).finally(() => setLoading(false));
  }, [user]);

  const completedSessionIds = new Set(
    logs.filter(l => l.completed).map(l => l.program_session_id)
  );

  const weeks = program
    ? Array.from(new Set(program.sessions?.map(s => s.week_number) ?? []))
        .sort((a, b) => a - b)
    : [];

  function toggleWeek(w: number) {
    setExpandedWeeks(prev => {
      const next = new Set(prev);
      if (next.has(w)) next.delete(w);
      else next.add(w);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center pb-nav">
        <div className="text-zinc-500 text-sm">Loading program...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pb-nav overflow-y-auto">
      <div className="px-4 pt-12 pb-4 safe-top">
        <div className="text-2xl font-bold">Program</div>
        {program && (
          <div className="text-sm text-zinc-400 mt-1">{program.name}</div>
        )}
      </div>

      <div className="px-4 space-y-4">
        {!program && (
          <div className="flex flex-col items-center py-12 text-center">
            <Dumbbell size={40} className="text-zinc-700 mb-3" />
            <div className="text-zinc-400">No program found</div>
          </div>
        )}
        {weeks.map(week => {
          const sessions = program!.sessions!.filter(s => s.week_number === week);
          const weekDone = sessions.filter(s => completedSessionIds.has(s.id)).length;
          const isOpen = expandedWeeks.has(week);

          return (
            <div key={week} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
              <button
                className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-zinc-800/50 transition-colors"
                onClick={() => toggleWeek(week)}
              >
                <div className="flex-1 flex items-center gap-3">
                  <span className="font-bold text-base">Week {week}</span>
                  <span className="text-xs text-zinc-500">
                    {weekDone}/{sessions.length} done
                  </span>
                </div>
                {isOpen
                  ? <ChevronUp size={18} className="text-zinc-500" />
                  : <ChevronDown size={18} className="text-zinc-500" />}
              </button>

              {isOpen && (
                <div className="border-t border-zinc-800 px-3 pb-3 pt-2 space-y-2">
                  {sessions.map(s => (
                    <SessionRow
                      key={s.id}
                      session={s}
                      completed={completedSessionIds.has(s.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
