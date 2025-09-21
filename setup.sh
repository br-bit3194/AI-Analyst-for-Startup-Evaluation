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
    libxrender1

# Clean up
apt-get clean
rm -rf /var/lib/apt/lists/*

# Make the script executable
chmod +x /app/startup.sh
