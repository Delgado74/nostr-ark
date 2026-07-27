import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { hasWallet } from '@/lib/storage';
import { useApp } from '@/lib/context';

export default function AuthIndex() {
  const router = useRouter();
  const { t } = useApp();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkWallet();
  }, []);

  async function checkWallet() {
    const exists = await hasWallet();
    if (exists) {
      router.replace('/(tabs)');
    } else {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>{t.auth.loading}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>⚡</Text>
        <Text style={styles.title}>NostrArk</Text>
        <Text style={styles.subtitle}>{t.auth.subtitle}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/(auth)/create')}
        >
          <Text style={styles.primaryButtonText}>{t.auth.createWallet}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/(auth)/import')}
        >
          <Text style={styles.secondaryButtonText}>{t.auth.importWallet}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        {t.auth.footer}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loading: {
    color: '#fff',
    fontSize: 18,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#888',
    fontSize: 18,
    marginTop: 8,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#f7931a',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#222',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  footer: {
    color: '#666',
    fontSize: 14,
    marginTop: 40,
    textAlign: 'center',
  },
});
