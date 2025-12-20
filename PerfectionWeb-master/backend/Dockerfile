# Use official Python runtime as base image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install basic build tools (only if a package needs to compile C extensions)
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip and install binary wheels for numpy/pandas first to avoid source builds
RUN python -m pip install --upgrade pip setuptools wheel
RUN python -m pip install --prefer-binary --only-binary=:all: numpy pandas || python -m pip install numpy pandas

# Copy requirements and install dependencies (remaining)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port 8080
EXPOSE 8080

# Run gunicorn
CMD exec gunicorn --bind :8080 --workers 4 --threads 2 --worker-class gthread --worker-tmp-dir /dev/shm app:app
