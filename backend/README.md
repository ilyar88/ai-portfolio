# Stand Alone Backend Service 🔧

[![Python](https://img.shields.io/badge/Python-3.12-blue?style=for-the-badge&logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)

## 🚀 Local Setup Instructions

1. Create venv for the project using python 3.12:
   ```bash
   pipenv shell
   pipenv install
   ```
2. Create an `.env` file and update the envars (look at env.example file in the root dir)

3. Build the postgres image:
   ```bash
   # From the backend directory
   docker build -t fly-postgres-pgvector -f Dockerfile.postgres .
   docker run -d --name fly-postgres-rag -p 5432:5432 -e POSTGRES_DB=pgdb -e POSTGRES_USER=pguser -e POSTGRES_PASSWORD=docker fly-postgres-pgvector
   ```

4. Create a local docker container for redis:
   ```bash
   docker run -d --name redis-db -p 6379:6379 redis:7-alpine
   ```

5. Add your CV and other text you want to use for the RAG to the "docs" folder as .md files

6. Start the server:
   ```bash
   python3 run_server.py
   ```

7. Visit http://localhost:8000/docs and enjoy! 🎉

### 🎤 Voice chat (Gemini Live)

The `/voice` WebSocket endpoint bridges the browser microphone to the Google
Gemini Live API for real-time voice-to-voice chat (triggered by the mic button in
the frontend). Set `GEMINI_API_KEY` in your `.env` to enable it. Gemini is
instructed with the same markdown knowledge base in `docs/` that powers the text
chat.

### 📂 File browser

The `/files/list` and `/files/raw` endpoints expose a **read-only** browser for a
single directory, used by the "Knowledge and experience" page in the frontend. It
defaults to `frontend/public`; override it with `FILES_ROOT=/absolute/path` in
your `.env`. The root lists folders only (files appear once you open a folder).
Every request is confined to that root (no path traversal) and only GET is
supported.

## 🐳 Docker Compose

```bash
# Build the containers
docker compose build

# Start the services
docker compose up
```

## 🚀 Deployment on fly.io

1. Install the Fly CLI:
   ```bash
   brew install flyctl
   ```

2. Create a new app:
   ```bash
   fly launch --no-deploy --name <your-app-name>
   ```

3. Create Postgres database:
   ```bash
   fly postgres create --image-ref andrebrito16/pgvector-fly --name <your-db-name>
   ```
   > Note: Using a community image with pgvector extension pre-installed.  
   > [Learn more here](https://andrefbrito.medium.com/how-to-add-pgvector-support-on-fly-io-postgres-35b2ca039ab8)

4. Create Redis instance:
   ```bash
   fly redis create --name <your-redis-name>
   ```

5. Set required secrets:
   ```bash
   fly secrets set POSTGRES_PASSWORD=<YOUR_PASSWORD>
   fly secrets set LLM_ROUTER_API_KEY=<YOUR_API_KEY>
   fly secrets set OPENAI_API_KEY=<YOUR_API_KEY>
   fly secrets set REDIS_URL=<YOUR_REDIS_URL>
   ```

6. Update the `fly.toml` file with your app, postgres, and redis details

7. Deploy:
   ```bash
   fly deploy
   ```

8. Visit your app at https://your-app-name.fly.dev/docs 🎉

## 🧪 Testing

This project uses pytest for testing. Tests are organized in the `tests/` directory following the application structure.

### Running Tests

```bash
# Run all tests
pytest

# Run tests with coverage report
pytest --cov=app

# Run specific test file
pytest tests/path/to/test_file.py

# Run tests in watch mode
pytest-watch
```

### Test Configuration

The test configuration is defined in `pytest.ini`. Test environment variables defined in the test fixtures.

