import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { importFromNsec } from '@/lib/nostr';
import { saveNsec, saveNpub } from '@/lib/storage';
import { useApp } from '@/lib/context';

export default function ImportWallet() {
  const router = useRouter();
  const { t } = useApp();
  const [nsec, setNsec] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  async function handleImport() {
    if (!nsec.startsWith('nsec1')) {
      Alert.alert(t.common.error, t.import.errors.invalidKey);
      return;
    }

    if (password.length < 6) {
      Alert.alert(t.common.error, t.import.errors.passwordLength);
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t.common.error, t.import.errors.passwordMatch);
      return;
    }

    try {
      const keys = importFromNsec(nsec);
      await saveNsec(keys.nsec, password);
      await saveNpub(keys.npub);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert(t.common.error, t.import.errors.importFailed);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t.import.title}</Text>

      <Text style={styles.description}>
        {t.import.description}
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t.import.privateKey}</Text>
        <TextInput
          style={styles.input}
          value={nsec}
          onChangeText={setNsec}
          placeholder="nsec1..."
          placeholderTextColor="#666"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t.import.newPassword}</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder={t.import.newPassword}
          placeholderTextColor="#666"
          secureTextEntry
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t.import.confirmPassword}</Text>
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder={t.import.confirmPassword}
          placeholderTextColor="#666"
          secureTextEntry
        />
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleImport}>
        <Text style={styles.primaryButtonText}>{t.import.import}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>{t.import.back}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  description: {
    color: '#888',
    fontSize: 16,
    marginBottom: 30,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  primaryButton: {
    backgroundColor: '#f7931a',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#888',
    fontSize: 16,
  },
});
