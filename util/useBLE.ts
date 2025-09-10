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

const CHUNK_SIZE = 20; // BLE characteristic max size
const HEART_RATE_UUID = "0000180d-0000-1000-8000-00805f9b34fb";
const HEART_RATE_CHARACTERISTIC = "00002a37-0000-1000-8000-00805f9b34fb";
const CONFIG_CHARACTERISTIC = "00002a38-0000-1000-8000-00805f9b34fb"; // New config characteristic

interface BluetoothLowEnergyApi {
  requestPermissions(): Promise<boolean>;
  scanForPeripherals(): void;
  connectToDevice: (deviceId: Device) => Promise<void>;
  writeToDevice: (device: Device, message: string) => Promise<void>;
  configureEndpoint: (device: Device, name: string, macAddress: string) => Promise<boolean>;
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

  const writeToDevice = async (device: Device, message: string) => {
    try {
      const fullMessage = message + "\n"; // Delimiter

      for (let i = 0; i < fullMessage.length; i += CHUNK_SIZE) {
        const chunk = fullMessage.slice(i, i + CHUNK_SIZE);
        const base64Chunk = base64.encode(chunk);
        await device.writeCharacteristicWithResponseForService(
          HEART_RATE_UUID,
          HEART_RATE_CHARACTERISTIC,
          base64Chunk
        );
      }

      console.log("Message written to device");
    } catch (e) {
      console.log("FAILED TO WRITE TO DEVICE", e);
    }
  };

  const configureEndpoint = async (device: Device, name: string, macAddress: string): Promise<boolean> => {
    try {
      const configMessage = `name=${name},mac=${macAddress}`;
      const fullMessage = configMessage + "\n"; // Add delimiter like writeToDevice

      // Send in chunks like writeToDevice
      for (let i = 0; i < fullMessage.length; i += CHUNK_SIZE) {
        const chunk = fullMessage.slice(i, i + CHUNK_SIZE);
        const base64Chunk = base64.encode(chunk);
        await device.writeCharacteristicWithResponseForService(
          HEART_RATE_UUID,
          CONFIG_CHARACTERISTIC,
          base64Chunk
        );
      }

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
