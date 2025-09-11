import React, { useState } from "react";
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
import Colors from "@/constants/Colors";

interface FileMessageProps {
  filename: string;
  base64Data: string;
  onPress?: () => void;
}

const FileMessage: React.FC<FileMessageProps> = ({
  filename,
  base64Data,
  onPress,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [fileContent, setFileContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const getFileIcon = (filename: string) => {
    const extension = getFileExtension(filename);
    
    switch (extension) {
      case 'pdf':
        return 'document-text';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'image';
      case 'txt':
        return 'document-outline';
      case 'json':
        return 'code-slash';
      case 'mp3':
      case 'wav':
        return 'musical-notes';
      case 'mp4':
      case 'avi':
        return 'videocam';
      default:
        return 'document';
    }
  };

  const isTextFile = (filename: string) => {
    const extension = getFileExtension(filename);
    const textExtensions = ['txt', 'json', 'xml', 'html', 'css', 'js', 'ts', 'md'];
    return textExtensions.includes(extension);
  };

  const isBase64 = (str: string) => {
    try {
      // Check if it's a valid base64 string
      return btoa(atob(str)) === str;
    } catch (err) {
      return false;
    }
  };

  const formatFileSize = (dataString: string) => {
    let sizeInBytes: number;
    
    if (isBase64(dataString)) {
      // Approximate file size from base64 (base64 is about 33% larger than original)
      sizeInBytes = (dataString.length * 3) / 4;
    } else {
      // Data is plain text, use string length as byte count
      sizeInBytes = new Blob([dataString]).size;
    }
    
    if (sizeInBytes < 1024) {
      return `${Math.round(sizeInBytes)} B`;
    } else if (sizeInBytes < 1024 * 1024) {
      return `${Math.round(sizeInBytes / 1024)} KB`;
    } else {
      return `${Math.round(sizeInBytes / (1024 * 1024))} MB`;
    }
  };

  const handlePress = async () => {
    if (onPress) {
      onPress();
      return;
    }

    // Always show preview for text files, options for others
    if (isTextFile(filename)) {
      try {
        setIsLoading(true);
        // Check if data is base64 encoded or plain text
        let decodedContent: string;
        if (isBase64(base64Data)) {
          // Decode base64 to text
          decodedContent = atob(base64Data);
        } else {
          // Data is already plain text
          decodedContent = base64Data;
        }
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
          { text: "Save to Device", onPress: saveToDevice }
        ]
      );
    }
  };

  const saveToDevice = async () => {
    try {
      // Dummy save implementation - just show a success message
      // In a real implementation, you would use expo-sharing or another file sharing method
      Alert.alert(
        "File Saved", 
        `${filename} has been saved successfully!\n\n(This is a dummy implementation)`,
        [{ text: "OK", style: "default" }]
      );
    } catch (error) {
      console.error("Error saving file:", error);
      Alert.alert("Error", "Failed to save file to device");
    }
  };

  const getMimeType = (filename: string) => {
    const extension = getFileExtension(filename);
    
    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'txt':
        return 'text/plain';
      case 'json':
        return 'application/json';
      case 'mp3':
        return 'audio/mpeg';
      case 'mp4':
        return 'video/mp4';
      default:
        return 'application/octet-stream';
    }
  };

  const copyToClipboard = async () => {
    // Note: expo-clipboard would be needed for this functionality
    // For now, we'll show the content in the modal
    Alert.alert("Info", "Text content is displayed in the preview window");
  };

  return (
    <>
      <TouchableOpacity style={styles.container} onPress={handlePress}>
        <View style={styles.header}>
          <Ionicons name={getFileIcon(filename)} size={20} color={Colors.primary} />
          <Text style={styles.title}>File</Text>
        </View>
        <Text style={styles.filename} numberOfLines={1}>
          {filename}
        </Text>
        <View style={styles.footer}>
          <Ionicons name="document-outline" size={16} color={Colors.gray} />
          <Text style={styles.footerText}>Tap to open</Text>
        </View>
      </TouchableOpacity>

      {/* File Content Preview Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
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
              >
                <Ionicons name="close" size={24} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.contentContainer}>
              <Text style={styles.fileContentText}>{fileContent}</Text>
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={saveToDevice}
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

const styles = StyleSheet.create({
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
    width: Dimensions.get('window').width - 40,
    height: Dimensions.get('window').height * 0.8,
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
  },
  contentContainer: {
    flex: 1,
    marginBottom: 16,
  },
  fileContentText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333",
    fontFamily: "monospace",
  },
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
