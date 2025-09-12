import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import Colors from "@/constants/Colors";
import { useBLEContext } from "@/util/contextBLE";
import { useChatContext } from "@/util/contextChat";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const Page = () => {
  const {
    configureEndpoint,
    configStatus,
    connectedDevice,
    clearConfigStatus,
  } = useBLEContext();
  const { addConfiguredChat, getConfiguredChat } = useChatContext();
  const [deviceName, setDeviceName] = useState("");
  const [macAddress, setMacAddress] = useState("");
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [existingConfig, setExistingConfig] = useState<any>(null);

  // Check for existing configuration when modal opens
  useEffect(() => {
    // Clear any previous config status
    clearConfigStatus();

    // Check if this device already has a configuration
    if (connectedDevice?.name) {
      const existing = getConfiguredChat(connectedDevice.name);
      if (existing) {
        setExistingConfig(existing);
        setDeviceName(existing.deviceName);
        setMacAddress(existing.macAddress);
        setIsEditMode(true);
      }
    }
  }, [connectedDevice?.name, clearConfigStatus, getConfiguredChat]);

  // Monitor configuration status - only when actively configuring
  useEffect(() => {
    if (configStatus && isConfiguring) {
      setIsConfiguring(false);

      if (configStatus.startsWith("SUCCESS:")) {
        console.log(configStatus);

        Alert.alert(
          "Success",
          "Endpoint configured successfully! Opening chat...",
          [
            {
              text: "OK",
              onPress: async () => {
                // Add the configured chat to the chat list
                await addConfiguredChat(deviceName.trim(), macAddress.trim());

                // Generate a chat ID based on the device name and mac
                const chatId = `${deviceName}_${macAddress}`
                  .toLowerCase()
                  .replace(/[^a-z0-9_]/g, "");
                router.replace(`/(tabs)/chats/${chatId}`);
              },
            },
          ]
        );
      } else if (configStatus.startsWith("ERROR:")) {
        Alert.alert("Configuration Error", configStatus.substring(6));
      }
    }
  }, [configStatus, deviceName, macAddress, isConfiguring]);

  const handleConfigureEndpoint = async (
    autoName?: string,
    autoMac?: string
  ) => {
    if (!connectedDevice) {
      Alert.alert("Error", "Please connect to a BLE device first");
      return;
    }

    const nameToUse = autoName || deviceName.trim().toLowerCase();
    const macToUse = autoMac || macAddress.trim().toLowerCase();

    // Validate device name
    if (!nameToUse) {
      Alert.alert("Error", "Please enter a device name");
      return;
    }

    // Validate device name format (alphanumeric and underscore only)
    if (!/^[a-zA-Z0-9_]+$/.test(nameToUse)) {
      Alert.alert(
        "Error",
        "Device name can only contain letters, numbers, and underscores"
      );
      return;
    }

    // Validate MAC address
    if (!macToUse) {
      Alert.alert("Error", "Please enter a MAC address");
      return;
    }

    // Validate MAC address format (8 hexadecimal characters)
    if (!/^[a-fA-F0-9]{8}$/.test(macToUse)) {
      Alert.alert(
        "Error",
        "MAC address must be exactly 8 hexadecimal characters (0-9, a-f)"
      );
      return;
    }

    // Validate MAC address is not the same as device local name
    if (
      connectedDevice.localName &&
      connectedDevice.localName.trim() !== "" &&
      macToUse === connectedDevice.localName.toLowerCase()
    ) {
      Alert.alert(
        "Cannot Create Chat",
        "This chat cannot be created because the MAC address matches the device you are currently connected to. You cannot have a remote chat with your own device.",
        [{ text: "OK" }]
      );
      return;
    }

    setIsConfiguring(true);

    console.log(
      `Configuring endpoint - Name: "${nameToUse}", MAC: "${macToUse.toLowerCase()}"`
    );

    try {
      const success = await configureEndpoint(
        connectedDevice,
        nameToUse,
        macToUse.toLowerCase()
      );

      if (!success) {
        setIsConfiguring(false);
        Alert.alert("Error", "Failed to send configuration to device");
      }
      // Success will be handled in the useEffect when configStatus updates
    } catch (error) {
      setIsConfiguring(false);
      console.error("Configuration error:", error);
      Alert.alert("Error", "Failed to configure endpoint");
    }
  };

  return (
    <View
      style={{ flex: 1, paddingTop: 50, backgroundColor: Colors.background }}
    >
      <View style={{ paddingHorizontal: 14, marginVertical: 16 }}>
        <Text style={styles.title}>
          {isEditMode ? "Edit Remote Endpoint" : "Configure Remote Endpoint"}
        </Text>

        {isEditMode && (
          <View style={styles.editModeIndicator}>
            <Ionicons
              name="information-circle"
              size={16}
              color={Colors.primary}
            />
            <Text style={styles.editModeText}>
              This device is already configured. You can edit the settings
              below.
            </Text>
          </View>
        )}

        {/* Device Name Input */}
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.label}>Device Name:</Text>
          <Text style={styles.helperText}>
            Letters, numbers, and underscores only
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TextInput
              style={styles.input}
              placeholder="e.g. SensorNode1"
              value={deviceName}
              onChangeText={(text) =>
                setDeviceName(text.replace(/[^a-zA-Z0-9_]/g, ""))
              }
              autoCapitalize="none"
              editable={!isConfiguring}
            />
          </View>
        </View>

        {/* MAC Address Input */}
        <View style={{ marginBottom: 24 }}>
          <Text style={styles.label}>MAC Address (8 hex characters):</Text>
          <Text style={styles.helperText}>Only 0-9 and a-f allowed</Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TextInput
              style={styles.input}
              placeholder="e.g. da5a26a5"
              value={macAddress}
              onChangeText={(text) =>
                setMacAddress(text.replace(/[^a-fA-F0-9]/g, "").toLowerCase())
              }
              maxLength={8}
              autoCapitalize="none"
              keyboardType="default"
              editable={!isConfiguring}
            />
          </View>
        </View>

        {/* Configure Button */}
        <TouchableOpacity
          style={[
            styles.configureButton,
            {
              backgroundColor: isConfiguring ? Colors.gray : Colors.primary,
              opacity: isConfiguring ? 0.6 : 1,
            },
          ]}
          onPress={() => handleConfigureEndpoint()}
          disabled={isConfiguring}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isConfiguring ? (
              <>
                <Ionicons
                  name="hourglass-outline"
                  size={20}
                  color="white"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.buttonText}>Configuring...</Text>
              </>
            ) : (
              <>
                <Ionicons
                  name="settings-outline"
                  size={20}
                  color="white"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.buttonText}>
                  {isEditMode ? "Update & Open Chat" : "Configure & Start Chat"}
                </Text>
              </>
            )}
          </View>
        </TouchableOpacity>

        {/* Open Existing Chat Button - only show in edit mode */}
        {isEditMode && existingConfig && (
          <TouchableOpacity
            style={[
              styles.configureButton,
              { backgroundColor: Colors.gray, marginTop: 12 },
            ]}
            onPress={() => {
              const chatId = existingConfig.id;
              router.replace(`/(tabs)/chats/${chatId}`);
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name="chatbubble-outline"
                size={20}
                color="white"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.buttonText}>Open Existing Chat</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Connection Status */}
        <View
          style={{
            marginTop: 16,
            padding: 12,
            backgroundColor: Colors.lightGray,
            borderRadius: 8,
          }}
        >
          <Text style={{ fontSize: 14, color: Colors.gray }}>
            Status:{" "}
            {connectedDevice
              ? `Connected to ${connectedDevice.localName || "Device"}`
              : "Not connected to BLE device"}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: Colors.primary,
  },
  editModeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightGray,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  editModeText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.primary,
    flex: 1,
  },
  label: {
    marginBottom: 8,
    fontWeight: "600",
    fontSize: 16,
    color: "#333",
  },
  helperText: {
    fontSize: 12,
    color: Colors.gray,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  configureButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Page;
