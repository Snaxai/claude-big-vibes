import { sqliteTable, text, integer, real, unique } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const exercises = sqliteTable("exercises", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").default("default").notNull(),
  name: text("name").notNull(),
  muscleGroup: text("muscle_group").notNull(),
  equipment: text("equipment"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const workoutSessions = sqliteTable("workout_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").default("default").notNull(),
  programDayId: integer("program_day_id").references(() => programDays.id),
  name: text("name").notNull(),
  startedAt: text("started_at").default(sql`(datetime('now'))`),
  finishedAt: text("finished_at"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const workoutSets = sqliteTable("workout_sets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id")
    .references(() => workoutSessions.id)
    .notNull(),
  exerciseId: integer("exercise_id")
    .references(() => exercises.id)
    .notNull(),
  setOrder: integer("set_order").notNull(),
  reps: integer("reps").notNull(),
  weight: real("weight").notNull(),
  rpe: real("rpe"),
  isPR: integer("is_pr").default(0),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const meals = sqliteTable("meals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").default("default").notNull(),
  date: text("date").notNull(),
  name: text("name").notNull(),
  calories: real("calories").notNull(),
  protein: real("protein").notNull(),
  carbs: real("carbs").notNull(),
  fat: real("fat").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const bodyLogs = sqliteTable("body_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").default("default").notNull(),
  date: text("date").notNull(),
  weight: real("weight"),
  bodyFat: real("body_fat"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const bodyMeasurements = sqliteTable("body_measurements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bodyLogId: integer("body_log_id")
    .references(() => bodyLogs.id)
    .notNull(),
  area: text("area").notNull(),
  value: real("value").notNull(),
});

export const programs = sqliteTable("programs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").default("default").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: integer("is_active").default(0),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const programDays = sqliteTable("program_days", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  programId: integer("program_id")
    .references(() => programs.id)
    .notNull(),
  dayOrder: integer("day_order").notNull(),
  name: text("name").notNull(),
});

export const programExercises = sqliteTable("program_exercises", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  programDayId: integer("program_day_id")
    .references(() => programDays.id)
    .notNull(),
  exerciseId: integer("exercise_id")
    .references(() => exercises.id)
    .notNull(),
  targetSets: integer("target_sets").notNull(),
  targetReps: integer("target_reps").notNull(),
  targetWeight: real("target_weight"),
});

export const settings = sqliteTable(
  "settings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").default("default").notNull(),
    key: text("key").notNull(),
    value: text("value").notNull(),
  },
  (table) => ({
    userKeyUnique: unique().on(table.userId, table.key),
  })
);
