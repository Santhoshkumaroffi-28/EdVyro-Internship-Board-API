# EdVyro Task 2 — REST API and Persistent Data

A Node.js + Express REST API for the fictional internship board, backed by SQLite. This project covers the Task 2 checklist: a defined data model and response envelope, list/detail/create/update/delete endpoints, pagination, validation, and consistent HTTP errors.

## Technology
- Node.js (20+)
- Express 5
- SQLite with `better-sqlite3`
- Zod request validation
- Helmet security headers
- Node's built-in test runner and Supertest

## Project structure
```text
edvyro-task-2-rest-api/
├── db/schema.sql              # SQLite schema
├── seed/internships.json      # Stable fictional seed records
├── src/app.js                 # API routes and error handling
├── src/db.js                  # SQLite connection
├── src/init-db.js             # Schema setup command
├── src/seed-db.js             # Seed command
├── src/server.js              # Server entry point
├── src/validation.js          # Request schemas
├── tests/api.test.js          # API tests
├── examples/requests.sh        # curl examples
├── .env.example
└── package.json
```

## Setup
Requires Node.js 20 or newer.

```bash
npm install
cp .env.example .env
npm run db:init
npm run db:seed
npm start
```

The API runs at `http://localhost:3000`. The server creates the schema on startup as well; the explicit init command is included for clarity. The default database file is `db/internships.sqlite`.

## Seed records
`seed/internships.json` contains the five stable records supplied in the Task 1/product brief (INT-101 through INT-105). Their IDs are preserved. The schema extends the supplied SQLite starter structure with location, skills, and openings fields so it can store the supplied JSON records. The supplied SQL starter's applications table concept is retained and extended with an optional portfolio URL.

## API response format
Successful responses use this envelope:

```json
{
  "status": "success",
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

Errors use a consistent shape:

```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request body is invalid.",
    "details": [{ "field": "title", "message": "Too small: expected string to have >=2 characters" }]
  }
}
```

## Endpoints
| Method | Endpoint | Purpose | Success |
|---|---|---|---|
| GET | `/health` | Health check | 200 |
| GET | `/api/internships?page=1&limit=10` | Paginated list; optional `domain`, `mode`, `search` | 200 |
| GET | `/api/internships/:id` | Get one internship | 200 |
| POST | `/api/internships` | Create internship | 201 |
| PUT | `/api/internships/:id` | Replace editable internship fields | 200 |
| DELETE | `/api/internships/:id` | Delete internship | 200 |
| POST | `/api/internships/:id/applications` | Create application | 201 |

Pagination accepts `page >= 1` and `limit` from 1 to 100. Invalid pagination returns 400. Missing records return 404, duplicate IDs/applications return 409, invalid request data returns 400, and unknown routes return 404.

### Create/update internship body
```json
{
  "title": "Backend Intern",
  "domain": "Full Stack Development",
  "mode": "Remote",
  "location": "India",
  "skills": ["Node.js", "SQLite"],
  "openings": 2
}
```

Allowed work modes: `Remote`, `Hybrid`, `On-site`. For POST, `id` is optional; if omitted, the API generates one. For PUT, the ID is in the URL and all editable fields are required.

### Application body
```json
{
  "applicantName": "Demo Applicant",
  "applicantEmail": "demo@example.com",
  "portfolioUrl": "https://example.com"
}
```

Name and valid email are required. Portfolio URL is optional and must use HTTPS. A database uniqueness constraint prevents the same email applying twice to the same internship. Applications for an unknown internship return 404; closed applications return 409.

## Test
```bash
npm test
```

The test suite checks health, pagination, detail lookup, invalid create data, create/update/delete, email and HTTPS URL validation, and duplicate application rejection. Run it after `npm install`.

## Security and privacy notes
- Request bodies are size-limited and validated with strict schemas.
- SQL statements use prepared parameters.
- Helmet sets standard HTTP security headers.
- Application logs include only event type and generated IDs; applicant names, emails, portfolio URLs, request bodies, and access tokens are not logged.
- No passwords or access tokens are collected by this API.
- This is a learning API, not a production deployment. Add authentication, authorization, rate limiting, HTTPS termination, backups, and operational monitoring before production use.

## Environment
Copy `.env.example` to `.env` and change `PORT` or `DATABASE_FILE` if needed. The example contains no secrets. `.env` and database files are ignored by Git.

## Author
Santhoshkumar G

GitHub: https://github.com/Santhoshkumaroffi-28

EdVyro — Full Stack Development, Task 2: REST API and Persistent Data.
