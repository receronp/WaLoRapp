import { View, Text, ScrollView, FlatList } from "react-native";
import chats from "@/assets/data/chats.json";
import ChatRow from "@/components/ChatRow";
import { defaultStyles } from "@/constants/Styles";
import { useChatContext } from "@/util/contextChat";

const Page = () => {
  const { configuredChats, removeConfiguredChat } = useChatContext();

  // Combine configured chats with static chats, with configured chats first
  const allChats = [...configuredChats, ...chats];

  const handleArchiveChat = async (chatId: string) => {
    await removeConfiguredChat(chatId);
  };

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ backgroundColor: "#fff" }}
      style={{ flex: 1 }}
      data={allChats}
      renderItem={({ item }) => (
        <ChatRow 
          {...item} 
          onArchive={() => handleArchiveChat(item.id)} 
        />
      )}
      keyExtractor={(item) => item.id.toString()}
      ItemSeparatorComponent={() => (
        <View style={[defaultStyles.separator, { marginLeft: 90 }]} />
      )}
    />
  );
};
export default Page;
