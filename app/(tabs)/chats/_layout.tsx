import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { Link, Stack } from "expo-router";
import { TouchableOpacity, View, Text, Image, StyleSheet } from "react-native";
import logoImage from "@/assets/images/logo.png";
const logo_image = Image.resolveAssetSource(logoImage).uri;

const Layout = () => {
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
              <Image
                source={{
                  uri: "https://pbs.twimg.com/profile_images/1564203599747600385/f6Lvcpcu_400x400.jpg",
                }}
                style={{ width: 40, height: 40, borderRadius: 50 }}
              />
              <Text style={{ fontSize: 16, fontWeight: "500" }}>
                Simon Grimm
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
