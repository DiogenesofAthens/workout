import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH ?? path.join(__dirname, '../../data/workout.db');

const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);

db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

db.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    display_name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

db.exec(`CREATE TABLE IF NOT EXISTS programs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

db.exec(`CREATE TABLE IF NOT EXISTS program_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    program_id INTEGER NOT NULL,
    week_number INTEGER NOT NULL,
    session_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    focus TEXT,
    order_index INTEGER NOT NULL
  )`);

db.exec(`CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    group_label TEXT,
    target_sets INTEGER DEFAULT 4,
    target_reps INTEGER DEFAULT 10,
    starting_weight REAL,
    is_bodyweight INTEGER DEFAULT 0,
    form_notes TEXT,
    order_index INTEGER NOT NULL
  )`);

db.exec(`CREATE TABLE IF NOT EXISTS workout_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    program_session_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT
  )`);

db.exec(`CREATE TABLE IF NOT EXISTS set_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_log_id INTEGER NOT NULL,
    exercise_id INTEGER NOT NULL,
    set_number INTEGER NOT NULL,
    weight_lbs REAL,
    reps INTEGER,
    is_bodyweight INTEGER DEFAULT 0,
    is_pr INTEGER DEFAULT 0,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

export default db;
