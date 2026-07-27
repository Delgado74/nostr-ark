import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { hasWallet } from '@/lib/storage';
import { AppProvider } from '@/lib/context';

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasExistingWallet, setHasExistingWallet] = useState(false);

  useEffect(() => {
    checkWallet();
  }, []);

  async function checkWallet() {
    const exists = await hasWallet();
    setHasExistingWallet(exists);
    setIsLoading(false);
  }

  if (isLoading) {
    return null;
  }

  return (
    <AppProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="(auth)"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />
      </Stack>
    </AppProvider>
  );
}
