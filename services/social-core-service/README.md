# Casa Social Core Service (Spring Boot)

This is the central backend API for the Casa Social Network, handling relational data, user management, and core social logic.

## Tech Stack
- **Framework**: Java 17 / Spring Boot 3
- **Security**: Spring Security + JWT
- **ORM**: Hibernate / Spring Data JPA
- **Database**: MySQL
- **Caching**: Redis
- **Storage**: MinIO (S3 Compatible Object Storage)

## Core Responsibilities
- User Authentication & Authorization.
- User Profile management.
- Post, Comment, and Story CRUD operations.
- Social Graph (Followers, Following).
- Like and Share interactions.
- MinIO integration for media uploads (Images/Videos).

## Project Structure
Standard Spring Boot Layered Architecture:
- `controllers/`: REST API endpoints.
- `services/`: Business logic.
- `repositories/`: Database access (Spring Data JPA).
- `models/`: JPA Entities mapping to MySQL tables.
- `dto/`: Data Transfer Objects (Requests/Responses).
- `configs/` & `securities/`: Application and security configurations.

## Getting Started

### Prerequisites
- Java 17+
- Maven
- MySQL Server (running)
- Redis Server (running)
- MinIO Server (running)

### Setup Environment
The application is configured via `src/main/resources/application.yml`. You can override properties using Environment Variables:

- `DBMS_CONNECTION` (default: jdbc:mysql://localhost:3306/appcasa)
- `DBMS_USERNAME` (default: root)
- `DBMS_PASSWORD` (default: Duong2k4)
- `SPRING_DATA_REDIS_HOST` (default: localhost)
- `MINIO_ENDPOINT` (default: http://localhost:9000)

*(Note: It is highly recommended to run this service alongside the API Gateway and Docker Compose setup for ease of database configuration).*

### Run the App
```bash
./mvnw spring-boot:run
```
The service defaults to running on port 8080 (or as configured in application properties).

## Development Guidelines
- Always return wrapped responses using the unified `ApiResponse` envelope.
- Do not expose JPA Entities directly to controllers; use DTOs.
- Respect microservice boundaries: Chat and real-time logic belong in the `communication-service`.
