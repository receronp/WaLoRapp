import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";

const SoftwareFirmwarePage = () => {
  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error("Failed to open link:", error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Software & Firmware</Text>
          <Text style={styles.subtitle}>Technical Implementation</Text>
          <Text style={styles.description}>
            Complete technical stack and implementation details for the WaLoRapp
            project, including mobile application, firmware, and hardware requirements.
          </Text>
        </View>

        {/* Mobile Application */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="phone-portrait" size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>React Native Application</Text>
          </View>

          <Text style={styles.description}>
            The WaLoRapp mobile application is built using modern React Native
            technologies, providing cross-platform compatibility for both iOS
            and Android devices.
          </Text>

          <View style={styles.techStack}>
            <Text style={styles.stackTitle}>Technology Stack:</Text>
            <View style={styles.stackGroup}>
              <Text style={styles.stackCategory}>Frontend Framework:</Text>
              <Text style={styles.stackItem}>• React Native 0.74+</Text>
              <Text style={styles.stackItem}>• Expo SDK 51+</Text>
              <Text style={styles.stackItem}>• TypeScript 5.3+</Text>
            </View>
            <View style={styles.stackGroup}>
              <Text style={styles.stackCategory}>Communication:</Text>
              <Text style={styles.stackItem}>• react-native-ble-plx (Bluetooth Low Energy)</Text>
              <Text style={styles.stackItem}>• Custom chunked protocol implementation</Text>
              <Text style={styles.stackItem}>• Base64 encoding for data transmission</Text>
            </View>
            <View style={styles.stackGroup}>
              <Text style={styles.stackCategory}>UI & Navigation:</Text>
              <Text style={styles.stackItem}>• Expo Router (File-based routing)</Text>
              <Text style={styles.stackItem}>• React Native Gifted Chat</Text>
              <Text style={styles.stackItem}>• Expo Vector Icons</Text>
              <Text style={styles.stackItem}>• Custom component library</Text>
            </View>
            <View style={styles.stackGroup}>
              <Text style={styles.stackCategory}>File & Location Services:</Text>
              <Text style={styles.stackItem}>• Expo Document Picker</Text>
              <Text style={styles.stackItem}>• Expo File System</Text>
              <Text style={styles.stackItem}>• Expo Location Services</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => openLink("https://github.com/receronp/WaLoRapp")}
          >
            <View style={styles.linkContent}>
              <Ionicons name="logo-github" size={20} color="white" />
              <Text style={styles.linkButtonText}>View Source Code</Text>
              <Ionicons name="open-outline" size={16} color="white" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Custom Firmware */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="hardware-chip" size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>MicroPython Firmware</Text>
          </View>

          <Text style={styles.description}>
            Custom MicroPython firmware specifically adapted and optimized for
            the LILYGO T3S3 hardware platform, enabling LoRa communication and
            Bluetooth Low Energy functionality.
          </Text>

          <View style={styles.firmwareFeatures}>
            <Text style={styles.featureTitle}>Firmware Features:</Text>
            <Text style={styles.featureItem}>🔧 Custom build for LILYGO T3S3</Text>
            <Text style={styles.featureItem}>📡 Native LoRa communication support</Text>
            <Text style={styles.featureItem}>🔵 Bluetooth Low Energy (BLE) integration</Text>
            <Text style={styles.featureItem}>⚡ Power management optimizations</Text>
            <Text style={styles.featureItem}>🔄 Chunked message protocol handling</Text>
            <Text style={styles.featureItem}>📦 File transfer capabilities</Text>
            <Text style={styles.featureItem}>🎯 GPS location services</Text>
          </View>

          <View style={styles.firmwareSpecs}>
            <Text style={styles.specsTitle}>Technical Specifications:</Text>
            <Text style={styles.specItem}>• MicroPython v1.23+</Text>
            <Text style={styles.specItem}>• ESP32-S3 dual-core processor support</Text>
            <Text style={styles.specItem}>• SX1262/SX1276 LoRa transceiver driver</Text>
            <Text style={styles.specItem}>• ESP32 BLE stack integration</Text>
            <Text style={styles.specItem}>• Custom aioble library implementation</Text>
            <Text style={styles.specItem}>• Asyncio-based concurrent processing</Text>
          </View>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() =>
              openLink("https://github.com/receronp/micropython/tree/lilygo-t3s3")
            }
          >
            <View style={styles.linkContent}>
              <Ionicons name="logo-github" size={20} color="white" />
              <Text style={styles.linkButtonText}>View Firmware Code</Text>
              <Ionicons name="open-outline" size={16} color="white" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Hardware Requirements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="build" size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Hardware Requirements</Text>
          </View>

          <View style={styles.hardwareSection}>
            <Text style={styles.hardwareTitle}>Primary Device:</Text>
            <View style={styles.hardwareItem}>
              <Text style={styles.hardwareName}>LILYGO T3S3 LoRa Module</Text>
              <Text style={styles.hardwareSpec}>• ESP32-S3 dual-core processor (240MHz)</Text>
              <Text style={styles.hardwareSpec}>• 8MB PSRAM, 16MB Flash memory</Text>
              <Text style={styles.hardwareSpec}>• SX1262 LoRa transceiver (433/868/915MHz)</Text>
              <Text style={styles.hardwareSpec}>• Integrated BLE 5.0 support</Text>
              <Text style={styles.hardwareSpec}>• Built-in GPS module</Text>
              <Text style={styles.hardwareSpec}>• 1.9" TFT LCD display (170x320)</Text>
              <Text style={styles.hardwareSpec}>• USB-C connectivity</Text>
            </View>

            <Text style={styles.hardwareTitle}>Mobile Device Requirements:</Text>
            <View style={styles.hardwareItem}>
              <Text style={styles.hardwareName}>iOS Device:</Text>
              <Text style={styles.hardwareSpec}>• iOS 13.0 or later</Text>
              <Text style={styles.hardwareSpec}>• Bluetooth 4.0+ (BLE support)</Text>
              <Text style={styles.hardwareSpec}>• 2GB RAM minimum</Text>
            </View>

            <View style={styles.hardwareItem}>
              <Text style={styles.hardwareName}>Android Device:</Text>
              <Text style={styles.hardwareSpec}>• Android 6.0 (API 23) or later</Text>
              <Text style={styles.hardwareSpec}>• Bluetooth 4.0+ (BLE support)</Text>
              <Text style={styles.hardwareSpec}>• 3GB RAM minimum</Text>
              <Text style={styles.hardwareSpec}>• Location services enabled</Text>
            </View>
          </View>
        </View>

        {/* Development Setup */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="code-working" size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Development Setup</Text>
          </View>

          <View style={styles.setupSection}>
            <Text style={styles.setupTitle}>Mobile App Development:</Text>
            <Text style={styles.setupItem}>1. Node.js 18+ and npm/yarn/pnpm</Text>
            <Text style={styles.setupItem}>2. Expo CLI: <Text style={styles.code}>npm install -g @expo/cli</Text></Text>
            <Text style={styles.setupItem}>3. Clone repository and install dependencies</Text>
            <Text style={styles.setupItem}>4. Run: <Text style={styles.code}>pnpm install && pnpm start</Text></Text>
            <Text style={styles.setupItem}>5. Use Expo Go app or development build</Text>
          </View>

          <View style={styles.setupSection}>
            <Text style={styles.setupTitle}>Firmware Development:</Text>
            <Text style={styles.setupItem}>1. ESP-IDF v5.0+ toolchain</Text>
            <Text style={styles.setupItem}>2. MicroPython build environment</Text>
            <Text style={styles.setupItem}>3. LILYGO T3S3 board definitions</Text>
            <Text style={styles.setupItem}>4. USB-C cable for flashing</Text>
            <Text style={styles.setupItem}>5. esptool for firmware deployment</Text>
          </View>

          <View style={styles.setupSection}>
            <Text style={styles.setupTitle}>Required Permissions:</Text>
            <Text style={styles.setupItem}>📍 Location Services (GPS coordinates)</Text>
            <Text style={styles.setupItem}>🔵 Bluetooth Access (BLE communication)</Text>
            <Text style={styles.setupItem}>📁 File System Access (document sharing)</Text>
            <Text style={styles.setupItem}>📷 Camera Access (optional, for QR scanning)</Text>
          </View>
        </View>

        {/* Communication Protocol */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="swap-horizontal" size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Communication Protocol</Text>
          </View>

          <Text style={styles.description}>
            Custom chunked message protocol designed for reliable data
            transmission over BLE with automatic error handling and recovery.
          </Text>

          <View style={styles.protocolFeatures}>
            <Text style={styles.protocolTitle}>Protocol Features:</Text>
            <Text style={styles.protocolItem}>🔄 Automatic chunking for large messages</Text>
            <Text style={styles.protocolItem}>✅ Message integrity verification</Text>
            <Text style={styles.protocolItem}>🔄 Automatic retry mechanisms</Text>
            <Text style={styles.protocolItem}>📦 Binary file transfer support</Text>
            <Text style={styles.protocolItem}>🎯 Location coordinate sharing</Text>
            <Text style={styles.protocolItem}>⚙️ Device configuration management</Text>
            <Text style={styles.protocolItem}>📊 Real-time transfer progress</Text>
          </View>

          <View style={styles.protocolSpecs}>
            <Text style={styles.protocolSpecTitle}>Message Format:</Text>
            <View style={styles.codeBlock}>
              <Text style={styles.codeText}>START: S:&lt;id&gt;:&lt;chunks&gt;:&lt;type&gt;</Text>
              <Text style={styles.codeText}>CHUNK: C:&lt;id&gt;:&lt;index&gt;:&lt;data&gt;</Text>
              <Text style={styles.codeText}>END: E:&lt;id&gt;:&lt;total&gt;</Text>
            </View>
          </View>
        </View>

        {/* Performance & Optimization */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="speedometer" size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Performance & Optimization</Text>
          </View>

          <View style={styles.performanceMetrics}>
            <Text style={styles.metricTitle}>Key Performance Metrics:</Text>
            <Text style={styles.metricItem}>📡 LoRa Range: Up to 15km (line of sight)</Text>
            <Text style={styles.metricItem}>⚡ BLE Throughput: Up to 20KB/s (MTU)</Text>
            <Text style={styles.metricItem}>📊 File Transfer: 5MB max file size</Text>
            <Text style={styles.metricItem}>🎯 GPS Accuracy: ±3 meters (typical)</Text>
            <Text style={styles.metricItem}>⏱️ Connection Time: &lt;5 seconds</Text>
          </View>

          <View style={styles.optimizationFeatures}>
            <Text style={styles.optimizationTitle}>Optimization Features:</Text>
            <Text style={styles.optimizationItem}>• Dynamic MTU negotiation for throughput</Text>
            <Text style={styles.optimizationItem}>• Efficient memory management</Text>
            <Text style={styles.optimizationItem}>• Background processing non-blocking UI</Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#fff",
    marginVertical: 8,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.gray,
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
    textAlign: "center",
  },
  section: {
    backgroundColor: "#fff",
    marginVertical: 8,
    borderRadius: 12,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.primary,
    marginLeft: 12,
  },
  techStack: {
    marginTop: 16,
  },
  stackTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  stackGroup: {
    marginBottom: 12,
  },
  stackCategory: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: 4,
  },
  stackItem: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginVertical: 1,
  },
  linkButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  linkContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  linkButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 8,
  },
  firmwareFeatures: {
    marginTop: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  featureItem: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
    marginVertical: 2,
  },
  firmwareSpecs: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  specsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: 8,
  },
  specItem: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginVertical: 2,
  },
  hardwareSection: {
    marginTop: 12,
  },
  hardwareTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  hardwareItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  hardwareName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: 6,
  },
  hardwareSpec: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginVertical: 1,
  },
  setupSection: {
    marginTop: 16,
  },
  setupTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: 8,
  },
  setupItem: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
    marginVertical: 2,
  },
  code: {
    fontFamily: "monospace",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
  },
  protocolFeatures: {
    marginTop: 16,
  },
  protocolTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  protocolItem: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
    marginVertical: 2,
  },
  protocolSpecs: {
    marginTop: 16,
  },
  protocolSpecTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: 8,
  },
  codeBlock: {
    backgroundColor: "#2d3748",
    padding: 12,
    borderRadius: 8,
  },
  codeText: {
    fontFamily: "monospace",
    color: "#e2e8f0",
    fontSize: 12,
    lineHeight: 18,
  },
  performanceMetrics: {
    marginTop: 12,
  },
  metricTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  metricItem: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
    marginVertical: 2,
  },
  optimizationFeatures: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  optimizationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: 8,
  },
  optimizationItem: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginVertical: 2,
  },
});

export default SoftwareFirmwarePage;