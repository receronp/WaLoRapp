import AppleStyleSwipeableRow from '@/components/AppleStyleSwipeableRow';
import Colors from '@/constants/Colors';
import { format } from 'date-fns';
import { Link } from 'expo-router';
import { FC } from 'react';
import { View, Text, Image, TouchableHighlight } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface ChatRowProps {
  id: string;
  from: string;
  date: string;
  msg: string;
  read: boolean;
  unreadCount: number;
  onArchive?: () => void;
}

const ChatRow: FC<ChatRowProps> = ({ id, from, date, msg, read, unreadCount, onArchive }) => {
  // Extract MAC address from ID if it follows the pattern "name_macaddress"
  const getDisplayName = () => {
    if (id && id.includes("_")) {
      const parts = id.split("_");
      if (parts.length >= 2) {
        const name = parts[0];
        const macAddress = parts[1];
        // Capitalize first letter of name
        const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
        return `${capitalizedName} @ ${macAddress}`;
      }
    }
    // Fallback to original from prop formatting
    return from
      .split(" ")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
      .join(" ");
  };

  // Format coordinates to 2 significant digits
  const formatCoordinates = (lat: string, lng: string): string => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    return `${latNum.toFixed(3)}, ${lngNum.toFixed(3)}`;
  };

  // Parse and format message content based on type
  const getMessageDisplay = () => {
    // Check for location messages
    if (msg.includes("Location:") && msg.includes("https://maps.google.com/?q=")) {
      const coordsMatch = msg.match(/q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (coordsMatch) {
        const [, lat, lng] = coordsMatch;
        const formattedCoords = formatCoordinates(lat, lng);
        return {
          type: 'location',
          icon: 'location' as const,
          text: formattedCoords,
          color: Colors.primary
        };
      }
    }

    // Check for file messages (both FILE_DATA and FILE formats)
    if (msg.startsWith("FILE_DATA:") || msg.startsWith("FILE:")) {
      const parts = msg.split(":");
      const filename = parts.length >= 2 ? parts[1] : "Unknown file";
      return {
        type: 'file',
        icon: 'attach' as const,
        text: filename,
        color: Colors.primary
      };
    }

    // Check for file received notifications
    if (msg.startsWith("File received:")) {
      const filename = msg.replace("File received: ", "");
      return {
        type: 'file',
        icon: 'attach' as const,
        text: filename,
        color: Colors.primary
      };
    }

    // Regular text message
    return {
      type: 'text',
      text: msg.length > 40 ? `${msg.substring(0, 40)}...` : msg
    };
  };

  const displayName = getDisplayName();
  const messageDisplay = getMessageDisplay();

  return (
    <AppleStyleSwipeableRow onArchive={onArchive}>
      <Link href={`/(tabs)/chats/${id}`} asChild>
        <TouchableHighlight activeOpacity={0.8} underlayColor={Colors.lightGray}>
            <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              paddingLeft: 20,
              paddingVertical: 10,
            }}
          >
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: `hsl(${
                  (displayName
                    .split("")
                    .reduce((acc, char) => acc + char.charCodeAt(0), 0) *
                    137.508) %
                  360
                }, 70%, 60%)`,
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Text style={{ 
              color: 'white', 
              fontSize: 20, 
              fontWeight: 'bold' 
              }}>
              {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                {displayName}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {messageDisplay.type !== 'text' && (
                  <Ionicons 
                    name={messageDisplay.icon} 
                    size={16} 
                    color={messageDisplay.color} 
                  />
                )}
                <Text style={{ fontSize: 16, color: Colors.gray, flex: 1 }}>
                  {messageDisplay.text}
                </Text>
              </View>
            </View>
            <Text style={{ color: Colors.gray, paddingRight: 20, alignSelf: 'flex-start' }}>
              {format(date, 'MM.dd.yy')}
            </Text>
            </View>
        </TouchableHighlight>
      </Link>
    </AppleStyleSwipeableRow>
  );
};
export default ChatRow;
