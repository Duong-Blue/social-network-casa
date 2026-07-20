# Casa Mobile Application (React Native / Expo)

This is the mobile frontend for the Casa Social Network, built with React Native and Expo Router.

## Tech Stack
- **Framework**: React Native + Expo (File-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: Redux Toolkit
- **Navigation**: Expo Router (React Navigation)
- **Real-time**: Socket.io-client

## Project Structure
- `app/`: Expo Router file-based routing and screens.
- `screens/`: UI Components grouped by feature domain.
- `features/`: Redux slices, thunks, and services for state management.
- `components/`: Reusable global UI components.
- `assets/`: Images, icons, and static assets.
- `utils/`: Helper functions, constants, and network configs.

## Getting Started

### Prerequisites
- Node.js (v18+)
- Expo CLI (`npm i -g expo-cli`)
- A physical device with Expo Go OR an iOS/Android Simulator.

### Setup Environment
1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
2. Update the `.env` file with your local IP address (Do not use `localhost` if running on a physical device):
   ```env
   EXPO_PUBLIC_GATEWAY_URL=http://<YOUR_IP>:8080
   EXPO_PUBLIC_API_URL=http://<YOUR_IP>:8080/api/v1
   EXPO_PUBLIC_NODE_API_URL=http://<YOUR_IP>:8080/chat
   EXPO_PUBLIC_NODE_SOCKET_URL=http://<YOUR_IP>:8080
   ```

### Run the App
```bash
npm install
npx expo start
```
Scan the QR code with your camera (iOS) or the Expo Go app (Android).

## Development Guidelines
- Always use `NativeWind` for styling. Avoid writing custom `StyleSheet.create` unless absolutely necessary.
- Ensure Redux state slices maintain parity with the Web App (if applicable).
