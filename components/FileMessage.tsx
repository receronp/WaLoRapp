import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import Colors from "@/constants/Colors";

interface FileMessageProps {
  filename: string;
  base64Data: string;
  onPress?: () => void;
}

type FileExtension =
  | "pdf"
  | "jpg"
  | "jpeg"
  | "png"
  | "gif"
  | "txt"
  | "json"
  | "xml"
  | "html"
  | "css"
  | "js"
  | "ts"
  | "md"
  | "mp3"
  | "wav"
  | "mp4"
  | "avi";

type IconName =
  | "document-text"
  | "image"
  | "document-outline"
  | "code-slash"
  | "musical-notes"
  | "videocam"
  | "document";

// Constants
const TEXT_EXTENSIONS = [
  "txt",
  "json",
  "xml",
  "html",
  "css",
  "js",
  "ts",
  "md",
] as const;
const BYTE_SIZE = 1024;
const BASE64_OVERHEAD = 4 / 3; // Base64 is ~33% larger than original

const ICON_MAP: Record<string, IconName> = {
  pdf: "document-text",
  jpg: "image",
  jpeg: "image",
  png: "image",
  gif: "image",
  txt: "document-outline",
  json: "code-slash",
  mp3: "musical-notes",
  wav: "musical-notes",
  mp4: "videocam",
  avi: "videocam",
} as const;

const MIME_TYPE_MAP: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  txt: "text/plain",
  json: "application/json",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
} as const;

/**
 * FileMessage component for displaying and handling file messages in a chat interface.
 * Supports text file previews, auto-saving to device storage, and file sharing.
 *
 * Features:
 * - Automatic file icon detection based on file extension
 * - Text file content preview in a modal
 * - Auto-save functionality for received files
 * - File sharing integration with device native sharing
 * - Accessibility support with proper labels and hints
 * - Performance optimizations with memoization and callbacks
 *
 * @param filename - The name of the file including extension
 * @param base64Data - The file data encoded in base64 format
 * @param onPress - Optional custom press handler. If not provided, default behavior is used.
 */
