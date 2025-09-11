import { useMemo, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import {
  BleError,
  BleManager,
  Characteristic,
  Device,
} from "react-native-ble-plx";

import { platformApiLevel } from "expo-device";

import base64 from "react-native-base64";

// BLE Constants
const CHUNK_SIZE = 20;
const BUFFERED_CHUNK_SIZE = 100;
const CHUNK_DELAY_MS = 20;

// Service and Characteristic UUIDs
const BLE_UUID = "0000180d-0000-1000-8000-00805f9b34fb";
const BLE_CHARACTERISTIC = "00002a37-0000-1000-8000-00805f9b34fb";
const CONFIG_CHARACTERISTIC = "00002a38-0000-1000-8000-00805f9b34fb";
const FILE_CHARACTERISTIC = "00002a39-0000-1000-8000-00805f9b34fb";

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
}

function useBLE(): BluetoothLowEnergyApi {
  const bleManager = useMemo(() => new BleManager(), []);
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [loraMsg, setLoraMsg] = useState<string>("");
  const [configStatus, setConfigStatus] = useState<string>("");

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
      setConnectedDevice(deviceConnection);
      await deviceConnection.discoverAllServicesAndCharacteristics();
      bleManager.stopDeviceScan();

      // Set up disconnect listener
      deviceConnection.onDisconnected(
        (error: BleError | null, disconnectedDevice: Device | null) => {
          console.log(
            "Device disconnected:",
            disconnectedDevice?.name || "Unknown device"
          );
          // Clean up state when device disconnects
          setConnectedDevice(null);
          setLoraMsg("");
          setConfigStatus("");
        }
      );

      startStreamingData(deviceConnection);
    } catch (error) {
      console.log("Failed to connect to device:", error);
      setConnectedDevice(null);
      throw new Error(`Connection failed: ${error}`);
    }
  };

  // Simple chunking without protocol headers (for small messages)
  const writeCharacteristicInChunks = async (
    device: Device,
    serviceUUID: string,
    characteristicUUID: string,
    message: string
  ): Promise<void> => {
    try {
      const fullMessage = message + "\n"; // Delimiter

      for (let i = 0; i < fullMessage.length; i += CHUNK_SIZE) {
        const chunk = fullMessage.slice(i, i + CHUNK_SIZE);
        const base64Chunk = base64.encode(chunk);
        await device.writeCharacteristicWithResponseForService(
          serviceUUID,
          characteristicUUID,
          base64Chunk
        );
      }
    } catch (error) {
      console.log("Failed to write characteristic chunks:", error);
      throw error;
    }
  };

  const writeLargeDataInChunks = async (
    device: Device,
    serviceUUID: string,
    characteristicUUID: string,
    data: string,
    messageId: string,
    messageType: string = "text"
  ): Promise<void> => {
    try {
      const isFileCharacteristic = characteristicUUID === FILE_CHARACTERISTIC;
      const baseChunkSize = isFileCharacteristic
        ? BUFFERED_CHUNK_SIZE
        : CHUNK_SIZE;
      const chunkSize = baseChunkSize - 5; // Reserve space for protocol overhead
      const totalChunks = Math.ceil(data.length / chunkSize);

      // Send START message
      const startMessage = `S:${messageId}:${totalChunks}:${messageType}`;
      await device.writeCharacteristicWithResponseForService(
        serviceUUID,
        characteristicUUID,
        base64.encode(startMessage)
      );
      await new Promise((resolve) => setTimeout(resolve, CHUNK_DELAY_MS));

      // Send data chunks
      for (let i = 0; i < totalChunks; i++) {
        const chunk = data.slice(i * chunkSize, (i + 1) * chunkSize);
        const chunkMessage = `C:${messageId}:${i}:${chunk}`;

        await device.writeCharacteristicWithResponseForService(
          serviceUUID,
          characteristicUUID,
          base64.encode(chunkMessage)
        );

        await new Promise((resolve) => setTimeout(resolve, CHUNK_DELAY_MS));
      }

      // Send END message
      const endMessage = `E:${messageId}:${totalChunks}`;
      await device.writeCharacteristicWithResponseForService(
        serviceUUID,
        characteristicUUID,
        base64.encode(endMessage)
      );
    } catch (error) {
      console.log("Failed to write large data chunks:", error);
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
        message
      );
    } catch (error) {
      // Handle device disconnection during write
      if (
        error instanceof BleError &&
        (error.errorCode === 201 || error.message.includes("disconnected"))
      ) {
        setConnectedDevice(null);
        setLoraMsg("");
        setConfigStatus("");
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
      // Try direct write to BufferedCharacteristic first
      const base64Data = base64.encode(fileMessage);
      await device.writeCharacteristicWithResponseForService(
        BLE_UUID,
        FILE_CHARACTERISTIC,
        base64Data
      );
    } catch (characteristicError) {
      // Check if device was disconnected
      if (
        characteristicError instanceof BleError &&
        (characteristicError.errorCode === 201 ||
          characteristicError.message.includes("disconnected"))
      ) {
        setConnectedDevice(null);
        setLoraMsg("");
        setConfigStatus("");
        throw new Error("Device disconnected during file transmission");
      }

      // Fallback to chunked transfer
      try {
        const messageId = Math.random().toString(36).substring(2, 8);
        await writeLargeDataInChunks(
          device,
          BLE_UUID,
          FILE_CHARACTERISTIC,
          fileMessage,
          messageId,
          "file"
        );
      } catch (chunkedError) {
        if (
          chunkedError instanceof BleError &&
          (chunkedError.errorCode === 201 ||
            chunkedError.message.includes("disconnected"))
        ) {
          setConnectedDevice(null);
          setLoraMsg("");
          setConfigStatus("");
          throw new Error("Device disconnected during file transmission");
        }
        throw chunkedError;
      }
    }
  };

  const configureEndpoint = async (
    device: Device,
    name: string,
    macAddress: string
  ): Promise<boolean> => {
    try {
      const configMessage = `name=${name},mac=${macAddress}`;
      await writeCharacteristicInChunks(
        device,
        BLE_UUID,
        CONFIG_CHARACTERISTIC,
        configMessage
      );
      return true;
    } catch (error) {
      // Handle device disconnection during configuration
      if (
        error instanceof BleError &&
        (error.errorCode === 201 || error.message.includes("disconnected"))
      ) {
        setConnectedDevice(null);
        setLoraMsg("");
        setConfigStatus("");
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
        setConnectedDevice(null);
        setLoraMsg("");
        setConfigStatus("");
      }
    }
  };

  const clearConfigStatus = () => {
    setConfigStatus("");
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
        setConnectedDevice(null);
        setLoraMsg("");
        setConfigStatus("");
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
      setLoraMsg(loraMessage);
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
        setConnectedDevice(null);
        setLoraMsg("");
        setConfigStatus("");
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
  };
}

export default useBLE;
