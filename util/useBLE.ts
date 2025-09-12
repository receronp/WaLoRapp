import { useCallback, useMemo, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import {
  BleError,
  BleManager,
  Characteristic,
  Device,
} from "react-native-ble-plx";

import { platformApiLevel } from "expo-device";

import base64 from "react-native-base64";

// BLE Constants - Dynamic based on negotiated MTU
const DEFAULT_CHUNK_SIZE = 20; // Fallback for default MTU

// Calculate optimal chunk size based on negotiated MTU
const calculateChunkSize = (device: Device | null): number => {
  if (!device || !device.mtu) {
    return DEFAULT_CHUNK_SIZE - 9; // Reserve for protocol overhead "C:ABC:0:"
  }

  const negotiatedMTU = device.mtu;
  const protocolOverhead = 9; // "C:ABC:0:" format overhead
  const effectiveChunkSize = negotiatedMTU - 3 - protocolOverhead; // MTU - ATT header - protocol

  return Math.max(effectiveChunkSize, 5); // Minimum 5 bytes for safety
};

// Service and Characteristic UUIDs
const BLE_UUID = "0000180d-0000-1000-8000-00805f9b34fb";
const BLE_CHARACTERISTIC = "00002a37-0000-1000-8000-00805f9b34fb";
const CONFIG_CHARACTERISTIC = "00002a38-0000-1000-8000-00805f9b34fb";

// Chunked message reassembly state
interface ChunkedMessageInfo {
  chunks: (string | null)[];
  totalChunks: number;
  receivedChunks: number;
  messageType: string;
  timestamp: number;
}

interface BluetoothLowEnergyApi {
  requestPermissions(): Promise<boolean>;
  scanForPeripherals(): void;
  connectToDevice: (deviceId: Device) => Promise<void>;
  writeToDevice: (device: Device, message: string) => Promise<void>;
  writeFileToDevice: (
    device: Device,
    fileName: string,
    fileBase64: string
  ) => Promise<void>;
  configureEndpoint: (
    device: Device,
    name: string,
    macAddress: string
  ) => Promise<boolean>;
  disconnectFromDevice: () => void;
  clearConfigStatus: () => void;
  connectedDevice: Device | null;
  allDevices: Device[];
  loraMsg: string;
  configStatus: string;
  chunkedMessages: { [messageId: string]: ChunkedMessageInfo };
  isReceivingChunkedMessage: boolean;
  chunkedMessageProgress: string;
}

function useBLE(): BluetoothLowEnergyApi {
  const bleManager = useMemo(() => new BleManager(), []);
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [loraMsg, setLoraMsg] = useState<string>("");
  const [configStatus, setConfigStatus] = useState<string>("");

  // Chunked message reassembly state
  const [chunkedMessages, setChunkedMessages] = useState<{
    [messageId: string]: ChunkedMessageInfo;
  }>({});

  // Helper function to clean up connection state
  const cleanupConnectionState = useCallback(() => {
    setConnectedDevice(null);
    setLoraMsg("");
    setConfigStatus("");
    setChunkedMessages({});
  }, []);

  // Computed values for UI display
  const isReceivingChunkedMessage = Object.keys(chunkedMessages).length > 0;
  const chunkedMessageProgress = useMemo(() => {
    const activeMessages = Object.entries(chunkedMessages);
    if (activeMessages.length === 0) return "";

    const [messageId, messageInfo] = activeMessages[0]; // Show first active message
    const progress = (
      (messageInfo.receivedChunks / messageInfo.totalChunks) *
      100
    ).toFixed(1);
    return `${messageId}: ${messageInfo.receivedChunks}/${messageInfo.totalChunks} chunks (${progress}%)`;
  }, [chunkedMessages]);

  const requestAndroid31Permissions = async (): Promise<boolean> => {
    try {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ];

      const results = await PermissionsAndroid.requestMultiple(permissions);

      return Object.values(results).every(
        (result) => result === PermissionsAndroid.RESULTS.GRANTED
      );
    } catch (error) {
      console.log("Error requesting Android 31+ permissions:", error);
      return false;
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== "android") {
      return true;
    }

    if ((platformApiLevel ?? -1) < 31) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Location Permission",
          message: "Bluetooth Low Energy requires Location access",
          buttonPositive: "OK",
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    return requestAndroid31Permissions();
  };

  const isDuplicateDevice = (devices: Device[], nextDevice: Device): boolean =>
    devices.some((device) => device.id === nextDevice.id);

  const scanForPeripherals = () => {
    bleManager.startDeviceScan(
      null,
      null,
      (error: BleError | null, device: Device | null) => {
        if (error) {
          console.log("Error scanning for devices:", error);
          return;
        }

        if (device && device.localName?.match(/^[0-9a-f]{8}$/)) {
          setAllDevices((prevState: Device[]) => {
            if (!isDuplicateDevice(prevState, device)) {
              return [...prevState, device];
            }
            return prevState;
          });
        }
      }
    );
  };
  const connectToDevice = async (device: Device): Promise<void> => {
    try {
      const deviceConnection = await bleManager.connectToDevice(device.id);

      // MTU Negotiation - Critical for optimal throughput
      try {
        // Request maximum MTU (517 bytes) - will negotiate down based on iOS/device limits
        const deviceWithMTU = await deviceConnection.requestMTU(517);
        setConnectedDevice(deviceWithMTU);
      } catch (mtuError) {
        console.warn("MTU negotiation failed, using default MTU:", mtuError);
        setConnectedDevice(deviceConnection);
      }

      await deviceConnection.discoverAllServicesAndCharacteristics();
      bleManager.stopDeviceScan();

      // Set up disconnect listener
      deviceConnection.onDisconnected(
        (error: BleError | null, disconnectedDevice: Device | null) => {
          cleanupConnectionState();
        }
      );

      startStreamingData(deviceConnection);
    } catch (error) {
      console.log("Failed to connect to device:", error);
      setConnectedDevice(null);
      throw new Error(`Connection failed: ${error}`);
    }
  };

  // Enhanced chunking with dynamic MTU-based sizing
  const writeCharacteristicInChunks = async (
    device: Device,
    serviceUUID: string,
    characteristicUUID: string,
    message: string,
    messageType: string = "text"
  ): Promise<void> => {
    try {
      // Use short message ID (3 chars: random base36)
      const messageId = Math.random().toString(36).substring(2, 5);

      // Calculate optimal chunk size based on negotiated MTU
      // Format: "C:ABC:0:DATA" = 9 chars overhead + data
      const maxChunkSize = calculateChunkSize(device);
      const totalChunks = Math.ceil(message.length / maxChunkSize);

      // Truncate message type to 1 char to save space
      const msgType = messageType.charAt(0);

      // Send START message: S:ABC:5:t (S:messageId:totalChunks:type)
      const startMessage = `S:${messageId}:${totalChunks}:${msgType}`;
      await device.writeCharacteristicWithResponseForService(
        serviceUUID,
        characteristicUUID,
        base64.encode(startMessage)
      );
      await new Promise((resolve) => setTimeout(resolve, 100)); // Reduced delay for optimized buffer system

      // Send chunks: C:ABC:0:DATA (C:messageId:chunkIndex:data)
      for (let i = 0; i < totalChunks; i++) {
        const start = i * maxChunkSize;
        const end = Math.min(start + maxChunkSize, message.length);
        const chunk = message.substring(start, end);
        const chunkMessage = `C:${messageId}:${i}:${chunk}`;

        await device.writeCharacteristicWithResponseForService(
          serviceUUID,
          characteristicUUID,
          base64.encode(chunkMessage)
        );

        await new Promise((resolve) => setTimeout(resolve, 30)); // Reduced delay for improved ESP32 buffer management
      }

      // Send END message: E:ABC:5 (E:messageId:totalChunks)
      const endMessage = `E:${messageId}:${totalChunks}`;
      await device.writeCharacteristicWithResponseForService(
        serviceUUID,
        characteristicUUID,
        base64.encode(endMessage)
      );
    } catch (error) {
      console.log("Failed to write characteristic chunks:", error);
      throw error;
    }
  };

  const writeToDevice = async (
    device: Device,
    message: string
  ): Promise<void> => {
    try {
      await writeCharacteristicInChunks(
        device,
        BLE_UUID,
        BLE_CHARACTERISTIC,
        message,
        "text" // message type
      );
    } catch (error) {
      // Handle device disconnection during write
      if (
        error instanceof BleError &&
        (error.errorCode === 201 || error.message.includes("disconnected"))
      ) {
        cleanupConnectionState();
        throw new Error("Device disconnected during message transmission");
      }
      console.log("Failed to write message to device:", error);
      throw error;
    }
  };

  const writeFileToDevice = async (
    device: Device,
    fileName: string,
    fileBase64: string
  ): Promise<void> => {
    if (!fileName || !fileBase64 || !device) {
      throw new Error("Device, filename, and file data are required");
    }

    const fileMessage = `FILE:${fileName}:${fileBase64}`;

    try {
      // Use the regular message characteristic with chunking protocol
      await writeCharacteristicInChunks(
        device,
        BLE_UUID,
        BLE_CHARACTERISTIC, // Use message characteristic, not file characteristic
        fileMessage,
        "file" // message type
      );
    } catch (error) {
      // Check if device was disconnected
      if (
        error instanceof BleError &&
        (error.errorCode === 201 || error.message.includes("disconnected"))
      ) {
        cleanupConnectionState();
        throw new Error("Device disconnected during file transmission");
      }

      console.error("Failed to write file to device:", error);
      throw error;
    }
  };

  const configureEndpoint = async (
    device: Device,
    name: string,
    macAddress: string
  ): Promise<boolean> => {
    try {
      const configMessage = `name=${name},mac=${macAddress}`;
      console.log(`Sending config message: "${configMessage}"`);
      
      // Send configuration directly without chunking protocol
      await device.writeCharacteristicWithResponseForService(
        BLE_UUID,
        CONFIG_CHARACTERISTIC,
        base64.encode(configMessage)
      );
      return true;
    } catch (error) {
      // Handle device disconnection during configuration
      if (
        error instanceof BleError &&
        (error.errorCode === 201 || error.message.includes("disconnected"))
      ) {
        cleanupConnectionState();
      } else {
        console.log("Failed to configure endpoint:", error);
      }
      return false;
    }
  };

  const disconnectFromDevice = () => {
    if (connectedDevice) {
      try {
        bleManager.cancelDeviceConnection(connectedDevice.id);
      } catch (error) {
        // Device might already be disconnected, ignore error
        console.log("Device was already disconnected");
      } finally {
        // Always clean up state
        cleanupConnectionState();
      }
    }
  };

  const clearConfigStatus = () => {
    setConfigStatus("");
  };

  // Parse chunked messages from bridge
  const parseChunkedMessage = (messageData: string): boolean => {
    try {
      const message = messageData.trim();

      if (message.startsWith("S:")) {
        // START message: S:<messageId>:<totalChunks>:<messageType>
        const parts = message.split(":", 4);
        if (parts.length >= 4) {
          const messageId = parts[1];
          const totalChunks = parseInt(parts[2]);
          const messageType = parts[3];

          setChunkedMessages((prev) => ({
            ...prev,
            [messageId]: {
              chunks: new Array(totalChunks).fill(null),
              totalChunks,
              receivedChunks: 0,
              messageType,
              timestamp: Date.now(),
            },
          }));
        }
        return true;
      } else if (message.startsWith("C:")) {
        // CHUNK message: C:<messageId>:<chunkIndex>:<data>
        const firstColon = message.indexOf(":", 2); // Find colon after "C:"
        const secondColon = message.indexOf(":", firstColon + 1); // Find next colon

        if (firstColon !== -1 && secondColon !== -1) {
          const messageId = message.substring(2, firstColon);
          const chunkIndexReceived = parseInt(
            message.substring(firstColon + 1, secondColon)
          );
          const chunkIndex = chunkIndexReceived - 1; // Convert from 1-based to 0-based for array indexing
          const chunkData = message.substring(secondColon + 1); // Everything after second colon

          setChunkedMessages((prev) => {
            const messageInfo = prev[messageId];
            if (
              !messageInfo ||
              chunkIndex < 0 ||
              chunkIndex >= messageInfo.totalChunks
            ) {
              return prev;
            }

            // Don't overwrite existing chunks (handle duplicates)
            if (messageInfo.chunks[chunkIndex] === null) {
              const newChunks = [...messageInfo.chunks];
              newChunks[chunkIndex] = chunkData;

              const newReceivedCount = messageInfo.receivedChunks + 1;

              return {
                ...prev,
                [messageId]: {
                  ...messageInfo,
                  chunks: newChunks,
                  receivedChunks: newReceivedCount,
                },
              };
            }

            return prev;
          });
        }
        return true;
      } else if (message.startsWith("E:")) {
        // END message: E:<messageId>:<totalChunks>
        const parts = message.split(":");
        if (parts.length >= 3) {
          const messageId = parts[1];
          const expectedTotal = parseInt(parts[2]);

          setChunkedMessages((prev) => {
            const messageInfo = prev[messageId];
            if (!messageInfo) {
              return prev;
            }

            // Check if all chunks received
            if (messageInfo.receivedChunks === messageInfo.totalChunks) {
              // Reassemble the message
              const reassembledMessage = messageInfo.chunks.join("");

              // Process the complete message based on its type
              if (messageInfo.messageType === "f") {
                // FILE type - handle file protocol
                if (reassembledMessage.startsWith("FILE:")) {
                  console.log(
                    `Received file message: ${reassembledMessage.substring(
                      0,
                      50
                    )}...`
                  );
                  // Set the message in the correct format for the chat component to handle
                  // The chat component expects "FILE:filename:base64data" format
                  setLoraMsg(reassembledMessage);
                } else {
                  // Fallback for other file formats
                  setLoraMsg(`File received:\n${reassembledMessage}`);
                }
              } else if (messageInfo.messageType === "c") {
                // CONFIG type
                console.log(
                  `Received config data: ${reassembledMessage.length} chars`
                );
                setLoraMsg(`Config received:\n${reassembledMessage}`);
              } else {
                // Default text message
                setLoraMsg(reassembledMessage);
              }

              // Clean up this message from state
              const newMessages = { ...prev };
              delete newMessages[messageId];
              return newMessages;
            } else {
              console.warn(
                `Incomplete message ${messageId}: ${messageInfo.receivedChunks}/${messageInfo.totalChunks} chunks received`
              );
            }

            return prev;
          });
        }
        return true;
      }

      return false; // Not a chunked message
    } catch (error) {
      console.error("Error parsing chunked message:", error);
      return false;
    }
  };

  const onLoRaMessageUpdate = (
    error: BleError | null,
    characteristic: Characteristic | null
  ): void => {
    if (error) {
      // Handle device disconnection and cancelled operations gracefully
      if (
        error.errorCode === 201 ||
        error.message.includes("disconnected") ||
        error.message.includes("cancelled")
      ) {
        // Device was disconnected, clean up connection state
        cleanupConnectionState();
      } else {
        console.log("LoRa message error:", error.message);
      }
      return;
    }

    if (!characteristic?.value) {
      return;
    }

    try {
      const loraMessage = base64.decode(characteristic.value);

      // Try to parse as chunked message first
      const isChunkedMessage = parseChunkedMessage(loraMessage);

      if (!isChunkedMessage) {
        // Not a chunked message, treat as regular message
        setLoraMsg(loraMessage);
      }
    } catch (decodeError) {
      console.log("Failed to decode LoRa message");
    }
  };

  const onConfigUpdate = (
    error: BleError | null,
    characteristic: Characteristic | null
  ): void => {
    if (error) {
      // Handle device disconnection and cancelled operations gracefully
      if (
        error.errorCode === 201 ||
        error.message.includes("disconnected") ||
        error.message.includes("cancelled")
      ) {
        // Device was disconnected, clean up connection state
        cleanupConnectionState();
      } else {
        console.log("Config error:", error.message);
      }
      return;
    }

    if (!characteristic?.value) {
      return;
    }

    try {
      const configResponse = base64.decode(characteristic.value);
      setConfigStatus(configResponse);
    } catch (decodeError) {
      console.log("Failed to decode config response");
    }
  };

  const startStreamingData = (device: Device): void => {
    if (!device) {
      console.log("Unable to start streaming: no device connected");
      return;
    }

    // Monitor message characteristic for LoRa messages
    device.monitorCharacteristicForService(
      BLE_UUID,
      BLE_CHARACTERISTIC,
      onLoRaMessageUpdate
    );

    // Monitor config characteristic for configuration responses
    device.monitorCharacteristicForService(
      BLE_UUID,
      CONFIG_CHARACTERISTIC,
      onConfigUpdate
    );
  };

  return {
    scanForPeripherals,
    requestPermissions,
    connectToDevice,
    writeToDevice,
    writeFileToDevice,
    configureEndpoint,
    allDevices,
    connectedDevice,
    disconnectFromDevice,
    clearConfigStatus,
    loraMsg,
    configStatus,
    chunkedMessages,
    isReceivingChunkedMessage,
    chunkedMessageProgress,
  };
}

export default useBLE;
