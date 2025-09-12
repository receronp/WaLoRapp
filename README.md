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
- BLE connection status display across all chat screens
- Improved navigation with consistent back arrow behavior

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
- Improved BLE connection modal with connect/disconnect functionality
- Enhanced navigation with info section subpages (Related Projects, Software & Firmware)
- Connection status alerts when attempting to create chats without BLE connection
- Consistent navigation patterns across the app
- Responsive design for all screen sizes
- Clean, modern UI with improved button styling and borders

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

## Recent Updates

### Version 1.0.0 - Latest Improvements

**Navigation & UX Enhancements:**
- Migrated "Related Projects" and "Software & Firmware" from modals to dedicated info subpages
- Implemented consistent navigation patterns with standard back arrow behavior
- Enhanced BLE connection modal with connect/disconnect states and improved styling
- Added persistent connection status display across all chat screens
- Improved new chat creation flow with BLE connection validation

**UI/UX Improvements:**
- Added borders and enhanced styling for BLE connection buttons
- Implemented connection status indicators in chat headers
- Enhanced navigation layout with proper back arrow placement
- Improved modal and page transitions for better user experience
- Added alert notifications for BLE connection requirements

**Technical Improvements:**
- Cleaned up unused dependencies for better performance
- Optimized package.json and removed redundant modules
- Enhanced navigation stack management
- Improved connection state management across components

## Architecture

### Tech Stack

- **Framework**: React Native 0.79.5 with Expo SDK 53
- **Language**: TypeScript 5.8
- **Navigation**: Expo Router 5.1 (file-based routing)
- **State Management**: React Context API + Local State
- **Storage**: AsyncStorage + Expo SecureStore
- **UI Library**: React Native + Expo Vector Icons 14.1
- **Chat Interface**: React Native Gifted Chat 2.6
- **BLE**: react-native-ble-plx 3.5
- **File Handling**: Expo Document Picker, File System, Sharing
- **Location**: Expo Location 18.1
- **Animations**: React Native Reanimated 3.17

### Project Structure

```
WaLoRapp/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab-based navigation
│   │   ├── chats/         # Chat screens with improved navigation
│   │   │   ├── index.tsx  # Chat list with BLE status
│   │   │   ├── [id].tsx   # Individual chat screen
│   │   │   └── _layout.tsx# Chat navigation layout
│   │   └── info/          # Information section
│   │       ├── index.tsx  # Info main page
│   │       ├── related-projects.tsx # SMARTLAGOON projects
│   │       └── software-firmware.tsx # Technical details
│   ├── (modals)/          # Modal screens
│   │   ├── ble-connection.tsx # Enhanced BLE connection modal
│   │   └── new-chat.tsx   # New chat creation
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
├── util/                  # Utilities and contexts
│   ├── contextBLE.tsx     # Enhanced BLE connectivity context
│   ├── contextChat.tsx    # Chat data management
│   └── useBLE.ts         # BLE hooks and utilities
├── constants/            # App constants and themes
├── assets/              # Images and static assets
└── ...                 # Config files
```

### Key Components

#### BLE Context (contextBLE.tsx)

- Device discovery and connection management
- Enhanced connection status tracking and display
- Connect/disconnect functionality with user feedback
- File transfer via BLE characteristics
- LoRa message handling and processing
- Auto-configuration for device endpoints
- Connection state management across app navigation

#### Chat Context (contextChat.tsx)

- Message persistence and retrieval
- Chat session management
- Local storage integration

#### Chat Interface ([id].tsx)

- Real-time messaging UI with enhanced navigation
- Persistent BLE connection status display
- Proper back navigation to chat index
- File picker integration
- Location sharing interface
- Message rendering and interaction

#### File Message Component (FileMessage.tsx)

- File preview and validation
- Auto-save functionality
- File sharing integration
- Multiple format support

#### Info Section Components

- **Related Projects Page**: Detailed information about SMARTLAGOON initiative projects (SMLG_AlLoRa, BODOQUE)
- **Software & Firmware Page**: Comprehensive technical documentation including React Native app details, MicroPython firmware specs, and hardware requirements
- Enhanced navigation structure with dedicated subpages

## Configuration

### BLE Configuration

The app automatically configures BLE connections based on device MAC addresses. Chat IDs follow the format: `{deviceName}_{macAddress}`

**Recent Improvements:**
- Enhanced BLE connection modal with visual feedback
- Connection status persistently displayed across chat screens
- Automatic connection alerts when creating new chats
- Improved disconnect functionality with user confirmation

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
