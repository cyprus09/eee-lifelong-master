FROM golang:1.18 as builder

WORKDIR /app
COPY . .

# Navigate to server directory and build
WORKDIR /app/server
RUN go mod download
RUN go build -tags netgo -ldflags '-s -w' -o app ./cmd

FROM debian:bullseye-slim
WORKDIR /app

# Install CA certificates
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy the binary from the builder stage
COPY --from=builder /app/server/app /app/app

# Run the application
CMD ["/app/app"]