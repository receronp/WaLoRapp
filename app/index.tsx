import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import logoImage from "@/assets/images/logo.png";
const logo_image = Image.resolveAssetSource(logoImage).uri;

const WelcomeScreen = () => {
  return (
    <View style={styles.container}>
      <Image source={{ uri: logo_image }} style={styles.logo} />
      <Text style={styles.headline}>Welcome to WaLoRapp</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  logo: {
    width: "100%",
    height: 200,
    borderRadius: 60,
    marginBottom: 80,
  },
  headline: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 20,
  },
});

export default WelcomeScreen;
