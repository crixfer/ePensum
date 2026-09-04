# ePensum

A small web app for tracking university degree progress ("pensum"): upload your curriculum from an Excel file, track each subject's status/grade/teacher, and see your credits, subjects, and academic index at a glance.

## Stack

- **Frontend**: React + Vite + Tailwind + shadcn/ui, in `client/`
- **Backend**: Express + Prisma + SQLite, in `server/`
- **Shared**: types, validation schemas, and grading logic used by both, in `shared/`

## Setup

Create environment files before running the app:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Then install dependencies and run:

```bash
npm install
npm run -w server prisma:migrate   # creates server/prisma/dev.db and applies the schema
npm run -w server prisma:seed      # optional: adds a sample career template
npm run dev                        # runs server (:4000) and client (:5173) together
```

Then open http://localhost:5173, sign up, and either pick an existing career or upload your own pensum Excel file.

For production deployments, set `VITE_API_URL` in the frontend environment to your deployed API origin, and set `CLIENT_ORIGIN` in the backend to your deployed frontend origin.

## Excel import format

The importer looks for repeating quarter blocks (rows containing "CUATRIMESTRE", "SEMESTRE", or "TRIMESTRE"), each followed by a header row with `CLAVE`, `ASIGNATURA`, `CREDITO`, `PRE-REQ`, `ESTATUS`, `NOTA FINAL`, `DOCENTE`, `FECHA` columns (in any order/position). After parsing, you get a review screen to fix anything before it's saved.

## Project layout

```
shared/src/    types, zod schemas, grading formulas (letter grade, credits/subjects %, weighted index, honor)
server/src/    Express routes, Prisma access, auth
client/src/    pages, components, the Excel parser (lib/pensumParser.ts)
```
