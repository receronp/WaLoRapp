# WaLoRapp

A modern React Native chat application that enables communication through Bluetooth Low Energy (BLE) and LoRa networks. Perfect for off-grid messaging, emergency communications, and IoT device interactions.

![WaLoRapp Logo](./assets/images/logo.png)

## Features

### Chat & Messaging

- Real-time messaging via BLE/LoRa protocols
- Message persistence with local storage
- Swipe-to-reply functionality
- System message notifications
- Auto-configuration for device endpoints

### File Sharing

- Share files up to 5MB via LoRa transmission
- Base64 encoding for reliable transfer
- Support for multiple file formats (PDF, images, documents, audio, video)
- File validation and size checking
- Auto-save received files to device storage

### Location Sharing

- Share GPS coordinates with high accuracy
- Interactive map integration
- Location permission management
- Efficient coordinate transmission via LoRa

### Connectivity

- Bluetooth Low Energy (BLE) device discovery and connection
- LoRa network integration for long-range communication
- Automatic device configuration
- Connection state management
- Background operation support

### User Experience

- Intuitive WhatsApp-style interface
- Dark/Light mode support
- Responsive design for all screen sizes
- Accessibility features (ARIA labels, screen reader support)
- Haptic feedback and smooth animations

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm, yarn, or pnpm
- Expo CLI
- iOS Simulator / Android Emulator or physical device
- BLE-capable device for testing

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/receronp/WaLoRapp.git
   cd WaLoRapp
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   # or
   npm install
   # or
   yarn install
   ```

3. **Start the development server**

   ```bash
   pnpm start
   # or
   npm start
   # or
   yarn start
   ```

4. **Run on your platform**

   ```bash
   # iOS
   pnpm ios

   # Android
   pnpm android

   # Web (limited BLE support)
   pnpm web
   ```

## Requirements

### System Requirements

- **iOS**: 13.0 or higher
- **Android**: API level 21 (Android 5.0) or higher
- **BLE Support**: Required for device connectivity

### Permissions

The app requires the following permissions:

- **Location**: For GPS coordinate sharing
- **Bluetooth**: For BLE device connectivity
- **Camera**: For photo sharing (optional)
- **File System**: For file sharing and storage
- **Photo Library**: For image selection (optional)

## Architecture

### Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React Context API + Local State
- **Storage**: AsyncStorage + Expo SecureStore + SQLite
- **UI Library**: React Native + Expo Vector Icons
- **Chat Interface**: React Native Gifted Chat
- **BLE**: react-native-ble-plx
- **Maps**: react-native-maps

### Project Structure

```
WaLoRapp/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab-based navigation
│   │   ├── chats/         # Chat screens
│   │   └── index.tsx      # Main chat list
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
│   ├── ChatMessageBox.tsx # Message bubble component
│   ├── FileMessage.tsx    # File sharing component
│   ├── LocationMessage.tsx# Location sharing component
│   └── ...               # Other UI components
├── util/                  # Utilities and contexts
│   ├── contextBLE.tsx     # BLE connectivity context
│   ├── contextChat.tsx    # Chat data management
│   └── useBLE.ts         # BLE hooks and utilities
├── constants/            # App constants and themes
├── assets/              # Images and static assets
└── ...                 # Config files
```

### Key Components

#### BLE Context (contextBLE.tsx)

- Device discovery and connection management
- File transfer via BLE characteristics
- LoRa message handling and processing
- Auto-configuration for device endpoints

#### Chat Context (contextChat.tsx)

- Message persistence and retrieval
- Chat session management
- Local storage integration

#### Chat Interface ([id].tsx)

- Real-time messaging UI
- File picker integration
- Location sharing interface
- Message rendering and interaction

#### File Message Component (FileMessage.tsx)

- File preview and validation
- Auto-save functionality
- File sharing integration
- Multiple format support

## Configuration

### BLE Configuration

The app automatically configures BLE connections based on device MAC addresses. Chat IDs follow the format: `{deviceName}_{macAddress}`

### LoRa Integration

LoRa message formatting is handled automatically with support for:

- Text messages
- File transfers (chunked for large files)
- Location coordinates
- System notifications

### Environment Variables

Create a `.env` file in the root directory:

```env
# Optional: Custom BLE service UUIDs
BLE_SERVICE_UUID=your-service-uuid
BLE_CHARACTERISTIC_UUID=your-characteristic-uuid

# Optional: App configuration
MAX_FILE_SIZE=5242880  # 5MB default
```

## API Reference

### BLE Context Methods

```typescript
// Connect to a BLE device
connectToDevice(device: Device): Promise<void>

// Write text message to device
writeToDevice(device: Device, message: string): Promise<void>

// Write file to device
writeFileToDevice(device: Device, filename: string, base64Data: string): Promise<void>

// Configure device endpoint
configureEndpoint(device: Device, name: string, macAddress: string): Promise<void>
```

### Chat Context Methods

```typescript
// Get messages for a chat
getChatMessages(chatId: string): Promise<IMessage[]>

// Save messages for a chat
saveChatMessages(chatId: string, messages: IMessage[]): Promise<void>
```

## Testing

### Running Tests

```bash
pnpm test
# or
npm test
```

### Testing BLE Functionality

1. Ensure you have a BLE-capable device or simulator
2. Use a BLE scanner app to verify device discovery
3. Test file transfers with various file sizes and formats
4. Validate location sharing accuracy

## Building for Production

### iOS

```bash
expo build:ios
```

### Android

```bash
expo build:android
```

### Using EAS Build

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure build
eas build:configure

# Build for all platforms
eas build --platform all
```

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Follow the existing code style

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Links

- **Repository**: [GitHub](https://github.com/receronp/WaLoRapp)
- **Issues**: [Bug Reports & Feature Requests](https://github.com/receronp/WaLoRapp/issues)
- **Expo**: [Project Page](https://expo.dev/@receronp/WaLoRapp)

## Support

- Email: [your-email@example.com](mailto:your-email@example.com)
- Issues: [GitHub Issues](https://github.com/receronp/WaLoRapp/issues)
- Discussions: [GitHub Discussions](https://github.com/receronp/WaLoRapp/discussions)

## Acknowledgments

- React Native community for excellent tooling and libraries
- Expo team for the amazing development platform
- Contributors and beta testers
- Open source community for inspiration and support

---

**Built with React Native and Expo**

_Perfect for off-grid communication, IoT projects, and emergency messaging scenarios._
