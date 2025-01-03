FROM python:3.9-slim

WORKDIR /app

# Install system dependencies including docker-compose
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    docker.io \
    docker-compose && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Make sure the files are readable and executable
RUN chmod -R 755 /app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"] 