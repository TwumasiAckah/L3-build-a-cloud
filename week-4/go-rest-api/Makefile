.PHONY: build run test test-coverage clean fmt lint deps docker-build docker-run install-tools swagger dev push deploy release

# Variables
APP_NAME=postgres-api
VERSION ?= latest
DOCKER_IMAGE=registry.onstackit.cloud/l3-cloud-psql/$(APP_NAME):$(VERSION)
PORT=8000
KUBECTL=kubectl
KUBE_NAMESPACE=default

# Build the application locally
build:
	CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o bin/$(APP_NAME) ./cmd/server

# Run the application locally
run:
	go run ./cmd/server

# Run tests
test:
	go test -v ./internal/api/handlers

# Run tests with coverage
test-coverage:
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out

# Clean build artifacts
clean:
	rm -rf bin/
	rm -f coverage.out

# Format code
fmt:
	go fmt ./...

# Lint code
lint:
	golangci-lint run

# Download dependencies
deps:
	go mod download
	go mod tidy

# Build Docker image
docker-build:
	podman build -t $(DOCKER_IMAGE) .

# Push Docker image to registry
docker-push:
	podman push $(DOCKER_IMAGE)

# Run Docker container locally
docker-run:
	podman run -p $(PORT):$(PORT) \
		-e KUBECONFIG=/kubeconfig \
		-v $$HOME/.kube/config:/kubeconfig \
		$(DOCKER_IMAGE)

# Install development toolsd
install-tools:
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	go install github.com/swaggo/swag/cmd/swag@latest
	go install github.com/cosmtrek/air@latest

# Generate Swagger documentation
swagger:
	swag init -g cmd/server/main.go

# Run with hot reload
dev:
	air

# Deploy to Kubernetes
deploy:
	$(KUBECTL) apply -n $(KUBE_NAMESPACE) -f deploy/deployment.yaml
	$(KUBECTL) apply -n $(KUBE_NAMESPACE) -f deploy/service.yaml

# Full release workflow: build → test → docker → push → deploy
release: build test docker-build docker-push deploy
	@echo "Release complete!"
