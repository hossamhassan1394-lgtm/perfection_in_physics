# Use official Python runtime as base image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install minimal system dependencies (PostgreSQL client only)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip, setuptools, wheel to latest versions
RUN python -m pip install --upgrade pip setuptools wheel

# Install numpy and pandas from prebuilt binary wheels
# Pin to versions known to have stable wheels for Python 3.11
RUN python -m pip install numpy==1.26.4 pandas==2.1.2 --no-cache-dir

# Copy requirements and install dependencies (remaining)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port 8080
EXPOSE 8080

# Run gunicorn
CMD exec gunicorn --bind :8080 --workers 4 --threads 2 --worker-class gthread --worker-tmp-dir /dev/shm app:app
