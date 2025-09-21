#!/bin/bash
set -e

# Install minimal system dependencies
apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
useradd -m appuser

# Install Python dependencies in a virtual environment
python -m venv /opt/venv
. /opt/venv/bin/activate

# Install Python packages with --no-deps to avoid conflicts
pip install --no-cache-dir --upgrade pip
pip install --no-cache-dir -r requirements-heroku.txt

# Clean up
find /opt/venv -type d -name "__pycache__" -exec rm -r {} +
find /opt/venv -type d -name "*.pyc" -delete

# Set permissions
chown -R appuser:appuser /app
chmod -R 755 /app
