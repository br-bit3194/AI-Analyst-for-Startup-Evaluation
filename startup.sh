#!/bin/bash

# Activate the virtual environment
source /app/venv/bin/activate

# Run database migrations (if any)
# python -m alembic upgrade head

# Start the application
exec gunicorn app.main:app --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
