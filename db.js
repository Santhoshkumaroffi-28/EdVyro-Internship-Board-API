const path = require('node:path');
const fs = require('node:fs');
const Database = require('better-sqlite3');

const configuredPath = process.env.DATABASE_FILE || './db/internships.sqlite';
const databasePath = path.resolve(process.cwd(), configuredPath);
fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const db = new Database(databasePath);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');
module.exports = db;
