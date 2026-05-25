export interface User {
  id: number;
  display_name: string;
  created_at: string;
}

export interface Program {
  id: number;
  name: string;
  description: string;
  created_at: string;
  sessions?: ProgramSession[];
}

export interface ProgramSession {
  id: number;
  program_id: number;
  week_number: number;
  session_number: number;
  name: string;
  focus: string;
  order_index: number;
  exercises?: Exercise[];
}

export interface Exercise {
  id: number;
  session_id: number;
  name: string;
  group_label: string;
  target_sets: number;
  target_reps: number;
  starting_weight: number | null;
  is_bodyweight: number;
  form_notes: string | null;
  order_index: number;
}

export interface WorkoutLog {
  id: number;
  user_id: number;
  program_session_id: number;
  date: string;
  completed: number;
  notes: string | null;
  created_at: string;
  completed_at: string | null;
  session_name?: string;
  focus?: string;
  week_number?: number;
  session_number?: number;
  sets?: SetLog[];
}

export interface SetLog {
  id: number;
  workout_log_id: number;
  exercise_id: number;
  set_number: number;
  weight_lbs: number | null;
  reps: number | null;
  is_bodyweight: number;
  is_pr: number;
  notes: string | null;
  created_at: string;
  exercise_name?: string;
  group_label?: string;
  target_sets?: number;
  target_reps?: number;
  order_index?: number;
}

export interface ExerciseHistory {
  id: number;
  exercise_id: number;
  set_number: number;
  weight_lbs: number | null;
  reps: number | null;
  is_bodyweight: number;
  is_pr: number;
  notes: string | null;
  date: string;
}
