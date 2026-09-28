# VINEXTURE Frontend

This is the frontend for the VINEXTURE platform, built with Next.js, TypeScript, and Tailwind CSS.

## Getting started

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 to view the app.

## Project structure

- `app/` — route pages and application layout
- `components/` — reusable UI and site sections
- `lib/` — utility code and shared helpers

## Environment variables

Create a `.env.local` file with values similar to:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## Production build

```bash
npm run build
npm run start
```
