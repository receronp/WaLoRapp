import ChatMessageBox from "@/components/ChatMessageBox";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  ImageBackground,
  KeyboardAvoidingView,
  StyleSheet,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import {
  GiftedChat,
  Bubble,
  InputToolbar,
  Send,
  SystemMessage,
  IMessage,
} from "react-native-gifted-chat";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBLEContext } from "@/util/contextBLE";
import { useChatContext } from "@/util/contextChat";
import { useLocalSearchParams } from "expo-router";

const Page = () => {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [text, setText] = useState("");
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [replyMessage, setReplyMessage] = useState<IMessage | null>(null);
  const swipeableRowRef = useRef<Swipeable | null>(null);
  const lastProcessedLoraMsg = useRef<string>("");

  const { connectedDevice, writeToDevice, loraMsg } = useBLEContext();
  const { getChatMessages, saveChatMessages } = useChatContext();

  useEffect(() => {
    const loadMessages = async () => {
      if (id) {
        const savedMessages = await getChatMessages(id);
        if (savedMessages.length > 0) {
          setMessages(savedMessages);
        } else {
          // Set initial system message if no messages exist
          const initialMessages = [
            {
              _id: 0,
              system: true,
              text: "Messages sent using LoRa",
              createdAt: new Date(),
              user: {
                _id: 0,
                name: "Bot",
              },
            },
          ];
          setMessages(initialMessages);
          // Save the initial message
          saveChatMessages(id, initialMessages);
        }
      }
    };

    loadMessages();
  }, [id]);

  // Add new message when loraMsg changes and is not empty
  useEffect(() => {
    if (
      loraMsg &&
      loraMsg.trim() !== "" &&
      loraMsg !== lastProcessedLoraMsg.current
    ) {
      lastProcessedLoraMsg.current = loraMsg;
      const newMessage: IMessage = {
        _id: Math.random().toString(36).substring(7), // Generate unique ID
        text: loraMsg,
        createdAt: new Date(),
        user: {
          _id: 2, // Different user ID to distinguish from current user
          name: "LoRa Device",
        },
      };

      setMessages((previousMessages) => {
        const updatedMessages = GiftedChat.append(previousMessages, [
          newMessage,
        ]);

        // Save messages to storage
        if (id) {
          saveChatMessages(id, updatedMessages);
        }
        return updatedMessages;
      });
    }
  }, [loraMsg, id]);

  const onSend = useCallback(
    (messages: IMessage[] = []) => {
      setMessages((previousMessages: any[]) => {
        const updatedMessages = GiftedChat.append(previousMessages, messages);

        // Save messages to storage
        if (id) {
          saveChatMessages(id, updatedMessages);
        }
        return updatedMessages;
      });
      if (connectedDevice && messages.length > 0) {
        writeToDevice(connectedDevice, messages[0].text);
      }
      setText("");
    },
    [connectedDevice, writeToDevice, id, saveChatMessages]
  );

  const renderInputToolbar = (props: any) => {
    return (
      <InputToolbar
        {...props}
        containerStyle={{ backgroundColor: Colors.background }}
        renderActions={() => (
          <View
            style={{
              height: 44,
              justifyContent: "center",
              alignItems: "center",
              left: 5,
            }}
          >
            <Ionicons name="add" color={Colors.primary} size={28} />
          </View>
        )}
      />
    );
  };

  const updateRowRef = useCallback(
    (ref: any) => {
      if (
        ref &&
        replyMessage &&
        ref.props.children.props.currentMessage?._id === replyMessage._id
      ) {
        swipeableRowRef.current = ref;
      }
    },
    [replyMessage]
  );

  useEffect(() => {
    if (replyMessage && swipeableRowRef.current) {
      swipeableRowRef.current.close();
      swipeableRowRef.current = null;
    }
  }, [replyMessage]);

  return (
    <ImageBackground
      source={require("@/assets/images/pattern.png")}
      style={{
        flex: 1,
        backgroundColor: Colors.background,
        marginBottom: insets.bottom,
      }}
    >
      <KeyboardAvoidingView style={{ flex: 1 }}>
        <GiftedChat
          messages={messages}
          onSend={(messages: any) => onSend(messages)}
          onInputTextChanged={setText}
          timeTextStyle={{
            right: { color: Colors.gray },
            left: { color: Colors.gray },
          }}
          user={{
            _id: 1,
          }}
          renderSystemMessage={(props) => (
            <SystemMessage {...props} textStyle={{ color: Colors.gray }} />
          )}
          renderAvatar={null}
          maxComposerHeight={100}
          textInputProps={styles.composer}
          renderBubble={(props) => {
            return (
              <Bubble
                {...props}
                textStyle={{
                  right: {
                    color: "#000",
                  },
                }}
                wrapperStyle={{
                  left: {
                    backgroundColor: "#fff",
                  },
                  right: {
                    backgroundColor: Colors.lightGreen,
                  },
                }}
              />
            );
          }}
          renderSend={(props) => (
            <View
              style={{
                height: 44,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
                paddingHorizontal: 14,
              }}
            >
              {text !== "" && (
                <Send
                  {...props}
                  containerStyle={{
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="send" color={Colors.primary} size={28} />
                </Send>
              )}
            </View>
          )}
          renderInputToolbar={renderInputToolbar}
          renderMessage={(props) => (
            <ChatMessageBox
              {...props}
              setReplyOnSwipeOpen={setReplyMessage}
              updateRowRef={updateRowRef}
            />
          )}
        />
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  composer: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 4,
    fontSize: 16,
    marginVertical: 4,
  },
});

export default Page;
