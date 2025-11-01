FROM python:3.12-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the application files
COPY . .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the .env file into the container
COPY .env /env/.env

# Expose the port FastAPI will run on
EXPOSE 8000

# Run Gunicorn with Uvicorn workers
CMD ["bash", "-c", "cp /env/.env /app/.env && uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4 --proxy-headers --forwarded-allow-ips \"*\""]