import * as Crypto from "expo-crypto";
import { decode, encode } from "base-64";

declare global {
  var nativeModuleProxy: any;
}

// Polyfill for Gifted Chat
if (!global.btoa) global.btoa = encode;
if (!global.atob) global.atob = decode;

// Mock the native module expected by Gifted Chat
global.nativeModuleProxy = {
  ...global.nativeModuleProxy,
  ExponentUtil: {
    getRandomBase64String: async (length: number) => {
      const bytes = await Crypto.getRandomBytesAsync(length);
      return Buffer.from(bytes).toString("base64");
    },
  },
};

import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import Colors from "@/constants/Colors";
import { BLEProvider } from "@/util/contextBLE";
import { ChatProvider } from "@/util/contextChat";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const InitialLayout = () => {
  const router = useRouter();
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    if (loaded) {
      setTimeout(() => {
        router.replace("/(tabs)/chats");
      }, 2000);
    }
  }, [loaded]);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="(modals)/new-chat"
        options={{
          presentation: "modal",
          title: "New Chat",
          headerTransparent: true,
          headerBlurEffect: "regular",
          headerStyle: {
            backgroundColor: Colors.background,
          },
        }}
      />
      <Stack.Screen
        name="(modals)/ble-connection"
        options={{
          presentation: "modal",
          title: "New Connection",
          headerTransparent: true,
          headerBlurEffect: "regular",
          headerStyle: {
            backgroundColor: Colors.background,
          },
        }}
      />
    </Stack>
  );
};

const RootLayoutNav = () => {
  return (
    <ChatProvider>
      <BLEProvider>
        <InitialLayout />
      </BLEProvider>
    </ChatProvider>
  );
};

export default RootLayoutNav;
