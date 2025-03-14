FROM golang:1.21-alpine AS backend-builder

WORKDIR /app
COPY . .
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -o kafka-dashboard

FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
COPY live-view-webapp/ .
RUN echo "VITE_API_URL=http://localhost:5001" > .env
RUN npm install --legacy-peer-deps
RUN npm run build

FROM alpine:latest

WORKDIR /app
COPY --from=backend-builder /app/kafka-dashboard .
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Install needed packages including netcat for health checks
RUN apk add --no-cache ca-certificates curl netcat-openbsd nginx openssl jq kafkacat busybox

# Configure nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Create directories for SSL certificates (if needed later)
RUN mkdir -p /app/certs

EXPOSE 5001
EXPOSE 3000

# Create a script to run both services with proper startup checks
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "Starting dashboard service with security configuration..."' >> /app/start.sh && \
    echo 'MAX_RETRIES=30' >> /app/start.sh && \
    echo 'RETRY_COUNT=0' >> /app/start.sh && \
    echo 'echo "Waiting for Kafka to be ready..."' >> /app/start.sh && \
    echo 'while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do' >> /app/start.sh && \
    echo '  if nc -z kafka 9092; then' >> /app/start.sh && \
    echo '    break' >> /app/start.sh && \
    echo '  fi' >> /app/start.sh && \
    echo '  RETRY_COUNT=$((RETRY_COUNT + 1))' >> /app/start.sh && \
    echo '  echo "Kafka not ready, attempt $RETRY_COUNT of $MAX_RETRIES"' >> /app/start.sh && \
    echo '  sleep 2' >> /app/start.sh && \
    echo 'done' >> /app/start.sh && \
    echo 'if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then' >> /app/start.sh && \
    echo '  echo "Failed to connect to Kafka after $MAX_RETRIES attempts"' >> /app/start.sh && \
    echo '  exit 1' >> /app/start.sh && \
    echo 'fi' >> /app/start.sh && \
    echo 'echo "Starting backend service..."' >> /app/start.sh && \
    echo './kafka-dashboard & backend_pid=$!' >> /app/start.sh && \
    echo 'echo "Waiting for backend to start..."' >> /app/start.sh && \
    echo 'while ! nc -z localhost 5001; do sleep 1; done' >> /app/start.sh && \
    echo 'echo "Backend is ready, starting nginx..."' >> /app/start.sh && \
    echo 'nginx -g "daemon off;" & nginx_pid=$!' >> /app/start.sh && \
    echo 'wait $backend_pid $nginx_pid' >> /app/start.sh && \
    chmod +x /app/start.sh

CMD ["/app/start.sh"]