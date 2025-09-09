import { View, Text, StyleSheet, TextInput } from "react-native";
import Colors from "@/constants/Colors";

const Page = () => {
  return (
    <View
      style={{ flex: 1, paddingTop: 50, backgroundColor: Colors.background }}
    >
      <View style={{ paddingHorizontal: 14, marginVertical: 16 }}>
        <Text style={{ marginBottom: 8, fontWeight: "bold" }}>
          Enter remote device MAC address:
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TextInput
            style={styles.input}
            placeholder="e.g. 1A2B3C4D"
            maxLength={8}
            autoCapitalize="characters"
            keyboardType="default"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    flex: 1,
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    fontSize: 16,
  },
});

export default Page;
