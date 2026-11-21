const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const request = require('supertest');

const testDb = path.join(__dirname, 'test.sqlite');
process.env.DATABASE_FILE = testDb;
const db = require('../src/db');
db.exec(fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8'));
const app = require('../src/app');

before(() => {
  db.exec('DELETE FROM applications; DELETE FROM internships;');
  db.prepare(`INSERT INTO internships (id,title,domain,mode,location,skills_json,openings)
    VALUES (?,?,?,?,?,?,?)`).run('INT-TEST', 'Test Internship', 'Testing', 'Remote', 'India', '["Node.js"]', 2);
});
after(() => {
  db.close();
  for (const suffix of ['', '-shm', '-wal']) {
    try { fs.unlinkSync(testDb + suffix); } catch {}
  }
});

test('health endpoint responds', async () => {
  const res = await request(app).get('/health').expect(200);
  assert.equal(res.body.status, 'success');
});
test('list endpoint returns predictable envelope and pagination', async () => {
  const res = await request(app).get('/api/internships?page=1&limit=1').expect(200);
  assert.equal(res.body.status, 'success');
  assert.equal(res.body.data.length, 1);
  assert.equal(res.body.meta.total, 1);
});
test('detail endpoint returns a record', async () => {
  const res = await request(app).get('/api/internships/INT-TEST').expect(200);
  assert.equal(res.body.data.id, 'INT-TEST');
});
test('create rejects invalid data', async () => {
  const res = await request(app).post('/api/internships').send({ title: '' }).expect(400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});
test('create, update and delete work', async () => {
  const created = await request(app).post('/api/internships').send({
    title: 'Backend Intern', domain: 'Engineering', mode: 'Hybrid', location: 'Chennai', skills: ['Node.js'], openings: 1
  }).expect(201);
  const id = created.body.data.id;
  await request(app).put(`/api/internships/${id}`).send({
    title: 'Updated Backend Intern', domain: 'Engineering', mode: 'Remote', location: 'India', skills: ['SQL'], openings: 2
  }).expect(200);
  await request(app).delete(`/api/internships/${id}`).expect(200);
  await request(app).get(`/api/internships/${id}`).expect(404);
});
test('application validates email and HTTPS portfolio URL', async () => {
  const bad = await request(app).post('/api/internships/INT-TEST/applications').send({
    applicantName: 'Test User', applicantEmail: 'not-an-email', portfolioUrl: 'http://unsafe.example'
  }).expect(400);
  assert.equal(bad.body.error.code, 'VALIDATION_ERROR');
});
test('duplicate applications are rejected', async () => {
  const payload = { applicantName: 'Test User', applicantEmail: 'test@example.com' };
  await request(app).post('/api/internships/INT-TEST/applications').send(payload).expect(201);
  const duplicate = await request(app).post('/api/internships/INT-TEST/applications').send(payload).expect(409);
  assert.equal(duplicate.body.error.code, 'DUPLICATE_APPLICATION');
});
