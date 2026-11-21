const fs = require('node:fs');
const path = require('node:path');
const db = require('./db');
db.exec(fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8'));
const app = require('./app');
const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`Internship API listening on port ${port}`));
