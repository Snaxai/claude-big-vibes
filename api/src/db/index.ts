import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { mkdirSync } from "fs";
import * as schema from "./schema";

// Ensure data directory exists
mkdirSync("./data", { recursive: true });

const sqlite = new Database("./data/fitness.db");

// Enable WAL mode for better concurrent performance
sqlite.exec("PRAGMA journal_mode = WAL;");

export const db = drizzle(sqlite, { schema });

// Create tables if they don't exist
function initializeDatabase() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'default',
      name TEXT NOT NULL,
      muscle_group TEXT NOT NULL,
      equipment TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS programs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'default',
      name TEXT NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS program_days (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program_id INTEGER NOT NULL REFERENCES programs(id),
      day_order INTEGER NOT NULL,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS program_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program_day_id INTEGER NOT NULL REFERENCES program_days(id),
      exercise_id INTEGER NOT NULL REFERENCES exercises(id),
      target_sets INTEGER NOT NULL,
      target_reps INTEGER NOT NULL,
      target_weight REAL
    );

    CREATE TABLE IF NOT EXISTS workout_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'default',
      program_day_id INTEGER REFERENCES program_days(id),
      name TEXT NOT NULL,
      started_at TEXT DEFAULT (datetime('now')),
      finished_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS workout_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES workout_sessions(id),
      exercise_id INTEGER NOT NULL REFERENCES exercises(id),
      set_order INTEGER NOT NULL,
      reps INTEGER NOT NULL,
      weight REAL NOT NULL,
      rpe REAL,
      is_pr INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS meals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'default',
      date TEXT NOT NULL,
      name TEXT NOT NULL,
      calories REAL NOT NULL,
      protein REAL NOT NULL,
      carbs REAL NOT NULL,
      fat REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS body_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'default',
      date TEXT NOT NULL,
      weight REAL,
      body_fat REAL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS body_measurements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      body_log_id INTEGER NOT NULL REFERENCES body_logs(id),
      area TEXT NOT NULL,
      value REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'default',
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      UNIQUE(user_id, key)
    );
  `);
}

initializeDatabase();
