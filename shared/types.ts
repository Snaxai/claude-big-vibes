// ── Exercise ──
export interface Exercise {
  id: number;
  userId: string;
  name: string;
  muscleGroup: string;
  equipment: string | null;
  createdAt: string;
}

export interface CreateExercisePayload {
  name: string;
  muscleGroup: string;
  equipment?: string;
}

// ── Workout Session ──
export interface WorkoutSession {
  id: number;
  userId: string;
  programDayId: number | null;
  name: string;
  startedAt: string;
  finishedAt: string | null;
  createdAt: string;
}

export interface CreateWorkoutSessionPayload {
  name: string;
  programDayId?: number;
}

// ── Workout Set ──
export interface WorkoutSet {
  id: number;
  sessionId: number;
  exerciseId: number;
  setOrder: number;
  reps: number;
  weight: number;
  rpe: number | null;
  isPR: boolean;
  createdAt: string;
}

export interface LogSetPayload {
  exerciseId: number;
  reps: number;
  weight: number;
  rpe?: number;
}

// ── Meal ──
export interface Meal {
  id: number;
  userId: string;
  date: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  createdAt: string;
}

export interface CreateMealPayload {
  date: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DailySummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  meals: Meal[];
}

// ── Body Log ──
export interface BodyLog {
  id: number;
  userId: string;
  date: string;
  weight: number | null;
  bodyFat: number | null;
  notes: string | null;
  createdAt: string;
  measurements?: BodyMeasurement[];
}

export interface CreateBodyLogPayload {
  date: string;
  weight?: number;
  bodyFat?: number;
  notes?: string;
  measurements?: { area: string; value: number }[];
}

export interface BodyMeasurement {
  id: number;
  bodyLogId: number;
  area: string;
  value: number;
}

// ── Program ──
export interface Program {
  id: number;
  userId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  days?: ProgramDay[];
}

export interface CreateProgramPayload {
  name: string;
  description?: string;
}

export interface ProgramDay {
  id: number;
  programId: number;
  dayOrder: number;
  name: string;
  exercises?: ProgramExercise[];
}

export interface CreateProgramDayPayload {
  name: string;
  dayOrder: number;
}

export interface ProgramExercise {
  id: number;
  programDayId: number;
  exerciseId: number;
  targetSets: number;
  targetReps: number;
  targetWeight: number | null;
  exercise?: Exercise;
}

export interface CreateProgramExercisePayload {
  exerciseId: number;
  targetSets: number;
  targetReps: number;
  targetWeight?: number;
}

// ── Settings ──
export interface Setting {
  id: number;
  userId: string;
  key: string;
  value: string;
}

export type SettingKey = "calorie_target" | "protein_target" | "carbs_target" | "fat_target" | "unit_system";

// ── WebSocket Events ──
export type WSEventType =
  | "workout:updated"
  | "workout:setLogged"
  | "meal:updated"
  | "body:updated"
  | "program:updated"
  | "settings:updated";

export interface WSEvent {
  type: WSEventType;
  payload?: Record<string, unknown>;
}

// ── API Response ──
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}
