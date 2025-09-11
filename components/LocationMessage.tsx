import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";

interface LocationMessageProps {
  latitude: number;
  longitude: number;
  onPress?: () => void;
}

const LocationMessage: React.FC<LocationMessageProps> = ({
  latitude,
  longitude,
  onPress,
}) => {
  const openInMaps = () => {
    const url = `https://maps.google.com/?q=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress || openInMaps}>
      <View style={styles.header}>
        <Ionicons name="location" size={20} color={Colors.primary} />
        <Text style={styles.title}>Location</Text>
      </View>
      <Text style={styles.coordinates}>
        {latitude.toFixed(6)}, {longitude.toFixed(6)}
      </Text>
      <View style={styles.footer}>
        <Ionicons name="map-outline" size={16} color={Colors.gray} />
        <Text style={styles.footerText}>Tap to view in maps</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    padding: 12,
    maxWidth: 250,
    minWidth: 200,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    color: Colors.primary,
  },
  coordinates: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
    fontFamily: "monospace",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: Colors.gray,
    marginLeft: 4,
  },
});

export default LocationMessage;
