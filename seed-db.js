const fs = require('node:fs');
const path = require('node:path');
const db = require('./db');
const seed = JSON.parse(fs.readFileSync(path.join(__dirname, '../seed/internships.json'), 'utf8'));
db.exec(fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8'));
const insert = db.prepare(`INSERT INTO internships
  (id, title, domain, mode, location, skills_json, openings)
  VALUES (@id, @title, @domain, @mode, @location, @skills_json, @openings)
  ON CONFLICT(id) DO UPDATE SET title=excluded.title, domain=excluded.domain,
  mode=excluded.mode, location=excluded.location, skills_json=excluded.skills_json,
  openings=excluded.openings, updated_at=CURRENT_TIMESTAMP`);
const run = db.transaction((records) => {
  for (const item of records) insert.run({ ...item, skills_json: JSON.stringify(item.skills) });
});
run(seed.internships);
console.log(`Seeded ${seed.internships.length} internships.`);
db.close();
