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

const CHUNK_SIZE = 20; // Standard BLE MTU size for regular characteristics
const BUFFERED_CHUNK_SIZE = 100; // Larger chunks for BufferedCharacteristic fallback
const HEART_RATE_UUID = "0000180d-0000-1000-8000-00805f9b34fb";
const HEART_RATE_CHARACTERISTIC = "00002a37-0000-1000-8000-00805f9b34fb";
const CONFIG_CHARACTERISTIC = "00002a38-0000-1000-8000-00805f9b34fb"; // Config characteristic
const FILE_CHARACTERISTIC = "00002a39-0000-1000-8000-00805f9b34fb"; // File characteristic (renamed from image)

interface BluetoothLowEnergyApi {
  requestPermissions(): Promise<boolean>;
  scanForPeripherals(): void;
  connectToDevice: (deviceId: Device) => Promise<void>;
  writeToDevice: (device: Device, message: string) => Promise<void>;
  writeFileToDevice: (device: Device, fileName: string, fileBase64: string) => Promise<void>;
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
  const [loraMsg, setLoRaIncommingMsg] = useState<string>("");
  const [configStatus, setConfigStatus] = useState<string>("");

  const requestAndroid31Permissions = async () => {
    const bluetoothScanPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );
    const bluetoothConnectPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );
    const fineLocationPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );

    return (
      bluetoothScanPermission === "granted" &&
      bluetoothConnectPermission === "granted" &&
      fineLocationPermission === "granted"
    );
  };

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      if ((platformApiLevel ?? -1) < 31) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "Bluetooth Low Energy requires Location",
            buttonPositive: "OK",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const isAndroid31PermissionsGranted =
          await requestAndroid31Permissions();

        return isAndroid31PermissionsGranted;
      }
    } else {
      return true;
    }
  };

  const isDuplicteDevice = (devices: Device[], nextDevice: Device) =>
    devices.findIndex((device) => nextDevice.id === device.id) > -1;

  const scanForPeripherals = () =>
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log(error);
      }
      if (device && device.localName?.match(/[0-9a-f]{8}/)) {
        setAllDevices((prevState: Device[]) => {
          if (!isDuplicteDevice(prevState, device)) {
            return [...prevState, device];
          }
          return prevState;
        });
      }
    });

  const connectToDevice = async (device: Device) => {
    try {
      const deviceConnection = await bleManager.connectToDevice(device.id);
      setConnectedDevice(deviceConnection);
      await deviceConnection.discoverAllServicesAndCharacteristics();
      bleManager.stopDeviceScan();
      startStreamingData(deviceConnection);
    } catch (e) {
      console.log("FAILED TO CONNECT", e);
    }
  };

  // Simple chunking without protocol headers (for small messages)
  const writeCharacteristicInChunks = async (
    device: Device,
    serviceUUID: string,
    characteristicUUID: string,
    message: string
  ): Promise<void> => {
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
  };

  // Advanced chunking with S:/C:/E: protocol headers (for large data like images)
  const writeLargeDataInChunks = async (
    device: Device,
    serviceUUID: string,
    characteristicUUID: string,
    data: string,
    messageId: string,
    messageType: string = "text"
  ): Promise<void> => {
    // Use appropriate chunk size based on characteristic type
    const isFileCharacteristic = characteristicUUID === FILE_CHARACTERISTIC;
    const baseChunkSize = isFileCharacteristic ? BUFFERED_CHUNK_SIZE : CHUNK_SIZE;
    const chunkSize = baseChunkSize - 5; // Reserve space for protocol overhead
    const totalChunks = Math.ceil(data.length / chunkSize);
    
    console.log(`Starting chunked transfer: messageId=${messageId}`);
    console.log(`Data size: ${data.length} chars, chunk size: ${chunkSize} (base: ${baseChunkSize}), total chunks: ${totalChunks}`);
    console.log(`Using characteristic: ${characteristicUUID} (${isFileCharacteristic ? 'BufferedCharacteristic' : 'Regular'})`);
    
    // Send START message with new S: protocol
    const startMessage = `S:${messageId}:${totalChunks}:${messageType}`;
    const base64Start = base64.encode(startMessage);
    console.log(`Sending START: ${startMessage}`);
    await device.writeCharacteristicWithResponseForService(
      serviceUUID,
      characteristicUUID,
      base64Start
    );
    await new Promise(resolve => setTimeout(resolve, 20));
    
    // Send data chunks with new C: protocol
    for (let i = 0; i < totalChunks; i++) {
      const chunk = data.slice(i * chunkSize, (i + 1) * chunkSize);
      const chunkMessage = `C:${messageId}:${i}:${chunk}`;
      
      console.log(`Sending chunk ${i + 1}/${totalChunks}: size=${chunk.length} chars`);
      console.log(`Chunk content: "${chunk}"`);
      console.log(`Chunk positions: [${i * chunkSize}:${(i + 1) * chunkSize}]`);
      
      const base64Chunk = base64.encode(chunkMessage);
      await device.writeCharacteristicWithResponseForService(
        serviceUUID,
        characteristicUUID,
        base64Chunk
      );
      
      // Small delay between chunks
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    
    // Send END message with new E: protocol
    const endMessage = `E:${messageId}:${totalChunks}`;
    const base64End = base64.encode(endMessage);
    console.log(`Sending END: ${endMessage}`);
    await device.writeCharacteristicWithResponseForService(
      serviceUUID,
      characteristicUUID,
      base64End
    );
    console.log(`Chunked transfer completed for messageId=${messageId}`);
  };

  const writeToDevice = async (
    device: Device,
    message: string
  ): Promise<void> => {
    try {
      await writeCharacteristicInChunks(
        device,
        HEART_RATE_UUID,
        HEART_RATE_CHARACTERISTIC,
        message
      );
      console.log("Message written to device");
    } catch (e) {
      console.log("FAILED TO WRITE TO DEVICE", e);
    }
  };

  const writeFileToDevice = async (
    device: Device,
    fileName: string,
    fileBase64: string
  ): Promise<void> => {
    try {
      // Validate inputs
      if (!fileName) {
        throw new Error("File name is required");
      }
      if (!fileBase64) {
        throw new Error("File base64 data is required");
      }
      if (!device) {
        throw new Error("Device is required");
      }

      const fileMessage = `FILE:${fileName}:${fileBase64}`;
      
      console.log(`Starting file transfer via BufferedCharacteristic`);
      console.log(`File name: "${fileName}"`);
      console.log(`Base64 data length: ${fileBase64.length} chars`);
      console.log(`Complete message length: ${fileMessage.length} chars`);
      console.log(`Message preview: "${fileMessage.substring(0, 100)}..."`);
      
      try {
        console.log(`Sending directly to BufferedCharacteristic: ${FILE_CHARACTERISTIC}`);
        
        // Send complete message directly to BufferedCharacteristic (no chunking needed)
        const base64Data = base64.encode(fileMessage);
        
        console.log(`Encoded message length: ${base64Data.length} chars`);
        console.log(`Encoded data preview: "${base64Data.substring(0, 100)}..."`);
        
        // Send the base64 encoded data directly
        await device.writeCharacteristicWithResponseForService(
          HEART_RATE_UUID,
          FILE_CHARACTERISTIC,
          base64Data
        );
        
        console.log("File sent successfully via BufferedCharacteristic");
      } catch (characteristicError) {
        console.log("BufferedCharacteristic write failed, trying chunked fallback:", characteristicError);
        // Fallback to chunked transfer if BufferedCharacteristic fails
        const messageId = Math.random().toString(36).substring(2, 8);
        await writeLargeDataInChunks(
          device,
          HEART_RATE_UUID,
          FILE_CHARACTERISTIC,
          fileMessage,
          messageId,
          "file"
        );
        console.log("File written to device successfully via message characteristic");
      }
    } catch (e) {
      console.log("FAILED TO WRITE FILE TO DEVICE", e);
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
        HEART_RATE_UUID,
        CONFIG_CHARACTERISTIC,
        configMessage
      );
      console.log("Configuration sent to device in chunks");
      return true;
    } catch (e) {
      console.log("FAILED TO CONFIGURE ENDPOINT", e);
      return false;
    }
  };

  const disconnectFromDevice = () => {
    if (connectedDevice) {
      bleManager.cancelDeviceConnection(connectedDevice.id);
      setConnectedDevice(null);
      setLoRaIncommingMsg("");
      setConfigStatus("");
    }
  };

  const clearConfigStatus = () => {
    setConfigStatus("");
  };

  const onLoRaMessageUpdate = (
    error: BleError | null,
    characteristic: Characteristic | null
  ) => {
    if (error) {
      console.log(error);
      return -1;
    } else if (!characteristic?.value) {
      console.log("No Data was recieved");
      return -1;
    }

    // Only decode BLE layer - MicroPython sends UTF-8, BLE encodes as base64
    const loraMessage = base64.decode(characteristic.value);
    console.log("LoRa message received:", loraMessage);
    setLoRaIncommingMsg(loraMessage);
  };

  const onConfigUpdate = (
    error: BleError | null,
    characteristic: Characteristic | null
  ) => {
    if (error) {
      console.log("Config error:", error);
      return;
    } else if (!characteristic?.value) {
      console.log("No config response received");
      return;
    }

    console.log("Raw characteristic value:", characteristic.value);
    // First decode (BLE layer)
    const finalResponse = base64.decode(characteristic.value);
    console.log("Config response:", finalResponse);
    setConfigStatus(finalResponse);
  };

  const startStreamingData = async (device: Device) => {
    if (device) {
      // Monitor message characteristic for LoRa messages
      device.monitorCharacteristicForService(
        HEART_RATE_UUID,
        HEART_RATE_CHARACTERISTIC,
        onLoRaMessageUpdate
      );

      // Monitor config characteristic for configuration responses
      device.monitorCharacteristicForService(
        HEART_RATE_UUID,
        CONFIG_CHARACTERISTIC,
        onConfigUpdate
      );
    } else {
      console.log("No Device Connected");
    }
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
