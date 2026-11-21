#!/usr/bin/env bash
# Run after starting the server at http://localhost:3000

# Health
curl http://localhost:3000/health

# List with pagination and filters
curl 'http://localhost:3000/api/internships?page=1&limit=2&domain=Full%20Stack%20Development&mode=Remote'

# Search
curl 'http://localhost:3000/api/internships?search=frontend'

# Detail
curl http://localhost:3000/api/internships/INT-101

# Create
curl -X POST http://localhost:3000/api/internships \
  -H 'Content-Type: application/json' \
  -d '{"title":"Backend Intern","domain":"Full Stack Development","mode":"Remote","location":"India","skills":["Node.js","SQLite"],"openings":2}'

# Update (PUT replaces all editable fields)
curl -X PUT http://localhost:3000/api/internships/INT-101 \
  -H 'Content-Type: application/json' \
  -d '{"title":"Frontend Intern","domain":"Full Stack Development","mode":"Hybrid","location":"Chennai","skills":["HTML","CSS","JavaScript"],"openings":3}'

# Apply (HTTPS portfolio URL is optional)
curl -X POST http://localhost:3000/api/internships/INT-101/applications \
  -H 'Content-Type: application/json' \
  -d '{"applicantName":"Demo Applicant","applicantEmail":"demo@example.com","portfolioUrl":"https://example.com"}'

# Delete
curl -X DELETE http://localhost:3000/api/internships/INT-101
