#!/bin/bash

# Install system dependencies
apt-get update
apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    poppler-utils \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user and set permissions
useradd -m appuser
chown -R appuser:appuser /app

# Install Python dependencies
pip install --no-cache-dir -r requirements-heroku.txt

# Clean up Python cache
find /app -type d -name "__pycache__" -exec rm -r {} +
