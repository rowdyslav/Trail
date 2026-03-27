# Repository Guidelines

## Project Structure & Module Organization

This FastAPI backend is organized from the repository root. [`main.py`](C:\Projects\full\Trail\backend\main.py) creates the app and registers middleware and routers. [`routers/`](C:\Projects\full\Trail\backend\routers) contains endpoint modules such as `auth.py`, `me.py`, `routes.py`, and `scan.py`. [`core/`](C:\Projects\full\Trail\backend\core) holds shared models, schemas, auth helpers, dependencies, and error utilities. [`db.py`](C:\Projects\full\Trail\backend\db.py) initializes MongoDB and seeds sample route data. Configuration parsing lives in [`env.py`](C:\Projects\full\Trail\backend\env.py).

## Build, Test, and Development Commands

Use `uv` for local setup and execution.

- `uv sync --dev` installs runtime and development dependencies into `.venv`.
- `uv run fastapi dev main.py` starts the API locally with reload on port `8000`.
- `uv run ruff check .` runs linting.
- `uv run ruff format .` formats the codebase.
- `docker build -t trail-backend .` builds the container image from [`Dockerfile`](C:\Projects\full\Trail\backend\Dockerfile).

Create `.env` from `.env.example` before running the service, and make sure `MONGO_URL` points to a live MongoDB instance.

## Coding Style & Naming Conventions

Target Python 3.14+ syntax and keep code aligned with `pyproject.toml` and `ruff.toml`. Use 4-space indentation, type hints on public functions, and explicit imports. Follow the existing naming style: `snake_case` for modules, functions, and variables; `PascalCase` for Pydantic and Beanie classes. Keep route handlers thin and move reusable logic into `core/` or focused helper modules.

## Testing Guidelines

There is no `tests/` package yet. Add tests under `tests/`, mirroring the runtime layout where practical, for example `tests/routers/test_auth.py`. Prefer `pytest` with async support for FastAPI endpoints and database code. Until automated tests are added, run `uv run ruff check .` and manually verify changed endpoints locally before opening a PR.

## Security & Configuration Tips

Do not commit real secrets in `.env`. Treat values in `.env.example` as placeholders only. Review CORS origins, auth secrets, and Mongo connection settings before deploying.
