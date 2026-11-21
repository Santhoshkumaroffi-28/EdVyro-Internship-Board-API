const fs = require('node:fs');
const path = require('node:path');
const db = require('./db');
const schema = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
db.exec(schema);
console.log('SQLite schema initialized.');
db.close();
