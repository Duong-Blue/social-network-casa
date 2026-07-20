# Casa Communication Service (NestJS)

This service manages all real-time communication, chat features, and live notifications for the Casa Social Network.

## Tech Stack
- **Framework**: Node.js / NestJS
- **Real-time**: Socket.io
- **Database**: MongoDB (Mongoose)

## Core Responsibilities
- Real-time bi-directional events via WebSockets.
- 1-to-1 Direct Messaging.
- Group Chats management.
- Live system notifications.
- Online/Offline status and typing indicators.

## Project Structure
Modular NestJS Architecture:
- `src/socket/`: WebSocket Gateway configurations and event handlers.
- `src/messages/`: Message history, sending, and retrieval logic.
- `src/conversations/`: Managing 1-1 chat threads.
- `src/groups/`: Group chat management.
- `src/notifications/`: Live notification dispatching.

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Server (running)

### Setup Environment
1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
2. Configure `.env` with your MongoDB URI and MinIO settings (for media in chats):
   ```env
   MONGO_URI=mongodb://admin:123zXc_@localhost:27017/chat-db?authSource=admin
   MINIO_ENDPOINT=localhost
   # ...
   ```

### Run the App
```bash
npm install

# Development mode
npm run start:dev
```
The service usually runs on port 3000 (accessible via Gateway on `/chat` and `/socket.io`).

## Development Guidelines
- Always ensure Socket.io events are cleanly namespaced or handled via the main gateway.
- Avoid placing relational social logic here (e.g., Follows, Post Likes); those belong in the `social-core-service`.
