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
      <Text style={modalStyle.ctaButtonText}>{device.localName}</Text>
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
      <Text style={modalStyle.modalTitleText}>Tap on a device to connect</Text>
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
    backgroundColor: "#FF6060",
    justifyContent: "center",
    alignItems: "center",
    height: 50,
    marginHorizontal: 20,
    marginBottom: 5,
    borderRadius: 8,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
});

export default Page;
