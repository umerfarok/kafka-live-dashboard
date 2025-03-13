FROM golang:1.21-alpine AS backend-builder

WORKDIR /app
COPY . .
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -o kafka-dashboard

FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
COPY live-view-webapp/ .
# Create .env file with the API URL for production build
RUN echo "VITE_API_URL=http://localhost:5001" > .env
RUN npm install --legacy-peer-deps
RUN npm run build

FROM alpine:latest

WORKDIR /app
COPY --from=backend-builder /app/kafka-dashboard .
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html
COPY .env .

# Install needed packages
RUN apk add --no-cache ca-certificates curl netcat-openbsd nginx

# Configure nginx
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 5001
EXPOSE 3000

# Create a script to run both services with proper startup order
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "Waiting for Kafka to be ready..."' >> /app/start.sh && \
    echo 'while ! nc -z kafka 9092; do sleep 1; done' >> /app/start.sh && \
    echo 'echo "Kafka is ready"' >> /app/start.sh && \
    echo 'echo "Starting backend service..."' >> /app/start.sh && \
    echo './kafka-dashboard & backend_pid=$!' >> /app/start.sh && \
    echo 'echo "Waiting for backend to start..."' >> /app/start.sh && \
    echo 'while ! curl -s http://localhost:5001/ > /dev/null; do sleep 1; done' >> /app/start.sh && \
    echo 'echo "Backend is ready, starting nginx..."' >> /app/start.sh && \
    echo 'nginx -g "daemon off;" & nginx_pid=$!' >> /app/start.sh && \
    echo 'wait $backend_pid $nginx_pid' >> /app/start.sh && \
    chmod +x /app/start.sh

CMD ["/app/start.sh"]