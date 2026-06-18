const Database = require('better-sqlite3')
const path = require('path')

const DB_PATH = path.join(__dirname, 'xiaoyuan.db')
let db

function getDB() {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
  }
  return db
}

function initDB() {
  const db = getDB()

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL CHECK(role IN ('owner','pet')),
      bind_code TEXT UNIQUE,
      partner_id INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pet_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      level INTEGER DEFAULT 1,
      exp INTEGER DEFAULT 0,
      points INTEGER DEFAULT 100,
      total_points INTEGER DEFAULT 100,
      mood TEXT DEFAULT 'happy',
      affection INTEGER DEFAULT 50,
      title TEXT DEFAULT '初来乍到的小狗',
      appearance TEXT DEFAULT 'default',
      streak INTEGER DEFAULT 0,
      last_checkin TEXT DEFAULT '',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS daily_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      date TEXT NOT NULL,
      task_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      icon TEXT DEFAULT '📌',
      points INTEGER DEFAULT 10,
      status TEXT DEFAULT 'pending',
      detail TEXT DEFAULT '',
      time_start TEXT DEFAULT '',
      time_end TEXT DEFAULT '',
      completed_at TEXT DEFAULT '',
      verified_by TEXT DEFAULT '',
      UNIQUE(user_id, date, task_id)
    );

    CREATE TABLE IF NOT EXISTS custom_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      type TEXT DEFAULT 'custom',
      points INTEGER DEFAULT 15,
      icon TEXT DEFAULT '⭐',
      recurring INTEGER DEFAULT 1,
      time_limit TEXT DEFAULT '',
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rewards_pool (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL REFERENCES users(id),
      type TEXT NOT NULL CHECK(type IN ('reward','punishment')),
      category TEXT NOT NULL,
      content TEXT NOT NULL,
      icon TEXT DEFAULT '🎁',
      points_cost INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS game_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      game_type TEXT NOT NULL,
      result TEXT DEFAULT '',
      points_change INTEGER DEFAULT 0,
      played_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS diary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      date TEXT NOT NULL,
      mood TEXT DEFAULT '',
      meal_breakfast TEXT DEFAULT '',
      meal_lunch TEXT DEFAULT '',
      meal_dinner TEXT DEFAULT '',
      highlights TEXT DEFAULT '',
      owner_comment TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, date)
    );
  `)

  console.log('数据库初始化完成')
}

module.exports = { getDB, initDB }
