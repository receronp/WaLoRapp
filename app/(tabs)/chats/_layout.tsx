import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import { TouchableOpacity, View, Text, Image, StyleSheet } from "react-native";
import logoImage from "@/assets/images/logo.png";
import { deviceName } from "expo-device";
const logo_image = Image.resolveAssetSource(logoImage).uri;

const Layout = () => {
  const { id } = useLocalSearchParams();
  console.log("Chat ID:", id);

  // Extract endpoint name from chat ID
  const getEndpointDisplayName = () => {
    // Get the actual chat ID from route parameters
    const chatId = id as string;
    console.log("Extracted chat ID:", chatId);

    if (chatId && chatId.includes("_")) {
      // Chat ID format is "{deviceName}_{macAddress}" converted to lowercase and cleaned
      // Try to extract the device name part before the underscore
      const parts = chatId.split("_");
      if (parts.length > 0) {
        // Capitalize first letter and return the device name part
        const deviceName = parts[0];
        return deviceName.charAt(0).toUpperCase() + deviceName.slice(1);
      }
    }

    return deviceName; // Default name
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
                <Image source={{ uri: logo_image }} style={styles.logo} />
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
                width: 220,
                alignItems: "center",
                gap: 10,
                paddingBottom: 4,
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
                  {getEndpointDisplayName().charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: "500" }}>
                {getEndpointDisplayName()}
              </Text>
              <View style={{ flex: 1 }} />
              <View style={{ flexDirection: "row", gap: 20, marginLeft: 10 }}>
                <TouchableOpacity>
                  <Ionicons
                    name="videocam-outline"
                    color={Colors.primary}
                    size={30}
                  />
                </TouchableOpacity>
                <TouchableOpacity>
                  <Ionicons
                    name="call-outline"
                    color={Colors.primary}
                    size={30}
                  />
                </TouchableOpacity>
              </View>
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
