import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

export interface FileInfo {
  uri: string;
  name: string;
  size: number;
  mimeType: string | null;
  base64?: string;
}

interface FileHandlingApi {
  pickFile: () => Promise<FileInfo | null>;
  pickMultipleFiles: () => Promise<FileInfo[] | null>;
  convertFileToBase64: (fileUri: string) => Promise<string>;
  validateFileSize: (size: number, maxSizeMB?: number) => boolean;
}

function useFileHandling(): FileHandlingApi {
  
  const pickFile = async (): Promise<FileInfo | null> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        // Validate file size (default max 10MB)
        if (!validateFileSize(file.size || 0, 10)) {
          Alert.alert(
            'File Too Large', 
            'Please select a file smaller than 10MB for LoRa transmission.'
          );
          return null;
        }

        return {
          uri: file.uri,
          name: file.name,
          size: file.size || 0,
          mimeType: file.mimeType || null,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('Error', 'Failed to pick file. Please try again.');
      return null;
    }
  };

  const pickMultipleFiles = async (): Promise<FileInfo[] | null> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const files: FileInfo[] = [];
        
        for (const file of result.assets) {
          // Validate each file size
          if (validateFileSize(file.size || 0, 10)) {
            files.push({
              uri: file.uri,
              name: file.name,
              size: file.size || 0,
              mimeType: file.mimeType || null,
            });
          } else {
            Alert.alert(
              'File Too Large', 
              `File "${file.name}" is too large. Maximum size is 10MB.`
            );
          }
        }
        
        return files.length > 0 ? files : null;
      }
      
      return null;
    } catch (error) {
      console.error('Error picking files:', error);
      Alert.alert('Error', 'Failed to pick files. Please try again.');
      return null;
    }
  };

  const convertFileToBase64 = async (fileUri: string): Promise<string> => {
    try {
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      return base64;
    } catch (error) {
      console.error('Error converting file to base64:', error);
      throw new Error('Failed to convert file to base64');
    }
  };

  const validateFileSize = (size: number, maxSizeMB: number = 10): boolean => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024; // Convert MB to bytes
    return size <= maxSizeBytes;
  };

  return {
    pickFile,
    pickMultipleFiles,
    convertFileToBase64,
    validateFileSize,
  };
}

export default useFileHandling;
