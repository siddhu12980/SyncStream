FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN curl -sSL https://install.python-poetry.org | python3 -

# Copy poetry files
COPY pyproject.toml poetry.lock ./

# Configure poetry
RUN poetry config virtualenvs.create false

# Install dependencies
ARG INSTALL_DEV=false
RUN if [ "$INSTALL_DEV" = "true" ] ; then \
    poetry install --no-root ; \
    else \
    poetry install --no-root --no-dev ; \
    fi

# Copy the rest of the application
COPY . .

# Make sure the application is in the Python path
ENV PYTHONPATH=/app

# Run the Celery worker
CMD ["poetry", "run", "celery", "-A", "backend.worker.tasks", "worker", "--loglevel=info"] 7