import { View, Text, ScrollView, FlatList } from "react-native";
import chats from "@/assets/data/chats.json";
import ChatRow from "@/components/ChatRow";
import { defaultStyles } from "@/constants/Styles";

const Page = () => {
  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ backgroundColor: "#fff" }}
      style={{ flex: 1 }}
      data={chats}
      renderItem={({ item }) => <ChatRow {...item} />}
      keyExtractor={(item) => item.id.toString()}
      ItemSeparatorComponent={() => (
        <View style={[defaultStyles.separator, { marginLeft: 90 }]} />
      )}
    />
  );
};
export default Page;
