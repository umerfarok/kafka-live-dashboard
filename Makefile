.PHONY: build run docker-build docker-run test clean frontend backend dev create-topic

# Default target
all: build

# Build the Go application
build:
	go build -o bin/kafka-dashboard

# Run the Go application
run: build
	./bin/kafka-dashboard

# Build the Docker image
docker-build:
	docker build -t kafka-live-dashboard .

# Run using Docker Compose
docker-run:
	docker compose up -d

# Run Docker Compose with logs
docker-logs:
	docker compose up

# Stop Docker Compose
docker-stop:
	docker compose down

# Test Go code
test:
	go test -v ./...

# Clean build artifacts
clean:
	rm -rf bin/

# Run frontend development server
frontend:
	cd live-view-webapp && npm install && npm run dev

# Run backend development server
backend:
	go run main.go

# Run both frontend and backend (requires tmux or multiple terminals)
dev:
	@echo "Starting backend server..."
	@go run main.go & 
	@echo "Starting frontend server..."
	@cd live-view-webapp && npm install && npm run dev

# Create a test topic with sample data
create-topic:
	go run create-test-topic.go

# Create a specific topic with parameters
create-custom-topic:
	@read -p "Topic name: " topic; \
	read -p "Number of partitions (default: 3): " partitions; \
	read -p "Replication factor (default: 1): " replication; \
	read -p "Number of messages (default: 100): " messages; \
	partitions=$${partitions:-3}; \
	replication=$${replication:-1}; \
	messages=$${messages:-100}; \
	go run create-test-topic.go -topic $$topic -partitions $$partitions -replication $$replication -messages $$messages

# Show help
help:
	@echo "Kafka Live Dashboard - Makefile Commands"
	@echo "--------------------------------------"
	@echo "make build             - Build the Go application"
	@echo "make run               - Run the Go application"
	@echo "make docker-build      - Build the Docker image"
	@echo "make docker-run        - Run using Docker Compose in detached mode"
	@echo "make docker-logs       - Run using Docker Compose with logs"
	@echo "make docker-stop       - Stop Docker Compose services"
	@echo "make test              - Run Go tests"
	@echo "make clean             - Remove build artifacts"
	@echo "make frontend          - Run frontend development server"
	@echo "make backend           - Run backend development server"
	@echo "make dev               - Run both frontend and backend"
	@echo "make create-topic      - Create a test topic with sample data"
	@echo "make create-custom-topic - Create a custom topic with parameters"