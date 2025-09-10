import { View, Text, ScrollView, FlatList } from "react-native";
import chats from "@/assets/data/chats.json";
import ChatRow from "@/components/ChatRow";
import { defaultStyles } from "@/constants/Styles";
import { useChatContext } from "@/util/contextChat";

const Page = () => {
  const { configuredChats } = useChatContext();

  // Combine configured chats with static chats, with configured chats first
  const allChats = [...configuredChats, ...chats];

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ backgroundColor: "#fff" }}
      style={{ flex: 1 }}
      data={allChats}
      renderItem={({ item }) => <ChatRow {...item} />}
      keyExtractor={(item) => item.id.toString()}
      ItemSeparatorComponent={() => (
        <View style={[defaultStyles.separator, { marginLeft: 90 }]} />
      )}
    />
  );
};
export default Page;
