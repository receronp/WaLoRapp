import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { Link, Stack, useLocalSearchParams, usePathname, router } from "expo-router";
import { TouchableOpacity, View, Text, Image, StyleSheet, Alert } from "react-native";
import { deviceName } from "expo-device";
import { useChatContext } from "@/util/contextChat";
import { useBLEContext } from "@/util/contextBLE";
import { useEffect, useState } from "react";

const Layout = () => {
  const { id } = useLocalSearchParams();
  const pathname = usePathname();
  const { configuredChats } = useChatContext();
  const { connectedDevice } = useBLEContext();
  const [displayName, setDisplayName] = useState<string>("Loading...");

  // Extract chat ID from pathname as a more reliable method
  const extractChatIdFromPath = () => {
    // Pathname should be something like "/(tabs)/chats/pietro_da5a17b4"
    const pathParts = pathname.split("/");
    const chatsIndex = pathParts.findIndex((part) => part === "chats");
    if (chatsIndex !== -1 && pathParts[chatsIndex + 1]) {
      return pathParts[chatsIndex + 1];
    }
    return null;
  };

  const chatId = (id as string) || extractChatIdFromPath();

  // Immediate check when component mounts or data changes
  useEffect(() => {
    if (chatId) {
      const currentChat = configuredChats.find((chat) => chat.id === chatId);

      if (currentChat) {
        setDisplayName(currentChat.from);
      } else {
        // Fallback: Extract from chat ID
        if (chatId.includes("_")) {
          const parts = chatId.split("_");
          if (parts.length > 0) {
            const fallbackName =
              parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
            setDisplayName(fallbackName);
          }
        } else {
          setDisplayName(deviceName || "Device");
        }
      }
    } else {
      setDisplayName("Device");
    }
  }, [chatId, configuredChats]);

  const getEndpointDisplayName = () => {
    return displayName;
  };

  const handleNewChatPress = () => {
    if (!connectedDevice) {
      Alert.alert(
        "BLE Connection Required",
        "Please connect to a BLE device first before creating a new chat.",
        [
          {
            text: "Connect to BLE",
            onPress: () => {
              router.push("/(modals)/ble-connection");
            },
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
    } else {
      router.push("/(modals)/new-chat");
    }
  };
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Chats",
          headerLargeTitle: true,
          headerTransparent: true,
          headerBlurEffect: "regular",
          headerBackVisible: false,
          headerTitle: () => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flex: 1,
                justifyContent: "space-between",
                height: 40,
              }}
            >
              <View style={styles.leftSection}>
                <Link href="/(modals)/ble-connection" asChild>
                  <TouchableOpacity>
                    <Ionicons
                      name="bluetooth-outline"
                      color={Colors.primary}
                      size={30}
                    />
                  </TouchableOpacity>
                </Link>
                {connectedDevice && (
                  <Text style={styles.connectionStatus}>
                    {connectedDevice.localName || connectedDevice.name || "Connected"}
                  </Text>
                )}
              </View>
              <View style={styles.container}>
                <Image
                  source={require("@/assets/images/logo.png")}
                  style={styles.logo}
                />
              </View>
              <TouchableOpacity onPress={handleNewChatPress}>
                <Ionicons
                  name="add-circle"
                  color={Colors.primary}
                  size={30}
                />
              </TouchableOpacity>
            </View>
          ),
          headerStyle: {
            backgroundColor: "#fff",
          },
        }}
      />

      <Stack.Screen
        name="[id]"
        options={{
          title: "",
          headerTitle: () => (
            <View
              style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingBottom: 4,
              flex: 1,
              justifyContent: "center",
              }}
            >
              <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: Colors.primary,
                justifyContent: "center",
                alignItems: "center",
              }}
              >
              <Text
                style={{
                color: "white",
                fontSize: 18,
                fontWeight: "bold",
                }}
              >
                {getEndpointDisplayName()?.charAt(0)?.toUpperCase() || "D"}
              </Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: "500" }}>
              {getEndpointDisplayName()}
              </Text>
            </View>
          ),
          headerRight: () => (
            <View style={styles.rightSection}>
              <Link href="/(modals)/ble-connection" asChild>
                <TouchableOpacity>
                  <Ionicons
                    name="bluetooth-outline"
                    color={Colors.primary}
                    size={24}
                  />
                </TouchableOpacity>
              </Link>
              {connectedDevice && (
                <Text style={styles.connectionStatusSmall}>
                  {connectedDevice.localName || connectedDevice.name || "Connected"}
                </Text>
              )}
            </View>
          ),
          headerStyle: {
            backgroundColor: Colors.background,
          },
        }}
      />
    </Stack>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: "100%",
    height: 40,
    resizeMode: "contain",
  },
  leftSection: {
    alignItems: "center",
    minWidth: 60,
  },
  rightSection: {
    alignItems: "center",
    minWidth: 60,
  },
  connectionStatus: {
    fontSize: 10,
    color: Colors.primary,
    marginTop: 2,
    textAlign: "center",
    fontWeight: "500",
  },
  connectionStatusSmall: {
    fontSize: 8,
    color: Colors.primary,
    marginTop: 1,
    textAlign: "center",
    fontWeight: "500",
  },
});

export default Layout;
