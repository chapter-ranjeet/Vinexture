# Deployment Guide

## Frontend (Vercel)

1. Import the `frontend/` directory into Vercel.
2. Set environment variables, for example:
   - `NEXT_PUBLIC_API_URL=https://your-backend-url/api`
3. Deploy the app.

## Backend (Render or Railway)

1. Create a new web service from the `backend/` directory.
2. Use a PostgreSQL add-on for production data.
3. Configure environment variables:
   - `DJANGO_SECRET_KEY=replace-with-secure-secret`
   - `DJANGO_DEBUG=False`
   - `DJANGO_ALLOWED_HOSTS=your-backend-domain.onrender.com,localhost`
   - `FRONTEND_URL=https://your-frontend-domain.vercel.app`
   - `DATABASE_URL=postgres://user:password@host:5432/dbname`
4. Run database migrations and collect static files.
5. Set the application to run with `gunicorn config.wsgi` or the platform default web server.

## Production database

Use PostgreSQL for production. The project is structured to transition from SQLite in development to PostgreSQL deployment without changing the app architecture significantly.

## Notes

- Keep local development on SQLite to keep bootstrapping simple.
- For Render or Railway, use the provided Postgres add-on and set `DATABASE_URL` to the service connection string.
- Configure CORS and `FRONTEND_URL` for the deployed frontend origin to enable JWT-based API access.
