import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";

const RelatedProjectsPage = () => {
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Related Projects</Text>
          <Text style={styles.subtitle}>SMARTLAGOON Initiative</Text>
          <Text style={styles.description}>
            This application builds upon foundational projects from the
            SMARTLAGOON research initiative, which focuses on innovative IoT
            solutions for environmental monitoring and smart city applications.
          </Text>
        </View>

        {/* SMLG_AlLoRa Project */}
        <View style={styles.projectSection}>
          <View style={styles.projectHeader}>
            <Ionicons name="radio" size={24} color={Colors.primary} />
            <Text style={styles.projectTitle}>SMLG_AlLoRa</Text>
          </View>

          <Text style={styles.projectDescription}>
            A comprehensive LoRa communication framework that provides the core
            networking capabilities for long-range, low-power IoT applications.
            This framework serves as the foundation for the LoRa communication
            protocol used in WaLoRapp.
          </Text>

          <View style={styles.featureList}>
            <Text style={styles.featureTitle}>Key Features:</Text>
            <Text style={styles.featureItem}>
              • Long-range wireless communication (up to 15km)
            </Text>
            <Text style={styles.featureItem}>
              • Ultra-low power consumption
            </Text>
            <Text style={styles.featureItem}>
              • Robust mesh networking capabilities
            </Text>
            <Text style={styles.featureItem}>
              • Adaptive data rate optimization
            </Text>
            <Text style={styles.featureItem}>
              • Built-in error correction and reliability
            </Text>
          </View>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() =>
              openLink("https://github.com/SMARTLAGOON/SMLG_AlLoRa")
            }
          >
            <View style={styles.linkContent}>
              <Ionicons name="logo-github" size={20} color="white" />
              <Text style={styles.linkButtonText}>View on GitHub</Text>
              <Ionicons name="open-outline" size={16} color="white" />
            </View>
          </TouchableOpacity>
        </View>

        {/* BODOQUE Project */}
        <View style={styles.projectSection}>
          <View style={styles.projectHeader}>
            <Ionicons name="hardware-chip" size={24} color={Colors.primary} />
            <Text style={styles.projectTitle}>BODOQUE</Text>
          </View>

          <Text style={styles.projectDescription}>
            An edge computing and sensor integration platform designed for
            real-time data processing and intelligent decision-making at the
            network edge. BODOQUE inspired the device communication architecture
            and data processing patterns used in WaLoRapp.
          </Text>

          <View style={styles.featureList}>
            <Text style={styles.featureTitle}>Key Features:</Text>
            <Text style={styles.featureItem}>
              • Edge AI and machine learning capabilities
            </Text>
            <Text style={styles.featureItem}>• Multi-sensor data fusion</Text>
            <Text style={styles.featureItem}>
              • Real-time video and image processing
            </Text>
            <Text style={styles.featureItem}>
              • Distributed computing architecture
            </Text>
            <Text style={styles.featureItem}>
              • Energy-efficient processing algorithms
            </Text>
          </View>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => openLink("https://github.com/SMARTLAGOON/BODOQUE")}
          >
            <View style={styles.linkContent}>
              <Ionicons name="logo-github" size={20} color="white" />
              <Text style={styles.linkButtonText}>View on GitHub</Text>
              <Ionicons name="open-outline" size={16} color="white" />
            </View>
          </TouchableOpacity>
        </View>

        {/* SMARTLAGOON Initiative */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="leaf" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>About SMARTLAGOON</Text>
          </View>
          <Text style={styles.description}>
            SMARTLAGOON is a research initiative focused on developing
            innovative IoT solutions for environmental monitoring, smart cities,
            and sustainable technology applications. The project emphasizes
            energy-efficient communication protocols, edge computing, and
            intelligent sensor networks.
          </Text>

          <View style={styles.objectiveList}>
            <Text style={styles.objectiveTitle}>Research Objectives:</Text>
            <Text style={styles.objectiveItem}>
              🌊 Marine and coastal ecosystem monitoring
            </Text>
            <Text style={styles.objectiveItem}>
              📡 Long-range communication technologies
            </Text>
            <Text style={styles.objectiveItem}>
              🔋 Energy-efficient IoT solutions
            </Text>
            <Text style={styles.objectiveItem}>
              🧠 Edge AI and distributed computing
            </Text>
            <Text style={styles.objectiveItem}>
              🌍 Sustainable technology development
            </Text>
          </View>
        </View>

        {/* Integration in WaLoRapp */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="link" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Integration in WaLoRapp</Text>
          </View>
          <Text style={styles.description}>
            WaLoRapp incorporates key concepts and technologies from both
            SMARTLAGOON projects:
          </Text>

          <View style={styles.integrationList}>
            <View style={styles.integrationItem}>
              <Text style={styles.integrationProject}>From SMLG_AlLoRa:</Text>
              <Text style={styles.integrationDetail}>
                LoRa communication protocols, mesh networking concepts, and
                adaptive transmission strategies
              </Text>
            </View>
            <View style={styles.integrationItem}>
              <Text style={styles.integrationProject}>From BODOQUE:</Text>
              <Text style={styles.integrationDetail}>
                Device communication patterns, data processing architecture, and
                edge computing principles
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#fff",
    marginVertical: 8,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.gray,
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
    textAlign: "center",
  },
  projectSection: {
    backgroundColor: "#fff",
    marginVertical: 8,
    borderRadius: 12,
    padding: 20,
  },
  projectHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  projectTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.primary,
    marginLeft: 12,
  },
  projectDescription: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
    marginBottom: 16,
  },
  featureList: {
    marginBottom: 20,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  featureItem: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginVertical: 2,
  },
  linkButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 12,
  },
  linkContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  linkButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 8,
  },
  section: {
    backgroundColor: "#fff",
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
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
  objectiveList: {
    marginTop: 12,
  },
  objectiveTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  objectiveItem: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
    marginVertical: 2,
  },
  integrationList: {
    marginTop: 12,
  },
  integrationItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  integrationProject: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: 4,
  },
  integrationDetail: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
});

export default RelatedProjectsPage;
