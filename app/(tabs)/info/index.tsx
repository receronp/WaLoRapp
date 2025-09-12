import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";

const Page = () => {
  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error("Failed to open link:", error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }}
      >
        {/* Project Header */}
        <View style={styles.section}>
          <Text style={styles.title}>WaLoRapp</Text>
          <Text style={styles.subtitle}>LoRa Communication App</Text>
          <Text style={styles.description}>
            A React Native application that enables communication through LoRa
            networks using BLE connectivity, designed for low-power, long-range
            communication scenarios.
          </Text>
          <Text style={styles.credits}>
            Developed by <Text style={styles.bold}>Raul Ceron</Text> with special thanks to{" "}
            <Text style={styles.bold}>Dr. Pietro Manzoni</Text> and{" "}
            <Text style={styles.bold}>Dr. Benjamin Arratia</Text> for their guidance and support.
          </Text>
        </View>

        {/* Related Projects */}
        <TouchableOpacity 
          style={styles.section}
          onPress={() => router.push('/related-projects' as any)}
        >
          <View style={styles.menuItem}>
            <Ionicons name="code-slash" size={20} color={Colors.primary} />
            <Text style={styles.menuText}>Related Projects</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.gray} />
          </View>
        </TouchableOpacity>

        {/* Software & Firmware */}
        <TouchableOpacity 
          style={styles.section}
          onPress={() => router.push('/software-firmware' as any)}
        >
          <View style={styles.menuItem}>
            <Ionicons name="layers" size={20} color={Colors.primary} />
            <Text style={styles.menuText}>Software & Firmware</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.gray} />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: "#fff",
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.primary,
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: "center",
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
  description: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
  },
  bold: {
    fontWeight: "600",
    color: Colors.primary,
  },
  credits: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginTop: 16,
    textAlign: "center",
    fontStyle: "italic",
  },
  linkItem: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  linkContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  linkText: {
    flex: 1,
    marginLeft: 12,
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: 2,
  },
  linkDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  techList: {
    marginTop: 8,
  },
  techItem: {
    fontSize: 15,
    color: "#666",
    marginVertical: 2,
    lineHeight: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  menuText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
    marginLeft: 12,
  },
});

export default Page;
