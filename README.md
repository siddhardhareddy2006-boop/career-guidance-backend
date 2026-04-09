## CareerGuide Backend
Express + MongoDB API for the CareerGuide platform.
### What it does
- Auth (register/login, profile)
- Career resources (public read, admin manage)
- Counseling sessions (students book, counselors confirm/complete)
- Admin dashboard (stats, engagement, staff management)
- Personalized career suggestions (based on student interests and skills)
### Tech
- Node.js + Express
- MongoDB + Mongoose
- JWT auth
### Setup
1. Install:
```bash
npm install
Create .env (copy from .env.example):
cp .env.example .env
Start the server:
npm run dev
Health check: GET /api/health

Seed demo data (optional)
npm run seed
This will:

Create demo admin/counselor accounts if missing
Delete all existing career resources
Insert 10 default resources
Demo accounts:

Admin: admin@careerguide.demo / demo1234
Counselor: counselor@careerguide.demo / demo1234
Main API routes
POST /api/auth/register

POST /api/auth/login

GET/PATCH /api/auth/me

GET /api/resources

GET /api/resources/:id

GET /api/counselors

POST /api/sessions

GET /api/sessions/mine

POST /api/career-insights/generate

POST /api/career-insights/saved-path

GET/DELETE /api/career-insights/saved-path/:id

GET /api/admin/stats (admin)
