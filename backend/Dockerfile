# Backend Dockerfile — Express + FastAPI in one container
FROM node:20-slim AS node-base

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM python:3.11-slim

# Install Node.js for running Express
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Node app
COPY --from=node-base /app/node_modules ./node_modules
COPY package*.json ./
COPY . .

# Copy Python service
COPY ../context/ ./python-service/
WORKDIR /app/python-service
RUN pip install --no-cache-dir -r requirements.txt

WORKDIR /app

# Start both services
COPY start.sh ./
RUN chmod +x start.sh

EXPOSE 5000

CMD ["./start.sh"]
