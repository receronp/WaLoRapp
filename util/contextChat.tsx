import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IMessage } from "react-native-gifted-chat";

export interface ConfiguredChat {
  id: string;
  from: string;
  deviceName: string;
  macAddress: string;
  date: string;
  img: string;
  msg: string;
  read: boolean;
  unreadCount: number;
}

interface ChatContextType {
  configuredChats: ConfiguredChat[];
  addConfiguredChat: (deviceName: string, macAddress: string) => Promise<void>;
  removeConfiguredChat: (chatId: string) => Promise<void>;
  updateChatLastMessage: (chatId: string, message: string) => Promise<void>;
  getConfiguredChat: (deviceId: string) => ConfiguredChat | undefined;
  getChatMessages: (chatId: string) => Promise<IMessage[]>;
  saveChatMessages: (chatId: string, messages: IMessage[]) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const STORAGE_KEY = "configured_chats";
const MESSAGES_STORAGE_KEY = "chat_messages_";

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [configuredChats, setConfiguredChats] = useState<ConfiguredChat[]>([]);

  // Load configured chats from storage on app start
  useEffect(() => {
    loadConfiguredChats();
  }, []);

  const loadConfiguredChats = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setConfiguredChats(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load configured chats:", error);
    }
  };

  const saveConfiguredChats = async (chats: ConfiguredChat[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    } catch (error) {
      console.error("Failed to save configured chats:", error);
    }
  };

  const addConfiguredChat = async (deviceName: string, macAddress: string) => {
    const chatId = `${deviceName}_${macAddress}`
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");

    // Check if chat already exists
    const existingChat = configuredChats.find((chat) => chat.id === chatId);
    if (existingChat) {
      console.log("Chat already exists:", chatId);
      return;
    }

    const newChat: ConfiguredChat = {
      id: chatId,
      from: deviceName,
      deviceName,
      macAddress,
      date: new Date().toISOString(),
      img: `https://i.pravatar.cc/150?u=${deviceName.toLowerCase()}`,
      msg: "Endpoint configured - ready to chat!",
      read: true,
      unreadCount: 0,
    };

    const updatedChats = [newChat, ...configuredChats];
    setConfiguredChats(updatedChats);
    await saveConfiguredChats(updatedChats);
  };

  const removeConfiguredChat = async (chatId: string) => {
    const updatedChats = configuredChats.filter((chat) => chat.id !== chatId);
    setConfiguredChats(updatedChats);
    await saveConfiguredChats(updatedChats);
    
    // Also remove the stored messages for this chat
    try {
      await AsyncStorage.removeItem(MESSAGES_STORAGE_KEY + chatId);
    } catch (error) {
      console.error("Failed to remove chat messages:", error);
    }
  };

  const updateChatLastMessage = async (chatId: string, message: string) => {
    const updatedChats = configuredChats.map((chat) =>
      chat.id === chatId
        ? {
            ...chat,
            msg: message,
            date: new Date().toISOString(),
            read: false,
            unreadCount: chat.unreadCount + 1,
          }
        : chat
    );
    setConfiguredChats(updatedChats);
    await saveConfiguredChats(updatedChats);
  };

  const getConfiguredChat = (deviceId: string) => {
    return configuredChats.find((chat) => 
      chat.deviceName.toLowerCase() === deviceId.toLowerCase() ||
      chat.id.toLowerCase() === deviceId.toLowerCase()
    );
  };

  const getChatMessages = async (chatId: string): Promise<IMessage[]> => {
    try {
      const stored = await AsyncStorage.getItem(MESSAGES_STORAGE_KEY + chatId);
      if (stored) {
        return JSON.parse(stored);
      }
      return [];
    } catch (error) {
      console.error("Failed to load chat messages:", error);
      return [];
    }
  };

  const saveChatMessages = async (chatId: string, messages: IMessage[]) => {
    try {
      await AsyncStorage.setItem(MESSAGES_STORAGE_KEY + chatId, JSON.stringify(messages));
      
      // Update the latest message in the chat list
      if (messages.length > 0) {
        const latestMessage = messages[0]; // GiftedChat keeps the latest message at index 0
        await updateChatLastMessage(chatId, latestMessage.text);
      }
    } catch (error) {
      console.error("Failed to save chat messages:", error);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        configuredChats,
        addConfiguredChat,
        removeConfiguredChat,
        updateChatLastMessage,
        getConfiguredChat,
        getChatMessages,
        saveChatMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
};