const FileMessage: React.FC<FileMessageProps> = ({
  filename,
  base64Data,
  onPress,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [fileContent, setFileContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [savedFileUri, setSavedFileUri] = useState<string | null>(null);

  // Memoized helper functions
  const isBase64 = useCallback((str: string): boolean => {
    if (!str || str.length === 0) return false;
    try {
      return btoa(atob(str)) === str;
    } catch {
      return false;
    }
  }, []);

  const getFileExtension = useCallback((filename: string): string => {
    return filename.split(".").pop()?.toLowerCase() || "";
  }, []);

  const fileExtension = useMemo(
    () => getFileExtension(filename),
    [filename, getFileExtension]
  );

  const fileIcon = useMemo((): IconName => {
    return ICON_MAP[fileExtension] || "document";
  }, [fileExtension]);

  const isTextFile = useMemo((): boolean => {
    return TEXT_EXTENSIONS.includes(fileExtension as any);
  }, [fileExtension]);

  // Auto-save received file to device storage when component mounts
  useEffect(() => {
    const autoSaveFile = async (): Promise<void> => {
      // Validate inputs before processing
      if (!base64Data || !filename || !isBase64(base64Data)) {
        return;
      }

      try {
        // Ensure document directory exists
        const documentDir = FileSystem.documentDirectory;
        if (!documentDir) {
          throw new Error("Document directory not available");
        }

        // Create unique filename to avoid conflicts
        const timestamp = Date.now();
        const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_"); // Sanitize filename
        const fileUri = `${documentDir}received_${timestamp}_${sanitizedFilename}`;

        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Verify file was written successfully
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        const fileSize = (fileInfo as FileSystem.FileInfo & { size?: number })
          .size;

        if (fileInfo.exists && fileSize && fileSize > 0) {
          setSavedFileUri(fileUri);
        } else {
          throw new Error("Auto-saved file is empty or doesn't exist");
        }
      } catch (error) {
        console.error("Failed to auto-save file:", error);
        // Don't show user error for auto-save failure as it's a background operation
      }
    };

    // Only run auto-save once when component mounts with valid data
    if (base64Data && filename) {
      autoSaveFile();
    }
  }, []); // Empty dependency array - only run once on mount

  const formatFileSize = useCallback(
    (dataString: string): string => {
      const sizeInBytes = isBase64(dataString)
        ? dataString.length / BASE64_OVERHEAD // More accurate base64 to bytes conversion
        : new Blob([dataString]).size; // Plain text size

      if (sizeInBytes < BYTE_SIZE) {
        return `${Math.round(sizeInBytes)} B`;
      } else if (sizeInBytes < BYTE_SIZE * BYTE_SIZE) {
        return `${Math.round(sizeInBytes / BYTE_SIZE)} KB`;
      } else {
        return `${Math.round(sizeInBytes / (BYTE_SIZE * BYTE_SIZE))} MB`;
      }
    },
    [isBase64]
  );

  const getMimeType = useCallback(
    (filename: string): string => {
      const extension = getFileExtension(filename);
      return MIME_TYPE_MAP[extension] || "application/octet-stream";
    },
    [getFileExtension]
  );

  const handlePress = useCallback(async (): Promise<void> => {
    if (onPress) {
      onPress();
      return;
    }

    // Show preview for text files, options for others
    if (isTextFile) {
      try {
        setIsLoading(true);
        const decodedContent = isBase64(base64Data)
          ? atob(base64Data)
          : base64Data;

        setFileContent(decodedContent);
        setShowModal(true);
      } catch (error) {
        console.error("Error processing file content:", error);
        Alert.alert("Error", "Unable to preview file content");
      } finally {
        setIsLoading(false);
      }
    } else {
      // For non-text files, show options to save
      Alert.alert(
        "File Options",
        `File: ${filename}\nSize: ${formatFileSize(base64Data)}`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Save to Device", onPress: saveToDevice },
        ]
      );
    }
  }, [onPress, isTextFile, isBase64, base64Data, filename, formatFileSize]);

  const saveToDevice = useCallback(async (): Promise<void> => {
    try {
      let fileUri: string;

      // Use already saved file if available, otherwise save it now
      if (savedFileUri) {
        fileUri = savedFileUri;

        // Verify the file still exists
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (!fileInfo.exists) {
          // Create new file if saved one doesn't exist
          fileUri = `${FileSystem.documentDirectory}${filename}`;
          await FileSystem.writeAsStringAsync(fileUri, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });
        }
      } else {
        // Create a temporary file for sharing
        fileUri = `${FileSystem.documentDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      // Check if sharing is available and share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: getMimeType(filename),
          dialogTitle: `Save ${filename}`,
        });
      } else {
        Alert.alert("Success", `File saved to: ${fileUri}`);
      }
    } catch (error) {
      console.error("Error saving file:", error);
      Alert.alert("Error", "Failed to save file to device");
    }
  }, [savedFileUri, filename, base64Data, getMimeType]);

  const copyToClipboard = useCallback(async (): Promise<void> => {
    // Note: expo-clipboard would be needed for this functionality
    // For now, we'll show the content in the modal
    Alert.alert("Info", "Text content is displayed in the preview window");
  }, []);

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={handlePress}
        disabled={isLoading}
        accessibilityLabel={`File ${filename}`}
        accessibilityHint={
          isTextFile ? "Tap to preview file content" : "Tap to see file options"
        }
        accessibilityRole="button"
      >
        <View style={styles.header}>
          <Ionicons name={fileIcon} size={20} color={Colors.primary} />
          <Text style={styles.title}>File</Text>
        </View>
        <Text style={styles.filename} numberOfLines={1}>
          {filename}
        </Text>
        <View style={styles.footer}>
          <Ionicons name="document-outline" size={16} color={Colors.gray} />
          <Text style={styles.footerText}>
            {isLoading ? "Loading..." : "Tap to open"}
          </Text>
        </View>
      </TouchableOpacity>

      {/* File Content Preview Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
        accessibilityViewIsModal={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {filename}
              </Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.closeButton}
                accessibilityLabel="Close preview"
                accessibilityRole="button"
              >
                <Ionicons name="close" size={24} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.contentContainer}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
            >
              <Text style={styles.fileContentText} selectable={true}>
                {fileContent}
              </Text>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={saveToDevice}
                accessibilityLabel="Save file to device"
                accessibilityRole="button"
              >
                <Ionicons name="download" size={20} color="white" />
                <Text style={styles.saveButtonText}>Save to Device</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const styles = StyleSheet.create({
  // File message container styles
  container: {
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    padding: 12,
    maxWidth: 250,
    minWidth: 200,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    color: Colors.primary,
  },
  filename: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: Colors.gray,
    marginLeft: 4,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: screenWidth - 40,
    height: screenHeight * 0.8,
    maxHeight: 600,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    marginRight: 12,
  },
  closeButton: {
    padding: 4,
    borderRadius: 4,
  },

  // Content styles
  contentContainer: {
    flex: 1,
    marginBottom: 16,
  },
  scrollContent: {
    padding: 4,
  },
  fileContentText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333",
    fontFamily: "monospace",
  },

  // Action styles
  modalActions: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default FileMessage;
