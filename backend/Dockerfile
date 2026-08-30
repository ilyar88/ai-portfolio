FROM python:3.13-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    PIP_DEFAULT_TIMEOUT=100

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        curl \
        build-essential \
        libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install pipenv
RUN pip install --no-cache-dir pipenv

# NOTE: the build context is the repo root (so frontend/public can be copied in).
# Deploy with:  fly deploy --config backend/fly.toml   (run from the repo root)

# Copy Pipfile and Pipfile.lock
COPY backend/Pipfile* ./

# Install dependencies
RUN pipenv install --system --deploy

# Copy the backend application
COPY backend/ .

# Bundle the frontend's public/ folder so the file browser ("Knowledge and
# experience") can serve it in production. FILES_ROOT points the browser here.
COPY frontend/public /srv/files
ENV FILES_ROOT=/srv/files

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
CMD ["python", "-m", "run_server"]
