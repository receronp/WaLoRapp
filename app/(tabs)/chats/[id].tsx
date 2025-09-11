import ChatMessageBox from "@/components/ChatMessageBox";
import LocationMessage from "@/components/LocationMessage";
import FileMessage from "@/components/FileMessage";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  ImageBackground,
  KeyboardAvoidingView,
  StyleSheet,
  View,
  Alert,
  TouchableOpacity,
  Modal,
  Text,
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
import * as Location from "expo-location";
import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";

const Page = () => {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [text, setText] = useState("");
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [isFilePickerActive, setIsFilePickerActive] = useState(false);
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [replyMessage, setReplyMessage] = useState<IMessage | null>(null);
  const swipeableRowRef = useRef<Swipeable | null>(null);
  const lastProcessedLoraMsg = useRef<string>("");
  const autoConfigured = useRef<string | null>(null); // Track auto-configured chat ID

  const { connectedDevice, writeToDevice, writeFileToDevice, loraMsg, configureEndpoint } = useBLEContext();
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

      let messageText = loraMsg;

      // Check if the message contains location coordinates (simple format: lat,lng)
      const locationPattern = /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/;
      const locationMatch = loraMsg.match(locationPattern);

      if (locationMatch) {
        const [, lat, lng] = locationMatch;
        messageText = `📍 Received Location: https://maps.google.com/?q=${lat},${lng}`;
      }
      // Check if it's an image notification
      else if (loraMsg === "📷 Image shared") {
        messageText = "📷 An image was shared via LoRa";
      }
      // Check if it's a file notification
      else if (loraMsg.startsWith("📁 File received:")) {
        messageText = loraMsg; // Keep the file notification as is
      }
      // Check if it's a file content message
      else if (loraMsg.startsWith("FILE_CONTENT:")) {
        messageText = loraMsg; // Keep the file content message as is for renderBubble to handle
      }

      const newMessage: IMessage = {
        _id: Math.random().toString(36).substring(7), // Generate unique ID
        text: messageText,
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

  // Auto-configure endpoint when entering chat
  useEffect(() => {
    const autoConfigureEndpoint = async () => {
      if (id && connectedDevice && id.includes("_") && autoConfigured.current !== id) {
        try {
          // Extract name and MAC from chat ID format: "pietro_da5a17b4"
          const parts = id.split("_");
          if (parts.length >= 2) {
            const name = parts[0];
            const macAddress = parts[1];
            
            // Only configure if we have valid format (8-character MAC)
            if (macAddress.length === 8 && name.length > 0) {
              console.log(`Auto-configuring endpoint: ${name}, MAC: ${macAddress}`);
              
              try {
                await configureEndpoint(connectedDevice, name, macAddress);
                autoConfigured.current = id; // Mark this chat as auto-configured
                console.log("Endpoint auto-configured successfully");
              } catch (error) {
                console.log("Auto-configuration failed:", error);
                // Don't show error to user as this is automatic
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

  const onSend = useCallback(
    async (messages: IMessage[] = []) => {
      // Keep messages as-is for display (FILE_DATA messages will be handled by renderBubble)
      const displayMessages = messages;

      setMessages((previousMessages: any[]) => {
        const updatedMessages = GiftedChat.append(previousMessages, displayMessages);

        // Save messages to storage
        if (id) {
          saveChatMessages(id, updatedMessages);
        }
        return updatedMessages;
      });

      if (connectedDevice && messages.length > 0) {
        const message = messages[0];

        // If it's a file message (detected by text pattern), extract file data from message
        if (message.text.startsWith("FILE_DATA:")) {
          try {
            // Parse file data from message text: "FILE_DATA:filename:base64data"
            const parts = message.text.split(":", 3); // Split into 3 parts: FILE_DATA, filename, base64data
            
            if (parts.length < 3) {
              throw new Error(`Invalid file message format: expected 3 parts, got ${parts.length}`);
            }
            
            const filename = parts[1];
            const base64Data = parts[2];
            
            if (!filename) {
              throw new Error("Filename is missing from file message");
            }
            if (!base64Data) {
              throw new Error("Base64 data is missing from file message");
            }
            
            console.log("Sending file via chunked transmission:", filename);
            await writeFileToDevice(connectedDevice, filename, base64Data);
          } catch (error) {
            console.error("Error sending file:", error);
            // Fallback to text notification
            writeToDevice(connectedDevice, "File shared");
          }
        }
        // If it's a location message, send just the coordinates via LoRa for efficiency
        else if (message.text.includes("📍 Location: https://maps.google.com/?q=")) {
          const coordsMatch = message.text.match(
            /q=(-?\d+\.?\d*),(-?\d+\.?\d*)/
          );
          if (coordsMatch) {
            const [, lat, lng] = coordsMatch;
            writeToDevice(connectedDevice, `${lat},${lng}`);
          }
        } else {
          // Send regular text message
          writeToDevice(connectedDevice, message.text);
        }
      }
      setText("");
    },
    [connectedDevice, writeToDevice, writeFileToDevice, id, saveChatMessages]
  );

  // Debug: Reset file picker state if stuck (can be removed in production)
  const resetFilePickerState = () => {
    console.log("Manually resetting file picker state");
    setIsFilePickerActive(false);
  };

  const sendLocation = async () => {
    try {
      setShowActionsModal(false); // Close modal first
      
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
        text: `📍 Location: https://maps.google.com/?q=${location.coords.latitude},${location.coords.longitude}`,
        createdAt: new Date(),
        user: {
          _id: 1,
        },
      };

      // Send location message
      onSend([locationMessage]);
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Error", "Failed to get your current location.");
    }
  };

  const sendFile = async () => {
    // Prevent multiple concurrent file picker operations
    if (isFilePickerActive) {
      console.log("File picker already active, ignoring request");
      return;
    }

    try {
      setIsFilePickerActive(true);
      setShowActionsModal(false); // Close modal first

      // Add a small delay to ensure modal closes completely
      await new Promise(resolve => setTimeout(resolve, 300));

      console.log("Opening file picker...");
      
      // Pick a file with additional configuration to prevent conflicts
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      console.log("File picker result:", result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        // Validate file size (max 5MB for LoRa transmission)
        const maxSizeBytes = 5 * 1024 * 1024; // 5MB
        if (file.size && file.size > maxSizeBytes) {
          Alert.alert(
            'File Too Large',
            'Please select a file smaller than 5MB for LoRa transmission.'
          );
          return;
        }

        // Show file info and confirm sending
        Alert.alert(
          'Send File',
          `File: ${file.name}\nSize: ${file.size ? (file.size / 1024).toFixed(2) + ' KB' : 'Unknown size'}\nType: ${file.mimeType || 'Unknown'}`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Send', 
              onPress: () => handleFileSend(file),
              style: 'default'
            }
          ]
        );
      } else {
        console.log("File picker was canceled or no file selected");
      }
    } catch (error) {
      console.error("Error picking file:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Check for the specific concurrent picker error
      if (errorMessage.includes('Different document picking in progress')) {
        Alert.alert(
          "File Picker Busy", 
          "Please wait a moment and try again. The file picker is currently busy.",
          [
            { text: 'OK', onPress: () => resetFilePickerState() }
          ]
        );
      } else {
        Alert.alert("Error", `Failed to pick file: ${errorMessage}`);
      }
    } finally {
      // Always reset the file picker state after a delay
      setTimeout(() => {
        setIsFilePickerActive(false);
      }, 500);
    }
  };

  const handleFileSend = async (file: any) => {
    try {
      if (!connectedDevice) {
        Alert.alert("No Device", "Please connect to a device first.");
        return;
      }

      // Convert file to base64
      const base64Data = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Create a file message that will go through onSend
      // Use a special format to embed file data in the message
      const fileMessage: IMessage = {
        _id: Math.random().toString(36).substring(7),
        text: `FILE_DATA:${file.name}:${base64Data}`,
        createdAt: new Date(),
        user: {
          _id: 1,
        },
      };

      // Send through onSend method (this will handle the actual BLE transmission)
      onSend([fileMessage]);

      // Show success message
      Alert.alert("Success", `File "${file.name}" sent successfully!`);
      
    } catch (error) {
      console.error("Error sending file:", error);
      Alert.alert("Error", "Failed to send file");
    }
  };

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
            <TouchableOpacity onPress={() => setShowActionsModal(true)}>
              <Ionicons name="add" color={Colors.primary} size={28} />
            </TouchableOpacity>
          </View>
        )}
      />
    );
  };

  const renderBubble = (props: any) => {
    const { currentMessage } = props;

    // Check if this is a file message (both sent and received)
    if (currentMessage.text.startsWith("FILE_DATA:") || currentMessage.text.startsWith("FILE_CONTENT:")) {
      // Extract filename and base64data from FILE_DATA:filename:base64data or FILE_CONTENT:filename:base64data
      // Split only on the first two colons to preserve content that may contain colons
      const parts = currentMessage.text.split(":");
      const filename = parts.length >= 2 ? parts[1] : "Unknown file";
      // Join all remaining parts (from index 2 onwards) to preserve content with colons
      const base64Data = parts.length >= 3 ? parts.slice(2).join(":") : "";
      
      return (
        <View style={{ margin: 4 }}>
          <FileMessage
            filename={filename}
            base64Data={base64Data}
          />
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

  // Cleanup file picker state on component unmount
  useEffect(() => {
    return () => {
      setIsFilePickerActive(false);
    };
  }, []);

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
          renderBubble={renderBubble}
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

      {/* Actions Modal */}
      <Modal
        visible={showActionsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowActionsModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActionsModal(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={sendLocation}
            >
              <Ionicons name="location" color={Colors.primary} size={24} />
              <Text style={styles.actionText}>Share Location</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.actionButton,
                isFilePickerActive && styles.disabledButton
              ]}
              onPress={sendFile}
              disabled={isFilePickerActive}
            >
              <Ionicons 
                name="attach" 
                color={isFilePickerActive ? Colors.gray : Colors.primary} 
                size={24} 
              />
              <Text style={[
                styles.actionText,
                isFilePickerActive && styles.disabledText
              ]}>
                {isFilePickerActive ? "Opening File Picker..." : "Send File"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => setShowActionsModal(false)}
            >
              <Text style={[styles.actionText, styles.cancelText]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
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
  disabledButton: {
    opacity: 0.6,
    backgroundColor: "#f0f0f0",
  },
  disabledText: {
    color: "#999",
  },
});

export default Page;
