.PHONY: build run test clean cert dev-up dev-down docker-build docker-push prod-up prod-down aws-push

# Default target
all: build

# Build the Go backend
build:
	go build -o kafka-dashboard

# Run locally
run:
	go run .

# Run tests
test:
	go test ./...

# Clean build artifacts
clean:
	rm -f kafka-dashboard
	rm -rf live-view-webapp/dist

# Generate SSL certificates
cert:
	cd scripts && chmod +x generate-certs.sh && ./generate-certs.sh

# Start development environment
dev-up:
	docker-compose -f docker-compose.dev.yaml up --build

# Stop development environment
dev-down:
	docker-compose -f docker-compose.dev.yaml down

# Build Docker image
docker-build:
	docker build -t kafka-dashboard:latest .

# Push to Docker Hub (replace with your username)
docker-push:
	@read -p "Enter Docker Hub username: " username; \
	docker tag kafka-dashboard:latest $$username/kafka-dashboard:latest; \
	docker push $$username/kafka-dashboard:latest

# Production deployment
prod-up:
	docker-compose -f docker-compose.prod.yaml up -d

prod-down:
	docker-compose -f docker-compose.prod.yaml down

# Push to AWS ECR
aws-push:
	@read -p "Enter AWS Region: " region; \
	read -p "Enter AWS Account ID: " account; \
	aws ecr get-login-password --region $$region | docker login --username AWS --password-stdin $$account.dkr.ecr.$$region.amazonaws.com; \
	docker tag kafka-dashboard:latest $$account.dkr.ecr.$$region.amazonaws.com/kafka-dashboard:latest; \
	docker push $$account.dkr.ecr.$$region.amazonaws.com/kafka-dashboard:latest

# Setup development environment
setup-dev:
	go mod download
	cd live-view-webapp && npm install --legacy-peer-deps

# Start frontend development server
frontend-dev:
	cd live-view-webapp && npm run dev

# Start backend development server
backend-dev:
	go run .

# Update help target
help:
	@echo "Available targets:"
	@echo "  build        - Build the Go backend"
	@echo "  run          - Run the application locally"
	@echo "  test         - Run tests"
	@echo "  clean        - Clean build artifacts"
	@echo "  cert         - Generate SSL certificates"
	@echo "  dev-up       - Start development environment with Docker"
	@echo "  dev-down     - Stop development environment"
	@echo "  docker-build - Build Docker image"
	@echo "  docker-push  - Push to Docker Hub"
	@echo "  aws-push     - Push to AWS ECR"
	@echo "  prod-up      - Start production environment"
	@echo "  prod-down    - Stop production environment"
	@echo "  setup-dev    - Setup development environment"
	@echo "  frontend-dev - Start frontend development server"
	@echo "  backend-dev  - Start backend development server"