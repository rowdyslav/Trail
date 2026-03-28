# Repository Guidelines

## Project Structure & Module Organization

This repository has two apps and shared container orchestration:

- `backend/`: FastAPI service. Entry point is `backend/main.py`; HTTP routes live in `backend/routers/`, domain logic in `backend/core/`, and integrations in `backend/utils/`.
- `frontend/`: Vite + React + TypeScript client. App wiring is in `frontend/src/app/`; user flows are split across `pages/`, `features/`, `entities/`, and `shared/`.
- `docker-compose.yml`: local MongoDB, backend, and frontend services.
- `frontend/public/`: static assets such as icons and level images.

## Build, Test, and Development Commands

- `docker compose up --build`: start MongoDB, backend, and frontend together.
- `cd backend && uv sync --dev`: install Python dependencies into the local virtual environment.
- `cd backend && uv run fastapi dev --host 0.0.0.0`: run the API locally on port `8000`.
- `cd backend && ruff check .`: run Python linting.
- `cd frontend && npm ci`: install frontend dependencies.
- `cd frontend && npm run dev`: start the Vite dev server.
- `cd frontend && npm run build`: type-check and create a production build.
- `cd frontend && npm run lint`: run ESLint on `ts`/`tsx` files.

## Coding Style & Naming Conventions

Use 4 spaces in Python and the existing TypeScript formatting in the frontend. Keep Python modules `snake_case`; keep React components, pages, and layout files `PascalCase` such as `RoutePage.tsx` and `AppShell.tsx`. Follow the current frontend FSD-style layout (`app`, `pages`, `features`, `entities`, `shared`). Use Ruff for backend linting and ESLint for frontend linting before submitting changes.

## Testing Guidelines

There is no committed automated test suite yet. Treat linting as the current minimum quality gate:

- `cd backend && ruff check .`
- `cd frontend && npm run lint`

## Commit & Pull Request Guidelines

Recent history uses short, imperative commit subjects such as `Refactor route reading endpoints` and occasional Conventional Commit prefixes like `feat:`. Prefer concise, present-tense subjects under 72 characters. Pull requests should include a clear summary, linked issue if applicable, affected areas (`backend`, `frontend`, or both), and screenshots for UI changes. Note any new environment variables or API contract changes explicitly.
