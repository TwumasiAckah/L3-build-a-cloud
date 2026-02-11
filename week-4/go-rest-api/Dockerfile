# Use the official Go image as builder
FROM --platform=linux/amd64 golang:1.25-alpine AS builder

# Install git, build dependencies
RUN apk add --no-cache git

# Set working directory inside container
WORKDIR /app

# Copy go.mod and go.sum first, for caching
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the source code
COPY . .

# Build the binary for Linux, statically linked
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o server ./cmd/server

# Use a small image for final artifact
FROM --platform=linux/amd64 alpine:latest

# Add CA certificates
RUN apk add --no-cache ca-certificates

WORKDIR /root/

# Copy the binary from builder
COPY --from=builder /app/server .

# Create a non-root user and switch to it
RUN addgroup -S postgres-app && adduser -S postgres-app -G postgres-app
USER postgres-app

# Expose the port your API runs on
EXPOSE 8000

# Command to run
CMD ["./server"]
