import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { Link, Stack, useLocalSearchParams, usePathname } from "expo-router";
import { TouchableOpacity, View, Text, Image, StyleSheet } from "react-native";
import { deviceName } from "expo-device";
import { useChatContext } from "@/util/contextChat";
import { useEffect, useState } from "react";

const Layout = () => {
  const { id } = useLocalSearchParams();
  const pathname = usePathname();
  const { configuredChats } = useChatContext();
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
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Chats",
          headerLargeTitle: true,
          headerTransparent: true,
          headerBlurEffect: "regular",
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
              <Link href="/(modals)/ble-connection" asChild>
                <TouchableOpacity>
                  <Ionicons
                    name="bluetooth-outline"
                    color={Colors.primary}
                    size={30}
                  />
                </TouchableOpacity>
              </Link>
              <View style={styles.container}>
                <Image
                  source={require("@/assets/images/logo.png")}
                  style={styles.logo}
                />
              </View>
              <Link href="/(modals)/new-chat" asChild>
                <TouchableOpacity>
                  <Ionicons
                    name="add-circle"
                    color={Colors.primary}
                    size={30}
                  />
                </TouchableOpacity>
              </Link>
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
});

export default Layout;
