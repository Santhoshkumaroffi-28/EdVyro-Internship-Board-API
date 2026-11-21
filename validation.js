const { z } = require('zod');

const internshipSchema = z.object({
  id: z.string().trim().min(3).max(30).regex(/^[A-Za-z0-9-]+$/).optional(),
  title: z.string().trim().min(2).max(120),
  domain: z.string().trim().min(2).max(80),
  mode: z.enum(['Remote', 'Hybrid', 'On-site']),
  location: z.string().trim().min(2).max(100),
  skills: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  openings: z.number().int().min(0).max(10000).default(1)
}).strict();

const applicationSchema = z.object({
  applicantName: z.string().trim().min(2).max(100),
  applicantEmail: z.string().trim().email().max(254).transform(v => v.toLowerCase()),
  portfolioUrl: z.string().trim().url().max(2048).refine(value => {
    try { return new URL(value).protocol === 'https:'; } catch { return false; }
  }, 'Portfolio URL must use HTTPS').optional()
}).strict();

module.exports = { internshipSchema, applicationSchema };
