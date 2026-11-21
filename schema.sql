PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS internships (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 2 AND 120),
  domain TEXT NOT NULL CHECK(length(trim(domain)) BETWEEN 2 AND 80),
  mode TEXT NOT NULL CHECK(mode IN ('Remote', 'Hybrid', 'On-site')),
  location TEXT NOT NULL CHECK(length(trim(location)) BETWEEN 2 AND 100),
  skills_json TEXT NOT NULL DEFAULT '[]',
  openings INTEGER NOT NULL DEFAULT 1 CHECK(openings >= 0),
  applications_open INTEGER NOT NULL DEFAULT 1 CHECK(applications_open IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  internship_id TEXT NOT NULL,
  applicant_name TEXT NOT NULL CHECK(length(trim(applicant_name)) BETWEEN 2 AND 100),
  applicant_email TEXT NOT NULL,
  portfolio_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(internship_id, applicant_email),
  FOREIGN KEY(internship_id) REFERENCES internships(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_internships_domain ON internships(domain);
CREATE INDEX IF NOT EXISTS idx_internships_mode ON internships(mode);
CREATE INDEX IF NOT EXISTS idx_applications_internship ON applications(internship_id);
