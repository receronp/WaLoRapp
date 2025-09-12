import { useEffect, useRef } from "react";
import { View, FlatList, Text, Animated } from "react-native";
import ChatRow from "@/components/ChatRow";
import { defaultStyles } from "@/constants/Styles";
import { useChatContext } from "@/util/contextChat";
import Ionicons from "@expo/vector-icons/build/Ionicons";

const Page = () => {
  const { configuredChats, removeConfiguredChat } = useChatContext();

  // Animation for empty state
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, []);

  const allChats = [...configuredChats];

  const handleArchiveChat = async (chatId: string) => {
    await removeConfiguredChat(chatId);
  };

  if (allChats.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
          paddingHorizontal: 40,
        }}
      >
        <View
          style={{
            alignItems: "center",
            opacity: 0.7,
          }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: "600",
              color: "#333",
              marginBottom: 12,
              textAlign: "center",
            }}
          >
            No chats yet
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: "#666",
              textAlign: "center",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 30,
              lineHeight: 22,
            }}
          >
            Start a new conversation by tapping the{" "}
            <Ionicons name="add-circle" size={16} color="#666" /> at the top
            right.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ backgroundColor: "#fff" }}
      style={{ flex: 1 }}
      data={allChats}
      renderItem={({ item }) => (
        <ChatRow {...item} onArchive={() => handleArchiveChat(item.id)} />
      )}
      keyExtractor={(item) => item.id.toString()}
      ItemSeparatorComponent={() => (
        <View style={[defaultStyles.separator, { marginLeft: 90 }]} />
      )}
    />
  );
};

export default Page;
