import React, { useCallback, useEffect } from "react";
import {
  FlatList,
  ListRenderItemInfo,
  SafeAreaView,
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Device } from "react-native-ble-plx";
import { useBLEContext } from "@/util/contextBLE";

// If you expect devices to be passed as JSON, parse them here
// Otherwise, adjust as needed for your data flow

type DeviceModalListItemProps = {
  device: Device;
  connectToPeripheral: (device: Device) => void;
  closeModal: () => void;
};

const DeviceModalListItem: React.FC<DeviceModalListItemProps> = ({
  device,
  connectToPeripheral,
  closeModal,
}) => {
  const connectAndCloseModal = useCallback(() => {
    connectToPeripheral(device);
    closeModal();
  }, [closeModal, connectToPeripheral, device]);

  return (
    <TouchableOpacity
      onPress={connectAndCloseModal}
      style={modalStyle.ctaButton}
    >
      <Text style={modalStyle.ctaButtonText}>
        {device.localName || device.name || "Unknown Device"}
      </Text>
    </TouchableOpacity>
  );
};

const Page = () => {
  const router = useRouter();
  const {
    allDevices,
    connectToDevice,
    scanForPeripherals,
    requestPermissions,
    connectedDevice,
    disconnectFromDevice,
  } = useBLEContext();

  const scanForDevices = async () => {
    const isPermissionsEnabled = await requestPermissions();
    if (isPermissionsEnabled) {
      scanForPeripherals();
    }
  };
  useEffect(() => {
    scanForDevices();
  }, [scanForDevices]);

  const closeModal = () => {
    router.back();
  };

  const renderDeviceModalListItem = useCallback(
    ({ item }: ListRenderItemInfo<Device>) => (
      <DeviceModalListItem
        device={item}
        connectToPeripheral={connectToDevice}
        closeModal={closeModal}
      />
    ),
    [closeModal, connectToDevice]
  );

  return (
    <SafeAreaView style={modalStyle.modalTitle}>
      <Text style={modalStyle.modalTitleText}>
        {connectedDevice ? "Connected Device" : "Tap on a device to connect"}
      </Text>

      {connectedDevice ? (
        <View style={modalStyle.connectedDeviceContainer}>
          <View style={modalStyle.connectedDeviceInfo}>
            <Text style={modalStyle.connectedDeviceText}>
              {connectedDevice.localName ||
                connectedDevice.name ||
                "Unknown Device"}
            </Text>
          </View>
          <TouchableOpacity
            style={modalStyle.disconnectButton}
            onPress={() => {
              disconnectFromDevice();
              closeModal();
            }}
          >
            <Text style={modalStyle.disconnectButtonText}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={modalStyle.modalFlatlistContiner}
          data={allDevices}
          renderItem={renderDeviceModalListItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 40 }}>
              <Text>No devices found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const modalStyle = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  modalFlatlistContiner: {
    flex: 1,
    justifyContent: "center",
  },
  modalCellOutline: {
    borderWidth: 1,
    borderColor: "black",
    alignItems: "center",
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
  },
  modalTitle: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  modalTitleText: {
    marginTop: 40,
    fontSize: 30,
    fontWeight: "bold",
    marginHorizontal: 20,
    textAlign: "center",
  },
  ctaButton: {
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    height: 50,
    marginHorizontal: 20,
    marginBottom: 5,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#0056D3",
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  connectedDeviceContainer: {
    backgroundColor: "#6C757D",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  connectedDeviceInfo: {
    alignItems: "center",
    marginBottom: 15,
  },
  connectedDeviceText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  connectedDeviceId: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
  },
  disconnectButton: {
    backgroundColor: "#FF6060",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#CC4848",
  },
  disconnectButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});

export default Page;
