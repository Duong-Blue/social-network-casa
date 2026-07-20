# Casa Social Network

Casa is a robust, full-stack microservice-based social media platform. It supports scalable social interactions, real-time messaging, and seamless cross-platform experiences on Mobile (React Native / Expo).

*(Note: This repository adopts a monorepo structure separating frontend clients and microservices).*

## 🌟 Demo & Screenshots
<p align="center"><img src="https://github.com/user-attachments/assets/cba64895-5ad5-476f-ba71-40d6b847e649" alt="Picture1" width="268"></p>


## 🏗 Architecture & Modules

To keep things organized, each major component of the system has its own dedicated documentation. Please refer to the corresponding READMEs for setup instructions, environment variables, and architecture details:

### 📱 Frontend Application
* **[Casa Mobile App (React Native/Expo)](./frontend/fe-mobile-app/README.md)**
  * *Tech:* React Native, Expo, NativeWind, Redux Toolkit, Socket.io-client.
  * *Features:* Real-time chat, social feeds, story viewing, etc.

### ⚙️ Backend Microservices
* **[Social Core Service (Spring Boot)](./services/social-core-service/README.md)**
  * *Tech:* Java 17, Spring Boot, MySQL, Hibernate, Spring Security (JWT), Redis.
  * *Features:* Core social graph (Follow/Unfollow), posts, interactions, user profiles.

* **[Communication Service (NestJS)](./services/communication-service/README.md)**
  * *Tech:* Node.js, NestJS, Socket.io, MongoDB.
  * *Features:* WebSockets, 1-1 direct messages, group chats, live notifications.

### 🌉 Infrastructure & Gateway
* **[API Gateway & Docker Compose](./services/api-gateway/README.md)**
  * *Tech:* Nginx, Docker, Docker Compose.
  * *Features:* Centralized reverse proxy routing `/api` and `/chat` to their respective microservices, and spinning up required databases (MySQL, MongoDB, Redis, MinIO).

---

## 🚀 Quick Start Guide

### 1. Configure Environments
Copy the `.env.example` to `.env` in the following folders and fill in your credentials/IPs:
1. `services/api-gateway/.env`
2. `services/communication-service/.env`
3. `frontend/fe-mobile-app/.env`

### 2. Start Infrastructure
Start MySQL, MongoDB, Redis, MinIO, and Nginx Gateway via Docker:
```bash
cd services/api-gateway
docker-compose up -d
```

### 3. Start Backend Services
* **Core Service:** Navigate to `services/social-core-service` and run `./mvnw spring-boot:run`
* **Chat Service:** Navigate to `services/communication-service`, run `npm install` then `npm run start:dev`

### 4. Start Mobile App
* Navigate to `frontend/fe-mobile-app`
* Run `npm install` then `npx expo start`

---
*© 2026 Casa. Designed and developed for scalable social networking.*
