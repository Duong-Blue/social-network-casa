# Casa API Gateway & Infrastructure

This module handles reverse proxy routing, load balancing (via Nginx), and orchestrates the backend infrastructure dependencies via Docker Compose.

## Tech Stack
- **Reverse Proxy**: Nginx
- **Container Orchestration**: Docker Compose

## Infrastructure Components
The `docker-compose.yml` file here spins up the required databases and object storage for the entire system:
1. **MySQL**: Core database for `social-core-service`.
2. **MongoDB**: NoSQL database for `communication-service`.
3. **Redis**: Caching layer.
4. **MinIO**: S3-compatible object storage for media (images, videos).
5. **Nginx**: The entry point API Gateway routing traffic to the Spring Boot and NestJS services.

## Nginx Routing
Nginx is configured to route traffic based on URL prefixes to ensure frontend apps only need to communicate with a single port (e.g., 8080).
- `/api/v1/*` ➔ routes to `social-core-service`
- `/chat/*` ➔ routes to `communication-service` (REST API)
- `/socket.io/*` ➔ routes to `communication-service` (WebSocket Upgrade)

## Getting Started

### Prerequisites
- Docker
- Docker Compose

### Setup Environment
1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
2. Update the `.env` file with secure passwords for the infrastructure:
   ```env
   MYSQL_ROOT_PASSWORD=your_password
   MONGO_ROOT_PASSWORD=your_password
   MINIO_ROOT_PASSWORD=your_password
   ```

### Run Infrastructure
To start the databases, Redis, MinIO, and Nginx Gateway:
```bash
docker-compose up -d
```

*(Note: Depending on your docker-compose setup, you may need to ensure your backend application services are also running and accessible by Nginx).*
