# VINEXTURE

A full-stack monorepo for VINEXTURE, covering a premium white-brand frontend and a Django REST API foundation.

## Monorepo structure

- `frontend/` — Next.js + TypeScript + Tailwind frontend
- `backend/` — Django + DRF backend and app modules
- `docs/` — project documentation and deployment guidance

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

## Backend setup

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py createsuperuser
.\.venv\Scripts\python.exe manage.py runserver
```

## Demo admin account

A seeded admin exists for local testing:

- Email: `admin@vinexture.com`
- Password: `Admin@12345`

## Production notes

- Frontend deploys to Vercel
- Backend deploys to Render or Railway
- PostgreSQL is the target production database
- Use environment variables for secrets and deployment settings
- The Django backend supports both SQLite for local development and PostgreSQL via `DATABASE_URL` in production
- CMS pages, blog content, and auth flows are wired into the API structure for a more complete product experience
