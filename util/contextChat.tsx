import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const STORAGE_KEY = "configured_chats";

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

  return (
    <ChatContext.Provider
      value={{
        configuredChats,
        addConfiguredChat,
        removeConfiguredChat,
        updateChatLastMessage,
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
