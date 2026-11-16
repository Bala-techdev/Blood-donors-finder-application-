# ========================================================
# SmartBlood ML Service Dockerfile
# ========================================================

FROM python:3.11-slim

WORKDIR /app

# Ensure security updates and clean package cache
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and trained models
COPY . .

# Run as non-privileged security user
RUN groupadd -r mluser && useradd -r -g mluser mluser && chown -R mluser:mluser /app
USER mluser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
