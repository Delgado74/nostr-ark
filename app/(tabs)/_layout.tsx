import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useApp } from '@/lib/context';

export default function TabsLayout() {
  const { t } = useApp();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111',
          borderTopColor: '#333',
          height: 80,
          paddingBottom: 20,
        },
        tabBarActiveTintColor: '#f7931a',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabs.home,
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 24 }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="send"
        options={{
          title: t.tabs.send,
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 24 }}>📤</Text>,
        }}
      />
      <Tabs.Screen
        name="receive"
        options={{
          title: t.tabs.receive,
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 24 }}>📥</Text>,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t.tabs.history,
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 24 }}>📋</Text>,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.tabs.settings,
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 24 }}>⚙️</Text>,
        }}
      />
    </Tabs>
  );
}
