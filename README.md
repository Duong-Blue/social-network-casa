# Casa Social Network

Casa is a robust, full-stack microservice-based social media platform. It supports scalable social interactions, real-time messaging, and seamless cross-platform experiences on both Web (Next.js) and Mobile (React Native / Expo).

## 🏗 Architecture Overview

The system is organized as a monorepo consisting of 4 primary components:

### Frontend
1. **fe-web-app (Web Application)**
   - **Tech Stack:** Next.js (App Router), React, Redux Toolkit, TailwindCSS, Socket.io-client.
   - **Features:** Responsive social feed, real-time messaging, story viewing, friend recommendations, search, and user profile management. Matches feature-parity with the mobile app.

2. **fe-mobile-app (Mobile Application)**
   - **Tech Stack:** React Native, Expo, NativeWind, Redux Toolkit, React Navigation.
   - **Features:** High-performance mobile social networking interface. File-based routing via Expo Router.

### Backend Services
3. **social-core-service (Core API)**
   - **Tech Stack:** Java, Spring Boot, Spring Security, Hibernate, MySQL, Redis.
   - **Responsibility:** Handles core social features including authentication, user profiles, posts, comments, stories, and social graphs (following/followers).

4. **communication-service (Real-time & Chat API)**
   - **Tech Stack:** Node.js, NestJS, Socket.io, MongoDB.
   - **Responsibility:** Manages all real-time events, direct messages, group chats, typing indicators, and live notifications.

5. **api-gateway**
   - **Responsibility:** API Gateway/Nginx configuration orchestrating traffic to the core and communication services.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Java 17+ (for Spring Boot)
- MySQL (Core Service DB)
- MongoDB (Communication Service DB)
- Redis (for Caching in Core Service)
- MinIO (for Object Storage)
- Expo CLI (for Mobile App)
- Docker & Docker Compose (Optional but recommended for databases and gateway)

### 0. Environment Setup (.env)

Before running the applications, you need to configure the environment variables.

Copy the `.env.example` file to `.env` in the following directories and update the values according to your local setup:

*   `frontend/fe-mobile-app/.env.example` -> `frontend/fe-mobile-app/.env`
*   `services/api-gateway/.env.example` -> `services/api-gateway/.env`
*   `services/communication-service/.env.example` -> `services/communication-service/.env`

*(Note: The core service uses `application.yml` instead of `.env` directly, but utilizes environment variables from the OS or Docker if provided).*

### 1. Running the Infrastructure (Recommended)
If you have Docker installed, you can start the necessary databases and gateway via docker-compose from the `services/api-gateway` folder (assuming docker-compose.yml exists there).

### 2. Running the Backend Services

**Core Service (Java/Spring Boot)**
```bash
cd services/social-core-service
# The application uses application.yml for configuration
./mvnw spring-boot:run
```

**Communication Service (Node/NestJS)**
```bash
cd services/communication-service
npm install
npm run start:dev
```

### 3. Running the Frontend Applications

**Web Application (Next.js)**
```bash
cd frontend/fe-web-app
npm install
npm run dev
# The web app runs on http://localhost:3002 (or as configured)
```

**Mobile Application (Expo)**
```bash
cd frontend/fe-mobile-app
npm install
npx expo start
# Use Expo Go on your mobile device or run on a simulator
```

---

## 🛠 Conventions & Best Practices
- **Redux State Parity:** Both Web and Mobile frontends share identical Redux state architectures (`interaction`, `chat`, `story`, `account`, `notification`).
- **Atomic Operations:** Slices interact seamlessly with unified Axios instances mapping interceptors and token behaviors consistently across devices.
- **Microservice Boundaries:** The Java Core handles relations and SQL data, while NestJS handles NoSQL chat histories and raw WebSocket connections.

---
*© 2026 Casa.*