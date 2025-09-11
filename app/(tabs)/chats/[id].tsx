import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import {
  ImageBackground,
  KeyboardAvoidingView,
  StyleSheet,
  View,
  Alert,
  TouchableOpacity,
  Modal,
  Text,
  Dimensions,
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
import { useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";
import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";

import ChatMessageBox from "@/components/ChatMessageBox";
import LocationMessage from "@/components/LocationMessage";
import FileMessage from "@/components/FileMessage";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useBLEContext } from "@/util/contextBLE";
import { useChatContext } from "@/util/contextChat";

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MODAL_CLOSE_DELAY = 300; // milliseconds
const FILE_PICKER_RESET_DELAY = 500; // milliseconds

// Message prefixes
const MESSAGE_PREFIXES = {
  FILE_DATA: "FILE_DATA:",
  FILE: "FILE:",
  LOCATION: "📍 Location: ",
} as const;

// User IDs
const USER_IDS = {
  SYSTEM: 0,
  CURRENT: 1,
  LORA_DEVICE: 2,
} as const;

// UI Constants
const UI_CONSTANTS = {
  ICON_SIZE: 28,
  ACTION_ICON_SIZE: 24,
  SEND_CONTAINER_HEIGHT: 44,
  COMPOSER_BORDER_RADIUS: 18,
  MODAL_BORDER_RADIUS: 20,
  ACTION_BUTTON_BORDER_RADIUS: 12,
} as const;

// Message patterns
const MESSAGE_PATTERNS = {
  LOCATION: /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/,
  LOCATION_URL: /q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
} as const;

// File types
interface FilePickerResult {
  name: string;
  size?: number;
  uri: string;
  mimeType?: string;
}

interface ChatState {
  messages: IMessage[];
  text: string;
  showActionsModal: boolean;
  isFilePickerActive: boolean;
  replyMessage: IMessage | null;
}

/**
 * Chat page component for handling messaging with BLE/LoRa devices.
 *
 * Features:
 * - Real-time messaging via BLE/LoRa
 * - File sharing with base64 encoding
 * - Location sharing with coordinates
 * - Auto-configuration for device endpoints
 * - Message persistence with local storage
 * - Responsive UI with accessibility support
 * - File picker with size validation
 * - Swipe-to-reply functionality
 *
 * Performance optimizations:
 * - Memoized callbacks to prevent unnecessary re-renders
 * - Centralized state management
 * - Efficient message handling and storage
 * - Background file operations
 */
const Page: React.FC = () => {
  // State management
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    text: "",
    showActionsModal: false,
    isFilePickerActive: false,
    replyMessage: null,
  });

  // Hooks
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Refs for managing component lifecycle and state
  const swipeableRowRef = useRef<Swipeable | null>(null);
  const lastProcessedLoraMsg = useRef<string>("");
  const autoConfigured = useRef<string | null>(null);

  // Context hooks
  const {
    connectedDevice,
    writeToDevice,
    writeFileToDevice,
    loraMsg,
    configureEndpoint,
  } = useBLEContext();
  const { getChatMessages, saveChatMessages } = useChatContext();

  // Memoized helper functions
  const generateMessageId = useCallback((): string => {
    return Math.random().toString(36).substring(7);
  }, []);

  const createInitialMessage = useCallback(
    (): IMessage => ({
      _id: 0,
      system: true,
      text: "Messages sent using LoRa",
      createdAt: new Date(),
      user: {
        _id: USER_IDS.SYSTEM,
        name: "Bot",
      },
    }),
    []
  );

  const updateChatState = useCallback((updates: Partial<ChatState>) => {
    setChatState((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateMessages = useCallback(
    (updater: (messages: IMessage[]) => IMessage[]) => {
      setChatState((prev) => ({ ...prev, messages: updater(prev.messages) }));
    },
    []
  );

  // Load messages on component mount
  useEffect(() => {
    const loadMessages = async (): Promise<void> => {
      if (!id) return;

      try {
        const savedMessages = await getChatMessages(id);
        if (savedMessages.length > 0) {
          updateChatState({ messages: savedMessages });
        } else {
          // Set initial system message if no messages exist
          const initialMessages = [createInitialMessage()];
          updateChatState({ messages: initialMessages });
          await saveChatMessages(id, initialMessages);
        }
      } catch (error) {
        console.error("Error loading messages:", error);
      }
    };

    loadMessages();
  }, [
    id,
    getChatMessages,
    saveChatMessages,
    updateChatState,
    createInitialMessage,
  ]);

  // Process incoming LoRa messages
  const processLoRaMessage = useCallback((loraMsg: string): string => {
    // Check if the message contains location coordinates
    const locationMatch = loraMsg.match(MESSAGE_PATTERNS.LOCATION);
    if (locationMatch) {
      const [, lat, lng] = locationMatch;
      return `📍 Received Location: https://maps.google.com/?q=${lat},${lng}`;
    }

    // Check for different message types
    if (loraMsg === "📷 Image shared") {
      return "📷 An image was shared via LoRa";
    }

    if (loraMsg.startsWith("📁 File received:")) {
      return loraMsg; // Keep file notifications as is
    }

    if (loraMsg.startsWith(MESSAGE_PREFIXES.FILE)) {
      return loraMsg; // Keep file content messages for renderBubble to handle
    }

    return loraMsg; // Return original message for regular text
  }, []);

  // Add new message when loraMsg changes and is not empty
  useEffect(() => {
    if (!loraMsg?.trim() || loraMsg === lastProcessedLoraMsg.current) {
      return;
    }

    lastProcessedLoraMsg.current = loraMsg;
    const messageText = processLoRaMessage(loraMsg);

    const newMessage: IMessage = {
      _id: generateMessageId(),
      text: messageText,
      createdAt: new Date(),
      user: {
        _id: USER_IDS.LORA_DEVICE,
        name: "LoRa Device",
      },
    };

    updateMessages((previousMessages) => {
      const updatedMessages = GiftedChat.append(previousMessages, [newMessage]);

      // Save messages to storage
      if (id) {
        saveChatMessages(id, updatedMessages).catch(console.error);
      }

      return updatedMessages;
    });
  }, [
    loraMsg,
    id,
    processLoRaMessage,
    generateMessageId,
    updateMessages,
    saveChatMessages,
  ]);

  // Auto-configure endpoint when entering chat
  useEffect(() => {
    const autoConfigureEndpoint = async () => {
      if (
        id &&
        connectedDevice &&
        id.includes("_") &&
        autoConfigured.current !== id
      ) {
        try {
          // Extract name and MAC from chat ID format: "pietro_da5a17b4"
          const parts = id.split("_");
          if (parts.length >= 2) {
            const name = parts[0];
            const macAddress = parts[1];

            // Only configure if we have valid format (8-character MAC)
            if (macAddress.length === 8 && name.length > 0) {
              try {
                await configureEndpoint(connectedDevice, name, macAddress);
                autoConfigured.current = id; // Mark this chat as auto-configured
              } catch (error) {
                console.log("Auto-configuration failed:", error);
              }
            }
          }
        } catch (error) {
          console.log("Error in auto-configuration:", error);
        }
      }
    };

    autoConfigureEndpoint();
  }, [id, connectedDevice, configureEndpoint]);

  // Helper function to parse file message
  const parseFileMessage = useCallback((messageText: string) => {
    const parts = messageText.split(":");

    if (parts.length < 3) {
      throw new Error(
        `Invalid file message format: expected at least 3 parts, got ${parts.length}`
      );
    }

    const filename = parts[1];
    const base64Data = parts.slice(2).join(":");

    if (!filename) {
      throw new Error("Filename is missing from file message");
    }
    if (!base64Data) {
      throw new Error("Base64 data is missing from file message");
    }

    return { filename, base64Data };
  }, []);

  // Handle sending messages
  const onSend = useCallback(
    async (messages: IMessage[] = []): Promise<void> => {
      if (messages.length === 0) return;

      // Update UI first
      updateMessages((previousMessages) => {
        const updatedMessages = GiftedChat.append(previousMessages, messages);

        // Save to storage
        if (id) {
          saveChatMessages(id, updatedMessages).catch(console.error);
        }

        return updatedMessages;
      });

      // Clear input text
      updateChatState({ text: "" });

      if (!connectedDevice) return;

      const message = messages[0];

      try {
        // Handle file messages
        if (message.text.startsWith(MESSAGE_PREFIXES.FILE_DATA)) {
          const { filename, base64Data } = parseFileMessage(message.text);
          console.log(
            `📁 Sending file: ${filename} (${base64Data.length} chars base64)`
          );
          await writeFileToDevice(connectedDevice, filename, base64Data);
          console.log("✅ File sent successfully via FileCharacteristic");
        }
        // Handle location messages
        else if (
          message.text.includes(
            `${MESSAGE_PREFIXES.LOCATION}https://maps.google.com/?q=`
          )
        ) {
          const coordsMatch = message.text.match(MESSAGE_PATTERNS.LOCATION_URL);
          if (coordsMatch) {
            const [, lat, lng] = coordsMatch;
            await writeToDevice(connectedDevice, `${lat},${lng}`);
          }
        }
        // Handle regular text messages
        else {
          await writeToDevice(connectedDevice, message.text);
        }
      } catch (error) {
        if (
          error instanceof Error &&
          !error.message.includes("Device disconnected")
        ) {
          console.error("❌ Failed to send message:", error);
        }
      }
    },
    [
      connectedDevice,
      writeToDevice,
      writeFileToDevice,
      id,
      saveChatMessages,
      updateMessages,
      updateChatState,
      parseFileMessage,
    ]
  );

  const resetFilePickerState = useCallback(() => {
    updateChatState({ isFilePickerActive: false });
  }, [updateChatState]);

  const sendLocation = useCallback(async (): Promise<void> => {
    try {
      updateChatState({ showActionsModal: false }); // Close modal first

      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to share your location."
        );
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Create location message with text describing the location
      const locationMessage: IMessage = {
        _id: Math.random().toString(36).substring(7),
        text: `${MESSAGE_PREFIXES.LOCATION}https://maps.google.com/?q=${location.coords.latitude},${location.coords.longitude}`,
        createdAt: new Date(),
        user: {
          _id: USER_IDS.CURRENT,
        },
      };

      // Send location message
      onSend([locationMessage]);
    } catch (error) {
      Alert.alert("Error", "Failed to get your current location.");
    }
  }, [updateChatState, onSend, generateMessageId]);

  const sendFile = useCallback(async (): Promise<void> => {
    // Prevent multiple concurrent file picker operations
    if (chatState.isFilePickerActive) {
      return;
    }

    try {
      updateChatState({ isFilePickerActive: true, showActionsModal: false });

      // Add a small delay to ensure modal closes completely
      await new Promise((resolve) => setTimeout(resolve, MODAL_CLOSE_DELAY));

      // Pick a file with additional configuration to prevent conflicts
      console.log(`🔄 Opening document picker...`);
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
        multiple: false,
      });

      console.log(`📄 Document picker result:`, {
        canceled: result.canceled,
        assetsLength: result.assets?.length,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];

        console.log(`📄 Selected file details:`, {
          name: file.name,
          size: file.size,
          mimeType: file.mimeType,
          uri: file.uri,
        });

        // Validate file properties
        if (!file.uri) {
          Alert.alert("Error", "Invalid file selected. Please try again.");
          return;
        }

        if (!file.name) {
          Alert.alert(
            "Error",
            "File has no name. Please select a different file."
          );
          return;
        }

        // Validate file size (max 5MB for LoRa transmission)
        if (file.size && file.size > MAX_FILE_SIZE) {
          Alert.alert(
            "File Too Large",
            "Please select a file smaller than 5MB for LoRa transmission."
          );
          return;
        }

        if (file.size === 0) {
          Alert.alert(
            "Empty File",
            "The selected file appears to be empty. Please select a different file."
          );
          return;
        }

        // Show file info and confirm sending
        Alert.alert(
          "Send File",
          `File: ${file.name}\nSize: ${
            file.size ? (file.size / 1024).toFixed(2) + " KB" : "Unknown size"
          }\nType: ${file.mimeType || "Unknown"}`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Send",
              onPress: () => handleFileSend(file),
              style: "default",
            },
          ]
        );
      }
    } catch (error) {
      console.error("Error picking file:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Check for the specific concurrent picker error
      if (errorMessage.includes("Different document picking in progress")) {
        Alert.alert(
          "File Picker Busy",
          "Please wait a moment and try again. The file picker is currently busy.",
          [{ text: "OK", onPress: () => resetFilePickerState() }]
        );
      } else {
        Alert.alert("Error", `Failed to pick file: ${errorMessage}`);
      }
    } finally {
      // Always reset the file picker state after a delay
      setTimeout(() => {
        updateChatState({ isFilePickerActive: false });
      }, FILE_PICKER_RESET_DELAY);
    }
  }, [chatState.isFilePickerActive, updateChatState, resetFilePickerState]);

  const handleFileSend = async (file: any) => {
    try {
      if (!connectedDevice) {
        Alert.alert("No Device", "Please connect to a device first.");
        return;
      }

      // Debug file information
      console.log(`📁 Selected file:`, {
        name: file.name,
        uri: file.uri,
        size: file.size,
        mimeType: file.mimeType,
      });

      // Check if file exists and get info
      const fileInfo = await FileSystem.getInfoAsync(file.uri);
      console.log(`📋 File info:`, fileInfo);

      if (!fileInfo.exists) {
        throw new Error(`File does not exist at URI: ${file.uri}`);
      }

      if (fileInfo.size === 0) {
        throw new Error(`File is empty: ${file.name}`);
      }

      // Convert file to base64
      console.log(`🔄 Reading file as base64...`);
      let base64Data: string;

      try {
        base64Data = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } catch (readError) {
        console.error(`❌ Failed to read file directly:`, readError);

        // Try alternative approach: copy to cache first
        console.log(`🔄 Trying alternative approach: copying to cache...`);
        const cacheUri = `${FileSystem.cacheDirectory}temp_${file.name}`;

        try {
          await FileSystem.copyAsync({
            from: file.uri,
            to: cacheUri,
          });

          base64Data = await FileSystem.readAsStringAsync(cacheUri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          // Clean up temp file
          await FileSystem.deleteAsync(cacheUri, { idempotent: true });

          console.log(`✅ Successfully read via cache copy`);
        } catch (cacheError) {
          console.error(`❌ Cache copy approach failed:`, cacheError);
          throw new Error(
            `Unable to read file: ${file.name}. Try selecting a different file.`
          );
        }
      }

      console.log(
        `📁 File read: ${file.name} (${
          base64Data.length
        } chars base64, expected ~${Math.ceil((fileInfo.size * 4) / 3)} chars)`
      );

      // Validate base64 data
      if (!base64Data || base64Data.length === 0) {
        throw new Error(`File appears to be empty or unreadable: ${file.name}`);
      }

      // Create a file message that will go through onSend
      // Use a special format to embed file data in the message
      const fileMessage: IMessage = {
        _id: Math.random().toString(36).substring(7),
        text: `${MESSAGE_PREFIXES.FILE_DATA}${file.name}:${base64Data}`,
        createdAt: new Date(),
        user: {
          _id: USER_IDS.CURRENT,
        },
      };

      console.log(
        `📝 Created file message: ${MESSAGE_PREFIXES.FILE_DATA}${
          file.name
        }:[${base64Data.substring(0, 50)}...]`
      );

      // Send through onSend method (this will handle the actual BLE transmission)
      onSend([fileMessage]);
    } catch (error) {
      console.error("Error sending file:", error);
      Alert.alert("Error", "Failed to send file");
    }
  };

  // Memoized render functions for performance
  const renderInputToolbar = useCallback(
    (props: React.ComponentProps<typeof InputToolbar>) => (
      <InputToolbar
        {...props}
        containerStyle={{ backgroundColor: Colors.background }}
        renderActions={() => (
          <View style={styles.inputActions}>
            <TouchableOpacity
              onPress={() => updateChatState({ showActionsModal: true })}
              accessibilityLabel="Show actions"
              accessibilityHint="Tap to show file and location sharing options"
            >
              <Ionicons
                name="add"
                color={Colors.primary}
                size={UI_CONSTANTS.ICON_SIZE}
              />
            </TouchableOpacity>
          </View>
        )}
      />
    ),
    [updateChatState]
  );

  const renderBubble = useCallback(
    (props: React.ComponentProps<typeof Bubble>) => {
      const { currentMessage } = props;

      // Check if this is a file message (both sent and received)
      if (
        currentMessage.text.startsWith(MESSAGE_PREFIXES.FILE_DATA) ||
        currentMessage.text.startsWith(MESSAGE_PREFIXES.FILE)
      ) {
        // Extract filename and base64data from FILE_DATA:filename:base64data or FILE_CONTENT:filename:base64data
        // Split only on the first two colons to preserve content that may contain colons
        const parts = currentMessage.text.split(":");
        const filename = parts.length >= 2 ? parts[1] : "Unknown file";
        // Join all remaining parts (from index 2 onwards) to preserve content with colons
        const base64Data = parts.length >= 3 ? parts.slice(2).join(":") : "";

        return (
          <View style={{ margin: 4 }}>
            <FileMessage filename={filename} base64Data={base64Data} />
          </View>
        );
      }

      // Check if this is a location message
      const isLocationMessage =
        currentMessage.text.includes("📍") &&
        currentMessage.text.includes("https://maps.google.com/?q=");

      if (isLocationMessage) {
        const coordsMatch = currentMessage.text.match(
          /q=(-?\d+\.?\d*),(-?\d+\.?\d*)/
        );
        if (coordsMatch) {
          const [, lat, lng] = coordsMatch;
          return (
            <View style={{ margin: 4 }}>
              <LocationMessage
                latitude={parseFloat(lat)}
                longitude={parseFloat(lng)}
              />
            </View>
          );
        }
      }

      // Regular message bubble
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
    },
    []
  );

  const updateRowRef = useCallback(
    (ref: any) => {
      if (
        ref &&
        chatState.replyMessage &&
        ref.props.children.props.currentMessage?._id ===
          chatState.replyMessage._id
      ) {
        swipeableRowRef.current = ref;
      }
    },
    [chatState.replyMessage]
  );

  useEffect(() => {
    if (chatState.replyMessage && swipeableRowRef.current) {
      swipeableRowRef.current.close();
      swipeableRowRef.current = null;
    }
  }, [chatState.replyMessage]);

  // Cleanup file picker state on component unmount
  useEffect(() => {
    return () => {
      updateChatState({ isFilePickerActive: false });
    };
  }, [updateChatState]);

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
          messages={chatState.messages}
          onSend={(messages: IMessage[]) => onSend(messages)}
          onInputTextChanged={(text: string) => updateChatState({ text })}
          timeTextStyle={{
            right: { color: Colors.gray },
            left: { color: Colors.gray },
          }}
          user={{
            _id: USER_IDS.CURRENT,
          }}
          renderSystemMessage={(props) => (
            <SystemMessage {...props} textStyle={{ color: Colors.gray }} />
          )}
          renderAvatar={null}
          maxComposerHeight={100}
          textInputProps={styles.composer}
          renderBubble={renderBubble}
          renderSend={(props) => (
            <View style={styles.sendContainer}>
              {chatState.text !== "" && (
                <Send
                  {...props}
                  containerStyle={{
                    justifyContent: "center",
                  }}
                >
                  <Ionicons
                    name="send"
                    color={Colors.primary}
                    size={UI_CONSTANTS.ICON_SIZE}
                  />
                </Send>
              )}
            </View>
          )}
          renderInputToolbar={renderInputToolbar}
          renderMessage={(props) => (
            <ChatMessageBox
              {...props}
              setReplyOnSwipeOpen={(message: IMessage | null) =>
                updateChatState({ replyMessage: message })
              }
              updateRowRef={updateRowRef}
            />
          )}
        />
      </KeyboardAvoidingView>

      {/* Actions Modal */}
      <Modal
        visible={chatState.showActionsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => updateChatState({ showActionsModal: false })}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => updateChatState({ showActionsModal: false })}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={sendLocation}
            >
              <Ionicons
                name="location"
                color={Colors.primary}
                size={UI_CONSTANTS.ACTION_ICON_SIZE}
              />
              <Text style={styles.actionText}>Share Location</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                chatState.isFilePickerActive && styles.disabledButton,
              ]}
              onPress={sendFile}
              disabled={chatState.isFilePickerActive}
            >
              <Ionicons
                name="attach"
                color={
                  chatState.isFilePickerActive ? Colors.gray : Colors.primary
                }
                size={UI_CONSTANTS.ACTION_ICON_SIZE}
              />
              <Text
                style={[
                  styles.actionText,
                  chatState.isFilePickerActive && styles.disabledText,
                ]}
              >
                {chatState.isFilePickerActive
                  ? "Opening File Picker..."
                  : "Send File"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => updateChatState({ showActionsModal: false })}
            >
              <Text style={[styles.actionText, styles.cancelText]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ImageBackground>
  );
};

