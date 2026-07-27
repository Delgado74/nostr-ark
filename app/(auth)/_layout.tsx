import { Stack } from 'expo-router';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="create" />
      <Stack.Screen name="import" />
    </Stack>
  );
}
