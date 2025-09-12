import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const TabsLayout = () => {
  const segments = useSegments();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarStyle: { backgroundColor: Colors.background },
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveBackgroundColor: Colors.background,
          tabBarActiveBackgroundColor: Colors.background,
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerShadowVisible: false,
        }}>
        <Tabs.Screen
          name="chats"
          options={{
            title: 'Chats',
            tabBarIcon: ({ size, color }) => (
              <Ionicons name="chatbubbles" size={size} color={color} />
            ),
            headerShown: false,
            tabBarStyle: {
              backgroundColor: Colors.background,
              display: segments[2] === '[id]' ? 'none' : 'flex',
            },
          }}
        />

        <Tabs.Screen
          name="info"
          options={{
            title: 'Info',
            tabBarIcon: ({ size, color }) => <Ionicons name="information-circle" size={size} color={color} />,
            headerShown: false,
          }}
        />
      </Tabs>
    </GestureHandlerRootView>
  );
};
export default TabsLayout;