const { width: screenWidth } = Dimensions.get("window");

const styles = StyleSheet.create({
  // Input styles
  composer: {
    backgroundColor: "#fff",
    borderRadius: UI_CONSTANTS.COMPOSER_BORDER_RADIUS,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 4,
    fontSize: 16,
    marginVertical: 4,
  },

  // Send container
  sendContainer: {
    height: UI_CONSTANTS.SEND_CONTAINER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: 14,
  },

  // Input actions
  inputActions: {
    height: UI_CONSTANTS.SEND_CONTAINER_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    left: 5,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: UI_CONSTANTS.MODAL_BORDER_RADIUS,
    borderTopRightRadius: UI_CONSTANTS.MODAL_BORDER_RADIUS,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxWidth: screenWidth,
  },

  // Action button styles
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: UI_CONSTANTS.ACTION_BUTTON_BORDER_RADIUS,
    marginVertical: 4,
    backgroundColor: "#f8f9fa",
  },
  actionText: {
    fontSize: 16,
    marginLeft: 12,
    color: "#333",
    fontWeight: "500",
  },
  cancelButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    marginTop: 8,
    justifyContent: "center",
  },
  cancelText: {
    color: "#666",
    marginLeft: 0,
    textAlign: "center",
  },

  // State styles
  disabledButton: {
    opacity: 0.6,
    backgroundColor: "#f0f0f0",
  },
  disabledText: {
    color: "#999",
  },
});

// Export the memoized component for better performance
export default React.memo(Page);
