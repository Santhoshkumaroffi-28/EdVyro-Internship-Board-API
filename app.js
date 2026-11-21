const express = require('express');
const helmet = require('helmet');
const { randomUUID } = require('node:crypto');
const db = require('./db');
const { internshipSchema, applicationSchema } = require('./validation');

const app = express();
app.use(helmet());
app.use(express.json({ limit: '20kb' }));

function send(res, statusCode, status, data, meta) {
  const body = { status, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}
function fail(res, statusCode, code, message, details) {
  return res.status(statusCode).json({ status: 'error', error: { code, message, ...(details ? { details } : {}) } });
}
function parseInternship(row) {
  return { id: row.id, title: row.title, domain: row.domain, mode: row.mode,
    location: row.location, skills: JSON.parse(row.skills_json), openings: row.openings,
    createdAt: row.created_at, updatedAt: row.updated_at };
}
function validate(schema, body) {
  const result = schema.safeParse(body);
  return result.success ? { value: result.data } : { error: result.error.issues.map(issue => ({ field: issue.path.join('.'), message: issue.message })) };
}

app.get('/health', (req, res) => send(res, 200, 'success', { message: 'Internship API is running' }));

app.get('/api/internships', (req, res) => {
  const page = Number.parseInt(req.query.page ?? '1', 10);
  const limit = Number.parseInt(req.query.limit ?? '10', 10);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    return fail(res, 400, 'INVALID_PAGINATION', 'page must be >= 1 and limit must be between 1 and 100.');
  }
  const filters = [];
  const params = [];
  for (const field of ['domain', 'mode']) {
    if (req.query[field]) { filters.push(`${field} = ?`); params.push(String(req.query[field]).slice(0, 100)); }
  }
  if (req.query.search) {
    filters.push('(title LIKE ? OR domain LIKE ? OR location LIKE ? OR skills_json LIKE ?)');
    const term = `%${String(req.query.search).slice(0, 80)}%`;
    params.push(term, term, term, term);
  }
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const total = db.prepare(`SELECT COUNT(*) AS count FROM internships ${where}`).get(...params).count;
  const rows = db.prepare(`SELECT * FROM internships ${where} ORDER BY id LIMIT ? OFFSET ?`).all(...params, limit, (page - 1) * limit);
  return send(res, 200, 'success', rows.map(parseInternship), {
    page, limit, total, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total,
    hasPreviousPage: page > 1
  });
});

app.get('/api/internships/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM internships WHERE id = ?').get(req.params.id);
  if (!row) return fail(res, 404, 'INTERNSHIP_NOT_FOUND', 'No internship exists with that ID.');
  return send(res, 200, 'success', parseInternship(row));
});

app.post('/api/internships', (req, res) => {
  const checked = validate(internshipSchema, req.body);
  if (checked.error) return fail(res, 400, 'VALIDATION_ERROR', 'The request body is invalid.', checked.error);
  const value = checked.value;
  const id = value.id || `INT-${randomUUID().slice(0, 8).toUpperCase()}`;
  try {
    db.prepare(`INSERT INTO internships (id,title,domain,mode,location,skills_json,openings)
      VALUES (@id,@title,@domain,@mode,@location,@skills_json,@openings)`).run({ ...value, id, skills_json: JSON.stringify(value.skills) });
    const created = db.prepare('SELECT * FROM internships WHERE id = ?').get(id);
    return send(res, 201, 'success', parseInternship(created));
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY' || error.code === 'SQLITE_CONSTRAINT_UNIQUE')
      return fail(res, 409, 'DUPLICATE_ID', 'An internship with this ID already exists.');
    throw error;
  }
});

app.put('/api/internships/:id', (req, res) => {
  const checked = validate(internshipSchema.omit({ id: true }), req.body);
  if (checked.error) return fail(res, 400, 'VALIDATION_ERROR', 'The request body is invalid.', checked.error);
  const current = db.prepare('SELECT id FROM internships WHERE id = ?').get(req.params.id);
  if (!current) return fail(res, 404, 'INTERNSHIP_NOT_FOUND', 'No internship exists with that ID.');
  const v = checked.value;
  db.prepare(`UPDATE internships SET title=@title, domain=@domain, mode=@mode, location=@location,
    skills_json=@skills_json, openings=@openings, updated_at=CURRENT_TIMESTAMP WHERE id=@id`)
    .run({ ...v, id: req.params.id, skills_json: JSON.stringify(v.skills) });
  return send(res, 200, 'success', parseInternship(db.prepare('SELECT * FROM internships WHERE id=?').get(req.params.id)));
});

app.delete('/api/internships/:id', (req, res) => {
  const result = db.prepare('DELETE FROM internships WHERE id = ?').run(req.params.id);
  if (!result.changes) return fail(res, 404, 'INTERNSHIP_NOT_FOUND', 'No internship exists with that ID.');
  return send(res, 200, 'success', { id: req.params.id, deleted: true });
});

app.post('/api/internships/:id/applications', (req, res) => {
  const internship = db.prepare('SELECT id, applications_open FROM internships WHERE id = ?').get(req.params.id);
  if (!internship) return fail(res, 404, 'INTERNSHIP_NOT_FOUND', 'No internship exists with that ID.');
  if (internship.applications_open === 0) return fail(res, 409, 'APPLICATIONS_CLOSED', 'Applications are closed for this internship.');
  const checked = validate(applicationSchema, req.body);
  if (checked.error) return fail(res, 400, 'VALIDATION_ERROR', 'The application is invalid.', checked.error);
  const v = checked.value;
  try {
    const result = db.prepare(`INSERT INTO applications (internship_id, applicant_name, applicant_email, portfolio_url)
      VALUES (?, ?, ?, ?)`).run(req.params.id, v.applicantName, v.applicantEmail, v.portfolioUrl || null);
    // Deliberately log only a non-sensitive event and generated record ID, never applicant details.
    console.info(JSON.stringify({ event: 'application_created', applicationId: result.lastInsertRowid, internshipId: req.params.id }));
    return send(res, 201, 'success', { id: result.lastInsertRowid, internshipId: req.params.id, created: true });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return fail(res, 409, 'DUPLICATE_APPLICATION', 'An application already exists for this email and internship.');
    throw error;
  }
});

app.use((req, res) => fail(res, 404, 'ROUTE_NOT_FOUND', 'The requested API route does not exist.'));
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && 'body' in error) return fail(res, 400, 'INVALID_JSON', 'Request body must contain valid JSON.');
  // Do not log request bodies, headers, or applicant information.
  console.error(JSON.stringify({ event: 'api_error', message: error.message }));
  return fail(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected server error occurred.');
});

module.exports = app;
