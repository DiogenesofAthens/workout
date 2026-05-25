import db from './db';

function seed() {
  const existingUser = db.prepare('SELECT id FROM users WHERE display_name = ?').get('Kirk');
  if (existingUser) {
    console.log('Already seeded, skipping.');
    return;
  }

  const insertUser = db.prepare('INSERT INTO users (display_name) VALUES (?)');
  insertUser.run('Kirk');

  const insertProgram = db.prepare('INSERT INTO programs (name, description) VALUES (?, ?)');
  const programResult = insertProgram.run(
    'Workout Program 2024/2025',
    'Outside LA - Push/Pull/Legs split with progressive overload'
  );
  const programId = Number(programResult.lastInsertRowid);

  const insertSession = db.prepare(`
    INSERT INTO program_sessions (program_id, week_number, session_number, name, focus, order_index)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertExercise = db.prepare(`
    INSERT INTO exercises (session_id, name, group_label, target_sets, target_reps, starting_weight, is_bodyweight, form_notes, order_index)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  type ExerciseDef = {
    name: string;
    group: string;
    sets: number;
    reps: number;
    weight: number | null;
    bodyweight?: boolean;
    notes?: string;
  };

  type SessionDef = {
    week: number;
    session: number;
    name: string;
    focus: string;
    exercises: ExerciseDef[];
  };

  const sessions: SessionDef[] = [
    // --- WEEK 1 ---
    {
      week: 1, session: 1, name: 'Push - Chest & Triceps', focus: 'Push',
      exercises: [
        { name: 'DB Bench Press', group: 'A', sets: 4, reps: 10, weight: 60, notes: 'Start at 55, work up to 60. Control descent.' },
        { name: 'Tricep Dips', group: 'A', sets: 4, reps: 10, weight: null, bodyweight: true, notes: 'Full extension at top, controlled descent.' },
        { name: 'Flat DB Chest Flies', group: 'B', sets: 4, reps: 10, weight: 40, notes: 'Keep slight bend in elbows throughout. Stretch at bottom.' },
        { name: 'Standing Overhead Single DB Tricep', group: 'B', sets: 4, reps: 10, weight: 40, notes: 'Watch left elbow — had a twinge at 40 lbs. Control the movement.' },
      ]
    },
    {
      week: 1, session: 2, name: 'Pull - Arms', focus: 'Pull',
      exercises: [
        { name: 'DB Curls', group: 'A', sets: 4, reps: 10, weight: 35, notes: 'Seeking return to 40 lbs. Full supination at top.' },
        { name: 'Hammer Curls', group: 'C', sets: 4, reps: 10, weight: 30, notes: 'Neutral grip. Squeeze at top.' },
        { name: 'Incline Dumbbell Row', group: 'B', sets: 4, reps: 10, weight: 50, notes: 'Right arm had a twinge — abort if pain returns. Keep chest on pad.' },
      ]
    },
    {
      week: 1, session: 3, name: 'Legs', focus: 'Legs',
      exercises: [
        { name: 'Squats', group: 'A', sets: 4, reps: 10, weight: 95, notes: '45 lb bar + 2×25 lb plates. Check bar weight before loading.' },
      ]
    },
    {
      week: 1, session: 4, name: 'Push - Chest & Triceps', focus: 'Push',
      exercises: [
        { name: 'DB Bench Press', group: 'A', sets: 4, reps: 10, weight: 60, notes: 'Start at 55, work up to 60. Control descent.' },
        { name: 'Tricep Dips', group: 'A', sets: 4, reps: 10, weight: null, bodyweight: true, notes: 'Full extension at top, controlled descent.' },
        { name: 'Flat DB Chest Flies', group: 'B', sets: 4, reps: 10, weight: 40, notes: 'Keep slight bend in elbows throughout.' },
        { name: 'Standing Overhead Single DB Tricep', group: 'B', sets: 4, reps: 10, weight: 40, notes: 'Watch left elbow — had a twinge at 40 lbs.' },
      ]
    },
    {
      week: 1, session: 5, name: 'Pull - Arms', focus: 'Pull',
      exercises: [
        { name: 'DB Curls', group: 'A', sets: 4, reps: 10, weight: 35, notes: 'Seeking return to 40 lbs.' },
        { name: 'Hammer Curls', group: 'C', sets: 4, reps: 10, weight: 30, notes: 'Neutral grip.' },
        { name: 'Incline Dumbbell Row', group: 'B', sets: 4, reps: 10, weight: 50, notes: 'Watch right arm twinge.' },
      ]
    },
    {
      week: 1, session: 6, name: 'Legs + Pullups', focus: 'Legs',
      exercises: [
        { name: 'Squats', group: 'A', sets: 4, reps: 10, weight: 95, notes: '45 lb bar + 2×25 lb plates.' },
        { name: 'Pullups', group: 'B', sets: 5, reps: 10, weight: null, bodyweight: true, notes: 'Full hang at bottom, chin over bar at top.' },
      ]
    },
    // --- WEEK 2 ---
    {
      week: 2, session: 1, name: 'Shoulders', focus: 'Shoulders',
      exercises: [
        { name: 'Lateral Raises', group: 'A', sets: 4, reps: 10, weight: 18, notes: 'Was fine at 20 by end of last session. Start at 18, push for 20.' },
        { name: 'Overhead DB Shoulder Press', group: 'B', sets: 4, reps: 10, weight: 40, notes: 'May be able to go up to 45 next time. One 40 rep was shaky stabilitywise — focus on shoulder stability.' },
      ]
    },
    {
      week: 2, session: 2, name: 'Push - Chest & Triceps', focus: 'Push',
      exercises: [
        { name: 'DB Bench Press', group: 'A', sets: 4, reps: 10, weight: 60 },
        { name: 'Tricep Dips', group: 'A', sets: 4, reps: 10, weight: null, bodyweight: true },
        { name: 'Flat DB Chest Flies', group: 'B', sets: 4, reps: 10, weight: 40, notes: '40 seemed ok.' },
        { name: 'Standing Overhead Single DB Tricep', group: 'B', sets: 4, reps: 10, weight: 40, notes: '40 seemed ok, though left elbow twinge — monitor.' },
      ]
    },
    {
      week: 2, session: 3, name: 'Pull - Back & Arms', focus: 'Pull',
      exercises: [
        { name: 'Incline Dumbbell Row', group: 'A', sets: 4, reps: 10, weight: 50 },
        { name: 'DB Curls', group: 'A', sets: 4, reps: 10, weight: 35, notes: 'Seeking return to 40 next time.' },
        { name: 'Back Machine Pulldown', group: 'B', sets: 4, reps: 10, weight: 115, notes: 'Was testing: went 85→115. Start at 115 next time — can go higher.' },
        { name: 'Hammer Curls', group: 'B', sets: 4, reps: 10, weight: 30 },
      ]
    },
    {
      week: 2, session: 4, name: 'Legs + Pullups', focus: 'Legs',
      exercises: [
        { name: 'Squats', group: 'A', sets: 4, reps: 10, weight: 95, notes: '45 lb bar + 2×25 lb plates.' },
        { name: 'Pullups', group: 'B', sets: 5, reps: 10, weight: null, bodyweight: true },
      ]
    },
    {
      week: 2, session: 5, name: 'Shoulders + Push', focus: 'Push',
      exercises: [
        { name: 'Lateral Raises', group: 'A', sets: 4, reps: 10, weight: 18 },
        { name: 'Overhead DB Shoulder Press', group: 'B', sets: 4, reps: 10, weight: 40 },
        { name: 'DB Bench Press', group: 'A', sets: 4, reps: 10, weight: 60 },
        { name: 'Tricep Dips', group: 'A', sets: 4, reps: 10, weight: null, bodyweight: true },
        { name: 'Flat DB Chest Flies', group: 'B', sets: 4, reps: 10, weight: 40 },
        { name: 'Standing Overhead Single DB Tricep', group: 'B', sets: 4, reps: 10, weight: 40 },
      ]
    },
    {
      week: 2, session: 6, name: 'Pull - Back & Arms', focus: 'Pull',
      exercises: [
        { name: 'Back Machine Pulldown', group: 'A', sets: 4, reps: 10, weight: 115, notes: 'Went up to 130 last time.' },
        { name: 'DB Curls', group: 'A', sets: 4, reps: 10, weight: 35 },
        { name: 'Incline Dumbbell Row', group: 'B', sets: 4, reps: 10, weight: 50, notes: 'Aborted last time due to right arm twinge — be careful.' },
        { name: 'Hammer Curls', group: 'B', sets: 4, reps: 10, weight: 30 },
      ]
    },
    // --- WEEK 3 ---
    {
      week: 3, session: 1, name: 'Shoulders', focus: 'Shoulders',
      exercises: [
        { name: 'Lateral Raises', group: 'B', sets: 4, reps: 10, weight: 18, notes: 'Aborted last time out of caution — feeling meh. Listen to body.' },
        { name: 'Overhead DB Shoulder Press', group: 'A', sets: 4, reps: 10, weight: 40 },
      ]
    },
    {
      week: 3, session: 2, name: 'Legs + Pullups', focus: 'Legs',
      exercises: [
        { name: 'Squats', group: 'A', sets: 4, reps: 10, weight: 95, notes: '45 lb bar + 2×25 lb plates.' },
        { name: 'Pullups', group: 'B', sets: 5, reps: 10, weight: null, bodyweight: true },
      ]
    },
    {
      week: 3, session: 3, name: 'Push - Chest & Triceps', focus: 'Push',
      exercises: [
        { name: 'DB Bench Press', group: 'A', sets: 4, reps: 10, weight: 60 },
        { name: 'Tricep Dips', group: 'A', sets: 4, reps: 10, weight: null, bodyweight: true },
        { name: 'Flat DB Chest Flies', group: 'B', sets: 4, reps: 10, weight: 40 },
        { name: 'Standing Overhead Single DB Tricep', group: 'B', sets: 4, reps: 10, weight: 40 },
      ]
    },
    {
      week: 3, session: 4, name: 'Pull - Back & Arms', focus: 'Pull',
      exercises: [
        { name: 'Back Machine Pulldown', group: 'A', sets: 4, reps: 10, weight: 115, notes: 'Was at 130 last time. Push higher if form holds.' },
        { name: 'DB Curls', group: 'A', sets: 4, reps: 10, weight: 35 },
        { name: 'Incline Dumbbell Row', group: 'B', sets: 4, reps: 10, weight: 50, notes: 'Had right arm twinge twice — abort if pain returns.' },
        { name: 'Hammer Curls', group: 'B', sets: 4, reps: 10, weight: 30 },
      ]
    },
    {
      week: 3, session: 5, name: 'Session 5', focus: 'TBD',
      exercises: []
    },
    {
      week: 3, session: 6, name: 'Session 6', focus: 'TBD',
      exercises: []
    },
    // --- WEEK 4 ---
    { week: 4, session: 1, name: 'Session 1', focus: 'TBD', exercises: [] },
    { week: 4, session: 2, name: 'Session 2', focus: 'TBD', exercises: [] },
    { week: 4, session: 3, name: 'Session 3', focus: 'TBD', exercises: [] },
    { week: 4, session: 4, name: 'Session 4', focus: 'TBD', exercises: [] },
    { week: 4, session: 5, name: 'Session 5', focus: 'TBD', exercises: [] },
    { week: 4, session: 6, name: 'Session 6', focus: 'TBD', exercises: [] },
    // --- WEEK 5 ---
    { week: 5, session: 1, name: 'Session 1', focus: 'TBD', exercises: [] },
    { week: 5, session: 2, name: 'Session 2', focus: 'TBD', exercises: [] },
    { week: 5, session: 3, name: 'Session 3', focus: 'TBD', exercises: [] },
    { week: 5, session: 4, name: 'Session 4', focus: 'TBD', exercises: [] },
    { week: 5, session: 5, name: 'Session 5', focus: 'TBD', exercises: [] },
    { week: 5, session: 6, name: 'Session 6', focus: 'TBD', exercises: [] },
  ];

  db.exec('BEGIN');
  try {
    let orderIndex = 0;
    for (const s of sessions) {
      const result = insertSession.run(programId, s.week, s.session, s.name, s.focus, orderIndex++);
      const sessionId = Number(result.lastInsertRowid);
      s.exercises.forEach((ex, exIdx) => {
        insertExercise.run(
          sessionId,
          ex.name,
          ex.group,
          ex.sets,
          ex.reps,
          ex.weight ?? null,
          ex.bodyweight ? 1 : 0,
          ex.notes ?? null,
          exIdx
        );
      });
    }
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
  console.log('Seed complete.');
}

seed();
