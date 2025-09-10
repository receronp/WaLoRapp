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
  const { configureEndpoint, configStatus, connectedDevice, clearConfigStatus } = useBLEContext();
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

  const handleConfigureEndpoint = async () => {
    if (!connectedDevice) {
      Alert.alert("Error", "Please connect to a BLE device first");
      return;
    }

    if (!deviceName.trim()) {
      Alert.alert("Error", "Please enter a device name");
      return;
    }

    if (!macAddress.trim() || macAddress.length !== 8) {
      Alert.alert("Error", "Please enter a valid 8-character MAC address");
      return;
    }

    setIsConfiguring(true);

    try {
      const success = await configureEndpoint(
        connectedDevice,
        deviceName.trim(),
        macAddress.trim()
      );

      if (!success) {
        setIsConfiguring(false);
        Alert.alert("Error", "Failed to send configuration to device");
      }
      // Success will be handled in the useEffect when configStatus updates
    } catch (error) {
      setIsConfiguring(false);
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
            <Ionicons name="information-circle" size={16} color={Colors.primary} />
            <Text style={styles.editModeText}>
              This device is already configured. You can edit the settings below.
            </Text>
          </View>
        )}

        {/* Device Name Input */}
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.label}>Device Name:</Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TextInput
              style={styles.input}
              placeholder="e.g. SensorNode1"
              value={deviceName}
              onChangeText={setDeviceName}
              autoCapitalize="none"
              editable={!isConfiguring}
            />
          </View>
        </View>

        {/* MAC Address Input */}
        <View style={{ marginBottom: 24 }}>
          <Text style={styles.label}>MAC Address (8 characters):</Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TextInput
              style={styles.input}
              placeholder="e.g. da5a26a5"
              value={macAddress}
              onChangeText={setMacAddress}
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
          onPress={handleConfigureEndpoint}
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
            style={[styles.configureButton, { backgroundColor: Colors.gray, marginTop: 12 }]}
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
              ? `Connected to ${connectedDevice.name || "Device"}`
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
