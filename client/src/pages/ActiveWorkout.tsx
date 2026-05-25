import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  X, ChevronLeft, ChevronRight, CheckCircle2, Plus, Minus,
  Info, Trash2, Award, Weight
} from 'lucide-react';
import { api } from '../api';
import type { WorkoutLog, Exercise, SetLog, ExerciseHistory } from '../types';

interface LocalSet {
  id?: number;
  set_number: number;
  weight_lbs: number | null;
  reps: number | null;
  is_bodyweight: boolean;
  notes: string;
  saved: boolean;
  is_pr: boolean;
}

interface ExerciseState {
  exercise: Exercise;
  sets: LocalSet[];
  history: ExerciseHistory[];
  showNotes: boolean;
}

function numBtn(label: string, onClick: () => void, className = '') {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold active:scale-95 transition-transform ${className}`}
    >
      {label}
    </button>
  );
}

function WeightInput({
  value,
  onChange,
  isBodyweight,
  suggestedWeight,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  isBodyweight: boolean;
  suggestedWeight: number | null;
}) {
  const [raw, setRaw] = useState(value?.toString() ?? '');

  const commit = (v: string) => {
    const n = parseFloat(v);
    onChange(isNaN(n) ? null : n);
  };

  if (isBodyweight) {
    return (
      <div className="flex-1 flex items-center justify-center h-14 bg-zinc-800 rounded-xl">
        <Weight size={16} className="text-zinc-500 mr-2" />
        <span className="text-zinc-400 text-sm font-medium">Bodyweight</span>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <div className="text-xs text-zinc-500 mb-1 text-center">Weight (lbs)</div>
      <div className="flex items-center gap-1">
        {numBtn('−5', () => onChange(Math.max(0, (value ?? suggestedWeight ?? 0) - 5)), 'bg-zinc-800 text-zinc-300')}
        <input
          type="number"
          inputMode="decimal"
          value={raw}
          placeholder={suggestedWeight?.toString() ?? '0'}
          onChange={e => setRaw(e.target.value)}
          onBlur={() => commit(raw)}
          onFocus={() => setRaw(value?.toString() ?? '')}
          className="flex-1 h-14 bg-zinc-800 rounded-xl text-center text-xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        {numBtn('+5', () => {
          const next = (value ?? suggestedWeight ?? 0) + 5;
          setRaw(next.toString());
          onChange(next);
        }, 'bg-zinc-800 text-zinc-300')}
      </div>
    </div>
  );
}

function RepsInput({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const [raw, setRaw] = useState(value?.toString() ?? '');

  const commit = (v: string) => {
    const n = parseInt(v);
    onChange(isNaN(n) ? null : n);
  };

  return (
    <div className="w-28">
      <div className="text-xs text-zinc-500 mb-1 text-center">Reps</div>
      <div className="flex items-center gap-1">
        {numBtn('−', () => onChange(Math.max(0, (value ?? 0) - 1)), 'bg-zinc-800 text-zinc-300')}
        <input
          type="number"
          inputMode="numeric"
          value={raw}
          placeholder="0"
          onChange={e => setRaw(e.target.value)}
          onBlur={() => commit(raw)}
          onFocus={() => setRaw(value?.toString() ?? '')}
          className="flex-1 h-14 bg-zinc-800 rounded-xl text-center text-xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-green-500 w-12"
        />
        {numBtn('+', () => {
          const next = (value ?? 0) + 1;
          setRaw(next.toString());
          onChange(next);
        }, 'bg-zinc-800 text-zinc-300')}
      </div>
    </div>
  );
}

export default function ActiveWorkout() {
  const { logId } = useParams<{ logId: string }>();
  const navigate = useNavigate();
  const [log, setLog] = useState<WorkoutLog | null>(null);
  const [exerciseStates, setExerciseStates] = useState<ExerciseState[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [showFinishModal, setShowFinishModal] = useState(false);
  const savingRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (!logId) return;
    (async () => {
      const [workoutLog, savedSets] = await Promise.all([
        api.workoutLogs.get(Number(logId)),
        api.workoutLogs.sets(Number(logId)),
      ]);
      setLog(workoutLog);

      const sessionData = await api.sessions.get(workoutLog.program_session_id);
      const exercises = sessionData.exercises ?? [];

      const states: ExerciseState[] = await Promise.all(
        exercises.map(async (ex) => {
          const history = await api.exercises.history(ex.id, 10);
          const exSets = savedSets.filter(s => s.exercise_id === ex.id);

          let sets: LocalSet[];
          if (exSets.length > 0) {
            sets = exSets.map(s => ({
              id: s.id,
              set_number: s.set_number,
              weight_lbs: s.weight_lbs,
              reps: s.reps,
              is_bodyweight: s.is_bodyweight === 1,
              notes: s.notes ?? '',
              saved: true,
              is_pr: s.is_pr === 1,
            }));
          } else {
            // Pre-fill with target sets
            const lastWeight = history.length > 0 && !history[0].is_bodyweight
              ? history[0].weight_lbs
              : ex.starting_weight;
            const targetSets = ex.target_sets ?? 4;
            sets = Array.from({ length: targetSets }, (_, i) => ({
              set_number: i + 1,
              weight_lbs: lastWeight ?? ex.starting_weight,
              reps: ex.target_reps ?? 10,
              is_bodyweight: ex.is_bodyweight === 1,
              notes: '',
              saved: false,
              is_pr: false,
            }));
          }

          return { exercise: ex, sets, history, showNotes: false };
        })
      );

      setExerciseStates(states);
      setLoading(false);
    })();
  }, [logId]);

  const updateSet = useCallback((exIdx: number, setIdx: number, updates: Partial<LocalSet>) => {
    setExerciseStates(prev => {
      const next = [...prev];
      const exState = { ...next[exIdx] };
      const sets = [...exState.sets];
      sets[setIdx] = { ...sets[setIdx], ...updates, saved: false };
      exState.sets = sets;
      next[exIdx] = exState;
      return next;
    });
  }, []);

  async function saveSet(exIdx: number, setIdx: number) {
    const key = `${exIdx}-${setIdx}`;
    if (savingRef.current[key]) return;
    savingRef.current[key] = true;

    const exState = exerciseStates[exIdx];
    const set = exState.sets[setIdx];
    try {
      if (set.id) {
        await api.workoutLogs.updateSet(Number(logId), set.id, {
          weight_lbs: set.weight_lbs,
          reps: set.reps,
          is_bodyweight: set.is_bodyweight ? 1 : 0,
          notes: set.notes || null,
        });
        setExerciseStates(prev => {
          const next = [...prev];
          const s = { ...next[exIdx].sets[setIdx], saved: true };
          next[exIdx] = { ...next[exIdx], sets: next[exIdx].sets.map((ss, i) => i === setIdx ? s : ss) };
          return next;
        });
      } else {
        const saved = await api.workoutLogs.addSet(Number(logId), {
          exerciseId: exState.exercise.id,
          setNumber: set.set_number,
          weightLbs: set.is_bodyweight ? null : set.weight_lbs,
          reps: set.reps,
          isBodyweight: set.is_bodyweight,
          notes: set.notes || undefined,
        });
        setExerciseStates(prev => {
          const next = [...prev];
          const updated: LocalSet = {
            ...next[exIdx].sets[setIdx],
            id: saved.id,
            is_pr: saved.is_pr === 1,
            saved: true,
          };
          next[exIdx] = { ...next[exIdx], sets: next[exIdx].sets.map((ss, i) => i === setIdx ? updated : ss) };
          return next;
        });
      }
    } finally {
      savingRef.current[key] = false;
    }
  }

  function addSet(exIdx: number) {
    setExerciseStates(prev => {
      const next = [...prev];
      const exState = { ...next[exIdx] };
      const sets = [...exState.sets];
      const last = sets[sets.length - 1];
      sets.push({
        set_number: sets.length + 1,
        weight_lbs: last?.weight_lbs ?? null,
        reps: last?.reps ?? exState.exercise.target_reps ?? 10,
        is_bodyweight: exState.exercise.is_bodyweight === 1,
        notes: '',
        saved: false,
        is_pr: false,
      });
      exState.sets = sets;
      next[exIdx] = exState;
      return next;
    });
  }

  async function deleteSet(exIdx: number, setIdx: number) {
    const set = exerciseStates[exIdx].sets[setIdx];
    if (set.id) {
      await api.workoutLogs.deleteSet(Number(logId), set.id);
    }
    setExerciseStates(prev => {
      const next = [...prev];
      const sets = next[exIdx].sets.filter((_, i) => i !== setIdx)
        .map((s, i) => ({ ...s, set_number: i + 1 }));
      next[exIdx] = { ...next[exIdx], sets };
      return next;
    });
  }

  async function finishWorkout() {
    setCompleting(true);
    // Save any unsaved sets
    for (let exIdx = 0; exIdx < exerciseStates.length; exIdx++) {
      for (let setIdx = 0; setIdx < exerciseStates[exIdx].sets.length; setIdx++) {
        const s = exerciseStates[exIdx].sets[setIdx];
        if (!s.saved && (s.weight_lbs !== null || s.is_bodyweight) && s.reps !== null) {
          await saveSet(exIdx, setIdx);
        }
      }
    }
    await api.workoutLogs.complete(Number(logId), sessionNotes || undefined);
    navigate('/');
  }

  if (loading || !log) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950 min-h-svh">
        <div className="text-zinc-500 text-sm">Loading workout...</div>
      </div>
    );
  }

  if (exerciseStates.length === 0) {
    return (
      <div className="flex-1 flex flex-col bg-zinc-950 min-h-svh">
        <div className="flex items-center gap-3 px-4 pt-12 pb-4 safe-top">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 text-zinc-400">
            <X size={22} />
          </button>
          <div className="flex-1">
            <div className="font-bold text-lg">{log.session_name}</div>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <div className="text-zinc-400 text-lg mb-2">No exercises in this session yet.</div>
          <div className="text-zinc-500 text-sm">Add exercises to this session in the Program view.</div>
          <button
            onClick={() => finishWorkout()}
            className="mt-8 bg-zinc-800 text-white font-semibold px-6 py-3 rounded-xl"
          >
            Mark Complete & Exit
          </button>
        </div>
      </div>
    );
  }

  const current = exerciseStates[currentIdx];
  const ex = current.exercise;
  const lastHistoryWeight = current.history.find(h => !h.is_bodyweight)?.weight_lbs;

  return (
    <div className="flex flex-col bg-zinc-950 min-h-svh">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3 safe-top bg-zinc-900 border-b border-zinc-800">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-zinc-400 active:text-zinc-100">
          <X size={22} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-bold truncate">{log.session_name}</div>
          <div className="text-xs text-zinc-500">
            Exercise {currentIdx + 1} of {exerciseStates.length}
          </div>
        </div>
        <button
          onClick={() => setShowFinishModal(true)}
          className="bg-green-500 text-black font-bold text-sm px-4 py-2 rounded-full active:bg-green-400"
        >
          Finish
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-zinc-800">
        <div
          className="h-full bg-green-500 transition-all duration-300"
          style={{ width: `${((currentIdx + 1) / exerciseStates.length) * 100}%` }}
        />
      </div>

      {/* Exercise navigation */}
      <div className="flex items-center px-4 py-3 gap-2 overflow-x-auto no-scrollbar">
        {exerciseStates.map((es, i) => {
          const done = es.sets.every(s => s.saved);
          return (
            <button
              key={i}
              onClick={() => setCurrentIdx(i)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                i === currentIdx
                  ? 'bg-green-500 text-black'
                  : done
                  ? 'bg-zinc-800 text-green-400'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {es.exercise.group_label}: {es.exercise.name.split(' ').slice(0, 2).join(' ')}
            </button>
          );
        })}
      </div>

      {/* Current exercise */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* Exercise header */}
        <div className="mb-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                Group {ex.group_label}
              </div>
              <div className="text-2xl font-bold leading-tight">{ex.name}</div>
            </div>
            <button
              onClick={() =>
                setExerciseStates(prev =>
                  prev.map((es, i) =>
                    i === currentIdx ? { ...es, showNotes: !es.showNotes } : es
                  )
                )
              }
              className={`mt-1 p-2 rounded-full ${current.showNotes ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-800 text-zinc-500'}`}
            >
              <Info size={18} />
            </button>
          </div>

          {/* Form notes */}
          {current.showNotes && ex.form_notes && (
            <div className="mt-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
              <div className="text-xs font-semibold text-blue-400 mb-1">Form Notes</div>
              <div className="text-sm text-zinc-300">{ex.form_notes}</div>
            </div>
          )}

          {/* Target & previous */}
          <div className="flex gap-3 mt-3">
            <div className="flex-1 bg-zinc-900 rounded-xl p-3">
              <div className="text-xs text-zinc-500">Target</div>
              <div className="text-sm font-semibold mt-0.5">
                {ex.target_sets} × {ex.target_reps}
                {ex.is_bodyweight ? ' (BW)' : ex.starting_weight ? ` @ ${ex.starting_weight} lbs` : ''}
              </div>
            </div>
            {lastHistoryWeight && (
              <div className="flex-1 bg-zinc-900 rounded-xl p-3">
                <div className="text-xs text-zinc-500">Last Time</div>
                <div className="text-sm font-semibold mt-0.5">{lastHistoryWeight} lbs</div>
              </div>
            )}
          </div>
        </div>

        {/* Sets */}
        <div className="space-y-3">
          {current.sets.map((set, setIdx) => (
            <div
              key={setIdx}
              className={`bg-zinc-900 rounded-2xl p-4 border transition-colors ${
                set.saved ? 'border-green-500/30' : 'border-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-zinc-400">Set {set.set_number}</span>
                  {set.is_pr && (
                    <span className="flex items-center gap-1 bg-yellow-500/20 text-yellow-300 text-xs font-bold px-2 py-0.5 rounded-full border border-yellow-500/30">
                      <Award size={10} /> PR
                    </span>
                  )}
                  {set.saved && !set.is_pr && (
                    <CheckCircle2 size={14} className="text-green-400" />
                  )}
                </div>
                <button
                  onClick={() => deleteSet(currentIdx, setIdx)}
                  className="p-1.5 text-zinc-600 active:text-red-400"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="flex gap-3 items-end">
                <WeightInput
                  value={set.weight_lbs}
                  onChange={v => updateSet(currentIdx, setIdx, { weight_lbs: v })}
                  isBodyweight={set.is_bodyweight}
                  suggestedWeight={lastHistoryWeight ?? ex.starting_weight ?? null}
                />
                <RepsInput
                  value={set.reps}
                  onChange={v => updateSet(currentIdx, setIdx, { reps: v })}
                />
              </div>

              {/* Notes row */}
              <input
                type="text"
                placeholder="Notes (optional)"
                value={set.notes}
                onChange={e => updateSet(currentIdx, setIdx, { notes: e.target.value })}
                className="mt-3 w-full bg-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500"
              />

              {/* Save button */}
              {!set.saved && (
                <button
                  onClick={() => saveSet(currentIdx, setIdx)}
                  disabled={(set.weight_lbs === null && !set.is_bodyweight) || set.reps === null}
                  className="mt-3 w-full bg-green-500 text-black font-bold py-2.5 rounded-xl text-sm active:bg-green-400 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Log Set {set.set_number}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add set */}
        <button
          onClick={() => addSet(currentIdx)}
          className="mt-3 w-full flex items-center justify-center gap-2 bg-zinc-800 border border-zinc-700 rounded-2xl py-3.5 text-zinc-400 text-sm font-medium active:bg-zinc-700"
        >
          <Plus size={16} /> Add Set
        </button>
      </div>

      {/* Prev/Next navigation */}
      <div className="flex gap-3 px-4 py-3 bg-zinc-900 border-t border-zinc-800"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
        <button
          onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
          className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 rounded-xl py-3.5 text-sm font-semibold disabled:opacity-40 active:bg-zinc-700"
        >
          <ChevronLeft size={18} /> Prev
        </button>
        {currentIdx < exerciseStates.length - 1 ? (
          <button
            onClick={() => setCurrentIdx(i => i + 1)}
            className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 rounded-xl py-3.5 text-sm font-semibold active:bg-zinc-700"
          >
            Next <ChevronRight size={18} />
          </button>
        ) : (
          <button
            onClick={() => setShowFinishModal(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-black rounded-xl py-3.5 text-sm font-bold active:bg-green-400"
          >
            Finish <CheckCircle2 size={18} />
          </button>
        )}
      </div>

      {/* Finish modal */}
      {showFinishModal && (
        <div className="fixed inset-0 bg-black/70 flex items-end z-50" onClick={() => setShowFinishModal(false)}>
          <div
            className="w-full bg-zinc-900 rounded-t-3xl p-6"
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="text-xl font-bold mb-1">Finish Workout?</div>
            <div className="text-zinc-400 text-sm mb-4">
              {exerciseStates.reduce((acc, es) => acc + es.sets.filter(s => s.saved).length, 0)} sets logged
              across {exerciseStates.filter(es => es.sets.some(s => s.saved)).length} exercises.
            </div>
            <textarea
              placeholder="Session notes (optional)..."
              value={sessionNotes}
              onChange={e => setSessionNotes(e.target.value)}
              rows={3}
              className="w-full bg-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none mb-4"
            />
            <button
              onClick={finishWorkout}
              disabled={completing}
              className="w-full bg-green-500 text-black font-bold py-4 rounded-2xl text-lg active:bg-green-400 disabled:opacity-60"
            >
              {completing ? 'Saving...' : 'Complete Workout'}
            </button>
            <button
              onClick={() => setShowFinishModal(false)}
              className="w-full mt-3 text-zinc-400 font-medium py-2"
            >
              Keep Going
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
